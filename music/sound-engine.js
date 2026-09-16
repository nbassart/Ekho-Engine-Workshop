// ================================================
// 🔊 EKHO ENGINE — MOTOR DE SO
// ================================================

let audioContext = null;
let masterGain = null;

const activeVoices = new Map();
const drumLoops = new Map();

// ================================================
// 🥁 TEMPO GLOBAL
// ================================================

let DRUM_BPM = 120;

let STEP_DURATION =
    60 / DRUM_BPM / 4;

// ================================================
// 🎵 INICIAR SO
// ================================================

export function startSound() {
    if (!audioContext) {
        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

        masterGain =
            audioContext.createGain();

        masterGain.gain.value = 1;

        masterGain.connect(
            audioContext.destination
        );
    }

    if (
        audioContext.state ===
        "suspended"
    ) {
        audioContext.resume();
    }

    masterGain.gain.value = 1;

    startDrumScheduler();
}

// ================================================
// 🎚️ MASTER
// ================================================

function ensureAudio() {
    if (!audioContext) {
        startSound();
    }

    return audioContext;
}

// ================================================
// 🎵 TEMPO
// ================================================

export function setTempo(bpm) {
    const value = Number(bpm);

    if (!Number.isFinite(value)) {
        return;
    }

    DRUM_BPM =
        Math.max(
            40,
            Math.min(
                240,
                value
            )
        );

    // 16 passos per compàs de 4/4:
    // cada pas és una semicorxera.
    STEP_DURATION =
        60 / DRUM_BPM / 4;

    if (audioContext) {
        nextNoteTime =
            audioContext.currentTime + 0.02;
    }
}

// ================================================
// 🎵 NOTA
// ================================================

export function playNote(
    id,
    frequency
) {
    const ctx = ensureAudio();

    stopNote(id);

    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();

    oscillator.type = "sine";

    oscillator.frequency.value =
        frequency;

    gain.gain.value = 0.22;

    oscillator.connect(gain);

    gain.connect(masterGain);

    oscillator.start();

    activeVoices.set(
        id,
        {
            type: "note",
            oscillator,
            gain
        }
    );
}

export function stopNote(id) {
    const voice =
        activeVoices.get(id);

    if (
        !voice ||
        voice.type !== "note"
    ) {
        return;
    }

    try {
        voice.gain.gain.setTargetAtTime(
            0,
            audioContext.currentTime,
            0.02
        );

        voice.oscillator.stop(
            audioContext.currentTime + 0.08
        );
    }
    catch (error) {
        // Ja estava aturada
    }

    activeVoices.delete(id);
}

// ================================================
// 🎹 ACORD
// ================================================

export function playChord(
    id,
    frequencies
) {
    const ctx = ensureAudio();

    stopChord(id);

    if (
        !Array.isArray(frequencies) ||
        frequencies.length === 0
    ) {
        return;
    }

    const oscillators = [];
    const gains = [];

    const gainValue =
        0.16 /
        Math.sqrt(
            frequencies.length
        );

    frequencies.forEach(
        frequency => {
            const oscillator =
                ctx.createOscillator();

            const gain =
                ctx.createGain();

            oscillator.type =
                "sine";

            oscillator.frequency.value =
                frequency;

            gain.gain.value =
                gainValue;

            oscillator.connect(
                gain
            );

            gain.connect(
                masterGain
            );

            oscillator.start();

            oscillators.push(
                oscillator
            );

            gains.push(
                gain
            );
        }
    );

    activeVoices.set(
        id,
        {
            type: "chord",
            oscillators,
            gains
        }
    );
}

export function stopChord(id) {
    const voice =
        activeVoices.get(id);

    if (
        !voice ||
        voice.type !== "chord"
    ) {
        return;
    }

    if (!audioContext) {
        activeVoices.delete(id);
        return;
    }

    const now =
        audioContext.currentTime;

    voice.gains.forEach(
        gain => {
            try {
                gain.gain.setTargetAtTime(
                    0,
                    now,
                    0.02
                );
            }
            catch (error) {}
        }
    );

    voice.oscillators.forEach(
        oscillator => {
            try {
                oscillator.stop(
                    now + 0.08
                );
            }
            catch (error) {}
        }
    );

    activeVoices.delete(id);
}

// ================================================
// 🥁 LOOPS DE BATERIA
// ================================================
//
// Cada entrada de drumLoops és un LOOP COMPLET.
//
// Exemple:
//
// startDrumLoop(
//     "left-index",
//     {
//         kick: [...16 passos],
//         snare: [...16 passos],
//         closedHat: [...16 passos],
//         clap: [...16 passos]
//     }
// );
//
// No existeixen pistes independents.
// ================================================

