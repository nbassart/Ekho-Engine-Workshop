// ================================================
// GESTURE DETECTOR
// ================================================
// Detecta individualment els cinc dits de cada mà.
//
// Cada dit retorna:
//
// true  → actiu / estès
// false → tancat
//
// El polze té un detector específic perquè el seu
// moviment és diferent del dels altres dits.
//
// ================================================


// ------------------------------------------------
// DISTÀNCIA ENTRE DOS PUNTS
// ------------------------------------------------

function distance(pointA, pointB) {

    const dx =
        pointA.x - pointB.x;

    const dy =
        pointA.y - pointB.y;

    return Math.sqrt(
        dx * dx +
        dy * dy
    );
}


// ------------------------------------------------
// ANGLE ENTRE TRES PUNTS
// ------------------------------------------------

function angle(
    pointA,
    pointB,
    pointC
) {

    const vectorBA = {
        x: pointA.x - pointB.x,
        y: pointA.y - pointB.y
    };

    const vectorBC = {
        x: pointC.x - pointB.x,
        y: pointC.y - pointB.y
    };


    const dot =
        vectorBA.x * vectorBC.x +
        vectorBA.y * vectorBC.y;


    const magnitudeBA =
        Math.sqrt(
            vectorBA.x * vectorBA.x +
            vectorBA.y * vectorBA.y
        );


    const magnitudeBC =
        Math.sqrt(
            vectorBC.x * vectorBC.x +
            vectorBC.y * vectorBC.y
        );


    if (
        magnitudeBA === 0 ||
        magnitudeBC === 0
    ) {
        return 0;
    }


    const cosine =
        dot /
        (
            magnitudeBA *
            magnitudeBC
        );


    const clampedCosine =
        Math.max(
            -1,
            Math.min(
                1,
                cosine
            )
        );


    return (
        Math.acos(
            clampedCosine
        ) *
        180 /
        Math.PI
    );
}


// ------------------------------------------------
// DISTÀNCIA D'UN PUNT A UNA LÍNIA
// ------------------------------------------------

function distanceToPalmAxis(
    point,
    wrist,
    middleBase
) {

    const lineX =
        middleBase.x - wrist.x;

    const lineY =
        middleBase.y - wrist.y;


    const pointX =
        point.x - wrist.x;

    const pointY =
        point.y - wrist.y;


    const lineLength =
        Math.sqrt(
            lineX * lineX +
            lineY * lineY
        );


    if (lineLength === 0) {
        return 0;
    }


    const cross =
        Math.abs(
            lineX * pointY -
            lineY * pointX
        );


    return cross / lineLength;
}


// ------------------------------------------------
// MIDA DE REFERÈNCIA DE LA MÀ
// ------------------------------------------------
//
// Normalitzem les distàncies perquè el detector
// funcioni igual encara que la mà estigui més a
// prop o més lluny de la càmera.
// ------------------------------------------------

function getHandSize(
    landmarks
) {

    return distance(
        landmarks[0],
        landmarks[9]
    );
}


// ------------------------------------------------
// DETECTAR SI UN DIT LLARG ESTÀ TANCAT
// ------------------------------------------------

function isLongFingerClosed(
    landmarks,
    tipIndex
) {

    const handSize =
        getHandSize(
            landmarks
        );


    if (handSize === 0) {
        return false;
    }


    const palmCenter = {

        x:
            (
                landmarks[5].x +
                landmarks[9].x +
                landmarks[13].x +
                landmarks[17].x
            ) / 4,

        y:
            (
                landmarks[5].y +
                landmarks[9].y +
                landmarks[13].y +
                landmarks[17].y
            ) / 4

    };


    const distanceToWrist =
        distance(
            landmarks[tipIndex],
            landmarks[0]
        ) /
        handSize;


    const distanceToPalm =
        distance(
            landmarks[tipIndex],
            palmCenter
        ) /
        handSize;


    return (

        distanceToWrist < 1.15 &&

        distanceToPalm < 0.70

    );
}


