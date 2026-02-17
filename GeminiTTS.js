(function () {
    // --- CONFIGURATION ---
    // You can hardcode your key here, or better yet, the script will prompt you 
    // the first time you use it and save it to your browser's localStorage.
    const STORAGE_KEY = 'tm_extension_google_tts_key';
    const VOICE_NAME = 'en-US-Studio-O'; // The high-quality "Gemini-style" voice
    
    let apiKey = localStorage.getItem(STORAGE_KEY);

    async function synthesizeSpeech(text) {
        if (!apiKey) {
            apiKey = prompt("Please enter your Google Cloud API Key (for Text-to-Speech):");
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
                console.error("TTS Error:", data);
                alert("Error from Google TTS. Check console for details.");
            }
        } catch (error) {
            console.error("Failed to fetch TTS:", error);
        }
    }

    function addTTSButton(actionGroup) {
        // Prevent duplicate buttons
        if (actionGroup.querySelector('.gemini-tts-btn')) return;

        const button = document.createElement('button');
        button.className = 'gemini-tts-btn p-1 hover:bg-white/20 rounded transition-colors ml-1';
        button.title = "Play with Gemini TTS";
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        
        // Speaker Icon SVG
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/70">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
        `;

        button.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Find the message text associated with this action group
            const messageElement = actionGroup.closest('[data-element-id="ai-message"], [data-element-id="chat-message"]');
            if (messageElement) {
                // Get text, excluding code blocks or UI elements if preferred
                const text = messageElement.innerText;
                synthesizeSpeech(text);
            }
        };

        actionGroup.appendChild(button);
    }

    // Observe the DOM for new messages
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) {
                    // TypingMind's action bar for messages
                    const actionGroups = node.querySelectorAll('[data-element-id="chat-message-actions"]');
                    actionGroups.forEach(addTTSButton);
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial run for existing messages
    document.querySelectorAll('[data-element-id="chat-message-actions"]').forEach(addTTSButton);

    console.log("Gemini TTS Extension Loaded");
})();
