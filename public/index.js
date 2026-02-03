"use strict";

// Game URL mappings
const GAME_URLS = {
    'roblox': 'https://now.gg/apps/a/19900/b.html?ng_uaId=ua-5zzK1iQgEv2j0rxXNd0Kn&ng_uaSessionId=uasess-qq0CRsnhiHbsuiPRWpRDD&ng_visitId=visitid-oIz2ckXBdcHdafhK6PTRj&ng_ngReferrer=NA&ng_ngEntryPoint=https%253A%252F%252Fnow.gg%252F&ng_utmSource=&ng_utmMedium=&ng_utmCampaign=&ng_ntmSource=SearchResult&ng_userSource=organic&ng_userCampaign=&ng_userAcqVar=NA_2026_JAN_23_PST',
    'paws-go': 'https://now.gg/apps/sofish-games/8826/paws-go.html'
};

// Global variables
let scramjet;
let connection;
let isInitialized = false;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔧 Initializing proxy...');
        
        // Initialize Scramjet first
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

        // Wait for BareMux to load
        let attempts = 0;
        while (!window.BareMuxLoaded && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!window.BareMuxLoaded) {
            console.warn('⚠️ BareMux failed to load, continuing without it');
            isInitialized = true;
            return;
        }

        // Initialize BareMux connection
        try {
            connection = new window.BareMux.BareMuxConnection("/baremux/worker.js");
            console.log('✅ BareMux connection created');
        } catch (err) {
            console.warn('⚠️ BareMux connection failed:', err);
        }

        isInitialized = true;
        console.log('✅ All systems ready!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showStatus('Initialization failed: ' + error.message, 'error');
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
    statusEl.style.display = 'block';
    
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
        // Check if initialized
        if (!isInitialized || !scramjet) {
            showStatus('Still initializing... please wait 5 seconds', 'error');
            return;
        }

        showStatus('Registering service worker...', 'loading');

        // Register service worker
        try {
            await registerSW();
            console.log('✅ Service worker ready');
        } catch (err) {
            showStatus('Service worker failed!', 'error');
            console.error(err);
            return;
        }

        // Wait for service worker to be fully active
        await new Promise(resolve => setTimeout(resolve, 1000));

        showStatus('Setting up transport...', 'loading');

        // Set up transport only if connection exists
        if (connection) {
            try {
                const wispUrl =
                    (location.protocol === "https:" ? "wss" : "ws") +
                    "://" +
                    location.host +
                    "/wisp/";

                console.log('🔗 WISP URL:', wispUrl);

                // Check current transport
                const currentTransport = await connection.getTransport();
                console.log('📡 Current transport:', currentTransport);

                // Set transport if different
                if (currentTransport !== "/epoxy/index.mjs") {
                    await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                    console.log('✅ Transport set to Epoxy');
                }
            } catch (err) {
                console.warn('⚠️ Transport setup warning:', err);
                // Continue anyway
            }
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
