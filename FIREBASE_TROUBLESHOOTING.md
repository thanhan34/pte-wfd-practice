# Firebase Troubleshooting Guide

## Common Issues and Solutions

### 1. "Missing or insufficient permissions" Error

**Symptoms:**
- Error creating room: FirebaseError: Missing or insufficient permissions
- Failed to load resource errors

**Solutions:**

#### A. Deploy Firestore Security Rules
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project (if not done)
firebase init

# Deploy the security rules
node deploy-firestore-rules.js
```

#### B. Manual Rule Deployment
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wfdpracticeroom`
3. Go to Firestore Database → Rules
4. Replace the rules with the content from `firestore.rules`
5. Click "Publish"

### 2. "ERR_BLOCKED_BY_CLIENT" Error

**Symptoms:**
- POST requests to firestore.googleapis.com are blocked
- Network errors in browser console

**Solutions:**

#### A. Disable Browser Extensions
- Temporarily disable ad blockers (uBlock Origin, AdBlock Plus, etc.)
- Disable privacy extensions that might block Google services
- Try in incognito/private mode

#### B. Check Network/Firewall
- Ensure your network allows connections to `*.googleapis.com`
- Check if corporate firewall is blocking Firebase
- Try from a different network (mobile hotspot)

#### C. Clear Browser Data
```bash
# Clear browser cache and cookies
# Or try a different browser
```

### 3. Firebase Connection Timeout

**Symptoms:**
- "Firebase connection timeout" in console
- App falls back to localStorage

**Solutions:**

#### A. Check Internet Connection
- Ensure stable internet connection
- Test with: `ping firestore.googleapis.com`

#### B. Increase Timeout (if needed)
The app automatically falls back to localStorage after 10 seconds.

### 4. Authentication Issues

**Symptoms:**
- "User not authenticated" errors
- Anonymous sign-in failures

**Solutions:**

#### A. Enable Anonymous Authentication
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab
3. Enable "Anonymous" provider
4. Save changes

#### B. Check Firebase Configuration
Verify `src/lib/firebase.ts` has correct project settings:
- Project ID: `wfdpracticeroom`
- API Key and other config values match Firebase console

### 5. Development vs Production Issues

**For Development:**
```bash
# Run the development server
npm run dev

# Check console for detailed error messages
# Open browser dev tools (F12)
```

**For Production:**
```bash
# Build and test production version
npm run build
npm run start
```

## Testing Firebase Connection

### Manual Test
1. Open browser dev tools (F12)
2. Go to Console tab
3. Look for these messages:
   - ✅ "Firebase initialized successfully"
   - ✅ "Using Firebase for data storage"
   - ⚠️ "Firebase not available, using localStorage fallback"

### Programmatic Test
```javascript
// In browser console
import { checkFirebaseConnection } from './src/lib/firebase';
checkFirebaseConnection().then(connected => {
  console.log('Firebase connected:', connected);
});
```

## Fallback Behavior

The app is designed to work even when Firebase is unavailable:

1. **Firebase Available**: Full real-time functionality
2. **Firebase Unavailable**: Falls back to localStorage
   - Rooms work locally only
   - No real-time sync between users
   - Data persists in browser only

## Getting Help

### Check Logs
1. Browser console (F12 → Console)
2. Network tab for failed requests
3. Application tab → Local Storage

### Common Log Messages
- ✅ "Firebase initialized successfully" - All good
- ⚠️ "Firebase not available, using localStorage fallback" - Working offline
- ❌ "Firebase initialization failed" - Configuration issue
- 🚀 "Room [ID] created successfully" - Room creation worked

### Contact Support
If issues persist:
1. Check this troubleshooting guide
2. Verify all steps in the setup process
3. Test with different browsers/networks
4. Check Firebase Console for service status

## Quick Fixes Checklist

- [ ] Disable ad blockers/privacy extensions
- [ ] Try incognito/private browsing mode
- [ ] Check internet connection
- [ ] Verify Firebase project is active
- [ ] Deploy Firestore security rules
- [ ] Enable Anonymous authentication
- [ ] Clear browser cache
- [ ] Try different browser
- [ ] Test from different network
