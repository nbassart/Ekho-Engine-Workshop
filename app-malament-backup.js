// ============================================================
// 🎵 EKHO — TALLER
// ============================================================
//
// Aquest fitxer connecta:
//
//   🖐️ mans + dits
//   🎼 configuració musical
//   🎛️ instrument-config.js
//   🔊 motor de so
//   📷 càmera / MediaPipe
//
// ============================================================

import { startCamera } from "./core/camera.js";
import {
    createHandTracker,
    detectHands
} from "./core/hand-tracker.js";

import {
    instrumentConfig
} from "./config/instrument-config.js";

import {
    gestureActions,
    drumPatterns,
    chordTypes
} from "./music/actions.js";

import {
    getScale
} from "./music/scales.js";

import {
    startSound,
    playNote,
    stopNote,
    playChord,
    stopChord,
    addDrumTrack,
    removeDrumTrack,
    muteAllNotes,
    setTempo
} from "./music/sound-engine.js";

import {
    detectFingers
} from "./gestures/gesture-detector.js";


// ============================================================
// 🎯 ESTAT DE L'APLICACIÓ
// ============================================================

let currentScale = "C major";
let currentTempo = 120;

const handModes = {
    left: instrumentConfig.leftHand.mode || "fingers",
    right: instrumentConfig.rightHand.mode || "fingers"
};

const selectedFinger = {
    left: null,
    right: null
};

const selectedHandState = {
    left: "open",
    right: "open"
};


// ============================================================
// 🧩 UTILITATS
// ============================================================

function handKey(hand) {
    return hand === "left" ? "leftHand" : "rightHand";
}


function getHandConfig(hand) {
    return instrumentConfig[handKey(hand)];
}


function getFingerConfig(hand, finger) {
    const config = getHandConfig(hand);

    if (!config.fingers) {
        config.fingers = {};
    }

    if (!config.fingers[finger]) {
        config.fingers[finger] = "none";
    }

    return config.fingers[finger];
}


function ensureHandStructure(hand) {

    const config = getHandConfig(hand);

    if (!config.mode) {
        config.mode = "hand";
    }

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

    handModes[hand] = config.mode;
}


// ============================================================
// 🎼 TONALITAT
// ============================================================

function setupGlobalScaleSelector() {

    const selector =
        document.getElementById("global-scale-select");

    if (!selector) {
        console.warn("No s'ha trobat global-scale-select");
        return;
    }

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
            value: "B major",
            label: "Si major"
        },
        {
            value: "F major",
            label: "Fa major"
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
            value: "B minor",
            label: "Si menor"
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
            label: "🎨 Lliure"
        }
    ];

    selector.innerHTML = "";

    scales.forEach(scale => {

        const option =
            document.createElement("option");

        option.value = scale.value;
        option.textContent = scale.label;

        selector.appendChild(option);
    });

    selector.value = currentScale;

    selector.addEventListener("change", () => {

        currentScale = selector.value;

        refreshAllEditors();

    });
}


// ============================================================
// 🥁 TEMPO
// ============================================================

function setupGlobalTempoSelector() {

    const selector =
        document.getElementById("tempo-select");

    const value =
        document.getElementById("tempo-value");

    if (!selector) {
        console.warn("No s'ha trobat tempo-select");
        return;
    }

    currentTempo =
        Number(selector.value) || 120;

    if (value) {
        value.textContent =
            `${currentTempo} BPM`;
    }

    setTempo(currentTempo);

    selector.addEventListener("input", () => {

        currentTempo =
            Number(selector.value);

        if (value) {
            value.textContent =
                `${currentTempo} BPM`;
        }

        setTempo(currentTempo);
    });
}


// ============================================================
// 🎵 NOTES DISPONIBLES
// ============================================================

