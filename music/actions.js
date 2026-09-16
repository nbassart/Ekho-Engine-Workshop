// ================================================
// 🎵 ACCIONS
// ================================================

export const gestureActions = [
    {
        id: "none",
        name: "No fa res",
        category: "basic"
    },

    {
        id: "note",
        name: "Nota",
        category: "sound"
    },

    {
        id: "chord",
        name: "Acord",
        category: "sound"
    },

    {
        id: "drum",
        name: "Pista de bateria",
        category: "rhythm"
    },

    {
        id: "drumPattern",
        name: "Patró de bateria",
        category: "rhythm"
    },

    {
        id: "loop",
        name: "Loop",
        category: "rhythm"
    },

    {
        id: "arpeggiator",
        name: "Arpegiador",
        category: "sound"
    },

    {
        id: "reverb",
        name: "Reverb",
        category: "effect"
    },

    {
        id: "delay",
        name: "Delay",
        category: "effect"
    },

    {
        id: "filter",
        name: "Filter",
        category: "effect"
    },

    {
        id: "distortion",
        name: "Distorsió",
        category: "effect"
    },

    {
        id: "tremolo",
        name: "Tremolo",
        category: "effect"
    },

    {
        id: "tempoUp",
        name: "Accelerar",
        category: "control"
    },

    {
        id: "tempoDown",
        name: "Desaccelerar",
        category: "control"
    }
];


// ================================================
// 🥁 PATRONS DE BATERIA
// ================================================
//
// Cada patró és una unitat completa de bateria.
//
// 16 passos = 1 compàs en 4/4 amb subdivisions de
// semicorxera.
//
// Tots els instruments comparteixen exactament
// els mateixos 16 passos.
// ================================================

export const drumPatterns = {

    // --------------------------------------------
    // 🟢 BASIC ELECTRO
    // --------------------------------------------
    //
    // Patró senzill i estable.
    // Ideal per començar.
    //

    basicElectro: {
        name: "Basic Electro",
        emoji: "🥁",

        kick: [
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0
        ],

        snare: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            1, 0, 1, 0,
            1, 0, 1, 0,
            1, 0, 1, 0,
            1, 0, 1, 0
        ],

        clap: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ]
    },


    // --------------------------------------------
    // 🔵 FOUR ON THE FLOOR
    // --------------------------------------------
    //
    // Més dance / house.
    //

    fourOnTheFloor: {
        name: "Four on the Floor",
        emoji: "💿",

        kick: [
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0
        ],

        snare: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ],

        clap: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ]
    },


    // --------------------------------------------
    // 🟣 ELECTRO GROOVE
    // --------------------------------------------
    //
    // Més sincopat.
    //

    electroGroove: {
        name: "Electro Groove",
        emoji: "⚡",

        kick: [
            1, 0, 0, 1,
            0, 0, 1, 0,
            1, 0, 0, 0,
            0, 1, 0, 0
        ],

        snare: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            1, 0, 1, 1,
            0, 1, 1, 0,
            1, 0, 1, 1,
            0, 1, 1, 0
        ],

        clap: [
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 0,
            0, 0, 1, 0
        ]
    },


    // --------------------------------------------
    // 🟠 BREAKBEAT
    // --------------------------------------------
    //
    // Més mogut i amb sensació de break.
    //

    breakbeat: {
        name: "Breakbeat",
        emoji: "🔥",

        kick: [
            1, 0, 0, 0,
            0, 0, 1, 0,
            1, 0, 0, 1,
            0, 1, 0, 0
        ],

        snare: [
            0, 0, 1, 0,
            1, 0, 0, 0,
            0, 0, 1, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ],

        clap: [
            0, 0, 1, 0,
            0, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 0
        ]
    },


    // --------------------------------------------
    // 🟡 MINIMAL
    // --------------------------------------------
    //
    // Pocs elements i molt d'espai.
    //

    minimal: {
        name: "Minimal",
        emoji: "◼️",

        kick: [
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 1,
            0, 0, 0, 0
        ],

        snare: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            0, 0, 1, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 1, 0, 0
        ],

        clap: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ]
    },


    // --------------------------------------------
    // 🔴 TRAP / HALF-TIME
    // --------------------------------------------
    //
    // Caixa a la tercera pulsació i hats més densos.
    //

    trap: {
        name: "Trap / Half-time",
        emoji: "🧊",

        kick: [
            1, 0, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
            0, 0, 1, 0
        ],

        snare: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0
        ],

        closedHat: [
            1, 0, 1, 1,
            1, 1, 1, 0,
            1, 0, 1, 1,
            1, 1, 1, 1
        ],

        clap: [
            0, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0
        ]
    },


    // --------------------------------------------
    // 🟢 DANCE
    // --------------------------------------------
    //
    // Patró més ple i energètic.
    //

    dance: {
        name: "Dance",
        emoji: "💥",

        kick: [
            1, 0, 0, 0,
            1, 0, 1, 0,
            1, 0, 0, 0,
            1, 0, 1, 0
        ],

        snare: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 0, 0
        ],

        closedHat: [
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ],

        clap: [
            0, 0, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 0,
            1, 0, 1, 0
        ]
    }
};


