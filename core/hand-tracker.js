import {
    HandLandmarker,
    FilesetResolver
} from "@mediapipe/tasks-vision";


export async function createHandTracker() {

    const vision = await FilesetResolver.forVisionTasks(
        "/wasm"
    );

    const handLandmarker =
        await HandLandmarker.createFromOptions(
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

    return handLandmarker;
}


export function detectHands(handLandmarker, video) {

    return handLandmarker.detectForVideo(
        video,
        performance.now()
    );
}