// ------------------------------------------------
// DETECTAR SI EL POLZE ESTÀ OBERT
// ------------------------------------------------
//
// Aquesta és la part nova.
//
// El criteri principal és:
//
//     punta polze (4)
//             ↕
//     punta índex (8)
//
// Quan el polze està recollit, aquestes puntes
// tendeixen a estar molt més juntes.
//
// Quan el polze s'obre, la distància augmenta.
//
// La distància està normalitzada respecte de:
//
//     canell (0) → base del mig (9)
//
// Això fa que no depengui de la mida de la mà
// a la imatge.
// ------------------------------------------------

function isThumbExtended(
    landmarks
) {

    const handSize =
        getHandSize(
            landmarks
        );


    if (handSize === 0) {
        return false;
    }


    const thumbTip =
        landmarks[4];

    const indexTip =
        landmarks[8];


    // --------------------------------------------
    // DISTÀNCIA POLZE → ÍNDEX
    // --------------------------------------------

    const thumbIndexDistance =
        distance(
            thumbTip,
            indexTip
        ) /
        handSize;


    // --------------------------------------------
    // DISTÀNCIA POLZE → PALMELL
    // --------------------------------------------

    const palmCenter = {

        x:
            (
                landmarks[5].x +
                landmarks[9].x +
                landmarks[13].x +
                landmarks[17].x
            ) / 4,

        y:
            (
                landmarks[5].y +
                landmarks[9].y +
                landmarks[13].y +
                landmarks[17].y
            ) / 4

    };


    const thumbToPalm =
        distance(
            thumbTip,
            palmCenter
        ) /
        handSize;


    // --------------------------------------------
    // GEOMETRIA DEL POLZE
    // --------------------------------------------

    const thumbMCP =
        landmarks[2];

    const thumbIP =
        landmarks[3];


    const thumbAngle =
        angle(
            thumbMCP,
            thumbIP,
            thumbTip
        );


    const thumbLength =
        distance(
            thumbMCP,
            thumbTip
        ) /
        handSize;


    // --------------------------------------------
    // CONDICIÓ PRINCIPAL
    // --------------------------------------------
    //
    // La separació polze-índex és el criteri més
    // important.
    //
    // Les altres dues condicions serveixen com a
    // confirmació geomètrica.
    // --------------------------------------------

    return (

        thumbIndexDistance > 0.55 &&

        thumbToPalm > 0.40 &&

        thumbAngle > 125 &&

        thumbLength > 0.35

    );
}


// ------------------------------------------------
// DETECTAR SI EL POLZE ESTÀ RECOLLIT
// ------------------------------------------------
//
// Utilitzem el mateix principi però al revés.
//
// El polze ha d'estar prou a prop de l'índex.
//
// IMPORTANT:
//
// No utilitzem simplement !isThumbExtended(),
// perquè així els casos amb landmarks poc fiables
// podrien convertir-se automàticament en "polze
// tancat".
// ------------------------------------------------

function isThumbClosed(
    landmarks
) {

    const handSize =
        getHandSize(
            landmarks
        );


    if (handSize === 0) {
        return false;
    }


    const thumbTip =
        landmarks[4];

    const indexTip =
        landmarks[8];


    const thumbIndexDistance =
        distance(
            thumbTip,
            indexTip
        ) /
        handSize;


    return (
        thumbIndexDistance < 0.48
    );
}


// ------------------------------------------------
// DETECTAR SI LA MÀ ÉS UN PUNY
// ------------------------------------------------
//
// Un puny necessita:
//
// 4 dits llargs tancats
// +
// polze clarament recollit.
//
// Per tant:
//
// ✊ → PUNY
//
// Però:
//
// 👍 → NO PUNY
// ☝️ → NO PUNY
// ✌️ → NO PUNY
// ------------------------------------------------

