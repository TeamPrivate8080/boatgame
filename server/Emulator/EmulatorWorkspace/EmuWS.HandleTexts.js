const { names_nouns, names_adjectives } = require('../../Texts/TextExporter.js');
const { Players } = require('../../ServerStoring.js');

function EmuExternalTexts_GetAvailableNameTag() {
    let name;
    do {
        const adj = names_adjectives[Math.floor(Math.random() * names_adjectives.length)];
        const noun = names_nouns[Math.floor(Math.random() * names_nouns.length)];
        name = `${adj}${noun}`;
    } while (Object.values(Players).some(p => p.ObjectName === name));

    return name;
}

module.exports = {
    EmuExternalTexts_GetAvailableNameTag
};