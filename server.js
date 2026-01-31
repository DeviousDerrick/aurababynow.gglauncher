const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// 1. GLOBAL CORS MIDDLEWARE
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Use raw body parser for POST requests
app.use(express.raw({ type: '*/*', limit: '10mb' }));
app.use(express.static('public'));

// 2. HELPER FUNCTIONS
function encodeProxyUrl(url) {
  return Buffer.from(url).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeProxyUrl(encoded) {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (base64.length % 4)) % 4;
  return Buffer.from(base64 + '='.repeat(padding), 'base64').toString('utf-8');
}

// Enhanced header spoofing for now.gg
function getNowGGHeaders(req, targetUrl) {
  const targetUrlObj = new URL(targetUrl);
  const isNowGG = targetUrlObj.hostname.includes('now.gg');
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'identity',
    'Accept-Language': 'en-US,en;q=0.9',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  };

  // For now.gg specifically, spoof as direct browser navigation
  if (isNowGG) {
    headers['Referer'] = targetUrlObj.origin + '/';
    headers['Origin'] = targetUrlObj.origin;
    // Don't send suspicious headers that indicate proxy
    delete headers['X-Forwarded-For'];
    delete headers['X-Real-IP'];
    delete headers['Via'];
  }

  // Forward important headers
  if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'];
  
  // Only forward cookie if it's for the target domain
  if (req.headers.cookie && isNowGG) {
    headers['Cookie'] = req.headers.cookie;
  }

  return headers;
}

