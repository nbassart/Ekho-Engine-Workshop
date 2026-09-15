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
    addDrumTrack,
    removeDrumTrack,
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
//
// Per defecte, primer configurem la mà sencera.
// Els dits només s'activen quan l'alumne prem
// "Personalitza els dits".
//

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
            of Object.keys(chordTypes)
        ) {

            if (
                chordFitsScale(
                    root.note,
                    type
                )
            ) {

                chords.push({
                    root: root.note,
                    type,
                    name:
                        root.note +
                        chordTypes[type].symbol
                });
            }
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

        if (isActive) {

            addDrumTrack(
                voiceId,
                config.value || "kick"
            );

        }
        else {

            removeDrumTrack(
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
        removeDrumTrack(voiceId);

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
        removeDrumTrack(voiceId);
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

        addDrumTrack(
            voiceId,
            config.value || "kick"
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

                removeDrumTrack(
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

            removeDrumTrack(
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
            : `🎼 Acords compatibles amb ${selectedScale}`;

    valueArea.appendChild(
        help
    );


    const select =
        document.createElement(
            "select"
        );

    select.id =
        "chord-select";


    const chords =
        getAvailableChords();


    for (
        const chord
        of chords
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            JSON.stringify({
                root: chord.root,
                type: chord.type
            });

        option.textContent =
            chord.name;

        select.appendChild(
            option
        );
    }


    let selectedIndex =
        -1;


    if (
        currentRoot &&
        currentType
    ) {

        selectedIndex =
            chords.findIndex(
                chord =>
                    chord.root ===
                        currentRoot &&
                    chord.type ===
                        currentType
            );
    }


    if (
        selectedIndex >= 0
    ) {

        select.selectedIndex =
            selectedIndex;

    }
    else if (
        chords.length > 0
    ) {

        select.selectedIndex =
            0;
    }


    select.addEventListener(
        "change",
        () => {

            const value =
                JSON.parse(
                    select.value
                );

            changeChord(
                value.root,
                value.type
            );
        }
    );


    valueArea.appendChild(
        select
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
        "🥁 Tria un so";

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
            "kick";
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


    updateCodePreview();
}


// ================================================
// 👆 SELECCIONAR DIT
// ================================================

function selectFinger(
    hand,
    finger
) {

    // Els dits només estan disponibles
    // en mode "fingers".

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


    const selected =
        document.getElementById(
            "selected-finger"
        );


    if (selected) {

        selected.textContent =
            `${hand === "left" ? "👈" : "👉"} ${
                state === "open"
                    ? "🖐️ Mà oberta"
                    : "✊ Mà tancada"
            }`;
    }


    loadCurrentHandConfiguration();
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

    document
        .querySelectorAll(
            ".action-button"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "selected"
                );
            }
        );


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


    const actionButton =
        document.querySelector(
            `[data-action="${selectedAction}"]`
        );


    if (actionButton) {

        actionButton.classList.add(
            "selected"
        );
    }


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
                "kick";
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

    removeDrumTrack(
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
// ⚙️ CANVIAR MODE DE LA MÀ
// ================================================

function setHandMode(
    hand,
    mode
) {

    const config =
        ensureHandConfig(
            hand
        );


    stopHandVoices(
        hand
    );


    handModes[hand] =
        mode;

    config.mode =
        mode;


    selectedHand =
        hand;

    selectedFinger =
        null;


    if (
        mode ===
        "fingers"
    ) {

        const handConfiguration =
            document.getElementById(
                `${hand}-hand-configuration`
            );


        const fingerMode =
            document.getElementById(
                `${hand}-finger-mode`
            );


        if (handConfiguration) {

            handConfiguration.classList.add(
                "hidden"
            );
        }


        if (fingerMode) {

            fingerMode.classList.remove(
                "hidden"
            );
        }


        updateFingerButtons(
            hand
        );


        updateHandStateButtons(
            hand
        );


        const selected =
            document.getElementById(
                "selected-finger"
            );


        if (selected) {

            selected.textContent =
                `${hand === "left" ? "👈" : "👉"} Selecciona un dit`;
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
    }

    else {

        const handConfiguration =
            document.getElementById(
                `${hand}-hand-configuration`
            );


        const fingerMode =
            document.getElementById(
                `${hand}-finger-mode`
            );


        if (handConfiguration) {

            handConfiguration.classList.remove(
                "hidden"
            );
        }


        if (fingerMode) {

            fingerMode.classList.add(
                "hidden"
            );
        }


        updateFingerButtons(
            hand
        );


        updateHandStateButtons(
            hand
        );


        loadCurrentHandConfiguration();
    }


    updateCodePreview();
}
// ================================================
// ⚙️ CONTROLS DE MODE DE LA MÀ
// ================================================

function setupHandModeControls() {

    for (
        const hand
        of [
            "left",
            "right"
        ]
    ) {

        const personalizeButton =
            document.getElementById(
                `personalize-${hand}`
            );


        if (
            personalizeButton
        ) {

            personalizeButton.addEventListener(
                "click",
                () => {

                    setHandMode(
                        hand,
                        "fingers"
                    );
                }
            );
        }


        document
            .querySelectorAll(
                `.back-to-hand-button[data-hand="${hand}"]`
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            setHandMode(
                                hand,
                                "hand"
                            );
                        }
                    );
                }
            );


        document
            .querySelectorAll(
                `.hand-mode-button[data-hand="${hand}"][data-state]`
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectHandState(
                                hand,
                                button.dataset.state
                            );
                        }
                    );
                }
            );
    }
}


// ================================================
// 👆 ACTIVAR / DESACTIVAR BOTONS DELS DITS
// ================================================

function updateFingerButtons(
    hand
) {

    const enabled =
        handModes[hand] ===
        "fingers";


    document
        .querySelectorAll(
            `.finger-button[data-hand="${hand}"]`
        )
        .forEach(
            button => {

                button.disabled =
                    !enabled;


                button.classList.toggle(
                    "selected",

                    enabled &&
                    button.dataset.finger ===
                        selectedFinger
                );
            }
        );
}


// ================================================
// 🖐️ ACTUALITZAR BOTONS MÀ SENCERA
// ================================================

function updateHandStateButtons(
    hand
) {

    const enabled =
        handModes[hand] ===
        "hand";


    document
        .querySelectorAll(
            `.hand-mode-button[data-hand="${hand}"][data-state]`
        )
        .forEach(
            button => {

                button.disabled =
                    !enabled;


                button.classList.toggle(
                    "selected",

                    enabled &&
                    button.dataset.state ===
                        selectedHandState[hand]
                );
            }
        );
}


// ================================================
// 👆 PREPARAR BOTONS DELS DITS
// ================================================

function setupFingerButtons() {

    document
        .querySelectorAll(
            ".finger-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            button.disabled
                        ) {
                            return;
                        }


                        selectFinger(
                            button.dataset.hand,
                            button.dataset.finger
                        );
                    }
                );
            }
        );
}


