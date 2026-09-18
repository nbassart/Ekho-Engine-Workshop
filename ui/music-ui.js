


// ================================================
// 🎼 EKHO — MUSIC UI
// ================================================
//
// Interfície dels controls musicals globals:
//
// 🎼 Tonalitat
// 🥁 Tempo
//
// Aquest mòdul s'encarrega de la presentació
// visual i comunica els canvis a app.js.
//
// La lògica musical continua a app.js.
// ================================================


// ================================================
// 🎼 NOTES MUSICALS
// ================================================

const musicalNotes = [

    {
        value: "C",
        label: "Do (C)"
    },

    {
        value: "C#",
        label: "Do# (C#)"
    },

    {
        value: "D",
        label: "Re (D)"
    },

    {
        value: "D#",
        label: "Re# (D#)"
    },

    {
        value: "E",
        label: "Mi (E)"
    },

    {
        value: "F",
        label: "Fa (F)"
    },

    {
        value: "F#",
        label: "Fa# (F#)"
    },

    {
        value: "G",
        label: "Sol (G)"
    },

    {
        value: "G#",
        label: "Sol# (G#)"
    },

    {
        value: "A",
        label: "La (A)"
    },

    {
        value: "A#",
        label: "La# (A#)"
    },

    {
        value: "B",
        label: "Si (B)"
    }

];


// ================================================
// 🎼 MODES
// ================================================

const musicalModes = [

    {
        value: "major",
        label: "Major (Major)"
    },

    {
        value: "minor",
        label: "Menor (Minor)"
    }

];


// ================================================
// 🎼 PREPARAR CONTROLS MUSICALS
// ================================================

export function setupGlobalMusicUI({

    selectedScale,
    selectedTempo,

    onScaleChange,
    onTempoChange

}) {

    setupGlobalScaleSelector({

        selectedScale,
        onScaleChange

    });


    setupGlobalTempoSelector({

        selectedTempo,
        onTempoChange

    });

}


// ================================================
// 🎼 SELECTOR DE TONALITAT
// ================================================

