import { MachineClient } from "../global.js";

const ChatInput = document.getElementById('chat-input');

export let ChatFocus = false;
export let FreezeChat = false;

export function CastMessage(sender, message, ownerid, params = {}) {
    const ChatMsgs = document.getElementById('chat-messages');

    // Freeze chat
    if (params.freeze_chat) {
        FreezeChat = true;
        setTimeout(() => { FreezeChat = false; }, params.freeze_chat);
    }

    // Update FOV
    if (params.set_fov !== undefined && MachineClient?.ClientCamera) {
        const NewFov = parseFloat(params.set_fov);
        if (!isNaN(NewFov)) {
            MachineClient.ClientCamera.fov = NewFov;
            MachineClient.ClientCamera.updateProjectionMatrix();
        }
    }

    // Keep brackets and special text
    const parts = String(message)
        .split(/\[cut\]|\$/)
        .map(m => m.trim())
        .filter(m => m.length > 0);


    const MessageDivElement = document.createElement('div');
    MessageDivElement.classList.add('chat-message');
    MessageDivElement.style.display = 'block';
    MessageDivElement.style.padding = '2px 0';
    MessageDivElement.style.wordWrap = 'break-word';
    MessageDivElement.style.overflowWrap = 'anywhere';
    MessageDivElement.style.whiteSpace = 'normal';


    const senderSpan = document.createElement('span');
    senderSpan.classList.add('chat-sender');
    senderSpan.style.fontWeight = 'bold';
    senderSpan.style.marginRight = '4px';
    senderSpan.textContent = sender + ":";

    MessageDivElement.appendChild(senderSpan);


    const textSpan = document.createElement('span');
    textSpan.classList.add('chat-text');
    textSpan.style.whiteSpace = 'normal';
    textSpan.style.wordBreak = 'break-word';
    textSpan.style.overflowWrap = 'break-word';
    textSpan.style.wordWrap = 'break-word';
    textSpan.style.display = 'inline';

    parts.forEach((line, index) => {
        if (index > 0) textSpan.appendChild(document.createElement('br'));
        textSpan.appendChild(document.createTextNode(line));
    });

    MessageDivElement.appendChild(textSpan);

    ChatMsgs.appendChild(MessageDivElement);
    ChatMsgs.scrollTop = ChatMsgs.scrollHeight;

    const messages = ChatMsgs.getElementsByClassName('chat-message');
    while (messages.length > 100) {
        ChatMsgs.removeChild(messages[0]);
    }

    if (ownerid === MachineClient.ClientNetPeer.id) {
        ChatInput.value = '';
    }
}


ChatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const message = ChatInput.value.trim();
        if (message.length > 0) {
            MachineClient.ClientNetPeer.emit('chat.message', { message });
            ChatInput.value = "";
        } else {
            ChatInput.blur();
        }
    }
});

ChatInput.addEventListener('focus', () => { ChatFocus = true; });
ChatInput.addEventListener('blur', () => { ChatFocus = false; });
ChatInput.addEventListener('click', () => { ChatFocus = true; });

document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !ChatFocus) {
        e.preventDefault();
        ChatInput.focus();
    }
});

const ChatBoxCT = document.getElementById("chatbox");

let IsOpen = false;

document.getElementById("chat-toggle").addEventListener("click", () => {
    IsOpen = !IsOpen;

    if (IsOpen) {
        ChatBoxCT.classList.remove("-translate-x-[calc(100%-2.2rem)]", "opacity-90");
        ChatBoxCT.classList.add("translate-x-0", "opacity-100");
        document.getElementById("chat-arrow").setAttribute("data-lucide", "chevron-left"); // switch icon
    } else {
        ChatBoxCT.classList.add("-translate-x-[calc(100%-2.2rem)]", "opacity-90");
        ChatBoxCT.classList.remove("translate-x-0", "opacity-100");
        document.getElementById("chat-arrow").setAttribute("data-lucide", "chevron-right"); // switch icon
    }

});