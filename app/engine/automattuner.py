import logging
from . import intune_logic  # Import the new refactored logic
import os

# Configure basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run(payload: dict, client_id: str, client_secret: str) -> dict:
    """
    Executes the actual Automattuner logic by calling the refactored script.
    Returns structured logs and result.
    """
    logger.info("Starting real Automattuner run...")
    
    # Extract parameters from the web UI payload
    app_ids_raw = payload.get("app_ids")
    if not app_ids_raw:
        return {"status": "error", "message": "App IDs are required."}
    
    app_ids = [pid.strip() for pid in app_ids_raw.split(',') if pid.strip()]
    version = payload.get("version") or None # Ensure None if empty
    architecture = payload.get("architecture", "x64")
    installer_context = payload.get("installer_context", "system")
    tenant_id = payload.get("tenant_id")

    if not tenant_id:
        return {"status": "error", "message": "Tenant ID is missing from session."}
    
    # Create the config object needed by the intune_logic module
    # Note: We are using the application's own credentials for the operations
    config = intune_logic.load_config(
        tenant_id=tenant_id,
        client_id=client_id,
        client_secret=client_secret,
        wintuner_dir=os.path.join(os.getcwd(), "wintuner_downloads") # Use a directory within the app's context
    )
    
    if not config:
        return {"status": "error", "message": "Failed to load configuration."}
        
    logger.info(f"Processing batch for tenant: {tenant_id}")
    logger.info(f"App IDs: {app_ids}, Version: {version}, Arch: {architecture}, Context: {installer_context}")

    # Call the main processing function from the refactored script
    result = intune_logic.process_apps_batch(
        app_ids=app_ids,
        version=version,
        architecture=architecture,
        installer_context=installer_context,
        config=config
    )
    
    logger.info("Run completed.")
    
    # Return the detailed results and logs from the script's execution
    return {
        "status": result.get("status", "success"),
        "message": result.get("message", "Automattuner execution completed"),
        "details": {
            "summary": result.get("results", {}),
            "logs": "\n".join(result.get("logs", []))
        }
    }
