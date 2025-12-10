document.addEventListener('DOMContentLoaded', () => {
    // 0. Inject Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
        document.head.appendChild(link);
    }

    // 1. Inject CSS styles if not present
    if (!document.querySelector('link[href*="chat.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'src/styles/chat.css';
        document.head.appendChild(link);
    }

    // 2. Inject HTML if not present
    if (!document.getElementById('chat-widget')) {
        const chatWidget = document.createElement('div');
        chatWidget.id = 'chat-widget';
        chatWidget.innerHTML = `
            <button class="chat-widget-btn" id="chat-toggle">
                <i class="fas fa-comment-dots"></i>
            </button>
            <div class="chat-window" id="chat-window">
                <div class="chat-header">
                    <div class="chat-title">
                        <span>Matie Cake AI</span>
                        <span>Always here to help</span>
                    </div>
                    <button class="chat-close" id="chat-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="chat-messages" id="chat-messages">
                    <div class="message bot">
                        Hello! 👋 Welcome to Matie Cake. To help me find the best cake for you, could you tell me what kind of flavors you like? (e.g., Cheese, Fruit, Salted Egg...) 🍰
                    </div>
                </div>

                <div class="image-preview-container" id="image-preview-container">
                    <img id="image-preview-thumb" class="preview-thumb" src="" alt="Preview">
                    <button id="image-preview-remove" class="preview-remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="chat-input-area">
                    <div class="chat-input-wrapper">
                        <input type="text" class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off">
                        
                        <input type="file" id="chat-image-upload" accept="image/*" style="display: none;">
                        <button class="chat-tool-btn" id="chat-upload-btn" title="Upload Image">
                            <i class="fas fa-paperclip"></i>
                        </button>
                    </div>
                    <button class="chat-send" id="chat-send">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(chatWidget);
    }

    // Elements
    const toggleBtn = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const windowEl = document.getElementById('chat-window');
    const inputEl = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesEl = document.getElementById('chat-messages');

    // Image Upload Elements
    const uploadBtn = document.getElementById('chat-upload-btn');
    const fileInput = document.getElementById('chat-image-upload');
    const previewContainer = document.getElementById('image-preview-container');
    const previewThumb = document.getElementById('image-preview-thumb');
    const removePreviewBtn = document.getElementById('image-preview-remove');

    let currentImageData = null;

    // RESTORE STATE & HISTORY (Changed to sessionStorage for temporary persistence)
    const savedState = sessionStorage.getItem('chatState');
    const savedMessages = sessionStorage.getItem('chatMessages');

    if (savedState === 'open') {
        windowEl.classList.add('active');
    }

    if (savedMessages) {
        messagesEl.innerHTML = savedMessages;
        scrollToBottom();
    }

    // Toggle Chat
    function toggleChat() {
        windowEl.classList.toggle('active');
        const isOpen = windowEl.classList.contains('active');
        sessionStorage.setItem('chatState', isOpen ? 'open' : 'closed');

        if (isOpen) {
            setTimeout(() => inputEl.focus(), 300); // Wait for animation
        }
    }

    toggleBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Image Upload Logic
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageData = event.target.result; // Base64 string
            previewThumb.src = currentImageData;
            previewContainer.classList.add('active');
            inputEl.focus();
        };
        reader.readAsDataURL(file);
    });

    removePreviewBtn.addEventListener('click', () => {
        clearImageSelection();
    });

    function clearImageSelection() {
        fileInput.value = '';
        currentImageData = null;
        previewContainer.classList.remove('active');
        previewThumb.src = '';
    }

    // Auto-scroll to bottom
    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Send Message
    async function sendMessage() {
        const text = inputEl.value.trim();
        if (!text && !currentImageData) return; // Don't send empty

        // 1. Add User Message
        let userMsgContent = text;
        if (currentImageData) {
            userMsgContent += `<br><img src="${currentImageData}" alt="Uploaded Image">`;
        }
        addMessage(userMsgContent, 'user', true);

        // Clear inputs immediately
        inputEl.value = '';
        const imageDataToSend = currentImageData; // Capture for sending
        clearImageSelection();

        // 2. Show Typing Indicator
        const loadingId = addTypingIndicator();
        scrollToBottom();

        try {
            // 3. Send to Backend
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text || "Analyze this image", // Fallback text if only image
                    image: imageDataToSend
                })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            // 4. Remove Loading & Add Bot Response
            removeMessage(loadingId);
            addMessage(data.response, 'bot', true);

        } catch (error) {
            console.error('Error:', error);
            removeMessage(loadingId);
            addMessage("Sorry, I'm having trouble connecting to the server. Please check if the backend is running.", 'bot');
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Helper: Add Message
    function addMessage(text, type, isHtml = false) {
        const div = document.createElement('div');
        div.className = `message ${type}`;

        if (isHtml) {
            // Simple Markdown parser for images: ![alt](url) -> <img src="url" alt="alt">
            // And bold **text** -> <b>text</b>
            let processed = text
                // 1. Linked Image: [![alt](src)](href) -> <a href="href" target="_blank"><img ...></a>
                .replace(/\[!\[(.*?)\]\((.*?)\)\]\((.*?)\)/g, '<a href="$3" target="_blank"><img src="$2" alt="$1"></a>')
                // 2. Standard Image: ![alt](src) -> <img ...>
                .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
                // 3. Bold: **text** -> <b>text</b>
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                // 4. Newlines
                .replace(/\n/g, '<br>');
            div.innerHTML = processed;
        } else {
            div.textContent = text;
        }

        messagesEl.appendChild(div);
        scrollToBottom();

        // SAVE HISTORY (Session Only)
        sessionStorage.setItem('chatMessages', messagesEl.innerHTML);

        return div;
    }

    // Force all links in chat to open in new tab
    messagesEl.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link) {
            e.preventDefault();
            const url = link.getAttribute('href');
            if (url && url !== '#') {
                window.open(url, '_blank');
            }
        }
    });

    // Helper: Add Typing Indicator
    function addTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = `typing-${Date.now()}`;
        div.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesEl.appendChild(div);
        return div.id;
    }

    // Helper: Remove Message
    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
        // SAVE HISTORY (Update after removal)
        sessionStorage.setItem('chatMessages', messagesEl.innerHTML);
    }
});
