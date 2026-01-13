document.addEventListener('DOMContentLoaded', () => {
    const runForm = document.getElementById('runForm');
    const executeBtn = document.getElementById('executeBtn');
    const outputLog = document.getElementById('outputLog');
    const btnContent = executeBtn.querySelector('.btn-content');

    // Helper: Add log line with typing effect
    const addLog = (text, type = 'info') => {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        outputLog.insertBefore(line, outputLog.lastElementChild);

        // Typing animation
        let i = 0;
        const speed = 10; // ms

        function typeWriter() {
            if (i < text.length) {
                line.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, speed);
                outputLog.scrollTop = outputLog.scrollHeight;
            }
        }
        typeWriter();
    };

    // Helper: Clear terminal
    const clearTerminal = () => {
        // Keep only the last child (cursor)
        while (outputLog.children.length > 1) {
            outputLog.removeChild(outputLog.firstChild);
        }
    };

    runForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const tenantId = document.getElementById('tenantId').value;

        // UI State: Running
        executeBtn.disabled = true;
        btnContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
        clearTerminal();

        addLog(`> INITIATING AUTOMATTUNER PROTOCOL...`, 'info');
        if (tenantId) addLog(`> TARGET TENANT LOCK: [${tenantId}]`, 'info');

        // Simulate some initial "connecting" logs for effect
        setTimeout(() => addLog("> ESTABLISHING SECURE CONNECTION...", 'info'), 500);
        setTimeout(() => addLog("> AUTHENTICATING PRINCIPALS...", 'info'), 1200);

        try {
            // Actual API Call
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: tenantId })
            });

            const data = await response.json();

            // Wait a bit to show the "connecting" logs before showing result
            setTimeout(() => {
                if (response.ok) {
                    addLog(`> SUCCESS: ${data.status}`, 'success');
                    addLog(`> MESSAGE: ${data.message}`, 'success');
                    if (data.details) {
                        addLog(`> DETAILS: ${JSON.stringify(data.details, null, 2)}`, 'info');
                    }
                } else {
                    addLog(`> ERROR: ${data.error || 'Unknown failure'}`, 'error');
                }

                // Reset UI
                executeBtn.disabled = false;
                btnContent.innerHTML = '<i class="fa-solid fa-bolt"></i> INITIATE SEQUENCE';
                addLog(`> OPERATION COMPLETE. WAITING...`, 'text-muted');
            }, 2000);

        } catch (error) {
            addLog(`> CRITICAL FAILURE: ${error.message}`, 'error');
            executeBtn.disabled = false;
            btnContent.innerHTML = '<i class="fa-solid fa-bolt"></i> INITIATE SEQUENCE';
        }
    });

    // Initial Welcome Message
    setTimeout(() => {
        addLog("> SYSTEM INITIALIZED.", 'success');
        addLog("> READY FOR INPUT.", 'info');
    }, 500);
});