function isFist(
    landmarks
) {

    const indexClosed =
        isLongFingerClosed(
            landmarks,
            8
        );


    const middleClosed =
        isLongFingerClosed(
            landmarks,
            12
        );


    const ringClosed =
        isLongFingerClosed(
            landmarks,
            16
        );


    const pinkyClosed =
        isLongFingerClosed(
            landmarks,
            20
        );


    const thumbClosed =
        isThumbClosed(
            landmarks
        );


    return (

        indexClosed &&
        middleClosed &&
        ringClosed &&
        pinkyClosed &&
        thumbClosed

    );
}


// ------------------------------------------------
// DETECTAR DIT LLARG OBERT
// ------------------------------------------------
// Índex, mig, anular i menovell.
// ------------------------------------------------

function isLongFingerExtended(
    landmarks,
    mcpIndex,
    pipIndex,
    dipIndex,
    tipIndex
) {

    const wrist =
        landmarks[0];

    const mcp =
        landmarks[mcpIndex];

    const pip =
        landmarks[pipIndex];

    const dip =
        landmarks[dipIndex];

    const tip =
        landmarks[tipIndex];


    const handSize =
        getHandSize(
            landmarks
        );


    if (handSize === 0) {
        return false;
    }


    // --------------------------------------------
    // ANGLES
    // --------------------------------------------

    const pipAngle =
        angle(
            mcp,
            pip,
            dip
        );


    const dipAngle =
        angle(
            pip,
            dip,
            tip
        );


    // --------------------------------------------
    // LONGITUD
    // --------------------------------------------

    const fingerLength =
        distance(
            mcp,
            tip
        );


    const relativeFingerLength =
        fingerLength /
        handSize;


    // --------------------------------------------
    // DISTÀNCIA AL CANELL
    // --------------------------------------------

    const wristToTip =
        distance(
            wrist,
            tip
        );


    const relativeWristToTip =
        wristToTip /
        handSize;


    // --------------------------------------------
    // CONDICIONS
    // --------------------------------------------

    return (

        pipAngle > 155 &&

        dipAngle > 150 &&

        relativeFingerLength > 0.62 &&

        relativeWristToTip > 1.05

    );
}


// ------------------------------------------------
// ESTABILITZACIÓ
// ------------------------------------------------

const fingerStability = {

    left: {

        thumb: {
            detected: false,
            count: 0
        },

        index: {
            detected: false,
            count: 0
        },

        middle: {
            detected: false,
            count: 0
        },

        ring: {
            detected: false,
            count: 0
        },

        pinky: {
            detected: false,
            count: 0
        }

    },

    right: {

        thumb: {
            detected: false,
            count: 0
        },

        index: {
            detected: false,
            count: 0
        },

        middle: {
            detected: false,
            count: 0
        },

        ring: {
            detected: false,
            count: 0
        },

        pinky: {
            detected: false,
            count: 0
        }

    }

};


// ------------------------------------------------
// FRAMES DE CONFIRMACIÓ
// ------------------------------------------------

const OPEN_CONFIRMATION_FRAMES = 2;

const CLOSE_CONFIRMATION_FRAMES = 3;


// ------------------------------------------------
// ACTUALITZAR ESTABILITAT
// ------------------------------------------------

function stabilizeFinger(
    handName,
    fingerName,
    detected
) {

    const state =
        fingerStability[handName][fingerName];


    if (
        detected ===
        state.detected
    ) {

        state.count = 0;

        return state.detected;
    }


    state.count++;


    const requiredFrames =
        detected
            ? OPEN_CONFIRMATION_FRAMES
            : CLOSE_CONFIRMATION_FRAMES;


    if (
        state.count >=
        requiredFrames
    ) {

        state.detected =
            detected;

        state.count = 0;
    }


    return state.detected;
}


// ------------------------------------------------
// REINICIAR ESTAT D'UNA MÀ
// ------------------------------------------------

function resetHandStability(
    handName
) {

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

        fingerStability[handName][finger] = {

            detected: false,
            count: 0

        };

    }
}


// ------------------------------------------------
// DETECTAR TOTS ELS DITS
// ------------------------------------------------

