(function() {
    // 1. CONFIRMATION ALERT (You can remove this once it works)
    console.log("!!! GEMINI EXTENSION LOADING !!!");
    alert("Gemini Media Extension Loaded! Check console (F12) for logs.");

    const STORAGE_KEY = 'tm_gemini_media_res';
    let currentRes = localStorage.getItem(STORAGE_KEY) || 'MEDIA_RESOLUTION_HIGH';

    // Helper to log with style so it's easy to find in the console
    const log = (msg, color = "#00ffcc") => console.log(`%c[GeminiRes] ${msg}`, `color: ${color}; font-weight: bold;`);

    // --- 1. THE UNIVERSAL HOOK ---
    // Instead of Fetch/XHR, we hook the JSON creator itself.
    // This is the most reliable way to catch data before it's sent.
    const originalStringify = JSON.stringify;
    JSON.stringify = function(value, replacer, space) {
        try {
            // TypingMind AI requests always have 'contents' and 'generationConfig'
            if (value && typeof value === 'object' && value.contents) {
                
                log("Intercepted a potential AI request...", "#ffcc00");

                // Target the generationConfig object
                // We use both casing styles found in TypingMind
                let config = value.generationConfig || value.generation_config;
                
                if (!config && value.model) {
                    // If config doesn't exist but it's a model call, create it
                    value.generationConfig = {};
                    config = value.generationConfig;
                }

                if (config) {
                    log(`Injecting Resolution: ${currentRes}`, "#00ff00");
                    
                    config.media_resolution = currentRes;
                    config.mediaResolution = currentRes;

                    // Ultra High Support (Per-part)
                    if (currentRes === 'MEDIA_RESOLUTION_ULTRA_HIGH') {
                        value.contents.forEach(c => {
                            c.parts?.forEach(p => {
                                if (p.inline_data || p.file_data) {
                                    p.media_resolution = { level: currentRes };
                                    p.mediaResolution = { level: currentRes };
                                }
                            });
                        });
                    }
                    log("SUCCESS: Resolution injected into payload.", "#00ff00");
                }
            }
        } catch (err) {
            // Ensure we never break the original stringify
        }
        return originalStringify(value, replacer, space);
    };

    // --- 2. UI INJECTION ---
    function injectUI() {
        const actionBar = document.querySelector('[data-element-id="chat-input-actions"]');
        if (!actionBar || document.getElementById('tm-gemini-res-container')) return;

        log("Injecting UI Selector...");
        const container = document.createElement('div');
        container.id = 'tm-gemini-res-container';
        container.style.cssText = 'display:flex; align-items:center; margin-right:8px; font-size:11px; border:1px solid #444; border-radius:4px; padding:2px 6px; background:rgba(255,255,255,0.05);';
        
        const select = document.createElement('select');
        select.style.cssText = 'background:transparent; border:none; outline:none; font-size:11px; cursor:pointer; color:inherit;';
        
        [
            {l:'Low', v:'MEDIA_RESOLUTION_LOW'},
            {l:'Med', v:'MEDIA_RESOLUTION_MEDIUM'},
            {l:'High', v:'MEDIA_RESOLUTION_HIGH'},
            {l:'Ultra', v:'MEDIA_RESOLUTION_ULTRA_HIGH'}
        ].forEach(optData => {
            const opt = document.createElement('option');
            opt.value = optData.v; opt.innerText = optData.l;
            opt.style.background = "#222"; // Dark theme fix
            if (optData.v === currentRes) opt.selected = true;
            select.appendChild(opt);
        });

        select.onchange = (e) => {
            currentRes = e.target.value;
            localStorage.setItem(STORAGE_KEY, currentRes);
            log("User changed setting to: " + currentRes);
        };

        container.innerHTML = `<span style="margin-right:4px; opacity:0.6;">Res:</span>`;
        container.appendChild(select);
        actionBar.prepend(container);
    }

    // Start UI check
    setInterval(injectUI, 2000);
})();
