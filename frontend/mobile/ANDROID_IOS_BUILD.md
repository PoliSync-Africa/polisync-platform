# PoliSync Africa — Phase 4 Android & iOS Build Preparation

## App identity

- Display name: PoliSync Africa
- Application ID / Bundle ID: `africa.polysync.app`
- Production web runtime: `https://polisync-app.onrender.com`
- Planned public domain: `https://polysync.africa`

## Android release

1. Install the Android platform with Capacitor in a machine that has Node.js, Android Studio, and the Android SDK.
2. Add/sync the Android platform from `frontend`.
3. Open the generated Android project in Android Studio.
4. Confirm application ID `africa.polysync.app`.
5. Configure the production signing key outside GitHub.
6. Configure camera, microphone, location, notifications, and network permissions according to the features actually used.
7. Build a signed Android App Bundle (`.aab`).
8. Test authentication, navigation, camera, GPS, messaging, voice/video calling, uploads, and back navigation on physical Android devices.

## iOS release

1. Run the Capacitor iOS platform generation on macOS with Xcode installed.
2. Open the generated iOS workspace in Xcode.
3. Confirm bundle identifier `africa.polysync.app`.
4. Configure Apple signing/team information outside GitHub.
5. Add camera, microphone, location, photo-library, and notification usage descriptions only where required.
6. Configure APNs later through Apple Developer/App Store Connect; do not commit certificates or private keys.
7. Build and archive the iOS app.
8. Test authentication, navigation, camera, GPS, messaging, voice/video calling, uploads, safe areas, and background/foreground transitions on physical iPhone/iPad devices.

## Store-safe security rules

- Never commit Android keystores, passwords, provisioning profiles, APNs private keys, Firebase service-account keys, JWT secrets, database credentials, or TURN credentials.
- Native apps must use HTTPS in production.
- Only public runtime configuration may be bundled into the app.
- Store release builds must be signed with credentials held outside the repository.

## Web compatibility

The existing Next.js web deployment remains the primary web client. Native Android/iOS packaging is an additional client and uses the same PoliSync backend.

## Build limitation in repository-only environments

The GitHub source repository can contain the Capacitor configuration and native project source, but signed Android/iOS binaries require the respective native toolchains. Android builds require Android Studio/SDK; iOS builds require macOS/Xcode and Apple signing.
