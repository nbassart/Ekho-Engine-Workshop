// ================================================
// 🎛️ EL MEU INSTRUMENT
// ================================================
//
// Aquí pots crear el teu propi instrument.
//
// Canvia les paraules que hi ha entre cometes
// i prova què passa!
//
// 📖 Tens la llegenda a la pantalla del taller.
// ================================================



// 👈 MÀ ESQUERRA
// ================================================

let esquerra = {

    // 👍 POLZE
    thumb: "none",

    // ☝️ ÍNDEX
    index: {
    action: "note",
    value: "C4"
    },

    // 🖕 MIG
    middle: "none",

    // 💍 ANULAR
    ring: "none",

    // 🤙 MENOVELL
    pinky: "none"

};



// 👉 MÀ DRETA
// ================================================

let dreta = {

    // 👍 POLZE
    thumb: "none",

    // ☝️ ÍNDEX
    index: "none",

    // 🖕 MIG
    middle: "none",

    // 💍 ANULAR
    ring: "none",

    // 🤙 MENOVELL
    pinky: "none"

};



// ================================================
// 🚀 NO CAL TOCAR RES A PARTIR D'AQUÍ
// ================================================

export const instrumentConfig = {

    leftHand: esquerra,

    rightHand: dreta

};