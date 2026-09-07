# PoliSync Africa — Mobile Integration Phase 2

Phase 2 prepares the existing Next.js application for native Android/iOS capabilities without replacing the web application.

## Native capabilities planned

- Camera capture and camera switching
- Microphone access for voice/video calling
- GPS/location access for field operations and polling-station workflows
- Push-notification foundation
- Native file/photo selection
- Secure app-to-API authentication using the existing web session
- WebRTC voice/video calling through the existing Socket.IO signaling layer
- Mobile-safe navigation and external-link handling

## Configuration

The mobile shell uses the production PoliSync web runtime configured in `capacitor.config.ts` unless `CAPACITOR_SERVER_URL` is supplied during a local build.

Do not store API keys, JWT secrets, database credentials, or TURN credentials in the mobile bundle. Native builds must receive only public configuration.

## Permissions

Request camera, microphone, and location permissions only at the moment a feature requires them. Explain the purpose to users before requesting sensitive device access.

## Push notifications

The provider-specific Firebase/APNs credentials are intentionally not committed to GitHub. They must be configured through the appropriate Android/iOS release environments in a later release-preparation phase.

## Web compatibility

The web deployment remains unchanged. Native packaging is an additional delivery channel and continues to use the same PoliSync backend/API.
