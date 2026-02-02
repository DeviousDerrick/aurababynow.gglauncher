# now.gg Launcher - Scramjet Edition 🚀

**The STRONGEST proxy-based now.gg launcher using Scramjet!**

## 🔥 Why Scramjet?

Scramjet is **10x more powerful** than Project Ocho:

✅ Service Worker based (intercepts ALL requests)  
✅ WISP WebSocket protocol (faster & more reliable)  
✅ Advanced URL encoding (harder to detect)  
✅ Active development by Mercury Workshop  
✅ Better bypass for now.gg's detection  

---

## 🚀 Quick Deploy to Render

### Step 1: Upload to GitHub

Create a new repo and upload these files:
- `server.js`
- `package.json`
- `public/` folder (with all HTML/JS files)

### Step 2: Deploy on Render

1. Go to **render.com**
2. Click **"New +" → "Web Service"**
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **"Create Web Service"**

### Step 3: Done!

Visit: `https://your-app-name.onrender.com`

---

## 🎮 How to Use

1. **Click a game button** (Roblox, Minecraft, Among Us, Cookie Run)
2. **Or enter custom URL** in the input field
3. **Wait 30-60 seconds** for game to load
4. **Play!** 🎉

---

## 📁 File Structure

```
your-repo/
├── server.js              # Fastify server with WISP
├── package.json           # Scramjet dependencies
└── public/
    ├── index.html         # Launcher interface
    ├── index.js           # Game launching logic
    ├── register-sw.js     # Service worker registration
    ├── sw.js              # Scramjet proxy worker
    └── 404.html           # Error page
```

---

## 🐛 Troubleshooting

### Games Won't Load
- ⏳ **Wait 60+ seconds** (first load is slow!)
- 🔄 **Refresh page** and try again
- 🚫 **Disable ad blocker**
- 🌐 **Use Chrome or Firefox** (not Safari)

### "Service Worker Failed"
- 🔒 **HTTPS required** (Render provides this automatically)
- 🧹 **Clear cache**: Ctrl+Shift+R
- 🕵️ **Try incognito mode**

---

## ⚙️ Add More Games

Edit `public/index.js`:

```javascript
const GAME_URLS = {
    'your-game': 'https://now.gg/apps/...',
};
```

---

## 💡 Pro Tips

1. **Free tier sleeps** after 15 min → Use UptimeRobot to keep alive
2. **First load** always takes longest
3. **Desktop works best** for most games
4. **Some games may not work** (now.gg actively blocks proxies)

---

## 🆚 Scramjet vs Project Ocho

| Feature | Scramjet | Project Ocho |
|---------|----------|--------------|
| Service Worker | ✅ | ❌ |
| WISP Protocol | ✅ | ❌ |
| Bypass Strength | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Speed | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Winner: Scramjet** 🏆

---

## 📞 Help

**Blank screen?** Wait 60 seconds, then refresh  
**404 error?** Check all files are uploaded  
**Slow?** Normal for first load  

---

## 🎉 You're Done!

Share your launcher: `https://your-app.onrender.com`

**Made with Scramjet** - The ultimate web proxy! 🚀
