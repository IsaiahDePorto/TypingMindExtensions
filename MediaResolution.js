/**
 * TypingMind Extension: Gemini 3 Media Resolution Controller
 * Injects a resolution selector and modifies outgoing Gemini API calls.
 */

(function() {
    const STORAGE_KEY = 'tm_gemini_media_res';
    const RESOLUTIONS = [
        { label: 'Low', value: 'MEDIA_RESOLUTION_LOW' },
        { label: 'Med', value: 'MEDIA_RESOLUTION_MEDIUM' },
        { label: 'High', value: 'MEDIA_RESOLUTION_HIGH' },
        { label: 'Ultra', value: 'MEDIA_RESOLUTION_ULTRA_HIGH' }
    ];

    // Initialize state
    let currentRes = localStorage.getItem(STORAGE_KEY) || 'MEDIA_RESOLUTION_HIGH';

    // --- 1. Request Interception Logic ---
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        let [url, options] = args;

        // Check if it's a Gemini request (Google AI Studio or direct)
        if (url.includes("generativelanguage.googleapis.com") && options.body) {
            try {
                let body = JSON.parse(options.body);

                // Check if the model is Gemini 3
                if (body.model && body.model.includes("gemini-3")) {
                    console.log(`[GeminiRes] Injecting ${currentRes} into request...`);

                    // Logic for ULTRA HIGH (Per-Part only)
                    if (currentRes === 'MEDIA_RESOLUTION_ULTRA_HIGH') {
                        if (body.contents) {
                            body.contents.forEach(content => {
                                content.parts.forEach(part => {
                                    // If part has media (inline_data or file_data)
                                    if (part.inline_data || part.file_data) {
                                        part.media_resolution = { level: currentRes };
                                    }
                                });
                            });
                        }
                    } else {
                        // Logic for LOW, MEDIUM, HIGH (Global Config)
                        body.generation_config = body.generation_config || {};
                        body.generation_config.media_resolution = currentRes;
                    }

                    options.body = JSON.stringify(body);
                }
            } catch (e) {
                console.error("[GeminiRes] Failed to parse request body", e);
            }
        }
        return originalFetch(url, options);
    };

    // --- 2. UI Injection Logic ---
    function injectUI() {
        // Target the chat input action bar
        const actionBar = document.querySelector('[data-element-id="chat-input-actions"]');
        if (!actionBar || document.getElementById('tm-gemini-res-container')) return;

        const container = document.createElement('div');
        container.id = 'tm-gemini-res-container';
        container.style.cssText = `
            display: flex;
            align-items: center;
            margin-right: 8px;
            font-size: 11px;
            color: #888;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 2px 4px;
            background: rgba(0,0,0,0.05);
        `;

        const label = document.createElement('span');
        label.innerText = 'Res: ';
        label.style.marginRight = '4px';
        container.appendChild(label);

        const select = document.createElement('select');
        select.style.cssText = 'background:transparent; border:none; outline:none; font-size:11px; cursor:pointer;';
        
        RESOLUTIONS.forEach(res => {
            const opt = document.createElement('option');
            opt.value = res.value;
            opt.innerText = res.label;
            if (res.value === currentRes) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            currentRes = e.target.value;
            localStorage.setItem(STORAGE_KEY, currentRes);
        };

        container.appendChild(select);
        actionBar.prepend(container);
    }

    // Run UI injection on an interval to catch dynamic loading
    setInterval(injectUI, 2000);
})();
