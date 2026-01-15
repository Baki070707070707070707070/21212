from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import os
import sys
import uuid
import msal

# Ensure app can find engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from engine.automattuner import run as run_engine

app = Flask(__name__, template_folder='../web/templates', static_folder='../web/static')

# --- MSAL MULTI-TENANT CONFIGURATION ---
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "super-secret-key-for-dev")

# These are now configured in the Azure App Service's "Configuration" blade
# The names must match the App Settings defined in `infra/arm/azuredeploy.json`
CLIENT_ID = os.environ.get("AZURE_CLIENT_ID")
CLIENT_SECRET = os.environ.get("AZURE_CLIENT_SECRET")

# For multi-tenant, the authority is the "common" endpoint, not a specific tenant
AUTHORITY = "https://login.microsoftonline.com/common"
REDIRECT_PATH = "/get-token"  # Must be registered as a Redirect URI

SCOPE = ["https://graph.microsoft.com/.default"]

# This function creates the MSAL app object on demand
def _build_msal_app(authority=AUTHORITY):
    return msal.ConfidentialClientApplication(
        CLIENT_ID, authority=authority, client_credential=CLIENT_SECRET
    )

# --- END MSAL CONFIGURATION ---


@app.route('/')
def index():
    is_authenticated = "access_token" in session
    user = session.get("user")
    return render_template('index.html', is_authenticated=is_authenticated, user=user)

@app.route("/login")
def login():
    # Check if the app is configured before trying to log in
    if not CLIENT_ID or not CLIENT_SECRET:
        return "Application is not configured. Please set AAD_CLIENT_ID and AAD_CLIENT_SECRET environment variables.", 500

    session["state"] = str(uuid.uuid4())
    
    msal_app = _build_msal_app()
    auth_url = msal_app.get_authorization_request_url(
        SCOPE,
        state=session["state"],
        redirect_uri=url_for("authorized", _external=True)
    )
    return redirect(auth_url)

@app.route(REDIRECT_PATH)
def authorized():
    if request.args.get('state') != session.get("state"):
        return redirect(url_for("index"))
    
    if request.args.get('code'):
        msal_app = _build_msal_app() # Recreate the app object for the request
        token = msal_app.acquire_token_by_authorization_code(
            request.args['code'],
            scopes=SCOPE,
            redirect_uri=url_for("authorized", _external=True)
        )
        
        if "error" in token:
            return f"Error acquiring token: {token['error_description']}"
            
        session["access_token"] = token['access_token']
        session["user"] = token.get("id_token_claims")
        
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.clear()
    
    logout_url = (
        f"{AUTHORITY}/oauth2/v2.0/logout"
        f"?post_logout_redirect_uri={url_for('index', _external=True)}"
    )
    return redirect(logout_url)

@app.route('/api/run', methods=['POST'])
def execute_automattuner():
    if "access_token" not in session:
        return jsonify({"error": "Unauthorized. Please log in first."}), 401
        
    try:
        payload = request.json or {}
        payload['tenant_id'] = session.get("user", {}).get("tid")
        
        result = run_engine(payload)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
    app.run(host='0.0.0.0', port=port, debug=True)
