import { startCamera } from "./core/camera.js";
import {
    createHandTracker,
    detectHands
} from "./core/hand-tracker.js";


const video = document.getElementById("video");
const status = document.getElementById("status");


async function startEkho() {

    try {

        status.textContent = "Carregant IA...";

        // ------------------------------------------
        // CARREGAR DETECTOR DE MANS
        // ------------------------------------------

        const handTracker =
            await createHandTracker();

        status.textContent =
            "IA preparada. Activant càmera...";


        // ------------------------------------------
        // ACTIVAR CÀMERA
        // ------------------------------------------

        await startCamera(video);


        status.textContent =
            "Càmera activa. Buscant mans...";


        // ------------------------------------------
        // DETECTAR MANS
        // ------------------------------------------

        detectLoop(handTracker);

    } catch (error) {

        console.error(
            "ERROR COMPLET:",
            error
        );

        status.textContent =
            "Hi ha hagut un error. Mira la consola.";
    }
}


function detectLoop(handTracker) {

    const results =
        detectHands(handTracker, video);


    if (results.landmarks.length > 0) {

        status.textContent =
            `Mans detectades: ${results.landmarks.length}`;

    } else {

        status.textContent =
            "No detecto cap mà";
    }


    requestAnimationFrame(() => {
        detectLoop(handTracker);
    });
}


startEkho();