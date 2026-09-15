// ================================================
// 🎛️ EL MEU INSTRUMENT
// ================================================
//
// Primer pots decidir què fa tota la mà.
// Si vols més control, pots personalitzar
// cada dit per separat.
//
// 📖 Tens la llegenda a la pantalla del taller.
// ================================================


// ================================================
// 👈 MÀ ESQUERRA
// ================================================

let esquerra = {

    // "hand"    → configura la mà sencera
    // "fingers" → personalitza els dits
    mode: "fingers",


    // ==========================================
    // 🖐️ CONFIGURACIÓ DE LA MÀ
    // ==========================================

    hand: {

        // 🖐️ Quan la mà està oberta
        open: {
            action: "note",
            value: "C4"
        },

        // ✊ Quan la mà està tancada
        closed: "none"

    },


    // ==========================================
    // 👇 CONFIGURACIÓ DELS DITS
    // ==========================================

    fingers: {

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

    }

};


// ================================================
// 👉 MÀ DRETA
// ================================================

let dreta = {

    mode: "fingers",


    // ==========================================
    // 🖐️ CONFIGURACIÓ DE LA MÀ
    // ==========================================

    hand: {

        // 🖐️ Quan la mà està oberta
        open: "none",

        // ✊ Quan la mà està tancada
        closed: "none"

    },


    // ==========================================
    // 👇 CONFIGURACIÓ DELS DITS
    // ==========================================

    fingers: {

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

    }

};


// ================================================
// 🚀 NO CAL TOCAR RES A PARTIR D'AQUÍ
// ================================================

export const instrumentConfig = {

    leftHand: esquerra,

    rightHand: dreta

};