import json
import subprocess
import sys
import time
from pathlib import Path
import urllib.request
import urllib.parse
import urllib.error

# This is a placeholder for logging. The web backend will handle the actual logging.
def log_info(message):
    print(f"INFO: {message}")

def log_error(step, error):
    print(f"ERROR during {step}: {error}")

def log_warning(message):
    print(f"WARNING: {message}")

###############################################################################
## Configuration Loading (Adapted for Web App)
###############################################################################
def load_config(tenant_id, client_id, client_secret, wintuner_dir='wintuner_downloads'):
    """Dynamically create a config object from environment/session variables."""
    try:
        config = {
            "intune_tenant_id": tenant_id,
            "intune_client_id": client_id,
            "intune_client_secret": client_secret,
            "wintuner_download_dir": wintuner_dir
        }
        Path(wintuner_dir).mkdir(parents=True, exist_ok=True)
        return config
    except Exception as e:
        log_error("Loading Configuration", str(e))
        return None

###############################################################################
## Intune App Report Generation (Adapted from Original)
###############################################################################
def get_intune_apps(token, package_id_filter=None):
    """Retrieves Intune apps using Microsoft Graph API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "ConsistencyLevel": "eventual"
    }
    base_uri = "https://graph.microsoft.com/v1.0/deviceAppManagement/mobileApps"
    params = {'$top': '999'}
    if package_id_filter:
        params['$filter'] = f"contains(tolower(displayName), '{package_id_filter.lower()}')"
        params['$count'] = 'true'

    uri = base_uri + "?" + urllib.parse.urlencode(params)
    all_apps = []
    
    while uri:
        try:
            req = urllib.request.Request(uri, headers=headers, method='GET')
            with urllib.request.urlopen(req, timeout=45) as response:
                if response.status != 200:
                    log_error("Fetching Intune Apps", f"HTTP Status: {response.status}")
                    return None
                data = json.loads(response.read().decode('utf-8'))
                all_apps.extend(data.get('value', []))
                uri = data.get('@odata.nextLink')
        except Exception as e:
            log_error("Fetching Intune Apps", str(e))
            return None
    return all_apps

def generate_report_output(apps):
    """Generates a structured list of Intune apps."""
    if not apps:
        return []
    report_list = []
    for app in apps:
        report_list.append({
            "displayName": app.get('displayName', 'N/A'),
            "id": app.get('id', 'N/A'),
            "version": app.get('displayVersion', 'N/A'),
        })
    return report_list

def check_intune_for_app(package_id, config):
    """Check if an app matching the package_id exists in Intune."""
    log_info(f"Checking Intune for apps matching '{package_id}'...")
    token = get_access_token(config)
    if not token:
        return {"error": "Failed to get access token."}

    processed_id = package_id.split(".")[0] if "." in package_id else package_id
    apps = get_intune_apps(token, package_id_filter=processed_id)
    if apps is None:
        return {"error": "Failed to retrieve Intune app report."}

    matches = []
    if apps:
        for app in apps:
            display_name = app.get('displayName', '')
            processed_display_name = display_name.split(".")[0] if "." in display_name else display_name
            if processed_id.lower() in processed_display_name.lower():
                matches.append(app)
    
    if matches:
        found_apps = generate_report_output(matches)
        log_warning(f"Found matching app(s) in Intune: {found_apps}")
        return {"exists": True, "apps": found_apps}
    else:
        log_info(f"No app with name containing '{package_id}' found in Intune.")
        return {"exists": False}

###############################################################################
## Microsoft Graph API Access Token Retrieval
###############################################################################
def get_access_token(config):
    """Get access token for Microsoft Graph API."""
    try:
        tenant_id = config['intune_tenant_id']
        client_id = config['intune_client_id']
        client_secret = config['intune_client_secret']

        authority = f"https://login.microsoftonline.com/{tenant_id}"
        url = f"{authority}/oauth2/v2.0/token"
        data = urllib.parse.urlencode({
            'grant_type': 'client_credentials',
            'client_id': client_id,
            'client_secret': client_secret,
            'scope': 'https://graph.microsoft.com/.default'
        }).encode('utf-8')

        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"}, method='POST')

        with urllib.request.urlopen(req, timeout=30) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8')).get('access_token')
            else:
                log_error("MSAL Authentication", f"HTTP Status {response.status}")
                return None
    except Exception as e:
        log_error("MSAL Authentication Exception", str(e))
        return None

###############################################################################
## Command Execution
###############################################################################
def run_command(cmd, description):
    """Execute a command and capture output, returning success and logs."""
    log_info(f"Executing: {description}...")
    try:
        cmd_str_list = [str(item) for item in cmd]
        process = subprocess.Popen(cmd_str_list, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace', shell=False)
        stdout, stderr = process.communicate()

        if process.returncode != 0:
            error_message = stderr.strip() or stdout.strip() or "No output."
            log_error(description, f"Return Code: {process.returncode}\n{error_message}")
            return False, error_message
        else:
            log_info(f"{description} completed successfully.")
            return True, stdout.strip()

    except Exception as e:
        log_error(f"Unexpected error during {description}", str(e))
        return False, str(e)

###############################################################################
## Main Logic, Refactored from Original main()
###############################################################################
def process_apps_batch(app_ids, version, architecture, installer_context, config):
    """
    This function contains the core logic from the original script,
    refactored to be called by the web server.
    """
    batch_results = {"success": [], "failed_pkg": [], "failed_pub": [], "skipped": []}
    logs = []

    # Get a single access token for the whole batch
    access_token = get_access_token(config)
    if not access_token:
        logs.append("FATAL: Failed to obtain access token. Cannot proceed with publishing.")
        return {"status": "error", "message": "Authentication failed.", "logs": logs, "results": batch_results}

    for package_id in app_ids:
        logs.append(f"--- Processing App: {package_id} ---")

        # 1. Package Creation/Check
        package_dir = Path(config['wintuner_download_dir']) / package_id / (version or 'latest')
        if package_dir.is_dir():
            logs.append(f"Local package found: {package_dir}")
        else:
            package_cmd = [
                "wintuner", "package", package_id,
                "--package-folder", config['wintuner_download_dir'],
                "--architecture", architecture,
                "--installer-context", installer_context
            ]
            if version:
                package_cmd.extend(["--version", version])

            success, output = run_command(package_cmd, f"Packaging {package_id}")
            logs.append(output)
            if not success:
                logs.append(f"❌ Failed to create package for {package_id}. Skipping.")
                batch_results["failed_pkg"].append(package_id)
                continue
        
        # 2. Publish to Intune (simplified from original - always attempts to publish)
        publish_cmd = [
            "wintuner", "publish", package_id,
            "--package-folder", config['wintuner_download_dir'],
            "--tenant", config['intune_tenant_id'],
            "--token", access_token
        ]
        if version:
            publish_cmd.extend(["--version", version])
        
        success, output = run_command(publish_cmd, f"Publishing {package_id}")
        logs.append(output)
        if success:
            logs.append(f"🎉 Successfully published {package_id} to Intune.")
            batch_results["success"].append(package_id)
        else:
            batch_results["failed_pub"].append(package_id)

    logs.append("--- Batch Processing Summary ---")
    summary = f"Success: {len(batch_results['success'])}, Failed Packaging: {len(batch_results['failed_pkg'])}, Failed Publishing: {len(batch_results['failed_pub'])}"
    logs.append(summary)
    
    return {"status": "success", "message": "Batch processing complete.", "logs": logs, "results": batch_results}
