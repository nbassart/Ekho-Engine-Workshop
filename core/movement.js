// ================================================
// MOVEMENT
// ================================================
// Aquest fitxer transforma la posició de la mà
// detectada per MediaPipe en dades de moviment.
//
// Prioritat:
// 1. Respondre ràpidament als moviments.
// 2. Permetre gestos ràpids i ritmes.
// 3. Reduir una mica el tremolor quan la mà està
//    pràcticament quieta.
//
// IMPORTANT:
// No fem un suavitzat fort perquè l'instrument
// ha de respondre immediatament.
// ================================================


// ------------------------------------------------
// ESTAT
// ------------------------------------------------

let previousPosition = null;

let smoothedPosition = null;


// ------------------------------------------------
// CONFIGURACIÓ
// ------------------------------------------------

// Suavitzat mínim quan la mà està gairebé quieta.

const STILL_SMOOTHING = 0.15;


// Suavitzat quan hi ha moviment normal.

const NORMAL_SMOOTHING = 0.75;


// Moviment a partir del qual considerem que
// la mà està fent un gest ràpid.

const FAST_MOVEMENT = 0.035;


// ------------------------------------------------
// OBTENIR EL CENTRE DE LA MÀ
// ------------------------------------------------

export function getHandCenter(landmarks) {

    let x = 0;

    let y = 0;


    for (
        const landmark of landmarks
    ) {

        x += landmark.x;

        y += landmark.y;
    }


    x /=
        landmarks.length;

    y /=
        landmarks.length;


    return {
        x,
        y
    };
}


// ------------------------------------------------
// CALCULAR MOVIMENT
// ------------------------------------------------

export function calculateMovement(
    landmarks
) {

    // --------------------------------------------
    // POSICIÓ REAL
    // --------------------------------------------

    const rawPosition =
        getHandCenter(
            landmarks
        );


    // --------------------------------------------
    // PRIMERA DETECCIÓ
    // --------------------------------------------

    if (
        previousPosition === null
    ) {

        previousPosition = {
            x: rawPosition.x,
            y: rawPosition.y
        };


        smoothedPosition = {
            x: rawPosition.x,
            y: rawPosition.y
        };


        return {

            x: rawPosition.x,

            y: rawPosition.y,

            movementX: 0,

            movementY: 0,

            speed: 0
        };
    }


    // --------------------------------------------
    // MOVIMENT REAL
    // --------------------------------------------

    const rawMovementX =
        rawPosition.x -
        previousPosition.x;


    const rawMovementY =
        rawPosition.y -
        previousPosition.y;


    const rawSpeed =
        Math.sqrt(
            rawMovementX * rawMovementX +
            rawMovementY * rawMovementY
        );


    // --------------------------------------------
    // ESCOLLIR SUAVITZAT
    // --------------------------------------------
    //
    // Mà gairebé quieta:
    // → poc moviment del detector
    // → una mica de suavitzat
    //
    // Mà movent-se:
    // → resposta ràpida
    //
    // Mà molt ràpida:
    // → pràcticament directa
    // --------------------------------------------

    let smoothing;


    if (
        rawSpeed >= FAST_MOVEMENT
    ) {

        // MOVIMENT RÀPID
        //
        // Seguim pràcticament la posició real.

        smoothing = 1.0;

    } else {

        // MOVIMENT NORMAL / PETIT

        const ratio =
            rawSpeed /
            FAST_MOVEMENT;


        smoothing =
            STILL_SMOOTHING +
            (
                NORMAL_SMOOTHING -
                STILL_SMOOTHING
            ) *
            ratio;
    }


    // --------------------------------------------
    // ACTUALITZAR POSICIÓ
    // --------------------------------------------

    smoothedPosition.x +=
        (
            rawPosition.x -
            smoothedPosition.x
        ) *
        smoothing;


    smoothedPosition.y +=
        (
            rawPosition.y -
            smoothedPosition.y
        ) *
        smoothing;


    // --------------------------------------------
    // MOVIMENT RESULTANT
    // --------------------------------------------

    const movementX =
        smoothedPosition.x -
        previousPosition.x;


    const movementY =
        smoothedPosition.y -
        previousPosition.y;


    const speed =
        Math.sqrt(
            movementX * movementX +
            movementY * movementY
        );


    // --------------------------------------------
    // ACTUALITZAR POSICIÓ ANTERIOR
    // --------------------------------------------

    previousPosition = {
        x: smoothedPosition.x,
        y: smoothedPosition.y
    };


    // --------------------------------------------
    // RESULTAT
    // --------------------------------------------

    return {

        x: smoothedPosition.x,

        y: smoothedPosition.y,

        movementX,

        movementY,

        speed
    };
}