function rewriteHtml(html, baseUrl, proxyPrefix) {
  let rewritten = html;
  const origin = new URL(baseUrl).origin;
  const isNowGG = baseUrl.includes('now.gg');

  // Block Service Workers aggressively
  rewritten = rewritten.replace(/navigator\.serviceWorker/g, 'navigator.__blockedServiceWorker');
  rewritten = rewritten.replace(/'serviceWorker'/g, "'__blockedServiceWorker'");
  rewritten = rewritten.replace(/"serviceWorker"/g, '"__blockedServiceWorker"');

  // Strip ALL security-related meta tags
  rewritten = rewritten.replace(/<meta http-equiv="Content-Security-Policy".*?>/gi, '');
  rewritten = rewritten.replace(/<meta.*?name="referrer".*?>/gi, '');
  rewritten = rewritten.replace(/integrity="[^"]*"/gi, '');
  rewritten = rewritten.replace(/crossorigin="[^"]*"/gi, '');

  // Remove CORB-triggering attributes
  rewritten = rewritten.replace(/\s+crossorigin/gi, '');

  // NOW.GG SPECIFIC: Block their proxy detection scripts
  if (isNowGG) {
    // Block common proxy detection methods
    rewritten = rewritten.replace(/window\.RTCPeerConnection/g, 'window.__blockedRTC');
    rewritten = rewritten.replace(/navigator\.webdriver/g, 'false');
    rewritten = rewritten.replace(/Object\.getOwnPropertyDescriptor/g, 'Object.__safeGetOwnPropertyDescriptor');
  }

  // Rewrite Links
  rewritten = rewritten.replace(/(src|href)=["']([^"']+)["']/gi, (match, attr, url) => {
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#') || url.startsWith('javascript:')) return match;
    
    // Skip if already proxied
    if (url.includes('/ocho/')) return match;
    
    let absoluteUrl = url;
    try {
      if (url.startsWith('//')) absoluteUrl = 'https:' + url;
      else if (url.startsWith('/')) absoluteUrl = origin + url;
      else if (!url.startsWith('http')) {
        const baseUrlObj = new URL(baseUrl);
        const basePath = baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);
        absoluteUrl = baseUrlObj.origin + basePath + url;
      }
      
      const encoded = encodeProxyUrl(absoluteUrl);
      return `${attr}="${proxyPrefix}${encoded}"`;
    } catch (e) { 
      console.error('URL rewrite error:', e, url);
      return match; 
    }
  });

  // AGGRESSIVE proxy injection with now.gg anti-detection
  const proxyScript = `
    <script>
      (function() {
        const currentOrigin = window.location.origin;
        const targetOrigin = '${origin}';
        const inFlight = new Set();
        const isNowGG = '${isNowGG}' === 'true';
        
        console.log('[PROXY] Initializing for', targetOrigin);
        
        // NOW.GG ANTI-DETECTION: Spoof browser properties
        if (isNowGG) {
          // Make webdriver property non-detectable
          Object.defineProperty(navigator, 'webdriver', {
            get: () => false,
            configurable: true
          });
          
          // Spoof plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
          });
          
          // Spoof languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en']
          });
          
          // Block common fingerprinting
          const originalToString = Function.prototype.toString;
          Function.prototype.toString = function() {
            if (this === window.fetch || this === XMLHttpRequest.prototype.open) {
              return 'function() { [native code] }';
            }
            return originalToString.call(this);
          };
        }
        
        // KILL SERVICE WORKERS IMMEDIATELY
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(reg => {
              console.log('[PROXY] Unregistering SW:', reg.scope);
              reg.unregister();
            });
          });
          
          // Block future registrations
          delete navigator.serviceWorker;
          Object.defineProperty(navigator, 'serviceWorker', {
            get: () => { 
              console.warn('[PROXY] Service Worker blocked');
              return undefined; 
            },
            configurable: false
          });
        }
        
        // Override fetch BEFORE anything else loads
        const origFetch = window.fetch;
        window.fetch = function(url, opts) {
          let urlStr = typeof url === 'string' ? url : url.url;
          
          // Already proxied or special protocol
          if (urlStr.startsWith('/ocho/') || urlStr.startsWith('data:') || urlStr.startsWith('blob:')) {
            return origFetch(url, opts);
          }
          
          // Prevent loops
          if (inFlight.has(urlStr)) {
            console.warn('[PROXY] Loop prevented:', urlStr);
            return Promise.reject(new Error('Loop prevented'));
          }
          
          // Build full URL
          let fullUrl = urlStr;
          if (!urlStr.startsWith('http')) {
            fullUrl = urlStr.startsWith('/') ? targetOrigin + urlStr : targetOrigin + '/' + urlStr;
          }
          
          // Encode and proxy
          const encoded = btoa(fullUrl).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
          const proxied = currentOrigin + '/ocho/' + encoded;
          
          console.log('[PROXY] Fetch:', urlStr, '->', proxied);
          
          inFlight.add(urlStr);
          return origFetch(proxied, opts).finally(() => inFlight.delete(urlStr));
        };
        
        // Override XHR
        const origOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, ...args) {
          if (typeof url === 'string' && !url.startsWith('/ocho/') && !url.startsWith('data:') && !url.startsWith('blob:')) {
            let fullUrl = url;
            if (!url.startsWith('http')) {
              fullUrl = url.startsWith('/') ? targetOrigin + url : targetOrigin + '/' + url;
            }
            const encoded = btoa(fullUrl).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
            url = currentOrigin + '/ocho/' + encoded;
            console.log('[PROXY] XHR:', method, url);
          }
          return origOpen.call(this, method, url, ...args);
        };
        
        // Intercept link clicks
        document.addEventListener('click', function(e) {
          const link = e.target.closest('a');
          if (link && link.href) {
            const url = link.href;
            if (url.startsWith(targetOrigin) || (!url.startsWith(currentOrigin) && !url.startsWith('javascript:') && !url.startsWith('mailto:') && !url.startsWith('tel:') && !url.startsWith('#'))) {
              e.preventDefault();
              const fullUrl = url.startsWith('http') ? url : targetOrigin + url;
              const encoded = btoa(fullUrl).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=/g, '');
              window.location.href = currentOrigin + '/ocho/' + encoded;
            }
          }
        }, true);
        
        console.log('[PROXY] Initialization complete');
      })();
    </script>
  `;

  // Inject at VERY start of head
  rewritten = rewritten.replace(/<head[^>]*>/i, (match) => match + proxyScript);

  return rewritten;
}

