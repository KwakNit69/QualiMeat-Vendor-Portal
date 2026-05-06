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

    // Populate Metadata
    document.getElementById("certInspector").textContent = data.inspectorName || "N/A";
    document.getElementById("certStall").textContent = data.stallNumber || "-";
    document.getElementById("certVendor").textContent = data.vendorName || "Unknown";
    
    // Format Date
    const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
    document.getElementById("certDate").textContent = dateObj.toLocaleDateString();

    let hasSpoiled = false;
    let aggregated = {};

    // 🔥 CENSUS LOGIC: Group scans by cut type
    if (data.scanHistory) {
        data.scanHistory.forEach(scan => {
            const cut = scan.cut || "Unknown Cut";
            if (!aggregated[cut]) {
                aggregated[cut] = { total: 0, fresh: 0, spoiled: 0 };
            }
            
            aggregated[cut].total++;
            
            if (scan.label === "SPOILED") {
                aggregated[cut].spoiled++;
                hasSpoiled = true;
            } else {
                aggregated[cut].fresh++;
            }
        });
    }

    // Build the summary table rows
    let rowsHTML = "";
    for (const [cut, stats] of Object.entries(aggregated)) {
        rowsHTML += `
            <tr>
                <td style="font-weight: bold;">${cut}</td>
                <td>${stats.total}</td>
                <td class="fresh">${stats.fresh}</td>
                <td class="spoiled">${stats.spoiled}</td>
            </tr>
        `;
    }

    // Fallback if no scans
    if (rowsHTML === "") {
        rowsHTML = `<tr><td colspan="4">No items scanned.</td></tr>`;
    }

    document.getElementById("certRows").innerHTML = rowsHTML;

    // Compliance Note
    const note = document.getElementById("complianceNote");
    if (hasSpoiled) {
        note.innerHTML = `
            <div class="compliance-note warning">
                <strong>Notice of Condemnation:</strong><br>
                Spoiled meat items detected during this inspection must be immediately removed 
                from the display and disposed of according to standard sanitary protocols.
            </div>
        `;
    } else {
        note.innerHTML = `
            <div class="compliance-note safe">
                <strong>Clearance:</strong><br>
                All inspected items passed visual quality parameters and are cleared for retail display.
            </div>
        `;
    }
}

loadCertificate();