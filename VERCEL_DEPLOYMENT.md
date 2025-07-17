# Vercel Deployment Guide

## Environment Variables Setup

This project uses environment variables for Firebase configuration. Follow these steps to deploy on Vercel:

### 1. Environment Variables Required

Add the following environment variables in your Vercel project settings:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC7LWF3rfk0K8l5BTjAxjHSmQotkOlJIt4
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wfdpracticeroom.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wfdpracticeroom
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=wfdpracticeroom.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=998166005854
NEXT_PUBLIC_FIREBASE_APP_ID=1:998166005854:web:c0a2e365b5d0cd6c4b0ccf
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-2Z5WQPZK2R
NODE_ENV=production
```

### 2. How to Add Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable one by one:
   - Name: `NEXT_PUBLIC_FIREBASE_API_KEY`
   - Value: `AIzaSyC7LWF3rfk0K8l5BTjAxjHSmQotkOlJIt4`
   - Environment: Production, Preview, Development (select all)

Repeat for all variables listed above.

### 3. Deploy

After adding all environment variables:
1. Trigger a new deployment by pushing to your main branch
2. Or manually redeploy from Vercel dashboard

### 4. Verify Deployment

Check that Firebase is working correctly by:
1. Opening the deployed site
2. Checking browser console for "✅ Firebase initialized successfully" message
3. Testing Firebase functionality (authentication, database operations)

## Local Development

For local development, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Then fill in your Firebase configuration values in `.env.local`.

## Security Notes

- The `.env` file is gitignored and should never be committed
- Firebase client-side configuration is safe to expose (uses NEXT_PUBLIC_ prefix)
- Always use environment variables for sensitive configuration
