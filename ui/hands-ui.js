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
// - 🟣 mà activa / mà seleccionada 
// - 👁️ mostrar / amagar l'editor 
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
// 🎨 ESTILS VISUALS 
// ================================================ 

function installActiveHandStyles() { 

    if ( 
        document.getElementById( 
            "ekho-active-hand-styles" 
        ) 
    ) { 

        return; 

    } 


    const style = 
        document.createElement( 
            "style" 
        ); 


    style.id = 
        "ekho-active-hand-styles"; 


    style.textContent = ` 

        /* ========================================== 
           🟣 MÀ ACTIVA 
           ========================================== */ 

        .hand-card.ekho-active-hand { 

            border-color: 
                #a855f7 !important; 

            background-color: 
                rgba(168, 85, 247, 0.10) !important; 

            box-shadow: 
                0 0 0 2px rgba(168, 85, 247, 0.18), 
                0 0 18px rgba(168, 85, 247, 0.10); 

            transition: 
                border-color 0.18s ease, 
                background-color 0.18s ease, 
                box-shadow 0.18s ease; 
        } 


        .hand-card.ekho-active-hand 
        .hand-title { 

            color: 
                #a855f7 !important; 
        } 


        /* ========================================== 
           👁️ EDITOR OCULT 
           ========================================== */ 

        #editor.ekho-editor-hidden { 

            display: 
                none !important; 
        } 

    `; 


    document.head.appendChild( 
        style 
    ); 

} 


// ================================================ 
// 🔎 TROBAR EL RECUADRE COMPLET DE LA MÀ 
// ================================================ 

function findHandContainer(hand) { 

    const handButton = 
        document.getElementById( 
            `${hand}-hand-mode` 
        ); 


    if (!handButton) { 

        return null; 

    } 


    const handCard = 
        handButton.closest( 
            ".hand-card" 
        ); 


    return handCard || null; 

} 


// ================================================ 
// 🟣 ACTUALITZAR MÀ ACTIVA 
// ================================================ 

function updateActiveHandUI( 
    activeHand 
) { 

    installActiveHandStyles(); 


    for ( 
        const hand 
        of hands 
    ) { 

        const container = 
            findHandContainer( 
                hand 
            ); 


        if (!container) { 

            continue; 

        } 


        container.classList.toggle( 
            "ekho-active-hand", 
            hand === activeHand 
        ); 

    } 

} 


// ================================================ 
// 👁️ EDITOR 
// ================================================ 

function getEditor() { 

    return document.getElementById( 
        "editor" 
    ); 

} 


// ================================================ 
// 👁️ AMAGAR EDITOR 
// ================================================ 

function hideEditor() { 

    installActiveHandStyles(); 


    const editor = 
        getEditor(); 


    if (!editor) { 

        return; 

    } 


    editor.classList.add( 
        "ekho-editor-hidden" 
    ); 

} 


// ================================================ 
// 👁️ MOSTRAR EDITOR 
// ================================================ 

function showEditor() { 

    installActiveHandStyles(); 


    const editor = 
        getEditor(); 


    if (!editor) { 

        return; 

    } 


    editor.classList.remove( 
        "ekho-editor-hidden" 
    ); 

} 


// ================================================ 
// 🧹 PLEGAR COMPLETAMENT UNA MÀ 
// ================================================ 
// 
// IMPORTANT: 
// 
// Aquí NO canviem el mode ni la configuració. 
// Només tanquem visualment tots els nivells 
// desplegables d'aquesta mà. 
// 
// ================================================ 

