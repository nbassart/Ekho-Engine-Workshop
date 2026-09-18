import {
    setupHandsUI,
    refreshHandUI
} from "./ui/hands-ui.js";

// ================================================
// 🎛️ EKHO WORKSHOP
// ================================================

import { startCamera } from "./core/camera.js";

import {
    createHandTracker,
    detectHands
} from "./core/hand-tracker.js";

import {
    detectBothHands
} from "./gestures/gesture-detector.js";

import {
    startSound,
    playNote,
    stopNote,
    playChord,
    stopChord,
    muteAllNotes,
    startDrumLoop,
    stopDrumLoop,
    setTempo
} from "./music/sound-engine.js";

import {
    instrumentConfig
} from "./config/instrument-config.js";

import {
    getScale
} from "./music/scales.js";

import {
    drumPatterns,
    chordTypes
} from "./music/actions.js";

import {
    setupGlobalMusicUI,
    refreshGlobalMusicUI
} from "./ui/music-ui.js";


// ================================================
// ELEMENTS
// ================================================

const video =
    document.getElementById("video");

const status =
    document.getElementById("status");

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");


// ================================================
// ESTAT
// ================================================

let selectedHand = null;
let selectedFinger = null;
let selectedAction = null;

let selectedScale = "C major";
let selectedTempo = 120;

let soundEnabled = false;


// ================================================
// 🖐️ MODE DE CONFIGURACIÓ DE CADA MÀ
// ================================================

const handModes = {
    left: "hand",
    right: "hand"
};

const selectedHandState = {
    left: "open",
    right: "open"
};

const activeHandStates = {
    left: null,
    right: null
};


// ================================================
// 🎵 NOTES
// ================================================

const chromaticNotes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B"
];


// ================================================
// 🎵 FREQÜÈNCIA
// ================================================

const pitchClasses = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11
};


function noteToMidi(noteName) {

    if (
        !noteName ||
        typeof noteName !== "string"
    ) {
        return null;
    }

    const match =
        noteName
            .trim()
            .match(
                /^([A-Ga-g](?:#|b)?)(-?\d+)$/
            );

    if (!match) {
        return null;
    }

    const note =
        match[1];

    const octave =
        Number(match[2]);

    const normalized =
        note.charAt(0).toUpperCase() +
        note.slice(1);

    const pitchClass =
        pitchClasses[normalized];

    if (
        pitchClass === undefined
    ) {
        return null;
    }

    return (
        (octave + 1) * 12 +
        pitchClass
    );
}


function noteToFrequency(noteName) {

    const midi =
        noteToMidi(noteName);

    if (midi === null) {
        return null;
    }

    return (
        440 *
        Math.pow(
            2,
            (midi - 69) / 12
        )
    );
}


// ================================================
// 🎹 ACORDS
// ================================================

function createChordFrequencies(
    rootNote,
    chordType
) {

    const rootMidi =
        noteToMidi(rootNote);

    const chord =
        chordTypes[chordType];

    if (
        rootMidi === null ||
        !chord
    ) {
        return [];
    }

    return chord.intervals.map(
        interval =>
            440 *
            Math.pow(
                2,
                (
                    rootMidi +
                    interval -
                    69
                ) / 12
            )
    );
}


// ================================================
// 🎼 OBTENIR NOTES DE LA TONALITAT
// ================================================

function getScaleNotes() {

    if (
        selectedScale === "Lliure"
    ) {
        return null;
    }

    const scale =
        getScale(selectedScale);

    if (
        !Array.isArray(scale)
    ) {
        return null;
    }

    return scale
        .map(item =>
            `${item.note}${item.octave}`
        );
}


// ================================================
// 🎼 NOTES DISPONIBLES
// ================================================

function getAvailableNotes() {

    if (
        selectedScale === "Lliure"
    ) {

        const notes = [];

        for (
            let octave = 3;
            octave <= 5;
            octave++
        ) {

            for (
                const note
                of chromaticNotes
            ) {

                notes.push(
                    `${note}${octave}`
                );
            }
        }

        return notes;
    }

    const notes =
        getScaleNotes();

    return notes || [];
}


// ================================================
// 🎹 UTILITATS D'ACORDS
// ================================================

// Treu l'octava del nom que es mostra a la interfície.
//
// Internament continuem treballant amb C3, D3, etc.
// però visualment volem mostrar C, D, etc.

function getChordDisplayRoot(
    rootNote
) {

    if (
        !rootNote ||
        typeof rootNote !== "string"
    ) {
        return rootNote;
    }

    return rootNote.replace(
        /-?\d+$/,
        ""
    );
}


// ================================================
// 🎹 GRAUS ROMANS
// ================================================

const romanNumerals = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII"
];


function getRomanNumeral(
    degreeIndex,
    chordType
) {

    let numeral =
        romanNumerals[
            degreeIndex
        ];


    if (
        chordType === "minor" ||
        chordType === "diminished"
    ) {

        numeral =
            numeral.toLowerCase();
    }


    if (
        chordType === "diminished"
    ) {

        numeral += "°";
    }


    return numeral;
}


// ================================================
// 🎹 TIPUS D'ACORDS QUE VOLEM AL TALLER
// ================================================
//
// Només mostrem:
// - tríades
// - sus4
// - sèptimes
//
// No mostrem novenes.
// Els acords només apareixen si TOTES les seves
// notes formen part de la tonalitat.
//

const workshopChordTypes = [
    "major",
    "minor",
    "diminished",
    "sus4",
    "dominant7",
    "major7",
    "minor7",
    "halfDiminished7"
];


// ================================================
// 🎹 ACORDS DIATÒNICS DISPONIBLES
// ================================================
//
// En una tonalitat:
//
// I      [C] [Cmaj7] ...
// ii     [Dm] [Dm7] ...
// iii    [Em] [Em7] ...
//
// Cada acord és independent.
//
// No ens limitem a les 7 tríades:
// també mostrem totes les variants del taller
// que encaixen completament dins de la tonalitat.
//

function getDiatonicChords() {

    const scale =
        getScale(selectedScale);


    if (
        !Array.isArray(scale) ||
        scale.length < 7
    ) {
        return [];
    }


    const scaleDegrees =
        scale.slice(0, 7);


    const scalePitchClasses =
        new Set(
            scaleDegrees.map(
                note => {

                    const midi =
                        noteToMidi(
                            `${note.note}3`
                        );

                    return midi % 12;
                }
            )
        );


    const chords = [];


    for (
        let degreeIndex = 0;
        degreeIndex < 7;
        degreeIndex++
    ) {

        const degree =
            scaleDegrees[
                degreeIndex
            ];


        const root =
            `${degree.note}3`;


        for (
            const type
            of workshopChordTypes
        ) {

            if (
                !chordTypes[type]
            ) {
                continue;
            }


            if (
                !chordFitsScaleWithPitchClasses(
                    root,
                    type,
                    scalePitchClasses
                )
            ) {
                continue;
            }


            chords.push({

                root,

                type,

                degree:
                    getRomanNumeral(
                        degreeIndex,
                        type
                    ),

                name:
                    `${
                        getRomanNumeral(
                            degreeIndex,
                            type
                        )
                    } — ${
                        getChordDisplayRoot(
                            root
                        )
                    }${
                        chordTypes[type].symbol
                    }`

            });
        }
    }


    return chords;
}


// ================================================
// 🎹 COMPROVAR SI UN ACORD ENCAIXA
// ================================================

function chordFitsScaleWithPitchClasses(
    rootNote,
    chordType,
    allowedPitchClasses
) {

    const chord =
        chordTypes[chordType];

    const rootMidi =
        noteToMidi(rootNote);


    if (
        !chord ||
        rootMidi === null
    ) {
        return false;
    }


    return chord.intervals.every(
        interval => {

            const pitchClass =
                (
                    rootMidi +
                    interval
                ) % 12;

            return allowedPitchClasses.has(
                pitchClass
            );
        }
    );
}


// ================================================
// 🎹 ACORD COMPATIBLE
// ================================================

function chordFitsScale(
    rootNote,
    chordType
) {

    if (
        selectedScale === "Lliure"
    ) {
        return true;
    }

    const scaleNotes =
        getAvailableNotes();

    const chord =
        chordTypes[chordType];

    const rootMidi =
        noteToMidi(rootNote);

    if (
        !chord ||
        rootMidi === null ||
        scaleNotes.length === 0
    ) {
        return false;
    }

    const allowedPitchClasses =
        new Set(
            scaleNotes.map(note => {

                const midi =
                    noteToMidi(note);

                return (
                    midi === null
                        ? null
                        : midi % 12
                );
            })
        );

    return chord.intervals.every(
        interval => {

            const pitchClass =
                (
                    rootMidi +
                    interval
                ) % 12;

            return allowedPitchClasses.has(
                pitchClass
            );
        }
    );
}


// ================================================
// 🎹 ACORDS DISPONIBLES
// ================================================

function getAvailableChords() {

    // ==========================================
    // 🎼 TONALITAT
    // ==========================================

    if (
        selectedScale !== "Lliure"
    ) {

        return getDiatonicChords();
    }


    // ==========================================
    // 🎨 MODE LLIURE
    // ==========================================

    const notes =
        getAvailableNotes();

    const chords = [];

    const roots = [];


    for (
        const note
        of notes
    ) {

        const midi =
            noteToMidi(note);

        if (
            midi === null
        ) {
            continue;
        }

        const pitchClass =
            midi % 12;

        if (
            !roots.some(
                root =>
                    root.pitchClass ===
                    pitchClass
            )
        ) {

            roots.push({
                note,
                pitchClass
            });
        }
    }


    for (
        const root
        of roots
    ) {

        for (
            const type
            of workshopChordTypes
        ) {

            if (
                !chordTypes[type]
            ) {
                continue;
            }


            chords.push({

                root:
                    root.note,

                type,

                name:
                    getChordDisplayRoot(
                        root.note
                    ) +
                    chordTypes[type].symbol

            });
        }
    }


    return chords;
}


// ================================================
// 👆 ESTAT DELS DITS
// ================================================

const activeNotes = {

    left: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false
    },

    right: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false
    }
};