function getAvailableNotes() {

    if (currentScale === "Lliure") {

        return [
            "C3", "C#3", "D3", "D#3",
            "E3", "F3", "F#3", "G3",
            "G#3", "A3", "A#3", "B3",

            "C4", "C#4", "D4", "D#4",
            "E4", "F4", "F#4", "G4",
            "G#4", "A4", "A#4", "B4",

            "C5", "C#5", "D5", "D#5",
            "E5", "F5", "F#5", "G5",
            "G#5", "A5", "A#5", "B5"
        ];
    }

    const scale =
        getScale(currentScale);

    if (!Array.isArray(scale) || scale.length === 0) {
        return [
            "C4",
            "D4",
            "E4",
            "F4",
            "G4",
            "A4",
            "B4"
        ];
    }

    return scale.map(note => {

        if (typeof note === "string") {
            return note;
        }

        return `${note.note}${note.octave}`;
    });
}


// ============================================================
// 🎹 ACORDS DISPONIBLES
// ============================================================

function getAvailableChords() {

    if (currentScale === "Lliure") {
        return Object.keys(chordTypes);
    }

    const scale =
        getAvailableNotes();

    const pitchClasses =
        new Set(
            scale.map(note =>
                note.replace(/[0-9]/g, "")
            )
        );

    const available = [];

    Object.entries(chordTypes).forEach(
        ([id, chord]) => {

            const root =
                scale[0];

            if (!root) return;

            const rootPitch =
                root.replace(/[0-9]/g, "");

            const rootIndex =
                getChromaticIndex(rootPitch);

            const valid =
                chord.intervals.every(interval => {

                    const pitch =
                        getPitchFromChromaticIndex(
                            rootIndex + interval
                        );

                    return pitchClasses.has(pitch);
                });

            if (valid) {
                available.push(id);
            }
        }
    );

    if (available.length === 0) {
        return ["major", "minor"];
    }

    return available;
}


