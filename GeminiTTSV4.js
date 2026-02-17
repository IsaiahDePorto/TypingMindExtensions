(function () {
    const STORAGE_KEY = 'tm_extension_google_tts_key';
    const VOICE_NAME = 'en-US-Studio-O'; 
    
    // Status Indicator
    const debugTag = document.createElement('div');
    debugTag.id = 'gemini-tts-status';
    debugTag.innerHTML = 'Gemini TTS: Ready';
    debugTag.style.cssText = 'position:fixed; top:0; left:50%; transform:translateX(-50%); background:rgba(74, 144, 226, 0.8); color:white; font-size:10px; padding:2px 10px; z-index:9999; pointer-events:none; border-radius:0 0 8px 8px; font-family:sans-serif; transition: all 0.3s;';
    document.body.appendChild(debugTag);

    function updateStatus(text, color = 'rgba(74, 144, 226, 0.8)') {
        debugTag.innerHTML = 'Gemini TTS: ' + text;
        debugTag.style.background = color;
    }

    async function synthesizeSpeech(text) {
        let apiKey = localStorage.getItem(STORAGE_KEY);
        if (!apiKey || apiKey.length < 5) {
            apiKey = prompt("Please enter your Google Cloud API Key:");
            if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey);
            else return;
        }

        updateStatus('Generating Audio...', '#f39c12');

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
            
            if (data.error) {
                updateStatus('API Error', '#e74c3c');
                alert("Google API Error: " + data.error.message);
                if (data.error.status === "UNAUTHENTICATED") localStorage.removeItem(STORAGE_KEY);
                return;
            }

            if (data.audioContent) {
                updateStatus('Playing...', '#2ecc71');
                const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
                audio.onended = () => updateStatus('Ready');
                await audio.play();
            }
        } catch (e) {
            updateStatus('Network Error', '#e74c3c');
            alert("Connection failed. Check your internet or API Key.");
            console.error(e);
        }
    }

    function findMessageText(btn) {
        // Look for the closest message container
        const container = btn.closest('[data-element-id="chat-message"], [role="presentation"], .message-row');
        if (!container) return null;

        // Try to find the specific text element within that container
        const textEl = container.querySelector('[data-element-id="ai-message"]') || 
                       container.querySelector('.prose') || 
                       container;
        
        // Clone and remove UI elements (like timestamps) before grabbing text
        const clone = textEl.cloneNode(true);
        const toRemove = clone.querySelectorAll('button, .timestamp, [data-element-id="chat-message-actions"]');
        toRemove.forEach(el => el.remove());
        
        return clone.innerText.trim();
    }

    function inject() {
        const copyBtns = document.querySelectorAll('[data-element-id="copy-message-button"]');
        copyBtns.forEach(copyBtn => {
            if (copyBtn.parentElement.querySelector('.gemini-tts-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'gemini-tts-btn p-1 ml-1 hover:bg-white/20 rounded';
            btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" stroke="white" stroke-width="2" fill="none"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
            
            btn.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const text = findMessageText(btn);
                if (text && text.length > 0) {
                    await synthesizeSpeech(text);
                } else {
                    alert("Could not find message text to read.");
                }
            };
            copyBtn.after(btn);
        });
    }

    setInterval(inject, 1000);
    console.log("Gemini TTS Extension Updated");
})();
