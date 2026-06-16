# Deployment Guide

This repository contains two parts that need to be deployed separately:

1. `backend/` - the Node.js + Express API with MongoDB.
2. `frontend/` - the Expo app that can be built for Android and exported for web.

The app talks to the backend through the `EXPO_PUBLIC_API_URL` environment variable, so the backend URL must be set before building the mobile or web client.

## 1. Backend Deployment

The backend lives in `backend/` and exposes the API under `/api`.

### Required environment variables

Set these variables in your hosting provider:

- `MONGODB_URI` - MongoDB connection string.
- `PORT` - optional. Most providers set this automatically.

Example `.env` values for local testing:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/plantapp
PORT=5000
```

### Deploy steps

1. Create a new service in your hosting platform for the backend.
2. Point the service root to `backend/`.
3. Run `npm install` inside `backend/`.
4. Set the start command to `node index.js`.
5. Add `MONGODB_URI` in the environment settings.
6. Deploy and confirm the service responds on `/api/plants`.

### Notes

- The server already enables CORS with `cors()`, so the frontend can call it from web and mobile clients.
- If you use MongoDB Atlas, make sure the database network access allows connections from your hosting provider.

## 2. Frontend Deployment for Android

The Android app is the Expo project in `frontend/`.

### Before building

Update the API URL to your deployed backend:

```env
EXPO_PUBLIC_API_URL=https://your-backend-domain.com/api
```

The app reads that value in its screens, so every build must use the production backend URL.

### Build requirements

Make sure you have:

- An Expo account.
- EAS CLI installed.
- The backend deployed and reachable over HTTPS.

### Android build steps

1. Open a terminal in `frontend/`.
2. Install dependencies if needed with `npm install`.
3. Log in to Expo with `npx eas login` or `eas login`.
4. Configure the project once with `npx eas build:configure` if it has not been configured yet.
5. Build the Android app with:

```bash
npx eas build -p android --profile production
```

6. Download the generated `.apk` or `.aab` from the Expo dashboard.
7. If you are publishing to Google Play, use the `.aab` artifact and submit it through the Play Console.

### Existing build profiles

The file `frontend/eas.json` already defines these profiles:

- `development` - internal development client.
- `preview` - internal APK build.
- `production` - release build for stores.

## 3. Frontend Deployment for Web

The same Expo project can be exported as a static web app.

### Before exporting

Set `EXPO_PUBLIC_API_URL` to the production backend URL before the build.

### Web export steps

1. Open a terminal in `frontend/`.
2. Install dependencies if needed with `npm install`.
3. Build the static site with:

```bash
npx expo export --platform web
```

4. The export is generated as a static site that can be hosted on any static host such as Netlify, Vercel, Cloudflare Pages, or an S3-style bucket.
5. Deploy the generated output directory from Expo to your hosting provider.

### Web hosting notes

- If you host under a custom domain, the backend API should also use HTTPS.
- If your host requires a single entry file for SPA routing, configure it to serve the exported `index.html` for unknown routes.

## 4. Recommended Production Flow

1. Deploy the backend first.
2. Copy the backend public URL.
3. Set `EXPO_PUBLIC_API_URL` to that URL.
4. Build Android with EAS.
5. Export web assets and deploy them to your static host.

## 5. Local Validation Before Release

Run these checks before shipping:

```bash
# backend
cd backend
npm install
node index.js

# frontend
cd ../frontend
npm install
npx expo start
```

Verify that:

- The backend responds on `/api/plants`.
- The Android app can reach the deployed backend.
- The web build loads the API from the production URL.

## 6. Optional Improvement

The backend now includes a `start` script in `backend/package.json`, so hosts can run `npm start` instead of calling `node index.js` directly.