function getChromaticIndex(note) {

    const notes = [
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

    return notes.indexOf(note);
}


function getPitchFromChromaticIndex(index) {

    const notes = [
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

    return notes[
        ((index % 12) + 12) % 12
    ];
}


// ============================================================
// 🎛️ EDITOR D'ACCIONS
// ============================================================

function renderActionSelector(
    container,
    config,
    onChange
) {

    container.innerHTML = "";

    const label =
        document.createElement("label");

    label.textContent =
        "🎵 Què vols que faci?";

    const select =
        document.createElement("select");

    gestureActions.forEach(action => {

        const option =
            document.createElement("option");

        option.value = action.id;
        option.textContent =
            action.name;

        select.appendChild(option);
    });

    let currentAction = "none";

    if (
        config &&
        typeof config === "object" &&
        config.action
    ) {
        currentAction = config.action;
    }

    if (typeof config === "string") {
        currentAction = config;
    }

    select.value = currentAction;

    container.appendChild(label);
    container.appendChild(select);

    const valueArea =
        document.createElement("div");

    valueArea.className =
        "dynamic-value-area";

    container.appendChild(valueArea);


    function renderValue() {

        const action =
            select.value;

        valueArea.innerHTML = "";

        if (action === "none") {

            onChange({
                action: "none"
            });

            return;
        }


        // ========================================
        // 🎵 NOTA
        // ========================================

        if (action === "note") {

            const valueLabel =
                document.createElement("label");

            valueLabel.textContent =
                "🎵 Nota";

            const valueSelect =
                document.createElement("select");

            getAvailableNotes().forEach(note => {

                const option =
                    document.createElement("option");

                option.value = note;
                option.textContent = note;

                valueSelect.appendChild(option);
            });

            const oldValue =
                config &&
                typeof config === "object" &&
                config.action === "note"
                    ? config.value
                    : null;

            if (
                oldValue &&
                [...valueSelect.options]
                    .some(option =>
                        option.value === oldValue
                    )
            ) {
                valueSelect.value = oldValue;
            }

            valueSelect.addEventListener(
                "change",
                () => {

                    onChange({
                        action: "note",
                        value: valueSelect.value
                    });
                }
            );

            valueArea.appendChild(valueLabel);
            valueArea.appendChild(valueSelect);

            onChange({
                action: "note",
                value: valueSelect.value
            });

            return;
        }


        // ========================================
        // 🎹 ACORD
        // ========================================

        if (action === "chord") {

            const rootLabel =
                document.createElement("label");

            rootLabel.textContent =
                "🎵 Nota de l'acord";

            const rootSelect =
                document.createElement("select");

            getAvailableNotes().forEach(note => {

                const option =
                    document.createElement("option");

                option.value = note;
                option.textContent = note;

                rootSelect.appendChild(option);
            });


            const typeLabel =
                document.createElement("label");

            typeLabel.textContent =
                "🎹 Tipus d'acord";

            const typeSelect =
                document.createElement("select");


            getAvailableChords().forEach(id => {

                const option =
                    document.createElement("option");

                option.value = id;

                option.textContent =
                    chordTypes[id].name;

                typeSelect.appendChild(option);
            });


            const oldRoot =
                config &&
                typeof config === "object" &&
                config.action === "chord"
                    ? config.root
                    : null;

            const oldType =
                config &&
                typeof config === "object" &&
                config.action === "chord"
                    ? config.type
                    : null;


            if (
                oldRoot &&
                [...rootSelect.options]
                    .some(option =>
                        option.value === oldRoot
                    )
            ) {
                rootSelect.value = oldRoot;
            }


            if (
                oldType &&
                [...typeSelect.options]
                    .some(option =>
                        option.value === oldType
                    )
            ) {
                typeSelect.value = oldType;
            }


            function updateChord() {

                onChange({
                    action: "chord",
                    root: rootSelect.value,
                    type: typeSelect.value
                });
            }


            rootSelect.addEventListener(
                "change",
                updateChord
            );

            typeSelect.addEventListener(
                "change",
                updateChord
            );


            valueArea.appendChild(rootLabel);
            valueArea.appendChild(rootSelect);

            valueArea.appendChild(typeLabel);
            valueArea.appendChild(typeSelect);

            updateChord();

            return;
        }


        // ========================================
        // 🥁 BATERIA
        // ========================================

        if (
            action === "drum" ||
            action === "drumPattern"
        ) {

            const drumLabel =
                document.createElement("label");

            drumLabel.textContent =
                "🥁 Patró";

            const drumSelect =
                document.createElement("select");


            Object.entries(drumPatterns)
                .forEach(([id, drum]) => {

                    const option =
                        document.createElement("option");

                    option.value = id;

                    option.textContent =
                        `${drum.emoji} ${drum.name}`;

                    drumSelect.appendChild(option);
                });


            const oldDrum =
                config &&
                typeof config === "object"
                    ? config.value
                    : null;


            if (
                oldDrum &&
                [...drumSelect.options]
                    .some(option =>
                        option.value === oldDrum
                    )
            ) {
                drumSelect.value =
                    oldDrum;
            }


            drumSelect.addEventListener(
                "change",
                () => {

                    onChange({
                        action,
                        value: drumSelect.value
                    });
                }
            );


            valueArea.appendChild(drumLabel);
            valueArea.appendChild(drumSelect);

            onChange({
                action,
                value: drumSelect.value
            });

            return;
        }


        // ========================================
        // ALTRES ACCIONS
        // ========================================

        onChange({
            action
        });
    }


    select.addEventListener(
        "change",
        renderValue
    );

    renderValue();
}


// ============================================================
// 🖐️ EDITOR DE MÀ SENCERA
// ============================================================

function renderHandEditor(hand) {

    const container =
        document.getElementById(
            `hand-editor-content-${hand}`
        );

    if (!container) return;

    const config =
        getHandConfig(hand);

    const state =
        selectedHandState[hand];

    const stateConfig =
        config.hand[state] || "none";


    renderActionSelector(
        container,
        stateConfig,
        newConfig => {

            config.hand[state] =
                newConfig;

        }
    );


    updateHandStateButtons(hand);
}


// ============================================================
// 🖐️ BOTONS MÀ SENCERA
// ============================================================

function updateHandStateButtons(hand) {

    document
        .querySelectorAll(
            `.hand-state-button[data-hand="${hand}"]`
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.state ===
                selectedHandState[hand]
            );
        });
}


