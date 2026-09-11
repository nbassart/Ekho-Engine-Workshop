// ================================================
// 🎼 EKHO — ESCALAS I TONALITATS
// ================================================
//
// Genera les notes de les tonalitats majors i menors.
//
// Les tonalitats es mostren en un ordre coherent
// i les notes disponibles es generen automàticament.
//
// ================================================


// ================================================
// NOTES CROMÀTIQUES
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
// INTERVALS
// ================================================

const majorIntervals = [
    0,
    2,
    4,
    5,
    7,
    9,
    11
];

const minorIntervals = [
    0,
    2,
    3,
    5,
    7,
    8,
    10
];


// ================================================
// EQUIVALÈNCIES DE BEMOL
// ================================================

const flatToSharp = {

    Db: "C#",
    Eb: "D#",
    Gb: "F#",
    Ab: "G#",
    Bb: "A#",

    db: "C#",
    eb: "D#",
    gb: "F#",
    ab: "G#",
    bb: "A#"

};


// ================================================
// NORMALITZAR NOM
// ================================================

function normalizeScaleName(
    scaleName
) {

    let name =
        scaleName
            .trim();


    let lowerName =
        name.toLowerCase();


    let type =
        "major";


    // --------------------------------------------
    // DETECTAR TIPUS
    // --------------------------------------------

    if (

        lowerName.endsWith("minor") ||

        lowerName.endsWith("min") ||

        lowerName.endsWith("m")

    ) {

        type =
            "minor";

    }


    // --------------------------------------------
    // TREURE EL NOM DEL TIPUS
    // --------------------------------------------

    let root =
        name;


    if (
        lowerName.endsWith("minor")
    ) {

        root =
            name.slice(
                0,
                -5
            );

    }

    else if (
        lowerName.endsWith("major")
    ) {

        root =
            name.slice(
                0,
                -5
            );

    }

    else if (
        lowerName.endsWith("min")
    ) {

        root =
            name.slice(
                0,
                -3
            );

    }

    else if (
        lowerName.endsWith("maj")
    ) {

        root =
            name.slice(
                0,
                -3
            );

    }

    else if (
        lowerName.endsWith("m")
    ) {

        root =
            name.slice(
                0,
                -1
            );

    }


    root =
        root.trim();


    // --------------------------------------------
    // BEMOL → SOSTINGUT INTERNAMENT
    // --------------------------------------------

    if (
        flatToSharp[root]
    ) {

        root =
            flatToSharp[root];

    }


    // --------------------------------------------
    // NORMALITZAR MAJÚSCULES
    // --------------------------------------------

    const noteNames = {

        c: "C",
        "c#": "C#",

        d: "D",
        "d#": "D#",

        e: "E",

        f: "F",
        "f#": "F#",

        g: "G",
        "g#": "G#",

        a: "A",
        "a#": "A#",

        b: "B"

    };


    const normalizedRoot =
        noteNames[
            root.toLowerCase()
        ];


    if (
        normalizedRoot
    ) {

        root =
            normalizedRoot;

    }


    return {

        root,

        type

    };

}


// ================================================
// GENERAR ESCALA
// ================================================

export function getScale(
    scaleName
) {

    const {
        root,
        type
    } =
        normalizeScaleName(
            scaleName
        );


    console.log(
        "Tonalitat normalitzada:",
        root,
        type
    );


    const rootIndex =
        chromaticNotes.indexOf(
            root
        );


    if (
        rootIndex === -1
    ) {

        console.error(
            `No reconec la tonalitat "${scaleName}".`
        );


        return [];

    }


    const intervals =

        type === "minor"

            ? minorIntervals

            : majorIntervals;


    const scale = [];


    // --------------------------------------------
    // DUES OCTAVES
    // --------------------------------------------

    for (
        let octave = 3;
        octave <= 4;
        octave++
    ) {

        for (
            const interval
            of intervals
        ) {

            const noteNumber =
                rootIndex +
                interval;


            const noteIndex =
                noteNumber %
                chromaticNotes.length;


            const octaveShift =
                Math.floor(
                    noteNumber /
                    chromaticNotes.length
                );


            const actualOctave =
                octave +
                octaveShift;


            const note =
                chromaticNotes[
                    noteIndex
                ];


            scale.push({

                note,

                octave:
                    actualOctave

            });

        }

    }


    console.log(
        "Escala generada:",
        scale
    );


    return scale;

}