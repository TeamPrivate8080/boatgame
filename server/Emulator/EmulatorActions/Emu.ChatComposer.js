const { ConfigCache } = require('../../ConfigLoader');
const { Players, WordFilterArray } = require('../../ServerStoring');
const { EmuHookMsgHandler } = require('../EmulatorWorkspace/EmuWS.HandleCommands');

function EmulatorHandleMessageChatComposer(io, peer, payload) {
    const { Message, SenderName, GlobalMsg } = payload;

    let msg = Message;

    msg = String(msg).trim();
    if (!msg) return;

    const MAX_LENGTH = 200;
    if (msg.length > MAX_LENGTH) {
        msg = msg.slice(0, MAX_LENGTH);
    }

    if (ConfigCache.Server.Debug) {
        console.log('[Chat]', `Message from ${SenderName || 'Unknown'}: ${msg}`);
    }

    msg = msg.replace(/\s+/g, " ").trim();
    msg = msg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
    msg = msg.replace(/<[^>]+>/g, "");
    msg = msg.replace(/javascript:/ig, "javascript:");
    msg = msg.replace(/data:/ig, "data:");
    msg = msg.replace(/onerror\s*=/ig, "");
    msg = msg.replace(/onload\s*=/ig, "");
    msg = msg.replace(/onmouseover\s*=/ig, "");
    msg = msg.replace(/onfocus\s*=/ig, "");
    msg = msg.replace(/eval\(/ig, "");
    msg = msg.replace(/script/ig, "");
    msg = msg.replace(/iframe/ig, "");
    msg = msg.replace(/<svg/ig, "");

    if (Array.isArray(WordFilterArray) && WordFilterArray.length > 0) {
        for (let i = 0; i < WordFilterArray.length; i++) {
            const bad = String(WordFilterArray[i]).trim().toLowerCase();
            if (!bad) continue;

            const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            let regex;

            if (escaped.includes('http') || escaped.includes('.') || escaped.includes('www')) {
                regex = new RegExp(escaped, "gi");
            } else {
                regex = new RegExp(`\\b${escaped}\\b`, "gi");
            }

            msg = msg.replace(regex, "###");
        }
    }

    msg = msg.trim();
    if (!msg) return;

    const HookResp = EmuHookMsgHandler(io, peer, { message: msg, sender: SenderName });

    if (HookResp.handled) {
        if (HookResp.feedback) {
            io.to(peer.id).emit('resp.chat.message', {
                sender: 'Server',
                message: HookResp.feedback,
                owner: 'server'
            });
        }
        return;
    }

    if (GlobalMsg) {
        io.emit('resp.chat.message', {
            sender: SenderName,
            message: msg,
            owner: peer.id
        });
    } else {
        io.to(peer.id).emit('resp.chat.message', {
            sender: SenderName,
            message: msg,
            owner: peer.id
        });
    }

}

module.exports = {
    EmulatorHandleMessageChatComposer
};