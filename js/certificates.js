import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadDetails() {
    try {
        const params = new URLSearchParams(window.location.search);
        const qrData = decodeURIComponent(params.get("id") || "").trim();

        if (!qrData) {
            document.getElementById("cert-grid").innerHTML =
                `<p class="empty-msg">Invalid QR data.</p>`;
            return;
        }

        let stallNumber = qrData;

        // ✅ supports "143,Vendor Name"
        if (qrData.includes(",")) {
            stallNumber = qrData.split(",")[0].trim();
        }

        // ✅ supports "Stall: 143"
        const labeledMatch = qrData.match(/stall\s*:\s*([^,]+)/i);
        if (labeledMatch) {
            stallNumber = labeledMatch[1].trim();
        }

        // =========================
        // GET STALL PROFILE
        // =========================
        const stallQuery = query(
            collection(db, "stalls"),
            where("stallNumber", "==", stallNumber)
        );

        const stallSnap = await getDocs(stallQuery);

        if (stallSnap.empty) {
            document.getElementById("cert-grid").innerHTML =
                `<p class="empty-msg">Vendor stall not found.</p>`;
            return;
        }

        const stallData = stallSnap.docs[0].data();

        document.getElementById("stall-name").textContent =
            stallData.vendorName || "Unknown Vendor";

        document.getElementById("stall-owner").textContent =
            `Stall ${stallData.stallNumber}`;

        document.getElementById("stall-img").src =
            stallData.stallImageUrl || "";

        // =========================
        // GET INSPECTION LOGS
        // =========================
        const logsQuery = query(
            collection(db, "inspections"),
            where("stallNumber", "==", stallNumber)
        );

        const logsSnap = await getDocs(logsQuery);
        const certGrid = document.getElementById("cert-grid");

        if (logsSnap.empty) {
            certGrid.innerHTML =
                `<p class="empty-msg">No inspection logs found.</p>`;

            document.getElementById("totalSessions").textContent = 0;
            document.getElementById("flaggedSessions").textContent = 0;

            return;
        }

        let logsHTML = "";
        let flaggedCount = 0;
        const totalSessions = logsSnap.size;

        logsSnap.forEach(doc => {
            const data = doc.data();
            const sessionId = doc.id;

            const date =
                data.timestamp?.toDate().toLocaleDateString() || "Unknown";

            let rows = "";
            let hasSpoiled = false;

            if (data.scanHistory) {
                data.scanHistory.forEach(scan => {
                    if (scan.label === "Spoiled") {
                        hasSpoiled = true;
                    }

                    rows += `
                        <div class="meat-row">
                            <span>${scan.cut}</span>
                            <span class="status-badge ${scan.label.toLowerCase()}">
                                ${scan.label}
                            </span>
                        </div>
                    `;
                });
            }

            if (hasSpoiled) flaggedCount++;

            logsHTML += `
                <div class="log-card"
                     onclick="openCertificate('${sessionId}')">
                    <div class="card-top">
                        <div>
                            <span class="label">DATE</span>
                            <span class="val">${date}</span>
                        </div>
                        <div>
                            <span class="label">INSPECTOR</span>
                            <span class="val">${data.inspectorName || "N/A"}</span>
                        </div>
                    </div>
                    ${rows}
                </div>
            `;
        });

        // =========================
        // UPDATE COUNTS
        // =========================
        document.getElementById("totalSessions").textContent =
            totalSessions;

        document.getElementById("flaggedSessions").textContent =
            flaggedCount;

        // =========================
        // WARNING BOX
        // =========================
        const warningBox = document.getElementById("warningBox");

        if (flaggedCount > 0) {
            warningBox.innerHTML = `
                <div class="warning-box">
                    ⚠ Warning Status<br>
                    ${flaggedCount} flagged inspection session(s) detected.
                </div>
            `;
        } else {
            warningBox.innerHTML = `
                <div class="warning-box" style="border-color:#00E676;color:#86efac;background:rgba(0,230,118,0.08)">
                    ✅ Safe Vendor Status<br>
                    No spoiled sessions found in inspection history.
                </div>
            `;
        }

        certGrid.innerHTML = logsHTML;

    } catch (error) {
        console.error("LOAD DETAILS ERROR:", error);

        document.getElementById("cert-grid").innerHTML =
            `<p class="empty-msg">Failed to load vendor data.</p>`;
    }
}

window.openCertificate = function(sessionId) {
    window.location.href = `certificate.html?id=${sessionId}`;
};

loadDetails();