export function detectFingers(
    landmarks,
    handName = null
) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {

        if (handName) {

            resetHandStability(
                handName
            );

        }


        return {

            thumb: false,
            index: false,
            middle: false,
            ring: false,
            pinky: false

        };
    }


    // --------------------------------------------
    // PRIMER: PUNY
    // --------------------------------------------

    const fist =
        isFist(
            landmarks
        );


    if (fist) {

        if (handName) {

            resetHandStability(
                handName
            );

        }


        return {

            thumb: false,
            index: false,
            middle: false,
            ring: false,
            pinky: false

        };
    }


    // --------------------------------------------
    // DETECCIÓ INDIVIDUAL
    // --------------------------------------------

    const rawThumb =
        isThumbExtended(
            landmarks
        );


    const rawIndex =
        isLongFingerExtended(
            landmarks,
            5,
            6,
            7,
            8
        );


    const rawMiddle =
        isLongFingerExtended(
            landmarks,
            9,
            10,
            11,
            12
        );


    const rawRing =
        isLongFingerExtended(
            landmarks,
            13,
            14,
            15,
            16
        );


    const rawPinky =
        isLongFingerExtended(
            landmarks,
            17,
            18,
            19,
            20
        );


    // --------------------------------------------
    // SENSE ESTABILITZACIÓ
    // --------------------------------------------

    if (!handName) {

        return {

            thumb: rawThumb,
            index: rawIndex,
            middle: rawMiddle,
            ring: rawRing,
            pinky: rawPinky

        };

    }


    return {

        thumb:
            stabilizeFinger(
                handName,
                "thumb",
                rawThumb
            ),

        index:
            stabilizeFinger(
                handName,
                "index",
                rawIndex
            ),

        middle:
            stabilizeFinger(
                handName,
                "middle",
                rawMiddle
            ),

        ring:
            stabilizeFinger(
                handName,
                "ring",
                rawRing
            ),

        pinky:
            stabilizeFinger(
                handName,
                "pinky",
                rawPinky
            )

    };
}


// ------------------------------------------------
// DETECTAR UNA MÀ
// ------------------------------------------------

export function detectHand(
    landmarks,
    handName = null
) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {

        if (handName) {

            resetHandStability(
                handName
            );

        }

        return null;
    }


    const fingers =
        detectFingers(
            landmarks,
            handName
        );


    return {

        landmarks,

        fingers,

        thumb:
            fingers.thumb,

        index:
            fingers.index,

        middle:
            fingers.middle,

        ring:
            fingers.ring,

        pinky:
            fingers.pinky

    };
}


// ------------------------------------------------
// DETECTAR LES DUES MANS
// ------------------------------------------------

export function detectBothHands(
    results
) {

    const hands = {

        left: null,

        right: null

    };


    if (
        !results ||
        !results.landmarks
    ) {

        resetHandStability(
            "left"
        );

        resetHandStability(
            "right"
        );

        return hands;
    }


    const detectedHandNames = {

        left: false,

        right: false

    };


    for (
        let i = 0;
        i < results.landmarks.length;
        i++
    ) {

        const landmarks =
            results.landmarks[i];


        let handedness = null;


        if (
            results.handedness &&
            results.handedness[i] &&
            results.handedness[i][0]
        ) {

            handedness =
                results.handedness[i][0]
                    .categoryName;
        }


        if (
            handedness === "Left"
        ) {

            hands.left =
                detectHand(
                    landmarks,
                    "left"
                );

            detectedHandNames.left =
                true;
        }


        else if (
            handedness === "Right"
        ) {

            hands.right =
                detectHand(
                    landmarks,
                    "right"
                );

            detectedHandNames.right =
                true;
        }
    }


    // --------------------------------------------
    // REINICIAR MANS DESAPAREGUDES
    // --------------------------------------------

    if (
        !detectedHandNames.left
    ) {

        resetHandStability(
            "left"
        );

    }


    if (
        !detectedHandNames.right
    ) {

        resetHandStability(
            "right"
        );

    }


    return hands;
}