const fingerLabels = {

    thumb: "👍 Polze",
    index: "☝️ Índex",
    middle: "🖕 Mig",
    ring: "💍 Anular",
    pinky: "🤙 Menovell"
};


// ================================================
// 🎥 CANVAS
// ================================================

const HAND_CONNECTIONS = [

    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    [5, 9],
    [9, 13],
    [13, 17]
];


function resizeCanvas() {

    if (
        !video.videoWidth
    ) {
        return;
    }

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;
}


function drawHands(results) {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    if (
        !results ||
        !results.landmarks
    ) {
        return;
    }

    for (
        const landmarks
        of results.landmarks
    ) {

        ctx.beginPath();

        for (
            const [
                a,
                b
            ]
            of HAND_CONNECTIONS
        ) {

            const p1 =
                landmarks[a];

            const p2 =
                landmarks[b];

            ctx.moveTo(
                p1.x * canvas.width,
                p1.y * canvas.height
            );

            ctx.lineTo(
                p2.x * canvas.width,
                p2.y * canvas.height
            );
        }

        ctx.strokeStyle =
            "#00ff88";

        ctx.lineWidth = 3;

        ctx.stroke();


        for (
            const point
            of landmarks
        ) {

            ctx.beginPath();

            ctx.arc(
                point.x * canvas.width,
                point.y * canvas.height,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#ffffff";

            ctx.fill();
        }
    }
}


// ================================================
// CONFIGURACIÓ D'UN DIT / D'UNA MÀ
// ================================================

function getHandConfig(hand) {

    return hand === "left"
        ? instrumentConfig.leftHand
        : instrumentConfig.rightHand;
}


function ensureHandConfig(hand) {

    const config =
        getHandConfig(hand);

    if (!config.hand) {

        config.hand = {
            open: "none",
            closed: "none"
        };
    }

    if (!config.fingers) {

        config.fingers = {
            thumb: "none",
            index: "none",
            middle: "none",
            ring: "none",
            pinky: "none"
        };
    }

    return config;
}


function getFingerConfig(
    hand,
    finger
) {

    const config =
        ensureHandConfig(hand);

    return config.fingers[finger];
}


function getVoiceId(
    hand,
    finger
) {

    return `${hand}-${finger}`;
}


function getWholeHandVoiceId(
    hand,
    state
) {

    return `${hand}-whole-${state}`;
}


for (
    const hand
    of ["left", "right"]
) {

    const config =
        ensureHandConfig(hand);

    config.mode =
        "hand";
}


// ================================================
// 🔊 EXECUTAR ACCIÓ
// ================================================

function executeAction(
    hand,
    finger,
    isActive
) {

    if (!soundEnabled) {
        return;
    }

    const config =
        getFingerConfig(
            hand,
            finger
        );

    const voiceId =
        getVoiceId(
            hand,
            finger
        );


    if (
        !config ||
        config === "none"
    ) {
        return;
    }


    const action =
        config.action;


    // ==========================================
    // 🎵 NOTA
    // ==========================================

    if (
        action === "note"
    ) {

        const frequency =
            noteToFrequency(
                config.value
            );

        if (
            frequency === null
        ) {
            return;
        }

        if (isActive) {

            playNote(
                voiceId,
                frequency
            );

        }
        else {

            stopNote(
                voiceId
            );
        }

        return;
    }


    // ==========================================
    // 🎹 ACORD
    // ==========================================

    if (
        action === "chord"
    ) {

        const frequencies =
            createChordFrequencies(
                config.value,
                config.chordType
            );

        if (
            frequencies.length === 0
        ) {
            return;
        }

        if (isActive) {

            playChord(
                voiceId,
                frequencies
            );

        }
        else {

            stopChord(
                voiceId
            );
        }

        return;
    }


    // ==========================================
    // 🥁 BATERIA
    // ==========================================

    if (
        action === "drum"
    ) {

        const pattern =
            drumPatterns[config.value];

        if (!pattern) {
            return;
        }

        if (isActive) {

            startDrumLoop(
                voiceId,
                pattern
            );

        }
        else {

            stopDrumLoop(
                voiceId
            );
        }
    }
}


// ================================================
// 🛑 ATURAR VEUS D'UNA MÀ
// ================================================

function stopHandVoices(hand) {

    const fingers = [
        "thumb",
        "index",
        "middle",
        "ring",
        "pinky"
    ];

    for (
        const finger
        of fingers
    ) {

        const voiceId =
            getVoiceId(
                hand,
                finger
            );

        stopNote(voiceId);
        stopChord(voiceId);
        stopDrumLoop(voiceId);

        activeNotes[hand][finger] =
            false;
    }

    for (
        const state
        of ["open", "closed"]
    ) {

        const voiceId =
            getWholeHandVoiceId(
                hand,
                state
            );

        stopNote(voiceId);
        stopChord(voiceId);
        stopDrumLoop(voiceId);
    }

    activeHandStates[hand] =
        null;
}


// ================================================
// 🖐️ EXECUTAR ACCIÓ DE LA MÀ SENCERA
// ================================================

function executeWholeHandAction(
    hand,
    state,
    config
) {

    if (
        !soundEnabled ||
        !config ||
        config === "none"
    ) {
        return;
    }

    const voiceId =
        getWholeHandVoiceId(
            hand,
            state
        );

    if (
        config.action === "note"
    ) {

        const frequency =
            noteToFrequency(
                config.value
            );

        if (
            frequency !== null
        ) {

            playNote(
                voiceId,
                frequency
            );
        }

        return;
    }

    if (
        config.action === "chord"
    ) {

        const frequencies =
            createChordFrequencies(
                config.value,
                config.chordType
            );

        if (
            frequencies.length > 0
        ) {

            playChord(
                voiceId,
                frequencies
            );
        }

        return;
    }

    if (
        config.action === "drum"
    ) {

        const pattern =
            drumPatterns[config.value];

        if (!pattern) {
            return;
        }

        startDrumLoop(
            voiceId,
            pattern
        );
    }
}


// ================================================
// 🖐️ PROCESSAR MÀ
// ================================================

function processHand(
    handName,
    hand
) {

    if (!hand) {

        stopHandVoices(
            handName
        );

        return;
    }

    const config =
        ensureHandConfig(
            handName
        );

    const fingers =
        hand.fingers || hand;

    const fingerNames = [
        "thumb",
        "index",
        "middle",
        "ring",
        "pinky"
    ];


    // ==========================================
    // 🖐️ MÀ SENCERA
    // ==========================================

    if (
        handModes[handName] ===
        "hand"
    ) {

        const isOpen =
            fingerNames.every(
                finger =>
                    Boolean(
                        fingers[finger]
                    )
            );

        const isClosed =
            fingerNames.every(
                finger =>
                    !Boolean(
                        fingers[finger]
                    )
            );

        let state =
            null;

        if (isOpen) {

            state =
                "open";

        }
        else if (isClosed) {

            state =
                "closed";
        }

        if (!state) {

            if (
                activeHandStates[
                    handName
                ]
            ) {

                const previousState =
                    activeHandStates[
                        handName
                    ];

                const voiceId =
                    getWholeHandVoiceId(
                        handName,
                        previousState
                    );

                stopNote(
                    voiceId
                );

                stopChord(
                    voiceId
                );

                stopDrumLoop(
                    voiceId
                );

                activeHandStates[
                    handName
                ] =
                    null;
            }

            return;
        }

        if (
            activeHandStates[
                handName
            ] === state
        ) {

            return;
        }

        if (
            activeHandStates[
                handName
            ]
        ) {

            const previousState =
                activeHandStates[
                    handName
                ];

            const previousVoiceId =
                getWholeHandVoiceId(
                    handName,
                    previousState
                );

            stopNote(
                previousVoiceId
            );

            stopChord(
                previousVoiceId
            );

            stopDrumLoop(
                previousVoiceId
            );
        }

        executeWholeHandAction(
            handName,
            state,
            config.hand[state]
        );

        activeHandStates[
            handName
        ] =
            state;

        return;
    }


    // ==========================================
    // 👆 DITS PERSONALITZATS
    // ==========================================

    for (
        const finger
        of fingerNames
    ) {

        const isActive =
            Boolean(
                fingers[finger]
            );

        const wasActive =
            activeNotes[
                handName
            ][finger];

        if (
            isActive !==
            wasActive
        ) {

            executeAction(
                handName,
                finger,
                isActive
            );

            activeNotes[
                handName
            ][finger] =
                isActive;
        }
    }
}


// ================================================
// 🔇 SENSE MANS
// ================================================

function globalMuteIfNoHands(
    hands
) {

    if (
        !hands ||
        (
            !hands.left &&
            !hands.right
        )
    ) {

        muteAllNotes();

        for (
            const hand
            of ["left", "right"]
        ) {

            stopHandVoices(
                hand
            );
        }
    }
}


// ================================================
// 🎵 CREAR SELECTOR DE NOTES
// ================================================

function createNoteSelector(
    currentValue = null
) {

    const valueArea =
        document.getElementById(
            "value-area"
        );

    valueArea.innerHTML =
        "";

    valueArea.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "value-title";

    title.textContent =
        "🎵 Tria una nota";

    valueArea.appendChild(
        title
    );


    const help =
        document.createElement(
            "div"
        );

    help.className =
        "value-help";

    help.textContent =
        selectedScale === "Lliure"
            ? "🎨 Mode lliure: pots escollir qualsevol nota."
            : `🎼 Notes de ${selectedScale}`;

    valueArea.appendChild(
        help
    );


    const select =
        document.createElement(
            "select"
        );

    select.id =
        "note-select";


    const notes =
        getAvailableNotes();


    for (
        const note
        of notes
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            note;

        option.textContent =
            note;

        select.appendChild(
            option
        );
    }


    if (
        currentValue &&
        notes.includes(currentValue)
    ) {

        select.value =
            currentValue;

    }
    else if (
        notes.length > 0
    ) {

        select.value =
            notes[0];
    }


    select.addEventListener(
        "change",
        () => {

            changeNote(
                select.value
            );

        }
    );


    valueArea.appendChild(
        select
    );
}


// ================================================
// 🎹 CREAR SELECTOR D'ACORDS
// ================================================
//
// En tonalitat:
//
// I       [ C ] [ Cmaj7 ]
// ii      [ Dm ] [ Dm7 ]
// iii     [ Em ] [ Em7 ]
//
// Cada botó és independent.
//
// En Lliure:
//
// [ C ] [ Cm ] [ C7 ] [ Cmaj7 ] ...
//
// ================================================

function createChordSelector(
    currentRoot = null,
    currentType = null
) {

    const valueArea =
        document.getElementById(
            "value-area"
        );

    valueArea.innerHTML =
        "";

    valueArea.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "value-title";

    title.textContent =
        "🎹 Tria un acord";

    valueArea.appendChild(
        title
    );


    const help =
        document.createElement(
            "div"
        );

    help.className =
        "value-help";

    help.textContent =
        selectedScale === "Lliure"
            ? "🎨 Mode lliure: pots escollir qualsevol acord."
            : `🎼 Acords de ${selectedScale} · només els que encaixen amb la tonalitat`;

    valueArea.appendChild(
        help
    );


    const chords =
        getAvailableChords();


    // ==========================================
    // 🎨 MODE LLIURE
    // ==========================================

    if (
        selectedScale === "Lliure"
    ) {

        const freeRow =
            document.createElement(
                "div"
            );

        freeRow.style.display =
            "flex";

        freeRow.style.flexWrap =
            "wrap";

        freeRow.style.gap =
            "8px";

        freeRow.style.alignItems =
            "center";

        freeRow.style.marginTop =
            "12px";


        for (
            const chord
            of chords
        ) {

            const button =
                createChordButton(
                    chord,
                    currentRoot,
                    currentType
                );

            freeRow.appendChild(
                button
            );
        }


        valueArea.appendChild(
            freeRow
        );

        return;
    }


    // ==========================================
    // 🎼 TONALITAT
    // ==========================================

    for (
        let degreeIndex = 0;
        degreeIndex < 7;
        degreeIndex++
    ) {

        const degreeChords =
            chords.filter(
                chord =>
                    getChordDegreeIndex(
                        chord
                    ) === degreeIndex
            );


        if (
            degreeChords.length === 0
        ) {
            continue;
        }


        const row =
            document.createElement(
                "div"
            );

        row.style.display =
            "flex";

        row.style.alignItems =
            "center";

        row.style.gap =
            "8px";

        row.style.marginTop =
            "8px";

        row.style.flexWrap =
            "wrap";


        const degreeLabel =
            document.createElement(
                "div"
            );

        degreeLabel.textContent =
            getDegreeLabel(
                degreeChords[0]
            );

        degreeLabel.style.width =
            "48px";

        degreeLabel.style.minWidth =
            "48px";

        degreeLabel.style.fontWeight =
            "700";

        degreeLabel.style.fontSize =
            "1rem";

        degreeLabel.style.textAlign =
            "right";

        degreeLabel.style.marginRight =
            "4px";


        row.appendChild(
            degreeLabel
        );


        for (
            const chord
            of degreeChords
        ) {

            const button =
                createChordButton(
                    chord,
                    currentRoot,
                    currentType
                );

            row.appendChild(
                button
            );
        }


        valueArea.appendChild(
            row
        );
    }
}


// ================================================
// 🎹 CREAR BOTÓ D'ACORD
// ================================================

function createChordButton(
    chord,
    currentRoot,
    currentType
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.textContent =
        selectedScale === "Lliure"
            ? chord.name
            : getChordButtonName(chord);


    button.style.border =
        "1px solid #6f42c1";

    button.style.borderRadius =
        "8px";

    button.style.padding =
        "8px 14px";

    button.style.fontSize =
        "0.95rem";

    button.style.cursor =
        "pointer";

    button.style.background =
        "#211b2d";

    button.style.color =
        "#ffffff";

    button.style.transition =
        "all 0.15s ease";


    const isSelected =
        chord.root === currentRoot &&
        chord.type === currentType;


    if (
        isSelected
    ) {

        button.style.background =
            "#7c4dff";

        button.style.borderColor =
            "#9b78ff";

    }


    button.addEventListener(
        "mouseenter",
        () => {

            if (
                !(
                    chord.root === currentRoot &&
                    chord.type === currentType
                )
            ) {

                button.style.background =
                    "#302640";
            }
        }
    );


    button.addEventListener(
        "mouseleave",
        () => {

            if (
                !(
                    chord.root === currentRoot &&
                    chord.type === currentType
                )
            ) {

                button.style.background =
                    "#211b2d";
            }
        }
    );


    button.addEventListener(
        "click",
        () => {

            changeChord(
                chord.root,
                chord.type
            );

            createChordSelector(
                chord.root,
                chord.type
            );
        }
    );


    return button;
}


// ================================================
// 🎹 NOM VISIBLE DEL BOTÓ
// ================================================
//
// El grau romà ja està a l'esquerra de la fila.
// Per tant, dins del botó només mostrem:
//
// C
// Cmaj7
// Dm
// Dm7
//
// etc.
//
// ================================================

function getChordButtonName(
    chord
) {

    return (
        getChordDisplayRoot(
            chord.root
        ) +
        (
            chordTypes[chord.type]?.symbol ||
            ""
        )
    );
}


// ================================================
// 🎹 OBTENIR GRAU D'UN ACORD
// ================================================

function getChordDegreeIndex(
    chord
) {

    const scale =
        getScale(selectedScale);


    if (
        !Array.isArray(scale)
    ) {
        return -1;
    }


    const displayRoot =
        getChordDisplayRoot(
            chord.root
        );


    return scale
        .slice(0, 7)
        .findIndex(
            degree =>
                degree.note ===
                displayRoot
        );
}


// ================================================
// 🎹 ETIQUETA DEL GRAU
// ================================================

function getDegreeLabel(
    chord
) {

    const degreeIndex =
        getChordDegreeIndex(
            chord
        );


    if (
        degreeIndex < 0
    ) {
        return "";
    }


    return getRomanNumeral(
        degreeIndex,
        chord.type
    );
}


// ================================================
// 🥁 SELECTOR BATERIA
// ================================================

function createDrumSelector(
    currentValue = null
) {

    const valueArea =
        document.getElementById(
            "value-area"
        );

    valueArea.innerHTML =
        "";

    valueArea.classList.remove(
        "hidden"
    );


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "value-title";

    title.textContent =
        "🥁 Tria un patró";

    valueArea.appendChild(
        title
    );


    const help =
        document.createElement(
            "div"
        );

    help.className =
        "value-help";

    help.textContent =
        `Loop de bateria · ${selectedTempo} BPM`;

    valueArea.appendChild(
        help
    );


    const select =
        document.createElement(
            "select"
        );

    select.id =
        "drum-select";


    for (
        const [
            id,
            drum
        ]
        of Object.entries(
            drumPatterns
        )
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            id;

        option.textContent =
            `${drum.emoji} ${drum.name}`;

        select.appendChild(
            option
        );
    }


    if (
        currentValue &&
        drumPatterns[currentValue]
    ) {

        select.value =
            currentValue;

    }
    else {

        select.value =
            "basicElectro";
    }


    select.addEventListener(
        "change",
        () => {

            changeDrum(
                select.value
            );

        }
    );


    valueArea.appendChild(
        select
    );
}


// ================================================
// 🎵 CANVIAR NOTA
// ================================================

function changeNote(value) {

    if (
        !selectedHand
    ) {
        return;
    }


    let config;


    if (
        handModes[selectedHand] ===
        "hand"
    ) {

        const handConfig =
            ensureHandConfig(
                selectedHand
            );

        const state =
            selectedHandState[
                selectedHand
            ];

        config =
            handConfig.hand[state];

    }
    else {

        if (
            !selectedFinger
        ) {
            return;
        }

        config =
            getFingerConfig(
                selectedHand,
                selectedFinger
            );
    }


    if (
        !config ||
        config === "none"
    ) {
        return;
    }


    config.action =
        "note";

    config.value =
        value;


    updateCodePreview();
}


// ================================================
// 🎹 CANVIAR ACORD
// ================================================

function changeChord(
    root,
    type
) {

    if (
        !selectedHand
    ) {
        return;
    }


    let config;


    if (
        handModes[selectedHand] ===
        "hand"
    ) {

        const handConfig =
            ensureHandConfig(
                selectedHand
            );

        const state =
            selectedHandState[
                selectedHand
            ];

        config =
            handConfig.hand[state];

    }
    else {

        if (
            !selectedFinger
        ) {
            return;
        }

        config =
            getFingerConfig(
                selectedHand,
                selectedFinger
            );
    }


    if (
        !config ||
        config === "none"
    ) {
        return;
    }


    config.action =
        "chord";

    config.value =
        root;

    config.chordType =
        type;


    updateCodePreview();
}


// ================================================
// 🥁 CANVIAR BATERIA
// ================================================

function changeDrum(value) {

    if (
        !selectedHand
    ) {
        return;
    }


    let config;


    if (
        handModes[selectedHand] ===
        "hand"
    ) {

        const handConfig =
            ensureHandConfig(
                selectedHand
            );

        const state =
            selectedHandState[
                selectedHand
            ];

        config =
            handConfig.hand[state];

    }
    else {

        if (
            !selectedFinger
        ) {
            return;
        }

        config =
            getFingerConfig(
                selectedHand,
                selectedFinger
            );
    }


    if (
        !config ||
        config === "none"
    ) {
        return;
    }


    config.action =
        "drum";

    config.value =
        value;


    // Si el loop ja estava actiu, el reiniciem
    // amb el nou patró com una única unitat.

    const voiceId =
        handModes[selectedHand] === "hand"
            ? getWholeHandVoiceId(
                selectedHand,
                selectedHandState[selectedHand]
            )
            : getVoiceId(
                selectedHand,
                selectedFinger
            );


    const isCurrentlyActive =
        handModes[selectedHand] === "hand"
            ? activeHandStates[selectedHand] !== null
            : activeNotes[selectedHand][selectedFinger];


    if (isCurrentlyActive) {

        stopDrumLoop(
            voiceId
        );

        startDrumLoop(
            voiceId,
            drumPatterns[value]
        );
    }


    updateCodePreview();
}


// ================================================
// 👆 SELECCIONAR DIT
// ================================================

function selectFinger(
    hand,
    finger
) {

    if (
        handModes[hand] !==
        "fingers"
    ) {
        return;
    }


    selectedHand =
        hand;

    selectedFinger =
        finger;


    document
        .querySelectorAll(
            ".finger-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "selected",

                    button.dataset.hand ===
                        hand &&

                    button.dataset.finger ===
                        finger
                );
            }
        );


    const selected =
        document.getElementById(
            "selected-finger"
        );


    if (selected) {

        selected.textContent =
            `${hand === "left" ? "👈" : "👉"} ${fingerLabels[finger]}`;
    }


    loadCurrentConfiguration();
}


