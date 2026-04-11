import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

async function loadWarnings() {
  const snapshot = await getDocs(collection(db, "inspections"));

  const warningList = document.getElementById("warning-list");
  let flaggedCount = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    const spoiledCuts = data.scanHistory?.filter(
      item => item.label.toLowerCase() === "spoiled"
    ) || [];

    if (spoiledCuts.length > 0) {
      flaggedCount++;

      const date = data.timestamp?.toDate().toLocaleDateString() || "-";

      const cutsHTML = spoiledCuts.map(cut => `
        <div class="cut-item">
          <span>${cut.cut}</span>
          <span class="badge">Spoiled</span>
        </div>
      `).join("");

      warningList.innerHTML += `
        <div class="warning-card">
          <div class="warning-header">
            <strong>${data.vendorName}</strong>
            <span>${date}</span>
          </div>
          <p>Stall ${data.stallNumber}</p>
          <small>Inspector: ${data.inspectorName}</small>

          <div class="cut-list">
            ${cutsHTML}
          </div>
        </div>
      `;
    }
  });

  document.getElementById("flagged-count").innerText = flaggedCount;

  if (flaggedCount === 0) {
    warningList.innerHTML = `
      <div class="warning-card">
        <strong>✅ No flagged sessions found</strong>
      </div>
    `;
  }
}

loadWarnings();