function setupHandStateButtons() {

    document
        .querySelectorAll(".hand-state-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const hand =
                        button.dataset.hand;

                    const state =
                        button.dataset.state;

                    selectedHandState[hand] =
                        state;

                    renderHandEditor(hand);
                }
            );
        });
}


// ============================================================
// ⚙️ PERSONALITZAR DITS
// ============================================================

function setHandMode(
    hand,
    mode
) {

    const config =
        getHandConfig(hand);

    config.mode = mode;

    handModes[hand] = mode;

    const handSection =
        document.getElementById(
            `hand-mode-section-${hand}`
        );

    const fingerSection =
        document.getElementById(
            `finger-section-${hand}`
        );

    const personalizeButton =
        document.getElementById(
            `personalize-hand-${hand}`
        );

    const modeLabel =
        document.getElementById(
            `hand-mode-label-${hand}`
        );


    if (mode === "fingers") {

        if (handSection) {
            handSection.hidden = true;
        }

        if (fingerSection) {
            fingerSection.hidden = false;
        }

        if (personalizeButton) {
            personalizeButton.hidden = true;
        }

        if (modeLabel) {
            modeLabel.textContent =
                "Dits personalitzats";
        }

    } else {

        if (handSection) {
            handSection.hidden = false;
        }

        if (fingerSection) {
            fingerSection.hidden = true;
        }

        if (personalizeButton) {
            personalizeButton.hidden = false;
        }

        if (modeLabel) {
            modeLabel.textContent =
                "Mà sencera";
        }
    }


    updateFingerButtons(hand);

    renderHandEditor(hand);
}


function setupPersonalizeButtons() {

    document
        .querySelectorAll(
            ".personalize-hand-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const hand =
                        button.dataset.hand;

                    setHandMode(
                        hand,
                        "fingers"
                    );
                }
            );
        });


    document
        .querySelectorAll(
            ".back-to-hand-button"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const hand =
                        button.dataset.hand;

                    setHandMode(
                        hand,
                        "hand"
                    );
                }
            );
        });
}


// ============================================================
// 👆 EDITOR DELS DITS
// ============================================================

function updateFingerButtons(hand) {

    document
        .querySelectorAll(
            `.finger-button[data-hand="${hand}"]`
        )
        .forEach(button => {

            button.disabled =
                handModes[hand] !== "fingers";

            button.classList.toggle(
                "active",
                button.dataset.finger ===
                selectedFinger[hand]
            );
        });
}


function setupFingerButtons() {

    document
        .querySelectorAll(".finger-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.disabled
                    ) {
                        return;
                    }

                    const hand =
                        button.dataset.hand;

                    const finger =
                        button.dataset.finger;

                    selectedFinger[hand] =
                        finger;

                    renderFingerEditor(
                        hand,
                        finger
                    );

                    updateFingerButtons(
                        hand
                    );
                }
            );
        });
}


function renderFingerEditor(
    hand,
    finger
) {

    const container =
        document.getElementById(
            `finger-editor-${hand}`
        );

    if (!container) return;

    const config =
        getFingerConfig(
            hand,
            finger
        );


    container.innerHTML = "";


    const title =
        document.createElement("h4");

    title.textContent =
        `Configura el ${getFingerName(finger)}`;

    container.appendChild(title);


    renderActionSelector(
        container,
        config,
        newConfig => {

            getHandConfig(hand)
                .fingers[finger] =
                newConfig;

        }
    );
}


function getFingerName(finger) {

    const names = {
        thumb: "polze",
        index: "dit índex",
        middle: "dit del mig",
        ring: "dit anular",
        pinky: "menovell"
    };

    return names[finger] || finger;
}


