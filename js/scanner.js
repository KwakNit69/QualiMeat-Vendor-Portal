const html5QrCode = new Html5Qrcode("reader");

const onScanSuccess = (decodedText) => {
    window.location.href =
        `details.html?id=${encodeURIComponent(decodedText)}`;
};

const startCamera = () => {
    html5QrCode.start(
        { facingMode: "environment" },
        { fps: 15, qrbox: 250 },
        onScanSuccess
    ).catch(err => console.error("Camera error:", err));
};

startCamera();

document.getElementById("qr-input")
.addEventListener("change", async (e) => {
    if (e.target.files.length === 0) return;

    const imageFile = e.target.files[0];

    try {
        const state = html5QrCode.getState();

        if (state === 2 || state === 3) {
            await html5QrCode.stop();
        }

        const decodedText =
            await html5QrCode.scanFile(imageFile, true);

        onScanSuccess(decodedText);

    } catch (err) {
        console.error("Upload failed:", err);
        alert("QR Code not found in image.");
        startCamera();
    }
});