// ================================================
// 🖐️ SELECCIONAR ESTAT DE LA MÀ
// ================================================

function selectHandState(
    hand,
    state
) {

    if (
        handModes[hand] !==
        "hand"
    ) {
        return;
    }


    selectedHand =
        hand;

    selectedFinger =
        null;


    selectedHandState[hand] =
        state;


    document
        .querySelectorAll(
            `.hand-mode-button[data-hand="${hand}"][data-state]`
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "selected",

                    button.dataset.state ===
                        state
                );
            }
        );


    document
        .querySelectorAll(
            `.finger-button[data-hand="${hand}"]`
        )
        .forEach(
            button => {

                button.classList.remove(
                    "selected"
                );
            }
        );


    updateSelectedTargetLabel(
        hand,
        state
    );


    loadCurrentHandConfiguration();
}


// ================================================
// 🏷️ ACTUALITZAR ELEMENT SELECCIONAT
// ================================================

function updateSelectedTargetLabel(
    hand,
    state = null
) {

    const selected =
        document.getElementById(
            "selected-finger"
        );


    if (!selected) {
        return;
    }


    if (
        state === null
    ) {

        state =
            selectedHandState[
                hand
            ];
    }


    selected.textContent =
        `${hand === "left" ? "👈" : "👉"} ${
            state === "open"
                ? "🖐️ Mà oberta"
                : "✊ Mà tancada"
        }`;
}