// ================================================
// 🎛️ PREPARAR BOTONS D'ACCIÓ
// ================================================

function setupActionButtons() {

    const allowedActions = [

        "none",
        "note",
        "chord",
        "drum"

    ];


    document
        .querySelectorAll(
            ".action-button"
        )
        .forEach(
            button => {

                const action =
                    button.dataset.action;


                // No afegim accions noves.
                // Si l'HTML en conté alguna altra,
                // queda amagada.

                if (
                    !allowedActions.includes(
                        action
                    )
                ) {

                    button.hidden =
                        true;

                    return;
                }


                button.addEventListener(
                    "click",
                    () => {

                        chooseAction(
                            action
                        );
                    }
                );
            }
        );
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


        // ==========================================
        // 👆 CONFIGURACIÓ DELS DITS
        // ==========================================

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


        // ==========================================
        // 🖐️ CONFIGURACIÓ DE LA MÀ
        // ==========================================

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


    const scaleSelect =
        document.getElementById(
            "global-scale-select"
        );


    if (scaleSelect) {

        scaleSelect.value =
            selectedScale;
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


    // Si estem configurant bateria,
    // actualitzem el text informatiu.

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
                "kick"
            );
        }
    }


    updateCodePreview();
}


// ================================================
// 🎼 PREPARAR TONALITAT
// ================================================