function collapseHandUI( 
    hand 
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


// ================================================ 
// 🧹 PLEGAR TOTES LES ALTRES MANS 
// ================================================ 

function collapseOtherHands( 
    activeHand 
) { 

    for ( 
        const hand 
        of hands 
    ) { 

        if ( 
            hand === 
            activeHand 
        ) { 

            continue; 

        } 


        collapseHandUI( 
            hand 
        ); 

    } 

} 


// ================================================ 
// 🧹 NETEJAR ZONA DE CONFIGURACIÓ MUSICAL 
// ================================================ 
// 
// Aquesta zona és compartida per les dues mans. 
// Quan canviem de mà, no volem que quedi visible 
// la configuració musical de l'anterior. 
// 
// IMPORTANT: 
// Això NO modifica la configuració guardada. 
// Només neteja la interfície visible. 
// 
// ================================================ 

function hideValueArea() { 

    const valueArea = 
        document.getElementById( 
            "value-area" 
        ); 


    if (!valueArea) { 

        return; 

    } 


    valueArea.classList.add( 
        "hidden" 
    ); 


    valueArea.innerHTML = 
        ""; 

} 


// ================================================ 
// 👁️ SELECCIÓ VISUAL D'UNA MÀ 
// ================================================ 
// 
// IMPORTANT: 
// 
// Seleccionar una mà NO mostra l'editor. 
// 
// L'editor només pot aparèixer després de: 
// 
// 🖐️ Mà oberta 
// ✊ Mà tancada 
// 👆 un dit 
// 
// Això permet que canviar de mà doni la sensació 
// d'estar obrint aquella mà per primera vegada, 
// encara que internament tingui una configuració 
// guardada. 
// 
// ================================================ 

function selectHandVisual( 
    hand 
) { 

    updateActiveHandUI( 
        hand 
    ); 


    collapseOtherHands( 
        hand 
    ); 


    hideValueArea(); 


    // ========================================== 
    // 🚫 NO MOSTRAR L'EDITOR 
    // ========================================== 

    hideEditor(); 

} 


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

    installActiveHandStyles(); 


    // ========================================== 
    // 👁️ INICI 
    // ========================================== 
    // 
    // No hi ha cap mà seleccionada. 
    // 
    // ========================================== 

    hideEditor(); 


    updateActiveHandUI( 
        null 
    ); 


    // ========================================== 
    // 🧹 TANCAR TOTES LES ÀREES 
    // ========================================== 

    for ( 
        const hand 
        of hands 
    ) { 

        collapseHandUI( 
            hand 
        ); 

    } 


    hideValueArea(); 


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


    setupHandCardClickNavigation({ 

        getHandMode 

    }); 


    refreshAllHandsUI({ 

        getHandMode, 
        getSelectedFinger 

    }); 

} 


// ================================================ 
// 🖱️ CLICAR A QUALSEVOL LLOC DE LA MÀ 
// ================================================ 
// 
// Si l'usuari clica sobre una zona buida del 
// .hand-card, interpretem que vol seleccionar 
// aquella mà. 
// 
// IMPORTANT: 
// 
// Això NO obre cap menú i NO mostra l'editor. 
// 
// ================================================ 

function setupHandCardClickNavigation({ 

    getHandMode 

}) { 

    for ( 
        const hand 
        of hands 
    ) { 

        const card = 
            findHandContainer( 
                hand 
            ); 


        if (!card) { 

            continue; 

        } 


        card.addEventListener( 
            "click", 
            event => { 

                // ================================== 
                // 🚫 NO INTERCEPTAR BOTONS 
                // ================================== 

                const clickedButton = 
                    event.target.closest( 
                        "button" 
                    ); 


                if ( 
                    clickedButton && 
                    card.contains( 
                        clickedButton 
                    ) 
                ) { 

                    return; 

                } 


                // ================================== 
                // 🟣 SELECCIONAR AQUESTA MÀ 
                // ================================== 

                selectHandVisual( 
                    hand 
                ); 

            } 
        ); 

    } 

} 


// ================================================ 
// ⚙️ BOTONS DE MODE 
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

                    // ================================== 
                    // 🟣 AQUESTA ÉS LA MÀ ACTIVA 
                    // ================================== 

                    selectHandVisual( 
                        hand 
                    ); 


                    // ================================== 
                    // 📂 MOSTRAR MÀ SENCERA 
                    // ================================== 

                    const wholeHandArea = 
                        document.getElementById( 
                            `${hand}-hand-configuration` 
                        ); 


                    const fingerArea = 
                        document.getElementById( 
                            `${hand}-finger-mode` 
                        ); 


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


                    // ================================== 
                    // 🔄 CANVI DE MODE NOMÉS SI CAL 
                    // ================================== 

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

                    // ================================== 
                    // 🟣 AQUESTA ÉS LA MÀ ACTIVA 
                    // ================================== 

                    selectHandVisual( 
                        hand 
                    ); 


                    // ================================== 
                    // 📂 MOSTRAR DITS 
                    // ================================== 

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


                    // ================================== 
                    // 🔄 CANVI DE MODE NOMÉS SI CAL 
                    // ================================== 

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


                        selectHandVisual( 
                            hand 
                        ); 


                        onFingerSelect( 
                            hand, 
                            finger 
                        ); 


                        // ==================================
                        // 👁️ ARA SÍ: MOSTRAR EDITOR
                        // ================================== 

                        showEditor(); 

                    } 
                ); 

            } 
        ); 

} 


// ================================================ 
// 🖐️ BOTONS MÀ OBERTA / TANCADA 
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


                            selectHandVisual( 
                                hand 
                            ); 


                            onHandStateSelect( 
                                hand, 
                                button.dataset.state 
                            ); 


                            // ==================================
                            // 👁️ ARA SÍ: MOSTRAR EDITOR
                            // ================================== 

                            showEditor(); 

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


    // ========================================== 
    // 🟣 CAP MÀ ACTIVA A L'INICI 
    // ========================================== 

    updateActiveHandUI( 
        null 
    ); 

}