// ================================================
// 📂 CARREGAR CONFIGURACIÓ DEL DIT
// ================================================

function loadCurrentConfiguration() {

    if (
        !selectedHand ||
        !selectedFinger
    ) {
        return;
    }


    const config =
        getFingerConfig(
            selectedHand,
            selectedFinger
        );


    renderConfiguration(
        config
    );
}


// ================================================
// 📂 CARREGAR CONFIGURACIÓ DE LA MÀ
// ================================================

function loadCurrentHandConfiguration() {

    if (
        !selectedHand
    ) {
        return;
    }


    const config =
        ensureHandConfig(
            selectedHand
        );


    const state =
        selectedHandState[
            selectedHand
        ];


    updateSelectedTargetLabel(
        selectedHand,
        state
    );


    renderConfiguration(
        config.hand[state]
    );
}


// ================================================
// 🎛️ RENDERITZAR CONFIGURACIÓ
// ================================================

function renderConfiguration(
    config
) {

    const actionSelect =
        document.getElementById(
            "action-select"
        );


    if (actionSelect) {

        actionSelect.value =
            (
                config &&
                config !== "none" &&
                typeof config === "object"
            )
                ? config.action
                : "none";
    }


    const valueArea =
        document.getElementById(
            "value-area"
        );


    if (
        !config ||
        config === "none"
    ) {

        selectedAction =
            null;


        if (valueArea) {

            valueArea.classList.add(
                "hidden"
            );

            valueArea.innerHTML =
                "";
        }


        updateCodePreview();

        return;
    }


    selectedAction =
        config.action;


    if (!valueArea) {
        return;
    }


    if (
        selectedAction ===
        "note"
    ) {

        createNoteSelector(
            config.value
        );
    }

    else if (
        selectedAction ===
        "chord"
    ) {

        createChordSelector(
            config.value,
            config.chordType
        );
    }

    else if (
        selectedAction ===
        "drum"
    ) {

        createDrumSelector(
            config.value
        );
    }

    else {

        valueArea.classList.add(
            "hidden"
        );

        valueArea.innerHTML =
            "";
    }


    updateCodePreview();
}