function setupGlobalScaleSelector() {

    const select =
        document.getElementById(
            "global-scale-select"
        );


    if (!select) {
        return;
    }


    select.innerHTML =
        "";


    const scales = [

        {
            value: "C major",
            label: "Do major"
        },

        {
            value: "G major",
            label: "Sol major"
        },

        {
            value: "D major",
            label: "Re major"
        },

        {
            value: "A major",
            label: "La major"
        },

        {
            value: "E major",
            label: "Mi major"
        },

        {
            value: "F major",
            label: "Fa major"
        },

        {
            value: "Bb major",
            label: "Sib major"
        },

        {
            value: "A minor",
            label: "La menor"
        },

        {
            value: "E minor",
            label: "Mi menor"
        },

        {
            value: "D minor",
            label: "Re menor"
        },

        {
            value: "G minor",
            label: "Sol menor"
        },

        {
            value: "C minor",
            label: "Do menor"
        },

        {
            value: "Lliure",
            label: "🎨 Lliure — totes les notes"
        }

    ];


    for (
        const scale
        of scales
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            scale.value;


        option.textContent =
            scale.label;


        select.appendChild(
            option
        );
    }


    select.value =
        selectedScale;


    select.addEventListener(
        "change",
        () => {

            changeScale(
                select.value
            );
        }
    );
}


// ================================================
// 🥁 PREPARAR TEMPO
// ================================================

function setupGlobalTempoSelector() {

    const input =
        document.getElementById(
            "tempo-select"
        );


    if (!input) {
        return;
    }


    input.value =
        selectedTempo;


    const display =
        document.getElementById(
            "tempo-value"
        );


    if (display) {

        display.textContent =
            `${selectedTempo} BPM`;
    }


    input.addEventListener(
        "input",
        () => {

            changeTempo(
                input.value
            );
        }
    );
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
// 🖐️ PREPARAR INTERFÍCIE DE LES MANS
// ================================================

function setupInitialHandInterface() {

    // IMPORTANT:
    // El mode inicial sempre és "mà sencera".
    //
    // Això evita que l'alumne vegi tots els dits
    // abans d'haver triat "Personalitza els dits".

    handModes.left =
        "hand";

    handModes.right =
        "hand";


    instrumentConfig.leftHand.mode =
        "hand";

    instrumentConfig.rightHand.mode =
        "hand";


    selectedHand =
        null;

    selectedFinger =
        null;


    updateFingerButtons(
        "left"
    );

    updateFingerButtons(
        "right"
    );


    updateHandStateButtons(
        "left"
    );

    updateHandStateButtons(
        "right"
    );
}


// ================================================
// 🎨 ACTUALITZAR INTERFÍCIE SEGONS MODE
// ================================================

function refreshHandInterface(
    hand
) {

    const mode =
        handModes[hand];


    const wholeHandArea =
        document.getElementById(
            `${hand}-hand-configuration`
        );


    const fingerArea =
        document.getElementById(
            `${hand}-finger-mode`
        );


    const personalizeButton =
        document.getElementById(
            `personalize-${hand}`
        );


    const backButton =
        document.querySelector(
            `.back-to-hand-button[data-hand="${hand}"]`
        );


    if (
        mode ===
        "fingers"
    ) {

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


        if (personalizeButton) {

            personalizeButton.classList.add(
                "hidden"
            );
        }


        if (backButton) {

            backButton.classList.remove(
                "hidden"
            );
        }

    }
    else {

        if (wholeHandArea) {

            wholeHandArea.classList.remove(
                "hidden"
            );
        }


        if (fingerArea) {

            fingerArea.classList.add(
                "hidden"
            );
        }


        if (personalizeButton) {

            personalizeButton.classList.remove(
                "hidden"
            );
        }


        if (backButton) {

            backButton.classList.add(
                "hidden"
            );
        }
    }


    updateFingerButtons(
        hand
    );

    updateHandStateButtons(
        hand
    );
}


// ================================================
// ⚙️ CANVIAR MODE
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


    refreshHandInterface(
        hand
    );


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

        loadCurrentHandConfiguration();

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
// ⚙️ PREPARAR BOTONS DE PERSONALITZACIÓ
// ================================================

function setupHandModeButtons() {

    for (
        const hand
        of [
            "left",
            "right"
        ]
    ) {

        const personalize =
            document.getElementById(
                `personalize-${hand}`
            );


        if (personalize) {

            personalize.addEventListener(
                "click",
                () => {

                    changeHandMode(
                        hand,
                        "fingers"
                    );
                }
            );
        }


        const backButtons =
            document.querySelectorAll(
                `.back-to-hand-button[data-hand="${hand}"]`
            );


        backButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        changeHandMode(
                            hand,
                            "hand"
                        );
                    }
                );
            }
        );


        const stateButtons =
            document.querySelectorAll(
                `.hand-mode-button[data-hand="${hand}"][data-state]`
            );


        stateButtons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            handModes[hand] !==
                            "hand"
                        ) {
                            return;
                        }


                        selectHandState(
                            hand,
                            button.dataset.state
                        );
                    }
                );
            }
        );
    }
}


