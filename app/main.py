from flask import Flask, render_template, request, jsonify
import os
import sys

# Ensure app can find engine
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from engine.automattuner import run as run_engine

app = Flask(__name__, template_folder='../web/templates', static_folder='../web/static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/run', methods=['POST'])
def execute_automattuner():
    try:
        payload = request.json or {}
        result = run_engine(payload)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
