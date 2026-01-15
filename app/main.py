import os
import json
import logging
from functools import wraps
from flask import Flask, session, request, redirect, url_for, Response, jsonify
from flask_session import Session
import msal
from app.engine import automattuner

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create the Flask app
app = Flask(__name__, static_folder='../web/static', template_folder='../web/templates')
app.config["SECRET_KEY"] = os.urandom(24)
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# MSAL (Azure AD) configuration
CLIENT_ID = os.getenv("AZURE_CLIENT_ID")
CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET")
AUTHORITY = f"https://login.microsoftonline.com/{os.getenv('AZURE_TENANT_ID')}"
REDIRECT_PATH = "/get_token"
SCOPE = ["User.Read"]

msal_app = msal.ConfidentialClientApplication(
    CLIENT_ID, authority=AUTHORITY, client_credential=CLIENT_SECRET
)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user" not in session:
            logger.warning("Unauthorized access attempt.")
            # For API requests, return a JSON error
            if request.path.startswith('/api/'):
                 return jsonify({"status": "error", "message": "Unauthorized. Please log in first."}), 401
            # For page loads, redirect to login
            return redirect(url_for("login"))
        return f(*args, **kwargs)
    return decorated_function

@app.route("/")
@require_auth
def index():
    return app.send_static_file('index.html')

@app.route("/login")
def login():
    session["flow"] = msal_app.initiate_auth_code_flow(SCOPE, redirect_uri=url_for("authorized", _external=True))
    return redirect(session["flow"]["auth_uri"])

@app.route(REDIRECT_PATH)
def authorized():
    try:
        cache = msal.SerializableTokenCache()
        if "token_cache" in session:
            cache.deserialize(session["token_cache"])

        result = msal_app.acquire_token_by_auth_code_flow(session.get("flow", {}), request.args)
        
        if "error" in result:
            logger.error(f"Authentication error: {result.get('error_description')}")
            return f"Login failed: {result.get('error_description')}", 400

        if "access_token" in result:
            session["token_cache"] = cache.serialize()
            session["user"] = result.get("id_token_claims")
            
    except ValueError as e:
        logger.error(f"Token acquisition error: {e}")
        pass # Handle potential state mismatch error
        
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        AUTHORITY + "/oauth2/v2.0/logout" +
        "?post_logout_redirect_uri=" + url_for("login", _external=True))

@app.route("/api/run", methods=["POST"])
@require_auth
def run_engine_endpoint():
    """
    This endpoint executes the engine and streams the output back to the client.
    """
    payload = request.json
    
    # Add tenant_id from the authenticated user's session
    tenant_id = session.get("user", {}).get("tid")
    if not tenant_id:
         return Response("data: ERROR: Could not identify Tenant ID from user session.\\n\\n", mimetype="text/event-stream")
    payload["tenant_id"] = tenant_id

    def generate_logs():
        try:
            # The automattuner.run function is a generator
            for log_line in automattuner.run(payload, CLIENT_ID, CLIENT_SECRET):
                # Format as Server-Sent Event (SSE)
                yield f"data: {log_line}\\n\\n"
        except Exception as e:
            logger.error(f"An error occurred during engine execution: {e}", exc_info=True)
            yield f"data: FATAL ERROR: {e}\\n\\n"

    # Return a streaming response
    return Response(generate_logs(), mimetype="text/event-stream")

if __name__ == "__main__":
    app.run(debug=True)
