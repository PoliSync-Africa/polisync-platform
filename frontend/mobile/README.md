# PoliSync Africa Mobile Foundation

PoliSync Africa uses Capacitor to package the existing Next.js application for Android and iOS while preserving the web application.

## App identity

- App name: PoliSync Africa
- Application ID / Bundle ID: `africa.polysync.app`
- Production web origin: `https://polisync-app.onrender.com`
- Planned public domain: `https://polysync.africa`

## Development

From `frontend/`:

```bash
npm install
npm run build
npm run mobile:add
npm run mobile:sync
```

Then open the native project with `npm run mobile:android` or `npm run mobile:ios`.

## Important

The current configuration uses the deployed PoliSync web application as the mobile web runtime. This keeps web and mobile behavior aligned during Phase 1. Native camera, microphone, location, notifications, offline storage, and other device integrations are added in later mobile integration phases.

Before store submission, replace the temporary Render URL with the final production domain after DNS/TLS and production environment configuration are complete.
