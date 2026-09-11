// ================================================
// 🎛️ ACCIONS DE L'INSTRUMENT
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

export const drumPatterns = {

    kick: {
        name: "Kick",
        emoji: "🥁",
        pattern: [
            1, 0, 1, 0,
            1, 0, 1, 0
        ]
    },

    snare: {
        name: "Caixa",
        emoji: "🥁",
        pattern: [
            0, 1, 0, 1,
            0, 1, 0, 1
        ]
    },

    closedHat: {
        name: "Hi-hat",
        emoji: "🎩",
        pattern: [
            1, 1, 1, 1,
            1, 1, 1, 1
        ]
    },

    clap: {
        name: "Clap",
        emoji: "👏",
        pattern: [
            0, 0, 1, 0,
            0, 0, 1, 0
        ]
    }

};


// ================================================
// 🎹 TIPUS D'ACORD
// ================================================
//
// Els intervals estan expressats en semitons
// respecte de la nota fonamental.
//
// 0  = fonamental
// 3  = tercera menor
// 4  = tercera major
// 7  = cinquena justa
// 10 = setena menor
// 11 = setena major
// 14 = novena
//
// ================================================

export const chordTypes = {

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

    diminished: {
        name: "Disminuït",
        symbol: "dim",
        intervals: [0, 3, 6]
    },

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
// 🎚️ ACCIONS DE POSICIÓ
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