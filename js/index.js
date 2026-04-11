const html5QrCode = new Html5Qrcode("reader");
let isCameraRunning = false;

// ✅ redirect to details page
function goToDetails(decodedText) {
    window.location.href = `details.html?id=${encodeURIComponent(decodedText)}`;
}

// ✅ successful scan
function onScanSuccess(decodedText) {
    goToDetails(decodedText);
}

// ✅ start camera
async function startCamera() {
    try {
        if (isCameraRunning) return;

        await html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 15,
                qrbox: 250
            },
            onScanSuccess
        );

        isCameraRunning = true;
    } catch (err) {
        console.error("Camera failed:", err);
    }
}

// ✅ stop camera safely
async function stopCamera() {
    try {
        if (!isCameraRunning) return;

        await html5QrCode.stop();
        isCameraRunning = false;
    } catch (err) {
        console.error("Stop camera error:", err);
    }
}

// ✅ upload QR image
document.getElementById("qr-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        // stop live scanner first
        await stopCamera();

        const decodedText = await html5QrCode.scanFile(file, true);

        goToDetails(decodedText);

    } catch (err) {
        console.error("Upload QR failed:", err);
        alert("QR code not detected. Please upload a clearer image.");

        // restart camera if failed
        startCamera();
    }
});

// start scanner on page load
startCamera();