import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadDetails() {
    try {
        const params = new URLSearchParams(window.location.search);
        const qrData = decodeURIComponent(params.get("id") || "").trim();

        if (!qrData) {
            document.getElementById("cert-grid").innerHTML = `<p class="empty-msg">Invalid QR data.</p>`;
            return;
        }

        let stallNumber = qrData;
        if (qrData.includes(",")) stallNumber = qrData.split(",")[0].trim();
        const labeledMatch = qrData.match(/stall\s*:\s*([^,]+)/i);
        if (labeledMatch) stallNumber = labeledMatch[1].trim();

        // 1. GET STALL PROFILE
        const stallQuery = query(collection(db, "stalls"), where("stallNumber", "==", stallNumber));
        const stallSnap = await getDocs(stallQuery);

        if (stallSnap.empty) {
            document.getElementById("cert-grid").innerHTML = `<p class="empty-msg">Vendor stall not found.</p>`;
            return;
        }

        const stallData = stallSnap.docs[0].data();
        document.getElementById("stall-name").textContent = stallData.vendorName || "Unknown Vendor";
        document.getElementById("stall-owner").textContent = `Stall ${stallData.stallNumber}`;
        document.getElementById("stall-img").src = stallData.stallImageUrl || "https://via.placeholder.com/120";

        // 2. GET INSPECTION LOGS (LIVE AGGREGATION & SORTED BY DATE)
        const logsQuery = query(collection(db, "inspections"), where("stallNumber", "==", stallNumber));

        onSnapshot(logsQuery, (logsSnap) => {
            const certGrid = document.getElementById("cert-grid");

            if (logsSnap.empty) {
                certGrid.innerHTML = `<p class="empty-msg">No inspection logs found.</p>`;
                document.getElementById("totalSessions").textContent = 0;
                document.getElementById("flaggedSessions").textContent = 0;
                document.getElementById("warningBox").innerHTML = `
                    <div class="warning-box safe">
                        ✅ Safe Vendor Status<br>No spoiled sessions found in inspection history.
                    </div>`;
                return;
            }

            let flaggedCount = 0;
            let logsHTML = "";

            // 🔥 STEP 1: Put all logs into an array first so we can sort them
            let logsArray = [];
            logsSnap.forEach(doc => {
                logsArray.push({ id: doc.id, data: doc.data() });
            });

            // 🔥 STEP 2: Sort the array by date (Newest first)
            logsArray.sort((a, b) => {
                const timeA = a.data.timestamp ? a.data.timestamp.toDate().getTime() : 0;
                const timeB = b.data.timestamp ? b.data.timestamp.toDate().getTime() : 0;
                return timeB - timeA; // Descending order (Newest to Oldest)
            });

            // 🔥 STEP 3: Loop through the SORTED array to build the HTML
            logsArray.forEach(log => {
                const data = log.data;
                const sessionId = log.id;
                
                // Format the date for display to include the exact time
                const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
                const displayDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // DATA AGGREGATION: Group scans by cut type
                let aggregated = {};
                let hasSpoiled = false;
                
                let sessionEvidence = []; 

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

                        // Collect full evidence context
                        if (scan.imageUrl) {
                            sessionEvidence.push({
                                cut: scan.cut || "Unknown",
                                label: scan.label || "Unknown",
                                imageUrl: scan.imageUrl
                            });
                        }
                    });
                }

                // Temporary Mock Evidence (if database doesn't have URLs yet)
                if (sessionEvidence.length === 0) {
                    sessionEvidence = [
                        { cut: "Liempo", label: "SPOILED", imageUrl: "https://images.unsplash.com/photo-1602491453631-e2a56cb1d0f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" },
                        { cut: "Liempo", label: "FRESH", imageUrl: "https://images.unsplash.com/photo-1599921841143-819065a55cc6?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" }
                    ];
                }

                if (hasSpoiled) flaggedCount++;

                // Build the Aggregated Rows HTML
                let rowsHTML = "";
                for (const [cut, stats] of Object.entries(aggregated)) {
                    rowsHTML += `
                        <div class="aggregated-row">
                            <div class="meat-info">
                                <strong>🥩 ${cut}</strong>
                                <small>Total Scans: ${stats.total}</small>
                            </div>
                            <div class="results-group">
                                <span class="badge fresh">${stats.fresh} Fresh</span>
                                <span class="badge spoiled">${stats.spoiled} Spoiled</span>
                            </div>
                        </div>
                    `;
                }

                // Generate tiny thumbnails for the button preview
                const thumbHTML = sessionEvidence.slice(0, 3).map(item => `<img src="${item.imageUrl}" alt="thumb">`).join("");
                
                // Encode the full object array for the modal
                const evidenceJSON = encodeURIComponent(JSON.stringify(sessionEvidence));

                logsHTML += `
                    <div class="log-card" onclick="openCertificate('${sessionId}')">
                        <div class="log-header">
                            <div>
                                <h3 style="margin:0; font-size:1.1rem; color:var(--title-color);">DATE: ${displayDate}</h3>
                                <span style="font-size:0.85rem; color:var(--muted);">${data.scanHistory?.length || 0} Items Scanned</span>
                            </div>
                            <div style="text-align: right;">
                                <h3 style="margin:0; font-size:1.1rem; color:var(--title-color);">INSPECTOR</h3>
                                <span style="font-size:0.85rem; color:var(--muted);">${data.inspectorName || "N/A"}</span>
                            </div>
                        </div>
                        
                        ${rowsHTML}

                        <div class="card-footer">
                            <button class="evidence-btn" onclick="event.stopPropagation(); openEvidenceModal('${evidenceJSON}')">
                                <div class="thumbnails">${thumbHTML}</div>
                                View Evidence
                            </button>
                            <span style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">View Full Certificate ➔</span>
                        </div>
                    </div>
                `;
            });

            document.getElementById("totalSessions").textContent = logsArray.length;
            document.getElementById("flaggedSessions").textContent = flaggedCount;

            const warningBox = document.getElementById("warningBox");
            if (flaggedCount > 0) {
                warningBox.innerHTML = `
                    <div class="warning-box danger">
                        ⚠ Warning Status<br>${flaggedCount} flagged inspection session(s) detected.
                    </div>`;
            } else {
                warningBox.innerHTML = `
                    <div class="warning-box safe">
                        ✅ Safe Vendor Status<br>No spoiled sessions found in inspection history.
                    </div>`;
            }

            document.getElementById("cert-grid").innerHTML = logsHTML;

        }, (error) => {
            console.error("Real-time listener error:", error);
        });

    } catch (error) {
        console.error("LOAD DETAILS ERROR:", error);
        document.getElementById("cert-grid").innerHTML = `<p class="empty-msg">Failed to load vendor data.</p>`;
    }
}