// ================================================
// 🎛️ PREPARAR CONFIGURACIÓ D'ACCIÓ
// ================================================

function prepareActionConfig(
    config,
    actionId
) {

    if (
        !config ||
        config === "none"
    ) {
        return;
    }


    // ==========================================
    // 🎵 NOTA
    // ==========================================

    if (
        actionId ===
        "note"
    ) {

        const notes =
            getAvailableNotes();


        if (
            !config.value ||
            !notes.includes(
                config.value
            )
        ) {

            config.value =
                notes[0] ||
                "C4";
        }


        delete config.chordType;
    }


    // ==========================================
    // 🎹 ACORD
    // ==========================================

    if (
        actionId ===
        "chord"
    ) {

        const chords =
            getAvailableChords();


        if (
            chords.length > 0
        ) {

            const currentValid =
                chords.some(
                    chord =>
                        chord.root ===
                            config.value &&

                        chord.type ===
                            (
                                config.chordType ||
                                "major"
                            )
                );


            if (
                !currentValid
            ) {

                config.value =
                    chords[0].root;

                config.chordType =
                    chords[0].type;
            }
        }
    }


    // ==========================================
    // 🥁 BATERIA
    // ==========================================

    if (
        actionId ===
        "drum"
    ) {

        if (
            !config.value ||
            !drumPatterns[
                config.value
            ]
        ) {

            config.value =
                "basicElectro";
        }
    }
}


// ================================================
// 🎛️ ESCOLLIR ACCIÓ
// ================================================

function chooseAction(
    actionId
) {

    if (
        !selectedHand
    ) {
        return;
    }


    // ==========================================
    // 🖐️ MODE MÀ SENCERA
    // ==========================================

    if (
        handModes[selectedHand] ===
        "hand"
    ) {

        const handConfig =
            ensureHandConfig(
                selectedHand
            );


        const state =
            selectedHandState[
                selectedHand
            ];


        if (
            actionId ===
            "none"
        ) {

            stopWholeHandVoice(
                selectedHand,
                state
            );


            handConfig.hand[state] =
                "none";


            selectedAction =
                null;


            renderConfiguration(
                "none"
            );


            updateCodePreview();

            return;
        }


        let config =
            handConfig.hand[state];


        if (
            !config ||
            config === "none" ||
            typeof config !== "object"
        ) {

            config = {
                action:
                    actionId
            };


            handConfig.hand[state] =
                config;

        }
        else {

            config.action =
                actionId;
        }


        prepareActionConfig(
            config,
            actionId
        );


        selectedAction =
            actionId;


        renderConfiguration(
            config
        );


        updateCodePreview();

        return;
    }


    // ==========================================
    // 👆 MODE DITS
    // ==========================================

    if (
        !selectedFinger
    ) {
        return;
    }


    const handConfig =
        ensureHandConfig(
            selectedHand
        );


    if (
        actionId ===
        "none"
    ) {

        stopHandVoices(
            selectedHand
        );


        handConfig.fingers[
            selectedFinger
        ] =
            "none";


        selectedAction =
            null;


        renderConfiguration(
            "none"
        );


        updateCodePreview();

        return;
    }


    let config =
        handConfig.fingers[
            selectedFinger
        ];


    if (
        !config ||
        config === "none" ||
        typeof config !== "object"
    ) {

        config = {
            action:
                actionId
        };


        handConfig.fingers[
            selectedFinger
        ] =
            config;

    }
    else {

        config.action =
            actionId;
    }


    prepareActionConfig(
        config,
        actionId
    );


    selectedAction =
        actionId;


    renderConfiguration(
        config
    );


    updateCodePreview();
}


