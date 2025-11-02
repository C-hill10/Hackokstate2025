# Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Fastest & Easiest)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"
   - Done! Your app will have a URL like `your-app.vercel.app`

3. **Environment Variables (if needed):**
   - In Vercel dashboard, go to Project Settings > Environment Variables
   - Add any Firebase config if you're using environment variables

### Option 2: Netlify

1. **Push to GitHub** (same as above)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub and select your repo
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

### Option 3: Firebase Hosting (With Cloud Functions)

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase in your project:**
   ```bash
   firebase init hosting
   firebase init functions
   ```
   - Select your Firebase project
   - Public directory: `hackokstate25/dist`
   - Configure as single-page app: `Yes`
   - Set up automatic builds: `No` (or `Yes` if you want)

4. **Install Functions dependencies:**
   ```bash
   cd functions
   npm install
   cd ..
   ```

5. **Set environment variables (optional, for API key authentication):**
   ```bash
   firebase functions:secrets:set API_KEY
   # Enter your secure API key when prompted
   firebase functions:secrets:set REQUIRE_API_KEY
   # Enter "false" or "true" when prompted
   ```
   Or use the Firebase Console: Functions > Configuration > Environment Variables

6. **Build and Deploy:**
   ```bash
   cd hackokstate25
   npm run build
   cd ..
   firebase deploy
   ```
   This deploys both hosting and functions together.

7. **Your app will be at:** `https://your-project-id.web.app`
   - API endpoint: `https://your-project-id.web.app/api/update-crowd-level`
   - Health check: `https://your-project-id.web.app/health`

**Note:** The sensor daemon API is now deployed as a Cloud Function, accessible via the same domain as your hosting. This means your sensors can send updates directly to your deployed app without needing a separate server.

## Post-Deployment Checklist

- [ ] Test the live URL - does the map load?
- [ ] Verify Firebase config is correct (check if markers appear)
- [ ] Test admin panel functionality
- [ ] Check mobile responsiveness
- [ ] Verify Firestore security rules (test mode is fine for demo)

## Firebase Config for Production

If you want to use environment variables instead of hardcoding:

1. **Create `.env` file:**
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=your-app-id
   ```

2. **Update `src/firebase/config.js`:**
   ```javascript
   const firebaseConfig = {
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   }
   ```

3. **Add environment variables in your hosting platform** (Vercel/Netlify) with the same variable names

## Troubleshooting Deployment

**Build fails:**
- Check that all dependencies are in `package.json`
- Run `npm run build` locally first to catch errors
- Check build logs in your hosting platform

**App loads but map doesn't show:**
- Check browser console for errors
- Verify Firebase config is correct
- Make sure Firestore has data

**CORS errors:**
- Firebase should handle CORS automatically
- If issues persist, check Firestore security rules

## Custom Domain (Optional)

### Vercel:
- Go to Project Settings > Domains
- Add your custom domain
- Follow DNS configuration instructions

### Netlify:
- Go to Site Settings > Domain Management
- Add custom domain
- Configure DNS records

### Firebase:
- Go to Hosting > Add custom domain
- Follow verification steps

## Performance Tips

- Images are optimized automatically by Vite
- Consider lazy loading map markers if you have many locations
- Firestore queries are already optimized for real-time updates