// NAVIGATION
window.openCertificate = function(sessionId) {
    window.location.href = `certificate.html?id=${sessionId}`;
};

// 🔥 MODAL CONTROLS WITH TABLE GENERATION
window.openEvidenceModal = function(evidenceJSON) {
    const evidenceList = JSON.parse(decodeURIComponent(evidenceJSON));
    const tableBody = document.getElementById("evidenceTableBody");
    
    if (evidenceList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align:center; padding: 30px; color: var(--muted);">
                    No visual evidence captured for this session.
                </td>
            </tr>`;
    } else {
        tableBody.innerHTML = evidenceList.map(item => {
            // Check if label is FRESH to apply the correct styling badge
            const isFresh = item.label.toUpperCase() === "FRESH" || item.label.toUpperCase() === "HALF-FRESH";
            const badgeClass = isFresh ? "fresh" : "spoiled";
            
            return `
                <tr>
                    <td>
                        <img src="${item.imageUrl}" alt="Scan Evidence">
                    </td>
                    <td style="font-weight: 700; color: var(--title-color); font-size: 1.1rem;">
                        ${item.cut}
                    </td>
                    <td>
                        <span class="badge ${badgeClass}">${item.label}</span>
                    </td>
                </tr>
            `;
        }).join("");
    }

    document.getElementById("evidenceModal").classList.remove("hidden");
};

window.closeEvidenceModal = function() {
    document.getElementById("evidenceModal").classList.add("hidden");
};

loadDetails();