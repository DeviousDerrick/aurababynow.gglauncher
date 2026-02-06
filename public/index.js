"use strict";

// Game URL mappings - simpler games with weaker detection
const GAME_URLS = {
    'roblox': 'https://now.gg/apps/a/19900/b.html',
    'paws-go': 'https://now.gg/apps/sofish-games/8826/paws-go.html',
    'stumble-guys': 'https://now.gg/apps/kitka-games/7999/stumble-guys.html',
    'hill-climb': 'https://now.gg/apps/fingersoft/8363/hill-climb-racing.html'
};

// Global variables
let scramjet = null;
let connection = null;
let isReady = false;

// Wait for BareMux to load
async function waitForBareMux() {
    // Try to load BareMux module
    try {
        const BareMuxModule = await import('/baremux/index.mjs');
        return BareMuxModule;
    } catch (err) {
        console.error('Failed to load BareMux module:', err);
        return null;
    }
}

// Initialize everything
async function initialize() {
    try {
        console.log('🔧 Initializing Scramjet + BareMux...');
        
        // 1. Initialize Scramjet first
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

        // 2. Load BareMux module
        const BareMuxModule = await waitForBareMux();
        
        if (BareMuxModule && BareMuxModule.BareMuxConnection) {
            // 3. Create BareMux connection
            connection = new BareMuxModule.BareMuxConnection("/baremux/worker.js");
            console.log('✅ BareMux connection created');
            
            // 4. Set up WISP transport
            const wispUrl = (location.protocol === "https:" ? "wss" : "ws") + "://" + location.host + "/wisp/";
            
            try {
                await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
                console.log('✅ Transport configured:', wispUrl);
            } catch (err) {
                console.warn('⚠️ Transport setup warning (continuing anyway):', err);
            }
        } else {
            console.warn('⚠️ BareMux not available, using pure Scramjet');
        }

        isReady = true;
        console.log('✅ System ready!');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        showStatus('Init failed: ' + error.message, 'error');
        // Set ready anyway - pure Scramjet might still work
        isReady = true;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Also add enter key support when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
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
    if (!statusEl) return;
    
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
        // Check if ready
        if (!isReady || !scramjet) {
            showStatus('Still initializing... wait 5 seconds', 'error');
            return;
        }

        showStatus('Registering service worker...', 'loading');

        // Register service worker
        try {
            await registerSW();
            console.log('✅ Service worker registered');
        } catch (err) {
            showStatus('Service worker failed!', 'error');
            console.error(err);
            return;
        }

        // Wait a bit for SW to activate
        await new Promise(resolve => setTimeout(resolve, 1000));

        showStatus('Launching game...', 'loading');

        // Add cache buster
        const gameUrl = new URL(targetUrl);
        gameUrl.searchParams.set('_cb', Date.now());

        // Encode URL with Scramjet
        const encodedUrl = scramjet.encodeUrl(gameUrl.toString());

        console.log('🎮 Loading game:', targetUrl);
        console.log('🔗 Encoded URL:', encodedUrl);

        // Small delay
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
