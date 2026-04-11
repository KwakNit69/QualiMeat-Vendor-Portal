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

    document.getElementById("certRows").innerHTML =
        data.scanHistory.map(scan => `
            <tr>
                <td>${scan.cut}</td>
                <td class="${scan.label.toLowerCase()}">${scan.label}</td>
            </tr>
        `).join("");
}

loadCertificate();