// ================================================
// 🎹 TIPUS D'ACORDS
// ================================================

export const chordTypes = {

    // -----------------------------
    // Tríades
    // -----------------------------

    major: {
        name: "Major",
        symbol: "",
        intervals: [0, 4, 7]
    },

    minor: {
        name: "Menor",
        symbol: "m",
        intervals: [0, 3, 7]
    },

    sus4: {
        name: "Sus4",
        symbol: "sus4",
        intervals: [0, 5, 7]
    },

    diminished: {
        name: "Disminuït",
        symbol: "dim",
        intervals: [0, 3, 6]
    },


    // -----------------------------
    // Sèptimes
    // -----------------------------

    dominant7: {
        name: "7a dominant",
        symbol: "7",
        intervals: [0, 4, 7, 10]
    },

    major7: {
        name: "Major 7",
        symbol: "maj7",
        intervals: [0, 4, 7, 11]
    },

    minor7: {
        name: "Minor 7",
        symbol: "m7",
        intervals: [0, 3, 7, 10]
    },

    halfDiminished7: {
        name: "Menor 7 ♭5",
        symbol: "m7♭5",
        intervals: [0, 3, 6, 10]
    },


    // -----------------------------
    // Extensions
    // -----------------------------
    //
    // Les mantenim disponibles al motor,
    // però l'editor del taller no les mostra
    // actualment.

    dominant9: {
        name: "9a dominant",
        symbol: "9",
        intervals: [0, 4, 7, 10, 14]
    },

    major9: {
        name: "Major 9",
        symbol: "maj9",
        intervals: [0, 4, 7, 11, 14]
    },

    minor9: {
        name: "Minor 9",
        symbol: "m9",
        intervals: [0, 3, 7, 10, 14]
    }
};


// ================================================
// 📍 ACCIONS DE POSICIÓ
// ================================================

export const positionActions = [

    {
        id: "volume",
        name: "Volum",
        category: "control"
    },

    {
        id: "tempo",
        name: "Tempo",
        category: "control"
    },

    {
        id: "reverbAmount",
        name: "Quantitat de reverb",
        category: "effect"
    },

    {
        id: "delayAmount",
        name: "Quantitat de delay",
        category: "effect"
    },

    {
        id: "filterAmount",
        name: "Quantitat de filter",
        category: "effect"
    },

    {
        id: "distortionAmount",
        name: "Quantitat de distorsió",
        category: "effect"
    },

    {
        id: "tremoloAmount",
        name: "Quantitat de tremolo",
        category: "effect"
    },

    {
        id: "pitch",
        name: "Altura / Pitch",
        category: "sound"
    }
];


// ================================================
// 📐 EIXOS
// ================================================

export const axes = [

    {
        id: "vertical",
        name: "Eix vertical",
        description:
            "La posició de la mà amunt o avall."
    },

    {
        id: "horizontal",
        name: "Eix horitzontal",
        description:
            "La posició de la mà esquerra o dreta."
    },

    {
        id: "movement",
        name: "Moviment",
        description:
            "La velocitat o intensitat del moviment."
    }
];