// ============================================================
// 🔄 ACTUALITZAR EDITORS
// ============================================================

function refreshAllEditors() {

    renderHandEditor("left");
    renderHandEditor("right");

    if (selectedFinger.left) {

        renderFingerEditor(
            "left",
            selectedFinger.left
        );
    }

    if (selectedFinger.right) {

        renderFingerEditor(
            "right",
            selectedFinger.right
        );
    }
}


// ============================================================
// 💾 GUARDAR
// ============================================================

function setupSave() {

    const button =
        document.getElementById(
            "save-instrument"
        );

    const message =
        document.getElementById(
            "save-message"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        () => {

            localStorage.setItem(
                "ekho-instrument",
                JSON.stringify(
                    instrumentConfig,
                    null,
                    2
                )
            );

            localStorage.setItem(
                "ekho-scale",
                currentScale
            );

            localStorage.setItem(
                "ekho-tempo",
                currentTempo
            );

            if (message) {

                message.textContent =
                    "✅ Instrument guardat!";

                setTimeout(() => {

                    message.textContent =
                        "";

                }, 2500);
            }
        }
    );
}


function loadSavedSettings() {

    const savedScale =
        localStorage.getItem(
            "ekho-scale"
        );

    const savedTempo =
        localStorage.getItem(
            "ekho-tempo"
        );


    if (savedScale) {
        currentScale = savedScale;
    }


    if (savedTempo) {
        currentTempo =
            Number(savedTempo) || 120;
    }
}


// ============================================================
// 💻 MOSTRAR CODI
// ============================================================

function setupCodePreview() {

    const preview =
        document.getElementById(
            "code-preview"
        );

    if (!preview) return;

    preview.textContent =
        `// El meu instrument

export const instrumentConfig = ${JSON.stringify(
    instrumentConfig,
    null,
    4
)};`;
}


// ============================================================
// 📷 CÀMERA
// ============================================================

let video = null;
let canvas = null;
let ctx = null;
let handTracker = null;


async function setupCamera() {

    video =
        document.getElementById(
            "camera"
        );

    canvas =
        document.getElementById(
            "canvas"
        );

    if (!video || !canvas) {
        return;
    }

    ctx =
        canvas.getContext("2d");


    try {

        await startCamera(video);

        handTracker =
            await createHandTracker();

        requestAnimationFrame(
            detectionLoop
        );

    } catch (error) {

        console.error(
            "Error inicialitzant la càmera:",
            error
        );
    }
}


// ============================================================
// 👋 DETECCIÓ
// ============================================================

const activeNotes =
    new Map();


function detectionLoop() {

    if (
        !video ||
        !handTracker ||
        video.readyState < 2
    ) {

        requestAnimationFrame(
            detectionLoop
        );

        return;
    }


    const result =
        detectHands(
            handTracker,
            video
        );


    if (
        result &&
        result.landmarks
    ) {

        processHands(result);
    }


    requestAnimationFrame(
        detectionLoop
    );
}


function processHands(result) {

    const handedness =
        result.handednesses || [];

    result.landmarks.forEach(
        (landmarks, index) => {

            const detected =
                detectFingers(
                    landmarks
                );

            const rawLabel =
                handedness[index]?.[0]?.categoryName ||
                "Right";

            const hand =
                rawLabel === "Left"
                    ? "left"
                    : "right";


            if (
                handModes[hand] ===
                "fingers"
            ) {

                processFingerMode(
                    hand,
                    detected
                );

            } else {

                processWholeHandMode(
                    hand,
                    detected
                );
            }
        }
    );
}


// ============================================================
// 👆 MODE DITS
// ============================================================

