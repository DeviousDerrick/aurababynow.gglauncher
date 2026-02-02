#A now.gg Launcher - Render Deployment Guide

A sophisticated cloud gaming launcher that bypasses now.gg's proxy detection using Project Ocho. **Optimized for Render deployment**.

## 🚀 Quick Deploy to Render

### Method 1: One-Click Deploy (Recommended)

1. **Fork this repository** to your GitHub account

2. **Go to [Render](https://render.com)** and sign up/login

3. **Click "New +" → "Web Service"**

4. **Connect your GitHub repository**

5. **Configure the service**:
   - **Name**: `nowgg-launcher` (or any name you want)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free` (or paid if you need better performance)

6. **Click "Create Web Service"**

7. **Wait 2-3 minutes** for deployment to complete

8. **Access your launcher** at: `https://your-app-name.onrender.com`

---

## 📋 Step-by-Step Render Setup

### Prerequisites
- A GitHub account
- A Render account (free tier works!)
- This project's files uploaded to a GitHub repository

### Detailed Deployment Steps

#### 1. Prepare Your Repository

Create a new GitHub repository and upload these files:
```
your-repo/
├── server.js
├── nowgg-launcher.html
├── sw.js
├── package.json
└── public/
    ├── index.html (copy of nowgg-launcher.html)
    └── sw.js
```

**Important**: Before uploading, create the `public` folder structure:
```bash
mkdir public
cp nowgg-launcher.html public/index.html
cp sw.js public/sw.js
```

#### 2. Create Render Web Service

1. Go to https://dashboard.render.com
2. Click **"New +"** in the top right
3. Select **"Web Service"**
4. Click **"Connect a repository"** or use **"Public Git repository"** if your repo is public

#### 3. Configure Service Settings

Fill in the following settings:

| Setting | Value |
|---------|-------|
| **Name** | `nowgg-launcher` (or your choice) |
| **Region** | Choose closest to you (Oregon, Frankfurt, etc.) |
| **Branch** | `main` (or your default branch) |
| **Root Directory** | Leave empty (unless files are in a subfolder) |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |

#### 4. Environment Variables (Optional)

Click **"Advanced"** and add environment variables if needed:

| Key | Value | Description |
|-----|-------|-------------|
| `PORT` | `10000` | Render uses port 10000 by default (auto-set) |
| `NODE_ENV` | `production` | Optional: enables production mode |

**Note**: Render automatically sets the `PORT` variable, so you don't need to add it manually.

#### 5. Instance Type

- **Free Tier**: Perfect for testing and personal use
  - Spins down after 15 min of inactivity
  - 750 hours/month free
  - Slower startup after spin-down
  
- **Paid Tiers** ($7+/month): For always-on service
  - No spin-down
  - Faster performance
  - More memory/CPU

#### 6. Deploy!

1. Click **"Create Web Service"**
2. Watch the deployment logs
3. Wait for "Deploy live for..." message (usually 2-3 minutes)
4. Your URL will be: `https://your-service-name.onrender.com`

---

## 🎮 Using Your Deployed Launcher

### Access Your Launcher

Once deployed, visit:
```
https://your-app-name.onrender.com
```

### Quick Launch Games

1. **Click on a game button**:
   - 🎮 Roblox
   - ⛏️ Minecraft  
   - 🚀 Among Us
   - 🔥 Free Fire

2. **Or enter custom URL**:
   ```
   now.gg/play/roblox-corporation/5349/roblox
   ```

3. **Click "Launch"** and play!

### Sharing Your Launcher

Share your Render URL with friends:
```
https://nowgg-launcher.onrender.com
```

They can use it to play unblocked games from anywhere!

---

## ⚙️ Render-Specific Configuration

### Custom Domain (Optional)

1. Go to your service **Settings** → **Custom Domains**
2. Click **"Add Custom Domain"**
3. Enter your domain (e.g., `games.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

### Auto-Deploy on Git Push

Render automatically redeploys when you push to your connected branch:

```bash
git add .
git commit -m "Update launcher"
git push origin main
```

Render will detect the push and redeploy automatically!

### Environment Variables

Update variables from your service dashboard:
1. Go to **Environment** tab
2. Add/edit variables
3. Click **"Save Changes"**
4. Service will automatically redeploy

---

## 🐛 Troubleshooting Render Issues

### Issue: "Application failed to respond"

**Solution**: 
- Ensure `server.js` listens on `0.0.0.0`, not `localhost`
- Check that PORT uses `process.env.PORT`
- Look for errors in the Render logs

```javascript
// Correct (already in server.js):
app.listen(PORT, '0.0.0.0', () => {
  console.log(`now.gg Launcher Server on 0.0.0.0:${PORT}`);
});
```

### Issue: "Build failed"

**Solutions**:
- Verify `package.json` is in the root directory
- Check Build Command is `npm install`
- Look for dependency errors in logs
- Try clearing build cache: Settings → "Clear build cache & deploy"

### Issue: Service spins down (Free tier)

**What happens**:
- After 15 minutes of no requests, Render spins down your service
- First request after spin-down takes 30-60 seconds to wake up

**Solutions**:
- **Upgrade to paid tier** ($7/month) for always-on
- **Use a ping service** like UptimeRobot to keep it alive (pings every 5 min)
- **Accept the spin-down** - it's normal for free tier

### Issue: Slow performance

**Solutions**:
- Upgrade to a paid instance type
- Choose a region closer to your users
- Use a CDN for static assets (advanced)

### Issue: "Node version mismatch"

**Solution**: Specify Node version in `package.json`:
```json
"engines": {
  "node": ">=18.0.0"
}
```

### Issue: Files not found (404 errors)

**Solution**: Ensure the `public` directory structure is correct:
```bash
# Before deploying to GitHub:
mkdir -p public
cp nowgg-launcher.html public/index.html
cp sw.js public/sw.js
git add .
git commit -m "Add public directory"
git push
```

---

## 📊 Monitoring Your Service

### View Logs

1. Go to your service dashboard
2. Click **"Logs"** tab
3. Watch real-time logs
4. Look for errors or proxy requests

### View Metrics (Paid tiers)

- CPU usage
- Memory usage
- Request count
- Bandwidth usage

### Set Up Notifications

1. Go to **Settings** → **Notifications**
2. Add email or Slack webhook
3. Get notified of:
   - Deploy success/failure
   - Service health issues
   - High resource usage

---

## 💰 Cost Breakdown

### Free Tier
- **Cost**: $0/month
- **Includes**: 750 hours (enough for 1 service)
- **Limitations**: 
  - Spins down after 15 min inactivity
  - Shared resources
  - Slower cold starts

### Starter ($7/month)
- **Always-on** service
- Better performance
- No spin-downs
- Recommended for regular use

### Standard ($25/month)
- Even better performance
- More memory/CPU
- Priority support

---

## 🔒 Security Best Practices

### 1. Keep Dependencies Updated

Regularly update your dependencies:
```bash
npm update
git add package.json package-lock.json
git commit -m "Update dependencies"
git push
```

### 2. Use Environment Variables

Never hardcode sensitive data. Use Render's environment variables:
```javascript
const SECRET_KEY = process.env.SECRET_KEY;
```

### 3. Enable HTTPS Only

Render provides free SSL certificates automatically. Your service is already HTTPS-enabled!

### 4. Monitor Logs

Regularly check logs for suspicious activity or errors.

---

## 🚀 Advanced: CI/CD with GitHub Actions

Auto-test before deploying to Render:

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Check
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test # Add tests if you have them
```

---

## 📱 Mobile Access

Your Render-deployed launcher works perfectly on mobile:

1. Visit your Render URL on phone
2. Add to home screen for app-like experience:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

---

## 🎯 Performance Optimization Tips

### 1. Enable Compression
Already enabled in server.js via Express

### 2. Use Caching
Add caching headers for static assets (advanced)

### 3. Minimize Redirects
Already optimized in the proxy logic

### 4. Choose Nearby Region
Select Render region closest to your target users

---

## 📞 Getting Help

### Render Support
- Free tier: Community support
- Paid tiers: Email support
- Docs: https://render.com/docs

### Common Links
- **Dashboard**: https://dashboard.render.com
- **Status**: https://status.render.com
- **Community**: https://community.render.com

### This Project
- Check logs first for error messages
- Verify all files are in the repository
- Ensure public directory structure is correct

---

## 📝 Quick Reference

### Deploy Checklist
- [ ] Files pushed to GitHub
- [ ] `public/` directory created with index.html and sw.js
- [ ] Render service created and connected to repo
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`
- [ ] Service deployed successfully
- [ ] Can access launcher at Render URL

### File Structure
```
your-repo/
├── server.js              # Main server (REQUIRED)
├── package.json           # Dependencies (REQUIRED)
├── nowgg-launcher.html    # Launcher source
├── sw.js                  # Service worker source
├── README.md              # This file
└── public/                # Static files (REQUIRED)
    ├── index.html         # Copy of nowgg-launcher.html
    └── sw.js              # Copy of sw.js
```

---

## ⚠️ Important Notes

1. **First Request Delay**: Free tier services sleep after 15 min. First request takes 30-60s to wake up.

2. **No Persistent Storage**: Render's free tier has ephemeral storage. Use a database if you need to store data.

3. **Build Time**: Initial deploy takes 2-3 minutes. Subsequent deploys are faster.

4. **HTTPS Only**: All Render services are HTTPS by default. HTTP redirects to HTTPS.

5. **Proxy Detection**: now.gg may still detect and block some proxy methods. The launcher includes multiple bypass techniques, but 100% success isn't guaranteed.

---

## 🎉 Success!

Once deployed, your now.gg launcher is live and accessible worldwide! Share your Render URL and enjoy unblocked cloud gaming!

**Your launcher**: `https://your-app-name.onrender.com`

Happy gaming! 🎮🚀
