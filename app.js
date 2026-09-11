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

    // 🎨 LLIURE
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


    // 🎼 TONALITAT
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

    // Evitem duplicar la mateixa nota
    // en diferents octaves.
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
// CONFIGURACIÓ D'UN DIT
// ================================================

function getFingerConfig(
    hand,
    finger
) {

    return hand === "left"
        ? instrumentConfig.leftHand[finger]
        : instrumentConfig.rightHand[finger];
}


function getHandConfig(hand) {

    return hand === "left"
        ? instrumentConfig.leftHand
        : instrumentConfig.rightHand;
}


function getVoiceId(
    hand,
    finger
) {

    return `${hand}-${finger}`;
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

    const fingers =
        hand.fingers || hand;

    const fingerNames = [
        "thumb",
        "index",
        "middle",
        "ring",
        "pinky"
    ];

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


    let selectedIndex = -1;


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
// 🎵 CANVIAR NOTA
// ================================================

function changeNote(value) {

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


    const voiceId =
        getVoiceId(
            selectedHand,
            selectedFinger
        );


    if (
        activeNotes[
            selectedHand
        ][selectedFinger] &&
        soundEnabled
    ) {

        stopNote(
            voiceId
        );

        const frequency =
            noteToFrequency(
                value
            );

        if (
            frequency !== null
        ) {

            playNote(
                voiceId,
                frequency
            );
        }
    }


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


    const voiceId =
        getVoiceId(
            selectedHand,
            selectedFinger
        );


    if (
        activeNotes[
            selectedHand
        ][selectedFinger] &&
        soundEnabled
    ) {

        stopChord(
            voiceId
        );

        const frequencies =
            createChordFrequencies(
                root,
                type
            );

        if (
            frequencies.length > 0
        ) {

            playChord(
                voiceId,
                frequencies
            );
        }
    }


    updateCodePreview();
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
// 🥁 CANVIAR BATERIA
// ================================================

function changeDrum(value) {

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


    const voiceId =
        getVoiceId(
            selectedHand,
            selectedFinger
        );


    if (
        activeNotes[
            selectedHand
        ][selectedFinger] &&
        soundEnabled
    ) {

        removeDrumTrack(
            voiceId
        );

        addDrumTrack(
            voiceId,
            value
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


    const valueArea =
        document.getElementById(
            "value-area"
        );


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
        selectedAction === "note"
    ) {

        createNoteSelector(
            config.value
        );
    }

    else if (
        selectedAction === "chord"
    ) {

        createChordSelector(
            config.value,
            config.chordType || "major"
        );
    }

    else if (
        selectedAction === "drum"
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
// 🎛️ ESCOLLIR ACCIÓ
// ================================================

function chooseAction(
    actionId
) {

    if (
        !selectedHand ||
        !selectedFinger
    ) {
        return;
    }


    const handConfig =
        getHandConfig(
            selectedHand
        );


    // ==========================================
    // ⚪ NO FA RES
    // ==========================================

    if (
        actionId === "none"
    ) {

        stopHandVoices(
            selectedHand
        );

        handConfig[
            selectedFinger
        ] =
            "none";

        selectedAction =
            null;


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
        actionId;


    let config =
        handConfig[
            selectedFinger
        ];


    if (
        !config ||
        config === "none" ||
        typeof config !== "object"
    ) {

        config = {
            action: actionId
        };

        handConfig[
            selectedFinger
        ] =
            config;

    }
    else {

        config.action =
            actionId;
    }


    // ==========================================
    // 🎵 NOTA
    // ==========================================

    if (
        actionId === "note"
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
                notes[0] || "C4";
        }

        delete config.chordType;
    }


    // ==========================================
    // 🎹 ACORD
    // ==========================================

    if (
        actionId === "chord"
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
        actionId === "drum"
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


    // ==========================================
    // BOTÓ SELECCIONAT
    // ==========================================

    document
        .querySelectorAll(
            ".action-button"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "selected",

                    button.dataset.action ===
                        actionId
                );
            }
        );


    const valueArea =
        document.getElementById(
            "value-area"
        );


    if (valueArea) {

        valueArea.classList.remove(
            "hidden"
        );


        if (
            actionId === "note"
        ) {

            createNoteSelector(
                config.value
            );
        }

        else if (
            actionId === "chord"
        ) {

            createChordSelector(
                config.value,
                config.chordType
            );
        }

        else if (
            actionId === "drum"
        ) {

            createDrumSelector(
                config.value
            );
        }

        else {

            valueArea.innerHTML =
                "";
        }
    }


    updateCodePreview();
}


// ================================================
// 🎼 CANVIAR TONALITAT GLOBAL
// ================================================

function changeScale(value) {

    selectedScale =
        value;


    // Revalidem totes les notes
    // i tots els acords ja configurats.

    const hands = [
        instrumentConfig.leftHand,
        instrumentConfig.rightHand
    ];


    for (
        const hand
        of hands
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
                hand[finger];


            if (
                !config ||
                config === "none" ||
                typeof config !== "object"
            ) {
                continue;
            }


            // 🎵 NOTA

            if (
                config.action === "note"
            ) {

                const notes =
                    getAvailableNotes();

                if (
                    !notes.includes(
                        config.value
                    )
                ) {

                    config.value =
                        notes[0] || "C4";
                }
            }


            // 🎹 ACORD

            if (
                config.action === "chord"
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


    const scaleSelect =
        document.getElementById(
            "global-scale-select"
        );


    if (scaleSelect) {

        scaleSelect.value =
            selectedScale;
    }


    if (
        selectedHand &&
        selectedFinger
    ) {

        loadCurrentConfiguration();
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


    // Si estem editant bateria,
    // actualitzem el text informatiu.

    if (
        selectedAction === "drum"
    ) {

        const valueArea =
            document.getElementById(
                "value-area"
            );

        if (valueArea) {

            const config =
                getFingerConfig(
                    selectedHand,
                    selectedFinger
                );

            createDrumSelector(
                config?.value || "kick"
            );
        }
    }
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


    const free =
        document.createElement(
            "option"
        );

    free.value =
        "Lliure";

    free.textContent =
        "🎨 Lliure — totes les notes";

    select.appendChild(
        free
    );


    const scales = [

        "C major",
        "G major",
        "D major",
        "A major",
        "E major",
        "F major",
        "Bb major",

        "A minor",
        "E minor",
        "D minor",
        "G minor",
        "C minor"

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
            scale;

        option.textContent =
            scale;

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


    function formatFinger(
        name,
        config
    ) {

        if (
            !config ||
            config === "none"
        ) {

            return `${name}: "none"`;
        }


        if (
            config.action === "note"
        ) {

            return `${name}: {
    action: "note",
    value: "${config.value}"
}`;
        }


        if (
            config.action === "chord"
        ) {

            return `${name}: {
    action: "chord",
    value: "${config.value}",
    chordType: "${config.chordType}"
}`;
        }


        if (
            config.action === "drum"
        ) {

            return `${name}: {
    action: "drum",
    value: "${config.value}"
}`;
        }


        return `${name}: {
    action: "${config.action}"
}`;
    }


    const left =
        instrumentConfig.leftHand;

    const right =
        instrumentConfig.rightHand;


    preview.textContent =
`// 🎼 CONFIGURACIÓ MUSICAL

tonalitat: "${selectedScale}"
tempo: ${selectedTempo}


// 👈 MÀ ESQUERRA

let esquerra = {

    ${formatFinger(
        "thumb",
        left.thumb
    )},

    ${formatFinger(
        "index",
        left.index
    )},

    ${formatFinger(
        "middle",
        left.middle
    )},

    ${formatFinger(
        "ring",
        left.ring
    )},

    ${formatFinger(
        "pinky",
        left.pinky
    )}

};


// 👉 MÀ DRETA

let dreta = {

    ${formatFinger(
        "thumb",
        right.thumb
    )},

    ${formatFinger(
        "index",
        right.index
    )},

    ${formatFinger(
        "middle",
        right.middle
    )},

    ${formatFinger(
        "ring",
        right.ring
    )},

    ${formatFinger(
        "pinky",
        right.pinky
    )}

};`;
}


// ================================================
// 💾 GUARDAR
// ================================================

const saveButton =
    document.getElementById(
        "save-instrument"
    );


if (saveButton) {

    saveButton.addEventListener(
        "click",
        () => {

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
            }
        }
    );
}


// ================================================
// 👆 BOTONS DELS DITS
// ================================================

document
    .querySelectorAll(
        ".finger-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectFinger(
                        button.dataset.hand,
                        button.dataset.finger
                    );
                }
            );
        }
    );


// ================================================
// 🎛️ BOTONS D'ACCIÓ
// ================================================

document
    .querySelectorAll(
        ".action-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    chooseAction(
                        button.dataset.action
                    );
                }
            );
        }
    );


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


                // Forcem una nova detecció
                // perquè els dits actuals
                // puguin tornar a sonar.

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
                }
            }
        }
    );
}


// ================================================
// 🚀 INICI
// ================================================

setTempo(
    selectedTempo
);

setupGlobalScaleSelector();

setupGlobalTempoSelector();

updateCodePreview();

startEkho();