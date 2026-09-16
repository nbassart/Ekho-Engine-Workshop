// ================================================
// 🖐️ EKHO — HANDS UI
// ================================================
//
// Aquest mòdul s'encarrega EXCLUSIVAMENT de la
// interfície de configuració de les mans.
//
// Aquí gestionem:
// - 🖐️ Mà sencera
// - ⚙️ Personalitza els dits
// - 👆 selecció dels dits
// - 🖐️ Mà oberta / ✊ mà tancada
// - mostrar / amagar les diferents zones
// - estat visual dels botons
//
// La lògica musical i l'estat real de l'instrument
// continuen a app.js.
// ================================================


// ================================================
// 👋 CONSTANTS
// ================================================

const hands = [
    "left",
    "right"
];


// ================================================
// 👆 DITS
// ================================================

const fingers = [
    "thumb",
    "index",
    "middle",
    "ring",
    "pinky"
];


// ================================================
// 🖐️ INICIALITZAR UI DE LES MANS
// ================================================

export function setupHandsUI({

    getHandMode,
    getSelectedFinger,

    onHandModeChange,
    onFingerSelect,
    onHandStateSelect

}) {

    setupModeButtons({

        getHandMode,
        onHandModeChange

    });


    setupFingerButtons({

        getHandMode,
        onFingerSelect

    });


    setupHandStateButtons({

        getHandMode,
        onHandStateSelect

    });


    refreshAllHandsUI({

        getHandMode,
        getSelectedFinger

    });

}


// ================================================
// ⚙️ BOTONS DE MODE
// ================================================
//
// Cada mà té dos botons:
//
// 🖐️ Mà sencera
// ⚙️ Personalitza els dits
//
// Aquests botons funcionen com a primer nivell
// de navegació.
//
// IMPORTANT:
// La selecció del mode NO ha d'obrir directament
// cap configuració musical.
//
// La configuració interior només apareix quan
// l'usuari entra explícitament en aquell mode.
// ================================================

function setupModeButtons({

    getHandMode,
    onHandModeChange

}) {

    for (
        const hand
        of hands
    ) {

        // ==========================================
        // 🖐️ MÀ SENCERA
        // ==========================================

        const handButton =
            document.getElementById(
                `${hand}-hand-mode`
            );


        if (handButton) {

            handButton.addEventListener(
                "click",
                () => {

                    if (
                        getHandMode(hand) ===
                        "hand"
                    ) {
                        return;
                    }


                    onHandModeChange(
                        hand,
                        "hand"
                    );

                }
            );

        }


        // ==========================================
        // ⚙️ PERSONALITZA ELS DITS
        // ==========================================

        const personalizeButton =
            document.getElementById(
                `personalize-${hand}`
            );


        if (personalizeButton) {

            personalizeButton.addEventListener(
                "click",
                () => {

                    if (
                        getHandMode(hand) ===
                        "fingers"
                    ) {
                        return;
                    }


                    onHandModeChange(
                        hand,
                        "fingers"
                    );

                }
            );

        }

    }

}


// ================================================
// 👆 BOTONS DELS DITS
// ================================================

function setupFingerButtons({

    getHandMode,
    onFingerSelect

}) {

    document
        .querySelectorAll(
            ".finger-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const hand =
                            button.dataset.hand;

                        const finger =
                            button.dataset.finger;


                        if (
                            getHandMode(hand) !==
                            "fingers"
                        ) {

                            return;

                        }


                        if (
                            button.disabled
                        ) {

                            return;

                        }


                        onFingerSelect(
                            hand,
                            finger
                        );

                    }
                );

            }
        );

}


// ================================================
// 🖐️ BOTONS MÀ OBERTA / TANCADA
// ================================================
//
// Aquests botons només són visibles quan:
//
// Mà → 🖐️ Mà sencera
//
// ================================================

function setupHandStateButtons({

    getHandMode,
    onHandStateSelect

}) {

    for (
        const hand
        of hands
    ) {

        document
            .querySelectorAll(
                `.hand-mode-button[data-hand="${hand}"][data-state]`
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                getHandMode(hand) !==
                                "hand"
                            ) {

                                return;

                            }


                            onHandStateSelect(
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
// 🎨 ACTUALITZAR UI D'UNA MÀ
// ================================================

export function refreshHandUI({

    hand,
    mode,
    selectedFinger

}) {

    const wholeHandArea =
        document.getElementById(
            `${hand}-hand-configuration`
        );


    const fingerArea =
        document.getElementById(
            `${hand}-finger-mode`
        );


    const handModeButton =
        document.getElementById(
            `${hand}-hand-mode`
        );


    const personalizeButton =
        document.getElementById(
            `personalize-${hand}`
        );


    // ==========================================
    // 🎛️ ACTUALITZAR SELECTOR DE MODE
    // ==========================================

    if (handModeButton) {

        handModeButton.classList.toggle(
            "selected",
            mode === "hand"
        );

    }


    if (personalizeButton) {

        personalizeButton.classList.toggle(
            "selected",
            mode === "fingers"
        );

    }


    // ==========================================
    // 🖐️ MÀ SENCERA
    // ==========================================
    //
    // Quan entrem en mode mà sencera,
    // mostrem NOMÉS les opcions:
    //
    // 🖐️ Mà oberta
    // ✊ Mà tancada
    //
    // La configuració musical no es mostra aquí.
    // Aquesta només apareix quan l'usuari selecciona
    // explícitament un dels dos estats.
    // ==========================================

    if (
        mode ===
        "hand"
    ) {

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

    }


    // ==========================================
    // 👆 PERSONALITZA ELS DITS
    // ==========================================
    //
    // Quan entrem en aquest mode, mostrem només
    // la selecció dels cinc dits.
    //
    // La configuració musical apareix després
    // de seleccionar un dit.
    // ==========================================

    else {

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

    }


    // ==========================================
    // 👆 ACTUALITZAR DITS
    // ==========================================

    updateFingerButtonsUI({

        hand,
        mode,
        selectedFinger

    });


    // ==========================================
    // 🖐️ ACTUALITZAR ESTATS DE LA MÀ
    // ==========================================

    updateHandStateButtonsUI({

        hand,
        mode

    });

}


// ================================================
// 👆 ACTUALITZAR BOTONS DELS DITS
// ================================================

function updateFingerButtonsUI({

    hand,
    mode,
    selectedFinger

}) {

    const enabled =
        mode ===
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
// 🖐️ ACTUALITZAR BOTONS MÀ OBERTA/TANCADA
// ================================================

function updateHandStateButtonsUI({

    hand,
    mode

}) {

    const enabled =
        mode ===
        "hand";


    document
        .querySelectorAll(
            `.hand-mode-button[data-hand="${hand}"][data-state]`
        )
        .forEach(
            button => {

                button.disabled =
                    !enabled;

            }
        );

}


// ================================================
// 🔄 ACTUALITZAR TOTES LES MANS
// ================================================

function refreshAllHandsUI({

    getHandMode,
    getSelectedFinger

}) {

    for (
        const hand
        of hands
    ) {

        refreshHandUI({

            hand,

            mode:
                getHandMode(
                    hand
                ),

            selectedFinger:
                getSelectedFinger()

        });

    }

}