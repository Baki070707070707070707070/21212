document.addEventListener('DOMContentLoaded', () => {
    const runForm = document.getElementById('runForm');
    const executeBtn = document.getElementById('executeBtn');
    const outputLog = document.getElementById('outputLog');
    const btnContent = executeBtn.querySelector('.btn-content');

    // Input fields
    const appIdsInput = document.getElementById('appIds');
    const versionInput = document.getElementById('version');
    const architectureInput = document.getElementById('architecture');
    const installerContextInput = document.getElementById('installerContext');

    const addLog = (text, type = 'info') => {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        
        // To handle multi-line logs from the engine
        const textWithBreaks = text.replace(/\n/g, '<br>');
        line.innerHTML = textWithBreaks;

        outputLog.insertBefore(line, outputLog.lastElementChild);
        outputLog.scrollTop = outputLog.scrollHeight;
    };

    const clearTerminal = () => {
        while (outputLog.children.length > 1) {
            outputLog.removeChild(outputLog.firstChild);
        }
    };

    runForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect data from all form fields
        const payload = {
            app_ids: appIdsInput.value,
            version: versionInput.value,
            architecture: architectureInput.value,
            installer_context: installerContextInput.value
        };

        if (!payload.app_ids.trim()) {
            addLog("> ERROR: App IDs field cannot be empty.", 'error');
            return;
        }
        
        // UI State: Running
        executeBtn.disabled = true;
        btnContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
        clearTerminal();

        addLog(`> INITIATING AUTOMATTUNER PROTOCOL...`, 'info');
        addLog(`> Parameters: ${JSON.stringify(payload, null, 2)}`, 'info');

        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                addLog(`> STATUS: ${data.status}`, 'success');
                addLog(`> MESSAGE: ${data.message}`, 'success');
                if (data.details && data.details.logs) {
                    addLog(`> ENGINE LOGS:\n${data.details.logs}`, 'info');
                }
            } else {
                addLog(`> ERROR: ${data.error || 'Unknown failure'}`, 'error');
            }

        } catch (error) {
            addLog(`> CRITICAL FAILURE: ${error.message}`, 'error');
        } finally {
            // Reset UI
            executeBtn.disabled = false;
            btnContent.innerHTML = '<i class="fa-solid fa-bolt"></i> INITIATE SEQUENCE';
            addLog(`> OPERATION COMPLETE. WAITING...`, 'text-muted');
        }
    });

    // Initial Welcome Message
    setTimeout(() => {
        addLog("> SYSTEM INITIALIZED.", 'success');
        addLog("> USER AUTHENTICATED. READY FOR INPUT.", 'info');
    }, 500);
});