function processFingerMode(
    hand,
    detected
) {

    const config =
        getHandConfig(hand);

    Object.entries(detected).forEach(
        ([finger, isActive]) => {

            const fingerConfig =
                config.fingers[finger];

            if (!fingerConfig) {
                return;
            }

            const key =
                `${hand}-${finger}`;


            if (isActive) {

                triggerAction(
                    key,
                    fingerConfig
                );

            } else {

                releaseAction(
                    key,
                    fingerConfig
                );
            }
        }
    );
}


// ============================================================
// 🖐️ MODE MÀ SENCERA
// ============================================================

function processWholeHandMode(
    hand,
    detected
) {

    const config =
        getHandConfig(hand);

    const key =
        `${hand}-whole-hand`;

    const fingers =
        Object.values(detected);

    const isOpen =
        fingers.length > 0 &&
        fingers.every(Boolean);

    const isClosed =
        fingers.length > 0 &&
        fingers.every(value => !value);


    if (isOpen) {

        triggerAction(
            key,
            config.hand.open
        );

    } else if (isClosed) {

        triggerAction(
            key,
            config.hand.closed
        );

    } else {

        releaseAction(
            key,
            config.hand.open
        );

        releaseAction(
            key,
            config.hand.closed
        );
    }
}


// ============================================================
// 🔊 ACCIONS
// ============================================================

function triggerAction(
    key,
    config
) {

    if (
        !config ||
        config === "none"
    ) {
        return;
    }

    if (activeNotes.has(key)) {
        return;
    }


    const action =
        typeof config === "string"
            ? config
            : config.action;


    if (action === "none") {
        return;
    }


    if (action === "note") {

        const note =
            config.value || "C4";

        playNote(note);

        activeNotes.set(
            key,
            {
                action: "note",
                note
            }
        );

        return;
    }


    if (action === "chord") {

        const root =
            config.root || "C4";

        const type =
            config.type || "major";

        const chord =
            chordTypes[type];

        if (!chord) return;

        playChord(
            root,
            chord.intervals
        );

        activeNotes.set(
            key,
            {
                action: "chord",
                root,
                intervals:
                    chord.intervals
            }
        );

        return;
    }


    if (
        action === "drum" ||
        action === "drumPattern"
    ) {

        const drum =
            config.value || "kick";

        const pattern =
            drumPatterns[drum];

        if (!pattern) return;

        addDrumTrack(
            key,
            pattern
        );

        activeNotes.set(
            key,
            {
                action: "drum",
                drum
            }
        );

        return;
    }


    activeNotes.set(
        key,
        {
            action
        }
    );
}


// ============================================================
// 🔇 ALLIBERAR ACCIONS
// ============================================================

function releaseAction(
    key,
    config
) {

    const active =
        activeNotes.get(key);

    if (!active) {
        return;
    }


    if (active.action === "note") {

        stopNote(
            active.note
        );
    }


    if (active.action === "chord") {

        stopChord(
            active.root,
            active.intervals
        );
    }


    if (active.action === "drum") {

        removeDrumTrack(
            key
        );
    }


    activeNotes.delete(key);
}


// ============================================================
// 🔊 BOTÓ DE SO
// ============================================================

function setupSoundButton() {

    const button =
        document.getElementById(
            "start-sound"
        );

    if (!button) return;

    button.addEventListener(
        "click",
        async () => {

            try {

                await startSound();

                button.textContent =
                    "🔊 So activat";

                button.disabled =
                    true;

            } catch (error) {

                console.error(
                    "Error activant el so:",
                    error
                );
            }
        }
    );
}


// ============================================================
// 🚀 INICI
// ============================================================

function init() {

    ensureHandStructure("left");
    ensureHandStructure("right");

    loadSavedSettings();

    setupGlobalScaleSelector();
    setupGlobalTempoSelector();

    setupHandStateButtons();
    setupPersonalizeButtons();
    setupFingerButtons();

    setHandMode(
        "left",
        handModes.left
    );

    setHandMode(
        "right",
        handModes.right
    );

    setupSave();
    setupCodePreview();
    setupSoundButton();

    setupCamera();

    refreshAllEditors();
}


init();