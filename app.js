import {
    HandLandmarker,
    FilesetResolver
} from "@mediapipe/tasks-vision";

const video = document.getElementById("video");
const status = document.getElementById("status");

let handLandmarker;


// --------------------------------------------------
// 1. CARREGAR MEDIAPIPE
// --------------------------------------------------

async function createHandLandmarker() {

    const vision = await FilesetResolver.forVisionTasks(
        "/wasm"
    );

    handLandmarker = await HandLandmarker.createFromOptions(
        vision,
        {
            baseOptions: {
                modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
            },

            runningMode: "VIDEO",

            numHands: 2
        }
    );

    console.log("MediaPipe preparat");
}


// --------------------------------------------------
// 2. ACTIVAR LA CÀMERA
// --------------------------------------------------

async function enableCamera() {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });

    video.srcObject = stream;

    video.addEventListener("loadeddata", () => {
        predictWebcam();
    });
}


// --------------------------------------------------
// 3. DETECTAR LES MANS
// --------------------------------------------------

function predictWebcam() {

    if (!handLandmarker) {
        return;
    }

    const results = handLandmarker.detectForVideo(
        video,
        performance.now()
    );

    if (results.landmarks.length > 0) {

        status.textContent =
            `Mans detectades: ${results.landmarks.length}`;

    } else {

        status.textContent =
            "No detecto cap mà";
    }

    requestAnimationFrame(predictWebcam);
}


// --------------------------------------------------
// 4. INICIAR EKHO
// --------------------------------------------------

async function startEkho() {

    try {

        status.textContent = "Carregant IA...";

        await createHandLandmarker();

        console.log("HandLandmarker carregat");

        status.textContent =
            "IA preparada. Activant càmera...";

        await enableCamera();

        status.textContent =
            "Càmera activa. Preparat per detectar mans!";

    } catch (error) {

        console.error("ERROR COMPLET:", error);

        status.textContent =
            "Hi ha hagut un error. Mira la consola.";
    }
}


// --------------------------------------------------
// 5. INICIAR
// --------------------------------------------------

startEkho();