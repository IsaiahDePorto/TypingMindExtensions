(function () {
    // --- CONFIGURATION ---
    const DEFAULT_DAILY_BUDGET = 1.00; // Your daily limit in USD
    const REFRESH_INTERVAL = 30000; // Auto-refresh every 30 seconds
    // ---------------------

    let dailyTotal = 0;

    // 1. Database Access Logic
    async function calculateDailySpend() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('keyval-store');
            
            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['keyval'], 'readonly');
                const store = transaction.objectStore('keyval');
                const cursorRequest = store.openCursor();

                let total = 0;
                const startOfDay = new Date();
                startOfDay.setHours(0, 0, 0, 0);

                cursorRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const key = cursor.key;
                        const chat = cursor.value;

                        // Only process keys starting with CHAT_
                        if (typeof key === 'string' && key.startsWith('CHAT_')) {
                            const lastUpdate = new Date(chat.updatedAt || 0);
                            
                            // Check if chat was active today
                            if (lastUpdate >= startOfDay) {
                                // TypingMind stores estimated cost in chat.totalCost
                                total += (chat.totalCost || 0);
                            }
                        }
                        cursor.continue();
                    } else {
                        resolve(total);
                    }
                };
            };
            request.onerror = () => reject("Could not open IndexedDB");
        });
    }

    // 2. UI Creation
    function createBudgetWidget() {
        if (document.getElementById('tm-budget-tracker')) return;

        const sidebar = document.querySelector('[data-element-id="workspace-bar"]');
        if (!sidebar) return;

        const container = document.createElement('div');
        container.id = 'tm-budget-tracker';
        container.style.cssText = `
            padding: 10px;
            margin: 10px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 11px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        `;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #ccc;">
                <span>Daily Spend</span>
                <span id="budget-value">$0.00 / $${DEFAULT_DAILY_BUDGET.toFixed(2)}</span>
            </div>
            <div style="width: 100%; height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
                <div id="budget-bar" style="width: 0%; height: 100%; background: #10b981; transition: width 0.5s ease, background 0.5s ease;"></div>
            </div>
        `;

        sidebar.appendChild(container);
    }

    // 3. Update Loop
    async function updateUI() {
        try {
            const spend = await calculateDailySpend();
            const budget = parseFloat(localStorage.getItem('tm_daily_budget')) || DEFAULT_DAILY_BUDGET;
            const percentage = Math.min((spend / budget) * 100, 100);
            
            const bar = document.getElementById('budget-bar');
            const label = document.getElementById('budget-value');

            if (bar && label) {
                label.innerText = `$${spend.toFixed(3)} / $${budget.toFixed(2)}`;
                bar.style.width = `${percentage}%`;

                // Color logic: Green -> Orange -> Red
                if (percentage > 90) bar.style.background = '#ef4444';
                else if (percentage > 70) bar.style.background = '#f59e0b';
                else bar.style.background = '#10b981';
            }
        } catch (e) {
            console.error("Budget Tracker Error:", e);
        }
    }

    // Initialize
    function init() {
        createBudgetWidget();
        updateUI();
        
        // Refresh periodically
        setInterval(updateUI, REFRESH_INTERVAL);

        // Also refresh when the user sends a message (watches for URL changes or fetch)
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (args[0].includes('chat/completions')) {
                // Wait slightly for TypingMind to write the cost to IndexedDB
                setTimeout(updateUI, 2000);
            }
            return response;
        };
    }

    // Wait for UI to load
    const observer = new MutationObserver(() => {
        if (document.querySelector('[data-element-id="workspace-bar"]')) {
            init();
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
