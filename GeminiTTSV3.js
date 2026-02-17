(function () {
    const STORAGE_KEY = 'tm_extension_google_tts_key';
    const VOICE_NAME = 'en-US-Studio-O'; 
    
    // --- CONFIRM SCRIPT IS RUNNING ---
    const debugTag = document.createElement('div');
    debugTag.innerHTML = 'Gemini TTS: Active';
    debugTag.style.cssText = 'position:fixed; top:0; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.5); color:white; font-size:10px; padding:2px 5px; z-index:9999; pointer-events:none; border-radius:0 0 5px 5px; opacity:0.5;';
    document.body.appendChild(debugTag);

    let apiKey = localStorage.getItem(STORAGE_KEY);

    async function synthesizeSpeech(text) {
        if (!apiKey) {
            apiKey = prompt("Enter Google Cloud API Key:");
            if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey);
            else return;
        }

        try {
            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    input: { text: text },
                    voice: { languageCode: "en-US", name: VOICE_NAME },
                    audioConfig: { audioEncoding: "MP3" }
                })
            });
            const data = await response.json();
            if (data.audioContent) {
                new Audio("data:audio/mp3;base64," + data.audioContent).play();
            } else {
                alert("Google API Error. Check if Text-to-Speech API is enabled in Cloud Console.");
            }
        } catch (e) { console.error(e); }
    }

    function inject() {
        // 1. Target the floating action bar buttons (Refresh, Edit, Copy)
        const copyBtns = document.querySelectorAll('[data-element-id="copy-message-button"]');
        copyBtns.forEach(copyBtn => {
            if (copyBtn.parentElement.querySelector('.gemini-tts-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'gemini-tts-btn p-1 ml-1';
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="white" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
            btn.onclick = (e) => {
                e.stopPropagation();
                const msg = btn.closest('[data-element-id="ai-message"], [data-element-id="chat-message"], .message-row');
                if (msg) synthesizeSpeech(msg.innerText.trim());
            };
            copyBtn.after(btn);
        });

        // 2. Target the Context Menu (the one in your screenshot)
        // TypingMind menus often use generic classes, so we look for the "Play" text
        const menuItems = document.querySelectorAll('div, button, li');
        menuItems.forEach(item => {
            if (item.innerText === 'Play' && !item.parentElement.querySelector('.gemini-menu-item')) {
                const geminiItem = item.cloneNode(true);
                geminiItem.innerText = 'Play (Gemini)';
                geminiItem.classList.add('gemini-menu-item');
                geminiItem.style.color = '#8E44AD'; // Purple color to distinguish it
                geminiItem.onclick = (e) => {
                    e.stopPropagation();
                    // Close menu by clicking backdrop if needed, then play
                    const allMsgs = document.querySelectorAll('[data-element-id="chat-message"]');
                    const lastMsg = allMsgs[allMsgs.length - 1]; // Fallback to last message
                    synthesizeSpeech(lastMsg.innerText.trim());
                    document.body.click(); // Try to close the menu
                };
                item.after(geminiItem);
            }
        });
    }

    // Run every 1 second to catch dynamically rendered mobile menus
    setInterval(inject, 1000);
    console.log("Gemini TTS Extension Loaded");
})();
