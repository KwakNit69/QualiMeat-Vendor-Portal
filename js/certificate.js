import { db } from "./firebase-config.js";
import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadCertificate() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("id");

    if (!sessionId) return;

    const ref = doc(db, "inspections", sessionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return;

    const data = snap.data();

    document.getElementById("certInspector").textContent =
        data.inspectorName || "N/A";

    document.getElementById("certStall").textContent =
        data.stallNumber || "-";

    document.getElementById("certVendor").textContent =
        data.vendorName || "Unknown";

    document.getElementById("certDate").textContent =
        data.timestamp?.toDate().toLocaleDateString() || "-";

    let hasSpoiled = false;

    document.getElementById("certRows").innerHTML =
        data.scanHistory.map(scan => {
            if (scan.label === "Spoiled") hasSpoiled = true;

            return `
                <tr>
                    <td>${scan.cut}</td>
                    <td class="${scan.label.toLowerCase()}">
                        ${scan.label}
                    </td>
                </tr>
            `;
        }).join("");

    const note = document.getElementById("complianceNote");

    if (hasSpoiled) {
        note.innerHTML = `
            <div class="compliance-note warning">
                <strong>Compliance Notice:</strong><br>
                Any meat item marked as <strong>Spoiled</strong> must be
                <strong>condemned and disposed of immediately</strong>
                in accordance with food safety regulations.
            </div>
        `;
    } else {
        note.innerHTML = `
            <div class="compliance-note safe">
                <strong>Inspection Result:</strong><br>
                All inspected meat products passed freshness standards
                and are cleared for vendor display.
            </div>
        `;
    }
}



loadCertificate();