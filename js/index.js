const html5QrCode = new Html5Qrcode("reader");
let isCameraRunning = false;

// ✅ Redirect to details page
function goToDetails(decodedText) {
    window.location.href = `details.html?id=${encodeURIComponent(decodedText)}`;
}

// ✅ Successful scan
function onScanSuccess(decodedText) {
    goToDetails(decodedText);
}

// ✅ Start camera
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

// ✅ Stop camera safely
async function stopCamera() {
    try {
        if (!isCameraRunning) return;

        await html5QrCode.stop();
        isCameraRunning = false;
    } catch (err) {
        console.error("Stop camera error:", err);
    }
}

// ✅ Upload QR image
document.getElementById("qr-input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        await stopCamera(); // stop live scanner first
        const decodedText = await html5QrCode.scanFile(file, true);
        goToDetails(decodedText);

    } catch (err) {
        console.error("Upload QR failed:", err);
        alert("QR code not detected. Please upload a clearer image.");
        startCamera(); // restart camera if failed
    }
});

// --- MANUAL ENTRY LOGIC ---
const scannerView = document.getElementById('scanner-view');
const manualView = document.getElementById('manual-view');
const showManualBtn = document.getElementById('show-manual-btn');
const backToScannerBtn = document.getElementById('back-to-scanner-btn');
const submitManualBtn = document.getElementById('submit-manual-btn');

// Switch to Manual Mode
showManualBtn.addEventListener('click', async () => {
    await stopCamera(); // Important: Frees up the device camera to save battery
    scannerView.style.display = 'none';
    manualView.style.display = 'block';
});

// Switch back to Scanner Mode
backToScannerBtn.addEventListener('click', () => {
    manualView.style.display = 'none';
    scannerView.style.display = 'block';
    startCamera(); // Turn the camera back on
});

// Handle Manual Submission
submitManualBtn.addEventListener('click', () => {
    const stallId = document.getElementById('stall-id').value.trim();

    if (!stallId) {
        alert("Please enter a valid Stall Number or ID.");
        return;
    }

    goToDetails(stallId); 
});

// ✅ Start scanner on page load
startCamera();