export async function startCamera(video) {

    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });

    video.srcObject = stream;

    await new Promise((resolve) => {
        video.addEventListener("loadeddata", resolve, {
            once: true
        });
    });

    return video;
}