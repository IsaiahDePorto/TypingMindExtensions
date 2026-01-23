(function() {
    const STORAGE_KEY = 'tm_gemini_media_res';
    let currentRes = localStorage.getItem(STORAGE_KEY) || 'MEDIA_RESOLUTION_HIGH';

    console.log("%c[GeminiRes] v4 Monitoring Active...", "color: #00ffcc; font-weight: bold;");

    // --- 1. THE INTERCEPTOR (SAFER) ---
    const originalStringify = JSON.stringify;
    JSON.stringify = function(value, replacer, space) {
        try {
            // Check for TypingMind's AI request structure: 'contents' + 'generationConfig'
            if (value && typeof value === 'object' && value.contents && (value.generationConfig || value.generation_config)) {
                
                // Only process if it's likely a Gemini/Google request
                const isGemini = (value.model && value.model.includes('gemini')) || 
                                 (value.generationConfig && value.generationConfig.thinkingConfig);

                if (isGemini) {
                    console.log("%c[GeminiRes] Detected AI Request. Injecting: " + currentRes, "color: #00ff00;");

                    const config = value.generationConfig || value.generation_config;

                    // Inject both styles (TypingMind internal + Google API standard)
                    config.media_resolution = currentRes;
                    config.mediaResolution = currentRes;

                    // Support for ULTRA HIGH (Per-part resolution)
                    if (currentRes === 'MEDIA_RESOLUTION_ULTRA_HIGH') {
                        value.contents.forEach(content => {
                            if (content.parts) {
                                content.parts.forEach(part => {
                                    if (part.inline_data || part.file_data) {
                                        part.media_resolution = { level: currentRes };
                                        part.mediaResolution = { level: currentRes };
                                    }
                                });
                            }
                        });
                    }
                    console.log("%c[GeminiRes] INJECTION SUCCESS", "color: #00ff00; font-weight: bold;");
                }
            }
        } catch (e) {
            // Silently fail so we don't break the actual Fetch/Sync
        }
        return originalStringify(value, replacer, space);
    };

    // --- 2. UI LOGIC (ISOLATED TO PREVENT ERRORS) ---
    function injectUI() {
        try {
            const actionBar = document.querySelector('[data-element-id="chat-input-actions"]');
            if (!actionBar || document.getElementById('tm-gemini-res-container')) return;

            const container = document.createElement('div');
            container.id = 'tm-gemini-res-container';
            container.style.cssText = 'display:flex; align-items:center; margin-right:8px; font-size:11px; border:1px solid rgba(128,128,128,0.2); border-radius:4px; padding:2px 6px; background:rgba(128,128,128,0.05);';
            
            const select = document.createElement('select');
            select.style.cssText = 'background:transparent; border:none; outline:none; font-size:11px; cursor:pointer; color:inherit;';
            
            const options = [
                { l: 'Low', v: 'MEDIA_RESOLUTION_LOW' },
                { l: 'Med', v: 'MEDIA_RESOLUTION_MEDIUM' },
                { l: 'High', v: 'MEDIA_RESOLUTION_HIGH' },
                { l: 'Ultra', v: 'MEDIA_RESOLUTION_ULTRA_HIGH' }
            ];

            options.forEach(optData => {
                const opt = document.createElement('option');
                opt.value = optData.v;
                opt.innerText = optData.l;
                if (optData.v === currentRes) opt.selected = true;
                select.appendChild(opt);
            });

            select.onchange = (e) => {
                currentRes = e.target.value;
                localStorage.setItem(STORAGE_KEY, currentRes);
                console.log("[GeminiRes] User changed res to: " + currentRes);
            };

            container.innerHTML = `<span style="margin-right:4px; opacity:0.7;">Res:</span>`;
            container.appendChild(select);
            actionBar.prepend(container);
        } catch (err) {
            console.error("[GeminiRes] UI Error", err);
        }
    }

    // Use a safer interval to ensure the UI is injected without blocking
    setTimeout(() => {
        setInterval(injectUI, 2000);
    }, 1000);
})();
