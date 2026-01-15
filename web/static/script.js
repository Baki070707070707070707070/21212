document.addEventListener('DOMContentLoaded', () => {
    const runForm = document.getElementById('runForm');
    const executeBtn = document.getElementById('executeBtn');
    const tenantIdInput = document.getElementById('tenantId');
    const outputLog = document.getElementById('outputLog');
    const btnContent = executeBtn.querySelector('.btn-content');

    // Helper: Add log line with typing effect
    const addLog = (text, type = 'info') => {
        const line = document.createElement('div');
        line.className = `log-line ${type}`;
        // Insert before the last child, which is the cursor
        outputLog.insertBefore(line, outputLog.lastElementChild);

        let i = 0;
        const speed = 10;

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
        while (outputLog.children.length > 1) {
            outputLog.removeChild(outputLog.firstChild);
        }
    };

    runForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Tenant ID is now read from the disabled input field, pre-filled by the server
        const tenantId = tenantIdInput.value;

        // UI State: Running
        executeBtn.disabled = true;
        btnContent.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> PROCESSING...';
        clearTerminal();

        addLog(`> INITIATING AUTOMATTUNER PROTOCOL...`, 'info');
        addLog(`> TARGET TENANT LOCK: [${tenantId}]`, 'info');

        setTimeout(() => addLog("> ESTABLISHING SECURE CONNECTION...", 'info'), 500);
        setTimeout(() => addLog("> AUTHENTICATING PRINCIPALS...", 'info'), 1200);

        try {
            const response = await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenant_id: tenantId })
            });

            const data = await response.json();

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
    
    // Initial Welcome Message for authenticated users
    setTimeout(() => {
        addLog("> SYSTEM INITIALIZED.", 'success');
        addLog("> USER AUTHENTICATED. READY FOR INPUT.", 'info');
    }, 500);
});
