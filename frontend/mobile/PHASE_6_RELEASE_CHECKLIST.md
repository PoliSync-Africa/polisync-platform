# PoliSync Africa — Phase 6 Release Checklist

## Status

This phase prepares and validates the production release pipeline. Native Android/iOS projects must exist before signed store binaries can be produced.

## 1. Production configuration

- [ ] Confirm production API base URL.
- [ ] Confirm Capacitor application ID is `africa.polysync.app`.
- [ ] Confirm production web runtime is `https://polisync-app.onrender.com` until the public domain is live.
- [ ] Confirm no JWT secret, database URI, Arkesel key, TURN credential, or other server secret is bundled into the frontend.
- [ ] Confirm HTTPS-only production traffic.

## 2. Android

- [ ] Run `npm ci` in `frontend`.
- [ ] Generate/sync the Capacitor Android project with `npm run mobile:add` and `npm run mobile:sync` on a native build machine.
- [ ] Confirm package/application ID `africa.polysync.app`.
- [ ] Configure Android 16 / API 36 target for store submission.
- [ ] Configure release signing outside source control.
- [ ] Build a signed `.aab`.
- [ ] Install and test on physical Android devices.

### Android test matrix

- [ ] Small phone
- [ ] Large phone
- [ ] Android 16 device/emulator
- [ ] Mobile data
- [ ] Wi-Fi
- [ ] Camera permission
- [ ] Microphone permission
- [ ] Location permission
- [ ] Notifications
- [ ] Background/return-to-app behavior

## 3. iOS

- [ ] Generate/sync the Capacitor iOS project on macOS.
- [ ] Confirm bundle ID `africa.polysync.app`.
- [ ] Configure Apple signing outside source control.
- [ ] Build using the current App Store Connect-required iOS SDK.
- [ ] Configure camera, microphone and location usage descriptions.
- [ ] Configure APNs only when push notification implementation is production-ready.
- [ ] Archive and upload to TestFlight.
- [ ] Test on physical iPhone devices.

### iOS test matrix

- [ ] Current supported iPhone size
- [ ] iOS 26 device
- [ ] Mobile data
- [ ] Wi-Fi
- [ ] Camera permission
- [ ] Microphone permission
- [ ] Location permission
- [ ] Notifications
- [ ] Background/return-to-app behavior

## 4. Authentication

- [ ] Account registration works.
- [ ] Login works.
- [ ] OTP delivery works.
- [ ] OTP verification works.
- [ ] Seven-day session behavior works.
- [ ] Logout revokes the active session.
- [ ] Expired/revoked sessions are rejected.
- [ ] Protected API routes cannot be accessed without authentication.

## 5. Communications

- [ ] User search works while typing.
- [ ] Direct messaging works.
- [ ] File attachments work.
- [ ] Image/gallery upload works.
- [ ] Camera capture works.
- [ ] Forwarding works.
- [ ] Voice calls work.
- [ ] Video calls work.
- [ ] Mute/camera controls work.
- [ ] Call timeout/end behavior works.
- [ ] Test calls across different mobile networks.
- [ ] Add production TURN infrastructure before claiming reliable calling across restrictive NATs.

## 6. Electoral and field workflows

- [ ] 16 Ghana regions load.
- [ ] 276 constituencies load.
- [ ] Polling stations load.
- [ ] Polling-station search works.
- [ ] Election results load.
- [ ] Field operations load.
- [ ] GPS/location workflows work.
- [ ] Offline behavior is understood and tested for workflows that claim offline support.

## 7. Store compliance

- [ ] Privacy Policy is publicly accessible.
- [ ] Terms are publicly accessible.
- [ ] Store data declarations match production behavior.
- [ ] Permission explanations match actual feature use.
- [ ] Store screenshots are captured from the release build.
- [ ] Store description matches actual capabilities.
- [ ] Reviewer account/instructions prepared.
- [ ] Support contact prepared.

## 8. Release gates

A release is **READY** only when all critical authentication, communications, electoral-data, permission, security and store-compliance checks above pass on physical devices.

Do not mark the application as published merely because the GitHub workflow succeeds. A workflow validates source/build readiness; store publication remains a separate human-controlled release step.
