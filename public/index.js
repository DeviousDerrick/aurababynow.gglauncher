"use strict";

// Game URL mappings
const GAME_URLS = {
    'roblox': 'https://now.gg/apps/a/19900/b.html?ng_uaId=ua-5zzK1iQgEv2j0rxXNd0Kn&ng_uaSessionId=uasess-qq0CRsnhiHbsuiPRWpRDD&ng_visitId=visitid-oIz2ckXBdcHdafhK6PTRj&ng_ngReferrer=NA&ng_ngEntryPoint=https%253A%252F%252Fnow.gg%252F&ng_utmSource=&ng_utmMedium=&ng_utmCampaign=&ng_ntmSource=SearchResult&ng_userSource=organic&ng_userCampaign=&ng_userAcqVar=NA_2026_JAN_23_PST',
    'paws-go': 'https://now.gg/apps/sofish-games/8826/paws-go.html'
};

// Global variables
let scramjet;
let connection;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize Scramjet
        const { ScramjetController } = $scramjetLoadController();
        scramjet = new ScramjetController({
            files: {
                wasm: '/scram/scramjet.wasm.wasm',
                all: '/scram/scramjet.all.js',
                sync: '/scram/scramjet.sync.js',
            },
        });

        await scramjet.init();
        console.log('✅ Scramjet initialized');

        // Initialize BareMux connection
        connection = new BareMux.BareMuxConnection("/baremux/worker.js");
        console.log('✅ BareMux connection created');

    } catch (error) {
        console.error('❌ Initialization error:', error);
    }

    // Enter key support
    const input = document.getElementById('sj-address');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                launchCustomUrl();
            }
        });
    }
});

function showStatus(message, type) {
    const statusEl = document.getElementById('statusMsg');
    statusEl.className = `status ${type}`;
    
    if (type === 'loading') {
        statusEl.innerHTML = `<span class="spinner"></span>${message}`;
    } else {
        statusEl.textContent = message;
    }

    if (type !== 'loading') {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    }
}

async function launchGame(gameKey) {
    const url = GAME_URLS[gameKey];
    if (!url) {
        showStatus('Game not found!', 'error');
        return;
    }

    await launchNowGG(url);
}

async function launchCustomUrl() {
    const input = document.getElementById('sj-address');
    let url = input.value.trim();
    
    if (!url) {
        showStatus('Please enter a URL!', 'error');
        return;
    }

    // Auto-add https:// if not present
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Validate it's a now.gg URL
    if (!url.includes('now.gg')) {
        showStatus('Please enter a valid now.gg URL!', 'error');
        return;
    }

    await launchNowGG(url);
}

async function launchNowGG(targetUrl) {
    try {
        if (!scramjet || !connection) {
            showStatus('Still initializing... please wait', 'error');
            return;
        }

        showStatus('Registering service worker...', 'loading');

        // Register service worker
        try {
            await registerSW();
        } catch (err) {
            showStatus('Failed to register service worker!', 'error');
            console.error(err);
            return;
        }

        showStatus('Setting up transport...', 'loading');

        // Get WISP URL
        const wispUrl =
            (location.protocol === "https:" ? "wss" : "ws") +
            "://" +
            location.host +
            "/wisp/";

        // Set up Epoxy transport with WISP
        try {
            if ((await connection.getTransport()) !== "/epoxy/index.mjs") {
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
            }
        } catch (err) {
            console.warn('Transport setup warning:', err);
            // Continue anyway - might work
        }

        showStatus('Launching game...', 'loading');

        // Add cache buster
        const gameUrl = new URL(targetUrl);
        gameUrl.searchParams.set('_cb', Date.now());

        // Encode URL with Scramjet
        const encodedUrl = scramjet.encodeUrl(gameUrl.toString());

        console.log('🎮 Loading game:', targetUrl);
        console.log('🔗 Encoded URL:', encodedUrl);

        // Small delay for effect
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show iframe and load game
        const frame = document.getElementById('sj-frame');
        const launcher = document.getElementById('launcher');
        
        frame.src = encodedUrl;
        frame.style.display = 'block';
        launcher.classList.add('hidden');

        console.log('✅ Game launched!');

    } catch (error) {
        console.error('❌ Launch error:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}