// ================================================
// 🛑 ATURAR ACCIÓ DE MÀ SENCERA
// ================================================

function stopWholeHandVoice(
    hand,
    state
) {

    const voiceId =
        getWholeHandVoiceId(
            hand,
            state
        );


    stopNote(
        voiceId
    );

    stopChord(
        voiceId
    );

    stopDrumLoop(
        voiceId
    );


    if (
        activeHandStates[hand] ===
        state
    ) {

        activeHandStates[hand] =
            null;
    }
}


// ================================================
// 🎼 CANVIAR TONALITAT GLOBAL
// ================================================

function changeScale(value) {

    selectedScale =
        value;


    const notes =
        getAvailableNotes();


    const hands = [

        instrumentConfig.leftHand,
        instrumentConfig.rightHand

    ];


    for (
        const hand
        of hands
    ) {

        const handConfig =
            hand;


        if (
            handConfig.fingers
        ) {

            for (
                const finger
                of [
                    "thumb",
                    "index",
                    "middle",
                    "ring",
                    "pinky"
                ]
            ) {

                const config =
                    handConfig.fingers[
                        finger
                    ];


                if (
                    !config ||
                    config === "none" ||
                    typeof config !== "object"
                ) {
                    continue;
                }


                if (
                    config.action ===
                    "note"
                ) {

                    if (
                        !notes.includes(
                            config.value
                        )
                    ) {

                        config.value =
                            notes[0] ||
                            "C4";
                    }
                }


                if (
                    config.action ===
                    "chord"
                ) {

                    const chords =
                        getAvailableChords();


                    const valid =
                        chords.some(
                            chord =>
                                chord.root ===
                                    config.value &&

                                chord.type ===
                                    (
                                        config.chordType ||
                                        "major"
                                    )
                        );


                    if (
                        !valid &&
                        chords.length > 0
                    ) {

                        config.value =
                            chords[0].root;

                        config.chordType =
                            chords[0].type;
                    }
                }
            }
        }


        if (
            handConfig.hand
        ) {

            for (
                const state
                of [
                    "open",
                    "closed"
                ]
            ) {

                const config =
                    handConfig.hand[state];


                if (
                    !config ||
                    config === "none" ||
                    typeof config !== "object"
                ) {
                    continue;
                }


                if (
                    config.action ===
                    "note"
                ) {

                    if (
                        !notes.includes(
                            config.value
                        )
                    ) {

                        config.value =
                            notes[0] ||
                            "C4";
                    }
                }


                if (
                    config.action ===
                    "chord"
                ) {

                    const chords =
                        getAvailableChords();


                    const valid =
                        chords.some(
                            chord =>
                                chord.root ===
                                    config.value &&

                                chord.type ===
                                    (
                                        config.chordType ||
                                        "major"
                                    )
                        );


                    if (
                        !valid &&
                        chords.length > 0
                    ) {

                        config.value =
                            chords[0].root;

                        config.chordType =
                            chords[0].type;
                    }
                }
            }
        }
    }


    if (
        selectedHand
    ) {

        if (
            handModes[selectedHand] ===
            "hand"
        ) {

            loadCurrentHandConfiguration();

        }
        else if (
            selectedFinger
        ) {

            loadCurrentConfiguration();
        }
    }


    updateCodePreview();
}


// ================================================
// 🥁 CANVIAR TEMPO GLOBAL
// ================================================

function changeTempo(value) {

    let tempo =
        Number(value);


    if (
        !Number.isFinite(
            tempo
        )
    ) {
        return;
    }


    tempo =
        Math.round(
            tempo
        );


    tempo =
        Math.max(
            40,
            Math.min(
                240,
                tempo
            )
        );


    selectedTempo =
        tempo;


    setTempo(
        selectedTempo
    );


    const input =
        document.getElementById(
            "tempo-select"
        );


    if (input) {

        input.value =
            selectedTempo;
    }


    const display =
        document.getElementById(
            "tempo-value"
        );


    if (display) {

        display.textContent =
            `${selectedTempo} BPM`;
    }


    if (
        selectedAction ===
        "drum"
    ) {

        const valueArea =
            document.getElementById(
                "value-area"
            );


        if (valueArea) {

            let config;


            if (
                selectedHand &&
                handModes[selectedHand] ===
                    "hand"
            ) {

                const handConfig =
                    ensureHandConfig(
                        selectedHand
                    );


                config =
                    handConfig.hand[
                        selectedHandState[
                            selectedHand
                        ]
                    ];

            }
            else if (
                selectedHand &&
                selectedFinger
            ) {

                config =
                    getFingerConfig(
                        selectedHand,
                        selectedFinger
                    );
            }


            createDrumSelector(
                config?.value ||
                "basicElectro"
            );
        }
    }


    updateCodePreview();
}
// ================================================
// 💻 PREVISUALITZACIÓ DEL CODI
// ================================================

function updateCodePreview() {

    const preview =
        document.getElementById(
            "code-preview"
        );


    if (!preview) {
        return;
    }


    function formatConfig(
        config
    ) {

        if (
            !config ||
            config === "none"
        ) {

            return '"none"';
        }


        if (
            config.action ===
            "note"
        ) {

            return `{
    action: "note",
    value: "${config.value}"
}`;
        }


        if (
            config.action ===
            "chord"
        ) {

            return `{
    action: "chord",
    value: "${config.value}",
    chordType: "${config.chordType}"
}`;
        }


        if (
            config.action ===
            "drum"
        ) {

            return `{
    action: "drum",
    value: "${config.value}"
}`;
        }


        return `{
    action: "${config.action}"
}`;
    }


    function formatHand(
        hand
    ) {

        return `{
    open: ${formatConfig(
        hand?.open
    )},
    closed: ${formatConfig(
        hand?.closed
    )}
}`;
    }


    function formatFingers(
        fingers
    ) {

        return `{
    thumb: ${formatConfig(
        fingers?.thumb
    )},
    index: ${formatConfig(
        fingers?.index
    )},
    middle: ${formatConfig(
        fingers?.middle
    )},
    ring: ${formatConfig(
        fingers?.ring
    )},
    pinky: ${formatConfig(
        fingers?.pinky
    )}
}`;
    }


    const left =
        ensureHandConfig(
            "left"
        );


    const right =
        ensureHandConfig(
            "right"
        );


    preview.textContent =
`// 🎼 CONFIGURACIÓ MUSICAL

tonalitat: "${selectedScale}"
tempo: ${selectedTempo}


// 👈 MÀ ESQUERRA

let esquerra = {

    mode: "${left.mode}",

    hand: ${formatHand(
        left.hand
    )},

    fingers: ${formatFingers(
        left.fingers
    )}

};


// 👉 MÀ DRETA

let dreta = {

    mode: "${right.mode}",

    hand: ${formatHand(
        right.hand
    )},

    fingers: ${formatFingers(
        right.fingers
    )}

};`;
}

