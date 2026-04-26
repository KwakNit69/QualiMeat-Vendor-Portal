const html5QrCode = new Html5Qrcode("reader");

// Success Function
const onScanSuccess = (decodedText) => {
    // encodeURIComponent handles the commas in your "Stall: 789, Vendor" format
    window.location.href = `details.html?id=${encodeURIComponent(decodedText)}`;
};

// Start Camera on Page Load
const startCamera = () => {
    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 15, qrbox: 250 },
        onScanSuccess
    ).catch(err => console.error("Camera error:", err));
};

startCamera();

// --- THE FIX FOR UPLOAD ---
document.getElementById('qr-input').addEventListener('change', async (e) => {
    if (e.target.files.length == 0) return;
    const imageFile = e.target.files[0];

    try {
        // 1. CHECK STATE: If camera is on, we MUST stop it first
        const state = html5QrCode.getState();
        if (state === 2 || state === 3) { // 2 = Scanning, 3 = Paused
            await html5QrCode.stop();
        }

        // 2. SCAN THE FILE
        const decodedText = await html5QrCode.scanFile(imageFile, true);
        
        // 3. REDIRECT ON SUCCESS
        onScanSuccess(decodedText);

    } catch (err) {
        console.error("Upload failed:", err);
        alert("QR Code not found in image. Please try a clearer photo.");
        
        // 4. RESTART CAMERA if the user wants to try scanning again
        startCamera();
    }
});