// CORE PROXY LOGIC
async function doProxyRequest(targetUrl, req, res) {
  console.log(`Proxying: ${req.method} ${targetUrl}`);

  try {
    const headers = getNowGGHeaders(req, targetUrl);

    const fetchOptions = {
      method: req.method,
      headers: headers,
      redirect: 'follow',
      signal: AbortSignal.timeout(60000)
    };

    // Forward Body for POST/PUT
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Buffer.isBuffer(req.body)) {
      fetchOptions.body = req.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Get content length to check size
    const contentLength = parseInt(response.headers.get('content-length') || '0');
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB limit
    
    if (contentLength > MAX_SIZE) {
      console.warn(`Response too large: ${contentLength} bytes, streaming directly`);
      res.set('Content-Type', response.headers.get('content-type'));
      return response.body.pipe(res).on('finish', () => {
        if (response.body.destroy) response.body.destroy();
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const headersToSend = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': '*',
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; style-src * 'unsafe-inline';",
      'X-Frame-Options': 'ALLOWALL',
      'Content-Type': contentType
    };

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) headersToSend['set-cookie'] = setCookie;

    res.set(headersToSend);
    res.status(response.status);

    // Only rewrite HTML, stream everything else
    if (contentType.includes('text/html') && contentLength < 5 * 1024 * 1024) {
      const text = await response.text();
      const rewritten = rewriteHtml(text, targetUrl, '/ocho/');
      const final = rewritten.toLowerCase().trim().startsWith('<!doctype') 
        ? rewritten 
        : '<!DOCTYPE html>\n' + rewritten;
      res.send(final);
    } else {
      // Stream everything else
      const stream = response.body.pipe(res);
      
      stream.on('finish', () => {
        if (response.body.destroy) response.body.destroy();
      });
      
      stream.on('error', (err) => {
        console.error('Stream error:', err.message);
        if (response.body.destroy) response.body.destroy();
        if (!res.headersSent) res.status(500).end();
      });
      
      req.on('close', () => {
        console.log('Client disconnected, aborting stream');
        if (response.body.destroy) response.body.destroy();
      });
    }
  } catch (error) {
    console.error(`Proxy Fail: ${targetUrl} - ${error.message}`);
    
    if (error.name === 'AbortError' || error.message.includes('aborted')) {
      console.log('Request timeout or aborted');
      if (!res.headersSent) {
        res.status(504).json({ 
          error: 'Request timeout', 
          message: 'The target server took too long to respond.' 
        });
      }
    } else if (error.code === 'ECONNREFUSED') {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Connection refused', message: 'Could not connect to target server' });
      }
    } else {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Proxy error', message: error.message });
      }
    }
  } finally {
    if (global.gc) {
      global.gc();
    }
  }
}

// Service Worker
app.get('/sw.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
    self.addEventListener('fetch', (event) => {
      const url = new URL(event.request.url);
      if (url.pathname === '/' || url.pathname === '/sw.js' || url.pathname.startsWith('/api/')) return;
      if (url.pathname.startsWith('/ocho/')) return;
      
      event.respondWith(
        clients.get(event.clientId).then(client => {
          if (!client) return fetch(event.request);
          
          const clientUrl = new URL(client.url);
          if (clientUrl.pathname.startsWith('/ocho/')) {
            const encodedPart = clientUrl.pathname.split('/ocho/')[1];
            return fetch(event.request);
          }
          return fetch(event.request);
        })
      );
    });
  `);
});

// API ENCODER
app.get('/api/encode', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const fullUrl = url.startsWith('http') ? url : 'https://' + url;
  res.json({ encoded: encodeProxyUrl(fullUrl), proxyUrl: `/ocho/${encodeProxyUrl(fullUrl)}` });
});

// ROOT ROUTE - Serve the launcher
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const fs = require('fs');
  
  // Try to serve from public directory first
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  
  // Fallback: serve inline HTML if public directory doesn't exist
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>now.gg Launcher</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .launcher-container {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .logo { text-align: center; margin-bottom: 30px; }
        .logo h1 {
            font-size: 2.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .logo p { color: #666; font-size: 0.9rem; }
        .game-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
        .game-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            color: white;
            border: none;
            font-size: 1rem;
            font-weight: 600;
        }
        .game-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4); }
        .game-card:active { transform: translateY(-2px); }
        .game-icon { font-size: 2rem; margin-bottom: 10px; }
        .custom-url { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
        .custom-url h3 { color: #333; font-size: 1rem; margin-bottom: 15px; }
        .url-input-group { display: flex; gap: 10px; }
        #customUrlInput {
            flex: 1;
            padding: 12px 15px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }
        #customUrlInput:focus { border-color: #667eea; }
        #customGoBtn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: opacity 0.2s;
        }
        #customGoBtn:hover { opacity: 0.9; }
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            display: none;
            font-size: 0.9rem;
        }
        .status.loading { background: #fff3cd; color: #856404; display: block; }
        .status.success { background: #d4edda; color: #155724; display: block; }
        .status.error { background: #f8d7da; color: #721c24; display: block; }
        .spinner {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            border-top-color: #856404;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .info {
            margin-top: 20px;
            padding: 15px;
            background: #e7f3ff;
            border-left: 4px solid #667eea;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #004085;
        }
    </style>
</head>
<body>
    <div class="launcher-container">
        <div class="logo">
            <h1>now.gg</h1>
            <p>Cloud Gaming Launcher</p>
        </div>
        <div class="game-grid">
            <button class="game-card" onclick="launchGame('roblox')">
                <div class="game-icon">🎮</div>
                <div>Roblox</div>
            </button>
            <button class="game-card" onclick="launchGame('minecraft')">
                <div class="game-icon">⛏️</div>
                <div>Minecraft</div>
            </button>
            <button class="game-card" onclick="launchGame('among-us')">
                <div class="game-icon">🚀</div>
                <div>Among Us</div>
            </button>
            <button class="game-card" onclick="launchGame('cookie-run')">
                <div class="game-icon">🍪</div>
                <div>Cookie Run</div>
            </button>
        </div>
        <div class="custom-url">
            <h3>Or enter any now.gg URL:</h3>
            <div class="url-input-group">
                <input type="text" id="customUrlInput" placeholder="now.gg/play/roblox-corporation/5349/roblox" autocomplete="off">
                <button id="customGoBtn" onclick="launchCustomUrl()">Launch</button>
            </div>
        </div>
        <div class="status" id="statusMsg"></div>
        <div class="info">💡 <strong>Tip:</strong> This launcher bypasses now.gg's proxy detection using advanced request spoofing.</div>
    </div>
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
        }
        const GAME_URLS = {
            'roblox': 'https://now.gg/apps/roblox-corporation/5349/roblox.html',
            'minecraft': 'https://now.gg/apps/mojang/2476/minecraft.html',
            'among-us': 'https://now.gg/apps/innersloth-llc/4047/among-us.html',
            'cookie-run': 'https://now.gg/apps/devsisters-corporation/3475/cookie-run.html'
        };
        function showStatus(message, type) {
            const statusEl = document.getElementById('statusMsg');
            statusEl.className = \`status \${type}\`;
            if (type === 'loading') {
                statusEl.innerHTML = \`<span class="spinner"></span>\${message}\`;
            } else {
                statusEl.textContent = message;
            }
            if (type !== 'loading') {
                setTimeout(() => statusEl.style.display = 'none', 5000);
            }
        }
        async function launchGame(gameKey) {
            const url = GAME_URLS[gameKey];
            if (!url) { showStatus('Game not found!', 'error'); return; }
            await launchNowGG(url);
        }
        async function launchCustomUrl() {
            const input = document.getElementById('customUrlInput');
            let url = input.value.trim();
            if (!url) { showStatus('Please enter a URL!', 'error'); return; }
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            if (!url.includes('now.gg')) { showStatus('Please enter a valid now.gg URL!', 'error'); return; }
            await launchNowGG(url);
        }
        async function launchNowGG(targetUrl) {
            try {
                showStatus('Initializing bypass...', 'loading');
                const bypassUrl = new URL(targetUrl);
                bypassUrl.searchParams.set('_cb', Date.now());
                const response = await fetch(\`/api/encode?url=\${encodeURIComponent(bypassUrl.toString())}\`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                showStatus('Launching game...', 'loading');
                await new Promise(resolve => setTimeout(resolve, 500));
                window.location.href = data.proxyUrl;
            } catch (error) {
                console.error('Launch error:', error);
                showStatus(\`Error: \${error.message}\`, 'error');
            }
        }
        document.getElementById('customUrlInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') launchCustomUrl();
        });
    </script>
</body>
</html>`);
});