function setupGlobalScaleSelector({

    selectedScale,
    onScaleChange

}) {

    const oldSelect =
        document.getElementById(
            "global-scale-select"
        );


    if (!oldSelect) {

        return;
    }


    // ==========================================
    // 📦 CONTENIDOR PRINCIPAL
    // ==========================================

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "music-scale-controls";


    // ==========================================
    // 🎼 OBTENIR VALORS ACTUALS
    // ==========================================

    let currentNote =
        "C";

    let currentMode =
        "major";


    if (
        selectedScale &&
        selectedScale !== "Lliure"
    ) {

        const match =
            selectedScale.match(
                /^([A-G](?:#|b)?)\s+(major|minor)$/
            );


        if (match) {

            currentNote =
                match[1];

            currentMode =
                match[2];

        }

    }


    // ==========================================
    // 🎼 BLOC DE NOTA
    // ==========================================

    const noteGroup =
        document.createElement(
            "div"
        );


    noteGroup.className =
        "music-scale-group";


    const noteLabel =
        document.createElement(
            "label"
        );


    noteLabel.textContent =
        "NOTA";


    const noteSelect =
        document.createElement(
            "select"
        );


    noteSelect.id =
        "global-scale-note-select";


    for (
        const note
        of musicalNotes
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            note.value;


        option.textContent =
            note.label;


        noteSelect.appendChild(
            option
        );

    }


    noteSelect.value =
        currentNote;


    noteGroup.appendChild(
        noteLabel
    );

    noteGroup.appendChild(
        noteSelect
    );


    // ==========================================
    // 🎼 BLOC DE MODE
    // ==========================================

    const modeGroup =
        document.createElement(
            "div"
        );


    modeGroup.className =
        "music-scale-group";


    const modeLabel =
        document.createElement(
            "label"
        );


    modeLabel.textContent =
        "MODE";


    const modeSelect =
        document.createElement(
            "select"
        );


    modeSelect.id =
        "global-scale-mode-select";


    for (
        const mode
        of musicalModes
    ) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            mode.value;


        option.textContent =
            mode.label;


        modeSelect.appendChild(
            option
        );

    }


    modeSelect.value =
        currentMode;


    modeGroup.appendChild(
        modeLabel
    );

    modeGroup.appendChild(
        modeSelect
    );


    // ==========================================
    // 🎨 MODE LLIURE
    // ==========================================

    const freeButton =
        document.createElement(
            "button"
        );


    freeButton.type =
        "button";


    freeButton.className =
        "free-scale-button";


    freeButton.innerHTML = `

        <span class="free-scale-icon">
            🎨
        </span>

        <span class="free-scale-content">

            <span class="free-scale-title">
                Lliure — totes les notes
            </span>

            <span class="free-scale-description">
                Utilitza totes les notes sense restriccions
            </span>

        </span>

        <span class="free-scale-indicator">
            ○
        </span>

    `;


    // ==========================================
    // 📦 AFEGIR ELEMENTS
    // ==========================================

    wrapper.appendChild(
        noteGroup
    );

    wrapper.appendChild(
        modeGroup
    );

    wrapper.appendChild(
        freeButton
    );


    // ==========================================
    // 🔄 SUBSTITUIR SELECT ANTIC
    // ==========================================

    oldSelect.replaceWith(
        wrapper
    );


    // ==========================================
    // 🎼 CANVIAR NOTA
    // ==========================================

    noteSelect.addEventListener(
        "change",
        () => {

            freeButton.classList.remove(
                "selected"
            );


            freeButton.querySelector(
                ".free-scale-indicator"
            ).textContent =
                "○";


            const scale =
                `${noteSelect.value} ${modeSelect.value}`;


            onScaleChange(
                scale
            );

        }
    );


    // ==========================================
    // 🎼 CANVIAR MODE
    // ==========================================

    modeSelect.addEventListener(
        "change",
        () => {

            freeButton.classList.remove(
                "selected"
            );


            freeButton.querySelector(
                ".free-scale-indicator"
            ).textContent =
                "○";


            const scale =
                `${noteSelect.value} ${modeSelect.value}`;


            onScaleChange(
                scale
            );

        }
    );


    // ==========================================
    // 🎨 ACTIVAR MODE LLIURE
    // ==========================================

    freeButton.addEventListener(
        "click",
        () => {

            // ======================================
            // 🎨 ACTIVAR VISUALMENT LLIURE
            // ======================================

            freeButton.classList.add(
                "selected"
            );


            freeButton.querySelector(
                ".free-scale-indicator"
            ).textContent =
                "●";


            // ======================================
            // ⚠️ IMPORTANT
            // ======================================
            //
            // NO desactivem els selectors.
            //
            // Això permet tornar directament
            // a qualsevol tonalitat després
            // d'haver seleccionat "Lliure".
            //
            // ======================================

            noteSelect.disabled =
                false;


            modeSelect.disabled =
                false;


            onScaleChange(
                "Lliure"
            );

        }
    );

}


// ================================================
// 🥁 SELECTOR DE TEMPO
// ================================================

function setupGlobalTempoSelector({

    selectedTempo,
    onTempoChange

}) {

    const input =
        document.getElementById(
            "tempo-select"
        );


    if (!input) {

        return;
    }


    const originalSetting =
        input.closest(
            ".global-music-setting"
        );


    if (!originalSetting) {

        return;
    }


    // ==========================================
    // 🧹 ELIMINAR DISPLAY ANTIC
    // ==========================================

    const oldDisplay =
        document.getElementById(
            "tempo-value"
        );


    if (oldDisplay) {

        oldDisplay.remove();

    }


    // ==========================================
    // 📦 CONTENIDOR NOU
    // ==========================================

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "music-tempo-controls";


    // ==========================================
    // 🎚️ SLIDER
    // ==========================================

    const slider =
        document.createElement(
            "input"
        );


    slider.type =
        "range";


    slider.id =
        "tempo-slider";


    slider.className =
        "tempo-slider";


    slider.min =
        "40";


    slider.max =
        "240";


    slider.step =
        "1";


    slider.value =
        selectedTempo;


    slider.setAttribute(
        "aria-label",
        "Tempo"
    );


    // ==========================================
    // 📊 EXTREMS DEL SLIDER
    // ==========================================

    const sliderLabels =
        document.createElement(
            "div"
        );


    sliderLabels.className =
        "tempo-slider-labels";


    const minimum =
        document.createElement(
            "span"
        );


    minimum.textContent =
        "40";


    const maximum =
        document.createElement(
        "span"
        );


    maximum.textContent =
        "240";


    sliderLabels.appendChild(
        minimum
    );

    sliderLabels.appendChild(
        maximum
    );


    // ==========================================
    // 🔢 VALOR EDITABLE
    // ==========================================

    input.classList.add(
        "tempo-number-input"
    );


    input.value =
        selectedTempo;


    input.setAttribute(
        "aria-label",
        "Tempo en BPM"
    );


    const editableValue =
        document.createElement(
            "div"
        );


    editableValue.className =
        "tempo-editable-value";


    editableValue.appendChild(
        input
    );


    const bpmLabel =
        document.createElement(
            "span"
        );


    bpmLabel.className =
        "tempo-bpm-label";


    bpmLabel.textContent =
        "BPM";


    editableValue.appendChild(
        bpmLabel
    );


    // ==========================================
    // 📦 MUNTAR TEMPO
    // ==========================================

    wrapper.appendChild(
        slider
    );


    wrapper.appendChild(
        sliderLabels
    );


    wrapper.appendChild(
        editableValue
    );


    // ==========================================
    // 🔄 AFEGIR AL CONTENIDOR
    // ==========================================

    originalSetting.appendChild(
        wrapper
    );


    // ==========================================
    // 🔢 CANVIAR DES DEL NÚMERO
    // ==========================================

    input.addEventListener(
        "input",
        () => {

            let value =
                Number(
                    input.value
                );


            if (
                Number.isNaN(value)
            ) {

                return;
            }


            value =
                Math.min(
                    240,
                    Math.max(
                        40,
                        value
                    )
                );


            slider.value =
                value;


            onTempoChange(
                value
            );

        }
    );


    // ==========================================
    // 🎚️ CANVIAR DES DEL SLIDER
    // ==========================================

    slider.addEventListener(
        "input",
        () => {

            input.value =
                slider.value;


            onTempoChange(
                slider.value
            );

        }
    );

}


// ================================================
// 🔄 ACTUALITZAR UI MUSICAL
// ================================================

export function refreshGlobalMusicUI(

    selectedScale,
    selectedTempo

) {

    // ==========================================
    // 🎼 TONALITAT
    // ==========================================

    const noteSelect =
        document.getElementById(
            "global-scale-note-select"
        );


    const modeSelect =
        document.getElementById(
            "global-scale-mode-select"
        );


    const freeButton =
        document.querySelector(
            ".free-scale-button"
        );


    if (
        selectedScale ===
        "Lliure"
    ) {

        if (noteSelect) {

            noteSelect.disabled =
                false;

        }


        if (modeSelect) {

            modeSelect.disabled =
                false;

        }


        if (freeButton) {

            freeButton.classList.add(
                "selected"
            );


            const indicator =
                freeButton.querySelector(
                    ".free-scale-indicator"
                );


            if (indicator) {

                indicator.textContent =
                    "●";

            }

        }

    }

    else {

        const match =
            selectedScale?.match(
                /^([A-G](?:#|b)?)\s+(major|minor)$/
            );


        if (match) {

            if (noteSelect) {

                noteSelect.value =
                    match[1];

            }


            if (modeSelect) {

                modeSelect.value =
                    match[2];

            }

        }


        if (noteSelect) {

            noteSelect.disabled =
                false;

        }


        if (modeSelect) {

            modeSelect.disabled =
                false;

        }


        if (freeButton) {

            freeButton.classList.remove(
                "selected"
            );


            const indicator =
                freeButton.querySelector(
                    ".free-scale-indicator"
                );


            if (indicator) {

                indicator.textContent =
                    "○";

            }

        }

    }


    // ==========================================
    // 🥁 TEMPO
    // ==========================================

    const tempoInput =
        document.getElementById(
            "tempo-select"
        );


    if (tempoInput) {

        tempoInput.value =
            selectedTempo;

    }


    const tempoSlider =
        document.getElementById(
            "tempo-slider"
        );


    if (tempoSlider) {

        tempoSlider.value =
            selectedTempo;

    }

}