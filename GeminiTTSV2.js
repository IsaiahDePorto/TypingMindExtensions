(function () {
    const STORAGE_KEY = 'tm_extension_google_tts_key';
    const VOICE_NAME = 'en-US-Studio-O'; // The high-quality "Gemini-style" voice
    
    let apiKey = localStorage.getItem(STORAGE_KEY);

    async function synthesizeSpeech(text) {
        if (!apiKey) {
            apiKey = prompt("Enter Google Cloud API Key (Text-to-Speech):");
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
                const audio = new Audio("data:audio/mp3;base64," + data.audioContent);
                audio.play();
            } else {
                console.error("Gemini TTS Error:", data);
                alert("Google TTS Error. Check console.");
            }
        } catch (error) {
            console.error("Failed to fetch Gemini TTS:", error);
        }
    }

    function injectButton(container) {
        if (container.querySelector('.gemini-tts-btn')) return;

        const button = document.createElement('button');
        button.className = 'gemini-tts-btn p-1 hover:bg-white/10 rounded transition-colors ml-1';
        button.title = "Play with Gemini TTS";
        button.style.cssText = 'display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px;';
        
        // Speaker Icon SVG (slightly modified for better mobile visibility)
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: rgba(255,255,255,0.7);">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
        `;

        button.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            // Find message text: TM usually stores message text in an element with data-element-id="ai-message"
            const messageRoot = container.closest('[data-element-id="chat-message"], [data-element-id="ai-message"]');
            if (messageRoot) {
                // Get clean text (ignoring the timestamp and action buttons)
                const textContent = messageRoot.innerText.replace(/[\d]{1,2}:[\d]{2}/, '').trim();
                synthesizeSpeech(textContent);
            }
        };

        // Try to append after the Copy button if it exists, otherwise just append to container
        const copyBtn = container.querySelector('[data-element-id="copy-message-button"]');
        if (copyBtn) {
            copyBtn.parentNode.insertBefore(button, copyBtn.nextSibling);
        } else {
            container.appendChild(button);
        }
    }

    // Main scanner function
    function scanAndInject() {
        // Try multiple selectors TypingMind uses for message action bars
        const selectors = [
            '[data-element-id="chat-message-actions"]',
            '[data-element-id="message-actions"]',
            '.message-actions'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(injectButton);
        });
    }

    // Observe for new messages or UI changes
    const observer = new MutationObserver(() => scanAndInject());
    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run
    scanAndInject();
    console.log("🚀 Gemini TTS Extension: Active and scanning...");
})();
