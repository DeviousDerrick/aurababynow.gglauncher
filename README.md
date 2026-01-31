# now.gg Launcher with Project Ocho Proxy

A sophisticated cloud gaming launcher that bypasses now.gg's proxy detection using advanced request spoofing and the Project Ocho proxy system.

## 🎮 Features

- **Proxy Detection Bypass**: Advanced header manipulation and fingerprint spoofing to evade now.gg's anti-proxy measures
- **One-Click Game Launch**: Pre-configured buttons for popular games (Roblox, Minecraft, Among Us, Free Fire)
- **Custom URL Support**: Launch any now.gg game via direct URL input
- **Service Worker Blocking**: Prevents site-level service workers from interfering with proxy
- **WebRTC & Fingerprint Spoofing**: Blocks common proxy detection methods
- **Smart URL Rewriting**: Automatically proxies all requests through the Project Ocho system

## 🚀 How It Works

### Bypass Techniques

1. **Header Spoofing**: 
   - Mimics legitimate browser headers (User-Agent, Accept, Sec-Fetch-*)
   - Removes proxy-revealing headers (X-Forwarded-For, Via, X-Real-IP)
   - Sets proper Origin and Referer headers for now.gg

2. **Browser Fingerprint Spoofing**:
   - Overrides `navigator.webdriver` to return `false`
   - Spoofs plugins, languages, and other detectable properties
   - Makes native function overrides invisible via `Function.toString()` hijacking

3. **Service Worker Elimination**:
   - Immediately unregisters all service workers on page load
   - Blocks future service worker registrations
   - Prevents now.gg from using service workers for proxy detection

4. **Request Interception**:
   - Overrides `fetch()` and `XMLHttpRequest` globally
   - Automatically proxies all external requests through Project Ocho
   - Handles link clicks and redirects them through the proxy

## 📁 File Structure

```
├── server.js              # Enhanced Express server with now.gg bypass
├── nowgg-launcher.html    # Launcher interface
├── sw.js                  # Service worker for leak detection
└── README.md             # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. **Install dependencies**:
```bash
npm install express node-fetch
```

2. **Create the public directory**:
```bash
mkdir public
```

3. **Move the launcher to public**:
```bash
mv nowgg-launcher.html public/index.html
```

4. **Place sw.js in public**:
```bash
mv sw.js public/sw.js
```

5. **Start the server**:
```bash
node server.js
```

The server will start on port 8080 by default. Access it at: `http://localhost:8080`

### Production Deployment

For production, set the `PORT` environment variable:

```bash
PORT=3000 node server.js
```

Or use a process manager like PM2:

```bash
npm install -g pm2
pm2 start server.js --name "nowgg-launcher"
```

## 🎯 Usage

### Quick Launch

1. Open the launcher in your browser
2. Click on any of the pre-configured game buttons:
   - 🎮 Roblox
   - ⛏️ Minecraft
   - 🚀 Among Us
   - 🔥 Free Fire

### Custom URL

1. Enter any now.gg URL in the input field:
   ```
   now.gg/play/roblox-corporation/5349/roblox
   ```
2. Click "Launch"

The launcher will automatically:
- Add `https://` if missing
- Validate the URL is a now.gg domain
- Encode the URL through Project Ocho
- Apply all bypass techniques
- Navigate to the proxied game

## 🔧 Technical Details

### Proxy URL Encoding

URLs are encoded using URL-safe Base64:
```javascript
// Original URL
https://now.gg/play/roblox-corporation/5349/roblox

// Becomes
/ocho/aHR0cHM6Ly9ub3cuZ2cvcGxheS9yb2Jsb3gtY29ycG9yYXRpb24vNTM0OS9yb2Jsb3g
```

### Detection Bypass Flow

```
User clicks game
    ↓
Add cache buster parameter
    ↓
Encode through /api/encode
    ↓
Navigate to /ocho/[base64-url]
    ↓
Server fetches with spoofed headers
    ↓
HTML rewriting injects bypass scripts
    ↓
Client-side fetch/XHR overrides activate
    ↓
All subsequent requests auto-proxied
    ↓
Game loads successfully! 🎉
```

### Security Considerations

- The proxy removes CSP headers to allow script injection
- Service workers are forcibly blocked to prevent detection
- All requests are CORS-enabled
- Cookies are forwarded only for target domain

## 🐛 Troubleshooting

### Game won't load
- Check browser console for errors
- Try refreshing the page
- Some games may have additional anti-proxy measures

### Blank screen
- Ensure all three files are properly set up
- Check that port 8080 is not in use
- Verify Node.js version is 14+

### Service worker errors
- Clear browser cache and service workers
- Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- Try incognito/private mode

## 📝 Advanced Configuration

### Custom Port
Edit `server.js` line 7:
```javascript
const PORT = process.env.PORT || 8080; // Change 8080 to your port
```

### Timeout Adjustment
Edit `server.js` line 238:
```javascript
signal: AbortSignal.timeout(60000) // 60 seconds
```

### Add More Games
Edit `nowgg-launcher.html` around line 120:
```javascript
const GAME_URLS = {
    'roblox': 'https://now.gg/play/roblox-corporation/5349/roblox',
    'your-game': 'https://now.gg/apps/...',  // Add here
};
```

Then add a button in the HTML grid section.

## ⚠️ Disclaimer

This tool is for educational purposes. Use responsibly and in accordance with now.gg's terms of service. The developers are not responsible for any misuse of this software.

## 🤝 Credits

- **Project Ocho**: Base proxy system
- **Bypass Techniques**: Community research and testing
- **UI Design**: Modern minimalist aesthetic

## 📄 License

MIT License - feel free to modify and distribute!

---

**Made with ❤️ for unblocked gaming**