function resetInstrumentConfiguration() {
    muteAllNotes();
    stopDrumLoop();
    soundEnabled = false;

    for (const hand of ["left", "right"]) {
        stopHandVoices(hand);

        instrumentConfig[hand] = {
            mode: "hand",
            hand: {
                open: "none",
                closed: "none"
            },
            fingers: {
                thumb: "none",
                index: "none",
                middle: "none",
                ring: "none",
                pinky: "none"
            }
        };
    }

    handModes.left = "hand";
    handModes.right = "hand";

    selectedHandState.left = null;
    selectedHandState.right = null;

    activeHandStates.left = null;
    activeHandStates.right = null;

    selectedHand = null;
    selectedFinger = null;
    selectedAction = null;

    updateCodePreview();
}
// ================================================
// 💾 GUARDAR CONFIGURACIÓ
// ================================================

function saveInstrument() {

    const data = {

        scale:
            selectedScale,

        tempo:
            selectedTempo,

        leftHand:
            instrumentConfig.leftHand,

        rightHand:
            instrumentConfig.rightHand
    };


    localStorage.setItem(
        "ekhoWorkshopConfig",
        JSON.stringify(data)
    );


    const message =
        document.getElementById(
            "save-message"
        );


    if (message) {

        message.textContent =
            "💾 Instrument guardat!";


        setTimeout(
            () => {

                message.textContent =
                    "";

            },
            2500
        );
    }
}


// ================================================
// 💾 BOTÓ GUARDAR
// ================================================

const saveButton =
    document.getElementById(
        "save-instrument"
    );



if (saveButton) {

    saveButton.addEventListener(
        "click",
        saveInstrument
    );
}

// ================================================
// ♻️ BOTÓ RESTAURAR
// ================================================

const restoreButton =
    document.getElementById(
        "restore-instrument"
    );


if (restoreButton) {

    restoreButton.addEventListener(
        "click",
        () => {

            // Carreguem la configuració que es va guardar
            loadSavedConfiguration();


            // Actualitzem la interfície global
            refreshGlobalMusicUI(
                selectedScale,
                selectedTempo
            );


            // Si hi havia una mà o dit seleccionat,
            // actualitzem també la seva configuració visual
            if (
                selectedHand
            ) {

                if (
                    handModes[selectedHand] ===
                    "hand"
                ) {

                    loadCurrentHandConfiguration();

                }
                else if (
                    selectedFinger
                ) {

                    loadCurrentConfiguration();
                }
            }


            // Actualitzem la previsualització
            updateCodePreview();


            const message =
                document.getElementById(
                    "restore-message"
                );


            if (message) {

                message.textContent =
                    "♻️ Configuració restaurada!";


                setTimeout(
                    () => {

                        message.textContent =
                            "";

                    },
                    2500
                );
            }
        }
    );
}
// ================================================
// 🧹 BOTÓ NETEJAR CONFIGURACIÓ
// ================================================

const resetButton = document.createElement("button");

resetButton.type = "button";
resetButton.id = "reset-instrument";
resetButton.textContent = "🧹 Netejar configuració";

resetButton.className = saveButton.className;

saveButton.parentNode.appendChild(resetButton);

resetButton.addEventListener(
    "click",
    () => {

        resetInstrumentConfiguration();

        localStorage.removeItem(
            "ekhoWorkshopConfig"
        );

        closeHandConfigurationAreas();

        refreshGlobalMusicUI(
            selectedScale,
            selectedTempo
        );

        updateCodePreview();

    }
);
// ================================================
// 📂 CARREGAR CONFIGURACIÓ GUARDADA
// ================================================

function loadSavedConfiguration() {

    const saved =
        localStorage.getItem(
            "ekhoWorkshopConfig"
        );


    if (!saved) {
        return;
    }


    try {

        const data =
            JSON.parse(saved);


        if (
            data.scale
        ) {

            selectedScale =
                data.scale;
        }


        if (
            data.tempo
        ) {

            selectedTempo =
                Number(
                    data.tempo
                );
        }


        if (
            data.leftHand
        ) {

            instrumentConfig.leftHand =
                data.leftHand;
        }


        if (
            data.rightHand
        ) {

            instrumentConfig.rightHand =
                data.rightHand;
        }


        ensureHandConfig(
            "left"
        );

        ensureHandConfig(
            "right"
        );


    }
    catch (error) {

        console.warn(
            "No s'ha pogut carregar la configuració guardada.",
            error
        );
    }
}


// ================================================
// ⚙️ CANVIAR MODE DE LA MÀ
// ================================================

function changeHandMode(
    hand,
    mode
) {

    if (
        mode !== "hand" &&
        mode !== "fingers"
    ) {
        return;
    }


    stopHandVoices(
        hand
    );


    handModes[hand] =
        mode;


    const config =
        ensureHandConfig(
            hand
        );


    config.mode =
        mode;


    selectedHand =
        hand;

    selectedFinger =
        null;


    refreshHandUI({
        hand,
        mode: handModes[hand],
        selectedFinger
    });


    const valueArea =
        document.getElementById(
            "value-area"
        );


    if (valueArea) {

        valueArea.classList.add(
            "hidden"
        );

        valueArea.innerHTML =
            "";
    }


    if (
        mode ===
        "hand"
    ) {

        const selected =
            document.getElementById(
                "selected-finger"
            );


        if (selected) {

            selected.textContent =
                `${hand === "left" ? "👈" : "👉"} Selecciona mà oberta o tancada`;

        }

    }
    else {

        const selected =
            document.getElementById(
                "selected-finger"
            );


        if (selected) {

            selected.textContent =
                `${hand === "left" ? "👈" : "👉"} Selecciona un dit`;
        }
    }


    updateCodePreview();
}


// ================================================
// 🎛️ PREPARAR DESPLEGABLE D'ACCIONS
// ================================================

function setupActionButtons() {

    const actionSelect =
        document.getElementById(
            "action-select"
        );


    if (!actionSelect) {
        return;
    }


    const allowedActions = [

        "none",
        "note",
        "chord",
        "drum"

    ];


    Array.from(
        actionSelect.options
    )
        .forEach(
            option => {

                if (
                    !allowedActions.includes(
                        option.value
                    )
                ) {

                    option.remove();
                }
            }
        );


    actionSelect.addEventListener(
        "change",
        () => {

            chooseAction(
                actionSelect.value
            );

        }
    );
}


// ================================================
// 🚀 PREPARAR TOTA LA INTERFÍCIE
// ================================================

resetInstrumentConfiguration();


setupGlobalMusicUI({
    selectedScale,
    selectedTempo,
    onScaleChange: changeScale,
    onTempoChange: changeTempo
});


setupHandsUI({

    getHandMode: (
        hand
    ) => {

        return handModes[
            hand
        ];

    },


    getSelectedFinger: () => {

        return selectedFinger;

    },


    onHandModeChange: (
        hand,
        mode
    ) => {

        changeHandMode(
            hand,
            mode
        );

    },


    onFingerSelect: (
        hand,
        finger
    ) => {

        selectFinger(
            hand,
            finger
        );

    },


    onHandStateSelect: (
        hand,
        state
    ) => {

        selectHandState(
            hand,
            state
        );

    }

});


setupActionButtons();


refreshGlobalMusicUI(
    selectedScale,
    selectedTempo
);


// ================================================
// 🏷️ ESTAT INICIAL DE L'EDITOR
// ================================================
//
// IMPORTANT:
//
// No seleccionem cap mà en entrar.
// No seleccionem cap dit.
// No seleccionem cap estat.
// No carreguem cap configuració musical
// dins del panell.
// Les zones interiors queden tancades.
//
// La configuració guardada continua existint
// internament, però no es mostra ni s'executa
// fins que l'usuari navega explícitament per la UI.
// ================================================

