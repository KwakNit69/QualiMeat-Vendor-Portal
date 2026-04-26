class GlobalHeader extends HTMLElement {
    connectedCallback() {
        const backUrl = this.getAttribute('back-url');
        const backBtn = backUrl ? `<button class="back-btn" onclick="window.location.href='${backUrl}'">← Back</button>` : '';

        this.innerHTML = `
            <header class="app-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; border-bottom: 1px solid var(--border); background: var(--app-bar-bg); backdrop-filter: blur(10px);">
                <div class="brand" style="display: flex; align-items: center; gap: 15px;">
                    ${backBtn}
                    <div style="font-size: 1.5rem;">🥩</div>
                    <div>
                        <h2 style="margin:0; color: var(--primary); font-size: 1.4rem;">QualiMeat</h2>
                        <small style="color: var(--muted);">Vendor Verification</small>
                    </div>
                </div>
                <div class="live-indicator" style="display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 0.9rem;">
                    <span class="dot" style="width: 10px; height: 10px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 10px var(--primary);"></span>
                    Live Firestore
                    <button id="theme-toggle" class="theme-switch" style="background: rgba(128, 128, 128, 0.1); border: 1px solid var(--border); color: var(--text); cursor: pointer; padding: 6px 12px; border-radius: 8px; margin-left: 10px; transition: 0.2s;">🌙</button>
                </div>
            </header>
        `;

        const toggleBtn = this.querySelector('#theme-toggle');
        const htmlElement = document.documentElement;

        const currentTheme = htmlElement.getAttribute('data-theme');
        toggleBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

        toggleBtn.addEventListener('click', () => {
            const newTheme = htmlElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            toggleBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }
}
customElements.define('global-header', GlobalHeader);