// MAIN ROUTE
app.use('/ocho/:url(*)', (req, res) => {
  const encodedUrl = req.params.url;
  try {
    let targetUrl = decodeProxyUrl(encodedUrl);
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    if (queryString) targetUrl += queryString;
    
    doProxyRequest(targetUrl, req, res);
  } catch (e) {
    res.status(400).send('Invalid URL');
  }
});

// ENHANCED CATCH-ALL - Only for leaked requests, not for root or static files
app.all('*', (req, res) => {
  // Don't catch root path or common static file paths
  if (req.path === '/' || 
      req.path === '/index.html' || 
      req.path.startsWith('/favicon') ||
      req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$/)) {
    return res.status(404).send('Not Found');
  }

  const referer = req.headers.referer;
  
  console.log(`Catch-all hit: ${req.method} ${req.url}`);
  console.log(`Referer: ${referer}`);
  
  if (referer) {
    try {
      let targetOrigin = null;
      
      if (referer.includes('/ocho/')) {
        const refPath = new URL(referer).pathname;
        const parts = refPath.split('/ocho/');
        if (parts.length > 1) {
          const encodedPart = parts[1].split('/')[0].split('?')[0];
          targetOrigin = new URL(decodeProxyUrl(encodedPart)).origin;
        }
      }
      
      if (targetOrigin) {
        const fixedUrl = targetOrigin + req.url;
        console.log(`✓ Catch-all proxying: ${req.url} -> ${fixedUrl}`);
        return doProxyRequest(fixedUrl, req, res);
      }
    } catch (e) {
      console.error('Catch-all parsing error:', e.message);
    }
  }
  
  console.log(`✗ 404 Not Found: ${req.url}`);
  res.status(404).json({ 
    error: 'Not Found', 
    path: req.url,
    hint: 'This request could not be proxied.'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`now.gg Launcher Server on 0.0.0.0:${PORT}`);
});