selectedHand =
    null;

selectedFinger =
    null;

selectedAction =
    null;


// ================================================
// 🔽 TANCAR TOTES LES ZONES INTERIORS
// ================================================

function closeHandConfigurationAreas() {

    for (
        const hand
        of ["left", "right"]
    ) {

        const wholeHandArea =
            document.getElementById(
                `${hand}-hand-configuration`
            );


        const fingerArea =
            document.getElementById(
                `${hand}-finger-mode`
            );


        if (wholeHandArea) {

            wholeHandArea.classList.add(
                "hidden"
            );

        }


        if (fingerArea) {

            fingerArea.classList.add(
                "hidden"
            );

        }

    }


    const valueArea =
        document.getElementById(
            "value-area"
        );


    if (valueArea) {

        valueArea.classList.add(
            "hidden"
        );

        valueArea.innerHTML =
            "";

    }


    const selected =
        document.getElementById(
            "selected-finger"
        );


    if (selected) {

        selected.textContent =
            "Selecciona una mà";

    }


    document
        .querySelectorAll(
            ".finger-button, .hand-mode-button"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "selected"
                );

            }
        );

}


// ================================================
// 🔽 NAVEGACIÓ DESPLEGABLE DE LES MANS
// ================================================
//
// Aquest nivell permet entrar en:
// - 🖐️ Mà sencera
// - ⚙️ Personalitza els dits
//
// Quan el mode intern ja coincideix amb el botó,
// hands-ui.js no fa cap canvi de mode.
//
// Per això aquest listener s'encarrega d'obrir
// igualment el nivell següent.
//
// ================================================

function setupHandNavigation() {

    for (
        const hand
        of ["left", "right"]
    ) {

        const handButton =
            document.getElementById(
                `${hand}-hand-mode`
            );


        if (handButton) {

            handButton.addEventListener(
                "click",
                () => {

                    if (
                        handModes[hand] !==
                        "hand"
                    ) {
                        return;
                    }


                    selectedHand =
                        hand;

                    selectedFinger =
                        null;

                    selectedAction =
                        null;


                    const wholeHandArea =
                        document.getElementById(
                            `${hand}-hand-configuration`
                        );


                    const fingerArea =
                        document.getElementById(
                            `${hand}-finger-mode`
                        );


                    if (fingerArea) {

                        fingerArea.classList.add(
                            "hidden"
                        );

                    }


                    if (wholeHandArea) {

                        wholeHandArea.classList.remove(
                            "hidden"
                        );

                    }


                    const valueArea =
                        document.getElementById(
                            "value-area"
                        );


                    if (valueArea) {

                        valueArea.classList.add(
                            "hidden"
                        );

                        valueArea.innerHTML =
                            "";

                    }


                    const selected =
                        document.getElementById(
                            "selected-finger"
                        );


                    if (selected) {

                        selected.textContent =
                            `${hand === "left" ? "👈" : "👉"} Selecciona mà oberta o tancada`;

                    }

                }
            );

        }


        const personalizeButton =
            document.getElementById(
                `personalize-${hand}`
            );


        if (personalizeButton) {

            personalizeButton.addEventListener(
                "click",
                () => {

                    if (
                        handModes[hand] !==
                        "fingers"
                    ) {
                        return;
                    }


                    selectedHand =
                        hand;

                    selectedFinger =
                        null;

                    selectedAction =
                        null;


                    const wholeHandArea =
                        document.getElementById(
                            `${hand}-hand-configuration`
                        );


                    const fingerArea =
                        document.getElementById(
                            `${hand}-finger-mode`
                        );


                    if (wholeHandArea) {

                        wholeHandArea.classList.add(
                            "hidden"
                        );

                    }


                    if (fingerArea) {

                        fingerArea.classList.remove(
                            "hidden"
                        );

                    }


                    const valueArea =
                        document.getElementById(
                            "value-area"
                        );


                    if (valueArea) {

                        valueArea.classList.add(
                            "hidden"
                        );

                        valueArea.innerHTML =
                            "";

                    }


                    const selected =
                        document.getElementById(
                            "selected-finger"
                        );


                    if (selected) {

                        selected.textContent =
                            `${hand === "left" ? "👈" : "👉"} Selecciona un dit`;

                    }

                }
            );

        }

    }

}


// ================================================
// 🚀 INICIALITZAR NAVEGACIÓ
// ================================================

closeHandConfigurationAreas();

setupHandNavigation();

updateCodePreview();


// ================================================
// 📷 INICIAR EKHO
// ================================================

async function startEkho() {

    try {

        status.textContent =
            "📷 Iniciant càmera...";


        await startCamera(
            video
        );


        resizeCanvas();


        window.addEventListener(
            "resize",
            resizeCanvas
        );


        status.textContent =
            "🖐️ Preparant detecció...";


        const handTracker =
            await createHandTracker();


        status.textContent =
            soundEnabled
                ? "🟢 So activat"
                : "🔇 So desactivat";


        let lastVideoTime =
            -1;


        function frame() {

            requestAnimationFrame(
                frame
            );


            if (
                video.readyState < 2
            ) {
                return;
            }


            if (
                video.currentTime ===
                lastVideoTime
            ) {
                return;
            }


            lastVideoTime =
                video.currentTime;


            const results =
                detectHands(
                    handTracker,
                    video
                );


            drawHands(
                results
            );


            if (!soundEnabled) {
                return;
            }


            const detected =
                detectBothHands(
                    results
                );


            if (!detected) {

                globalMuteIfNoHands(
                    null
                );

                return;
            }


            processHand(
                "left",
                detected.left
            );


            processHand(
                "right",
                detected.right
            );
        }


        frame();

    }

    catch (error) {

        console.error(
            "❌ Error iniciant Ekho:",
            error
        );


        status.textContent =
            "❌ Error iniciant Ekho.";
    }
}


// ================================================
// 🔊 BOTÓ SO
// ================================================

const soundButton =
    document.getElementById(
        "start-sound"
    );


if (soundButton) {

    soundButton.addEventListener(
        "click",
        () => {

            soundEnabled =
                !soundEnabled;


            if (soundEnabled) {

                startSound();


                setTempo(
                    selectedTempo
                );


                soundButton.textContent =
                    "🔊 So activat";


                soundButton.classList.add(
                    "active"
                );


                status.textContent =
                    "🟢 So activat";


                for (
                    const hand
                    of [
                        "left",
                        "right"
                    ]
                ) {

                    for (
                        const finger
                        of [
                            "thumb",
                            "index",
                            "middle",
                            "ring",
                            "pinky"
                        ]
                    ) {

                        activeNotes[
                            hand
                        ][finger] =
                            false;
                    }


                    activeHandStates[
                        hand
                    ] =
                        null;
                }

            }

            else {

                muteAllNotes();


                soundButton.textContent =
                    "🔇 So desactivat";


                soundButton.classList.remove(
                    "active"
                );


                status.textContent =
                    "🔇 So desactivat";


                for (
                    const hand
                    of [
                        "left",
                        "right"
                    ]
                ) {

                    stopHandVoices(
                        hand
                    );
                }
            }
        }
    );
}


// ================================================
// 🚀 ARRANCAR EL TALLER
// ================================================

startEkho();


// ================================================
// 🏁 FI
// ================================================

console.log(
    "🎛️ Ekho Workshop iniciat."
);