export function startDrumLoop(
    id,
    pattern
) {
    ensureAudio();

    if (
        !pattern ||
        !Array.isArray(pattern.kick) ||
        !Array.isArray(pattern.snare) ||
        !Array.isArray(pattern.closedHat) ||
        !Array.isArray(pattern.clap)
    ) {
        return;
    }

    // Normalitzem sempre a 16 passos.
    const normalizedPattern = {
        kick: normalizePattern(
            pattern.kick
        ),

        snare: normalizePattern(
            pattern.snare
        ),

        closedHat: normalizePattern(
            pattern.closedHat
        ),

        clap: normalizePattern(
            pattern.clap
        )
    };

    // Si aquest id ja tenia un loop,
    // simplement el substituïm.
    //
    // Això evita que es puguin acumular
    // diversos loops del mateix dit.
    drumLoops.set(
        id,
        normalizedPattern
    );
}


// ================================================
// 🛑 ATURAR LOOP DE BATERIA
// ================================================

export function stopDrumLoop(id) {
    drumLoops.delete(id);
}


// ================================================
// 🔢 NORMALITZAR PATRÓ
// ================================================

function normalizePattern(
    pattern
) {
    const result =
        new Array(16).fill(0);

    if (!Array.isArray(pattern)) {
        return result;
    }

    for (
        let i = 0;
        i < 16;
        i++
    ) {
        result[i] =
            pattern[i] === 1
                ? 1
                : 0;
    }

    return result;
}


// ================================================
// 🥁 SCHEDULER
// ================================================

let currentStep = 0;
let nextNoteTime = 0;
let schedulerInterval = null;

const LOOKAHEAD = 0.10;
const SCHEDULE_INTERVAL = 25;


// ================================================
// ▶️ INICIAR SCHEDULER
// ================================================

function startDrumScheduler() {
    if (schedulerInterval) {
        return;
    }

    nextNoteTime =
        audioContext.currentTime + 0.05;

    currentStep = 0;

    schedulerInterval =
        setInterval(
            scheduler,
            SCHEDULE_INTERVAL
        );
}


// ================================================
// ⏱️ SCHEDULER
// ================================================

function scheduler() {
    if (!audioContext) {
        return;
    }

    while (
        nextNoteTime <
        audioContext.currentTime +
            LOOKAHEAD
    ) {
        scheduleStep(
            currentStep,
            nextNoteTime
        );

        nextNoteTime +=
            STEP_DURATION;

        currentStep =
            (currentStep + 1) % 16;
    }
}


// ================================================
// 🥁 PROGRAMAR PAS
// ================================================

function scheduleStep(
    step,
    time
) {
    // IMPORTANT:
    //
    // En cada pas recorrem els LOOPS actius.
    //
    // Cada loop conté tots els instruments.
    // Per tant kick + snare + hat + clap
    // comparteixen exactament el mateix
    // "step" i el mateix "time".

    for (
        const pattern
        of drumLoops.values()
    ) {
        if (
            pattern.kick[step] === 1
        ) {
            scheduleKick(time);
        }

        if (
            pattern.snare[step] === 1
        ) {
            scheduleSnare(time);
        }

        if (
            pattern.closedHat[step] === 1
        ) {
            scheduleClosedHat(time);
        }

        if (
            pattern.clap[step] === 1
        ) {
            scheduleClap(time);
        }
    }
}


// ================================================
// 🥁 KICK
// ================================================

function scheduleKick(time) {
    if (!audioContext) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
        150,
        time
    );

    oscillator.frequency.exponentialRampToValueAtTime(
        45,
        time + 0.12
    );

    gain.gain.setValueAtTime(
        0.8,
        time
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + 0.15
    );

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(time);

    oscillator.stop(
        time + 0.16
    );
}


// ================================================
// 🥁 SNARE
// ================================================

function scheduleSnare(time) {
    if (!audioContext) {
        return;
    }

    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();

    oscillator.type =
        "triangle";

    oscillator.frequency.value =
        180;

    gain.gain.setValueAtTime(
        0.25,
        time
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + 0.12
    );

    oscillator.connect(gain);

    gain.connect(masterGain);

    oscillator.start(time);

    oscillator.stop(
        time + 0.13
    );

    // ----------------------------
    // Soroll de la caixa
    // ----------------------------

    const bufferSize =
        Math.floor(
            audioContext.sampleRate *
            0.12
        );

    const buffer =
        audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for (
        let i = 0;
        i < bufferSize;
        i++
    ) {
        data[i] =
            Math.random() * 2 - 1;
    }

    const noise =
        audioContext.createBufferSource();

    const noiseGain =
        audioContext.createGain();

    noise.buffer =
        buffer;

    noiseGain.gain.setValueAtTime(
        0.28,
        time
    );

    noiseGain.gain.exponentialRampToValueAtTime(
        0.001,
        time + 0.12
    );

    noise.connect(
        noiseGain
    );

    noiseGain.connect(
        masterGain
    );

    noise.start(time);

    noise.stop(
        time + 0.13
    );
}


