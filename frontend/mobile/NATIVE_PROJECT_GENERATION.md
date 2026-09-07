# Native project generation — PoliSync Africa

The repository now declares both Capacitor native platforms. Run these commands from `frontend/` on a machine with the required native toolchains.

## One-time generation

```bash
npm install
npm run mobile:prepare
```

This creates `frontend/android/` and `frontend/ios/` and synchronizes the Capacitor configuration.

## Android

Requirements:

- Node.js 22
- Android Studio
- Android SDK
- Java 21
- Android SDK Platform 36 / Android 16 tooling

Open the project with:

```bash
npm run mobile:android
```

For a release AAB:

```bash
npm run mobile:android:build
```

Configure release signing through Android Studio or protected CI secrets. Never commit keystores or passwords.

## iOS

Requirements:

- macOS
- Xcode with the current App Store Connect-supported SDK
- Apple Developer signing

Open the project with:

```bash
npm run mobile:ios
```

Archive from Xcode after selecting the correct team and signing profile.

## Important production architecture note

The current Capacitor configuration intentionally points the native shell at the hosted PoliSync runtime (`CAPACITOR_SERVER_URL`, defaulting to the Render deployment). This preserves the existing web application and avoids duplicating the Next.js server/API inside a mobile bundle.

Before store submission, test the hosted-runtime architecture on real devices. If store review or offline requirements require a locally bundled web runtime, a separate static/export-compatible mobile build should be introduced rather than changing the production web application blindly.

## Native project policy

Generated `android/` and `ios/` directories should only be committed after reviewing the generated files and deciding that the repository will own native project configuration. Signing material and private credentials must never be committed.