// ================================================
// 👆 PREPARAR DITS
// ================================================

function setupFingerMode() {

    document
        .querySelectorAll(
            ".finger-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            button.disabled
                        ) {
                            return;
                        }


                        selectFinger(
                            button.dataset.hand,
                            button.dataset.finger
                        );
                    }
                );
            }
        );
}


// ================================================
// 🎛️ ACTUALITZAR ESTAT DELS DITS
// ================================================

function updateFingerModeUI(
    hand
) {

    const enabled =
        handModes[hand] ===
        "fingers";


    document
        .querySelectorAll(
            `.finger-button[data-hand="${hand}"]`
        )
        .forEach(
            button => {

                button.disabled =
                    !enabled;


                if (!enabled) {

                    button.classList.remove(
                        "selected"
                    );
                }
            }
        );
}


// ================================================
// 🖐️ ACTUALITZAR ESTAT DE MÀ
// ================================================

function updateWholeHandModeUI(
    hand
) {

    const enabled =
        handModes[hand] ===
        "hand";


    document
        .querySelectorAll(
            `.hand-mode-button[data-hand="${hand}"][data-state]`
        )
        .forEach(
            button => {

                button.disabled =
                    !enabled;


                button.classList.toggle(
                    "selected",

                    enabled &&
                    button.dataset.state ===
                        selectedHandState[hand]
                );
            }
        );
}


// ================================================
// 🔄 ACTUALITZAR TOTA LA UI
// ================================================

function updateHandUI(
    hand
) {

    refreshHandInterface(
        hand
    );

    updateFingerModeUI(
        hand
    );

    updateWholeHandModeUI(
        hand
    );
}


// ================================================
// 🎼 ACTUALITZAR TONALITAT DESPRÉS DE CARREGAR
// ================================================

function refreshGlobalMusicUI() {

    const scaleSelect =
        document.getElementById(
            "global-scale-select"
        );


    if (scaleSelect) {

        scaleSelect.value =
            selectedScale;
    }


    const tempoInput =
        document.getElementById(
            "tempo-select"
        );


    if (tempoInput) {

        tempoInput.value =
            selectedTempo;
    }


    const tempoValue =
        document.getElementById(
            "tempo-value"
        );


    if (tempoValue) {

        tempoValue.textContent =
            `${selectedTempo} BPM`;
    }


    setTempo(
        selectedTempo
    );
}
// ================================================
// 🚀 PREPARAR TOTA LA INTERFÍCIE
// ================================================
//
// IMPORTANT:
// Fem tota la inicialització una sola vegada.
// La interfície comença en mode "mà sencera".
// Els dits només apareixen quan es prem
// "Personalitza els dits".
//

loadSavedConfiguration();

setupGlobalScaleSelector();

setupGlobalTempoSelector();

setupHandModeControls();

setupFingerButtons();

setupActionButtons();

setupInitialHandInterface();

refreshGlobalMusicUI();

updateHandUI(
    "left"
);

updateHandUI(
    "right"
);

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


            // =====================================
            // 🟢 VISUALS MEDIAPIPE
            // =====================================

            drawHands(
                results
            );


            // =====================================
            // 🔇 SI EL SO ESTÀ DESACTIVAT
            // CONTINUEM DETECTANT I DIBUIXANT
            // LES MANS, PERÒ NO REPRODUÏM SO
            // =====================================

            if (!soundEnabled) {
                return;
            }


            // =====================================
            // 🖐️ DETECTAR LES DUES MANS
            // =====================================

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


            // =====================================
            // 👈 PROCESSAR MÀ ESQUERRA
            // =====================================

            processHand(
                "left",
                detected.left
            );


            // =====================================
            // 👉 PROCESSAR MÀ DRETA
            // =====================================

            processHand(
                "right",
                detected.right
            );
        }


        // Comencem el bucle de vídeo
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


                // Reiniciem l'estat de les veus
                // perquè no quedin notes penjades.

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
//
// IMPORTANT:
// Aquesta línia és la que posa en marxa
// la càmera + MediaPipe + el bucle de detecció.
//

startEkho();


// ================================================
// 🏁 FI
// ================================================

console.log(
    "🎛️ Ekho Workshop iniciat."
);