// ================================================
// 🎩 HI-HAT
// ================================================

function scheduleClosedHat(time) {
    if (!audioContext) {
        return;
    }

    const bufferSize =
        Math.floor(
            audioContext.sampleRate *
            0.05
        );

    const buffer =
        audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for (
        let i = 0;
        i < bufferSize;
        i++
    ) {
        data[i] =
            Math.random() * 2 - 1;
    }

    const noise =
        audioContext.createBufferSource();

    const gain =
        audioContext.createGain();

    noise.buffer =
        buffer;

    gain.gain.setValueAtTime(
        0.12,
        time
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + 0.05
    );

    noise.connect(gain);

    gain.connect(masterGain);

    noise.start(time);

    noise.stop(
        time + 0.055
    );
}


// ================================================
// 👏 CLAP
// ================================================

function scheduleClap(time) {
    if (!audioContext) {
        return;
    }

    const bufferSize =
        Math.floor(
            audioContext.sampleRate *
            0.12
        );

    const buffer =
        audioContext.createBuffer(
            1,
            bufferSize,
            audioContext.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for (
        let i = 0;
        i < bufferSize;
        i++
    ) {
        data[i] =
            Math.random() * 2 - 1;
    }

    const noise =
        audioContext.createBufferSource();

    const gain =
        audioContext.createGain();

    noise.buffer =
        buffer;

    gain.gain.setValueAtTime(
        0.35,
        time
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        time + 0.12
    );

    noise.connect(gain);

    gain.connect(masterGain);

    noise.start(time);

    noise.stop(
        time + 0.125
    );
}


// ================================================
// 🔇 SILENCIAR TOT
// ================================================

export function muteAllNotes() {

    // ----------------------------
    // Notes i acords
    // ----------------------------

    for (
        const [id, voice]
        of activeVoices.entries()
    ) {

        if (
            voice.type === "note"
        ) {
            try {
                voice.gain.gain.setTargetAtTime(
                    0,
                    audioContext.currentTime,
                    0.02
                );

                voice.oscillator.stop(
                    audioContext.currentTime + 0.08
                );
            }
            catch (error) {}
        }

        else if (
            voice.type === "chord"
        ) {
            const now =
                audioContext
                    ? audioContext.currentTime
                    : 0;

            voice.gains.forEach(
                gain => {
                    try {
                        gain.gain.setTargetAtTime(
                            0,
                            now,
                            0.02
                        );
                    }
                    catch (error) {}
                }
            );

            voice.oscillators.forEach(
                oscillator => {
                    try {
                        oscillator.stop(
                            now + 0.08
                        );
                    }
                    catch (error) {}
                }
            );
        }
    }

    activeVoices.clear();


    // ----------------------------
    // Bateria
    // ----------------------------
    //
    // Important:
    // no intentem apagar instruments
    // individualment.
    //
    // Simplement eliminem tots els
    // loops actius.
    //

    drumLoops.clear();


    // ----------------------------
    // Master
    // ----------------------------

    if (masterGain) {
        masterGain.gain.value = 0;
    }
}


// ================================================
// 🔊 TORNAR A ACTIVAR EL MASTER
// ================================================

export function restoreSound() {
    if (!audioContext) {
        startSound();
        return;
    }

    if (
        audioContext.state ===
        "suspended"
    ) {
        audioContext.resume();
    }

    if (masterGain) {
        masterGain.gain.value = 1;
    }
}


// ================================================
// 🎵 CANVI DE VOLUM MASTER
// ================================================

export function setMasterVolume(
    value
) {
    if (!masterGain) {
        return;
    }

    const volume =
        Math.max(
            0,
            Math.min(
                1,
                Number(value)
            )
        );

    if (
        !Number.isFinite(
            volume
        )
    ) {
        return;
    }

    masterGain.gain.value =
        volume;
}


// ================================================
// 🛑 ATURAR MOTOR
// ================================================

export function stopSound() {
    muteAllNotes();

    if (schedulerInterval) {
        clearInterval(
            schedulerInterval
        );

        schedulerInterval =
            null;
    }

    if (audioContext) {
        audioContext.close();

        audioContext =
            null;

        masterGain =
            null;
    }
}