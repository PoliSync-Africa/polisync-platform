# PoliSync Africa — Phase 5 Store Release Package

## Product identity

**App name:** PoliSync Africa

**Application ID / Bundle ID:** `africa.polysync.app`

**Category:** Government / civic technology / productivity (select the closest store category available at submission time)

**Primary market:** Africa, with Ghana as the initial operational market.

## Store short description

A secure political technology platform for elections, research, field operations, communications and civic intelligence.

## Store full description

PoliSync Africa is a political technology platform designed to help political parties, candidates, researchers and civic organizations organize election and civic work in one secure workspace.

Key capabilities include:

• Election and polling-station information
• Election results and geographic intelligence
• Campaign and field operations
• Research, surveys and datasets
• Secure messaging and file sharing
• Voice and video communications
• Ghana politics, governance and economy intelligence
• AI-assisted analysis and planning
• Location-aware field workflows
• Personal workspaces and organization workspaces

PoliSync Africa connects people, information and operational workflows while keeping private organization information protected by authenticated access and role-based permissions.

Some features require an account, network connectivity, camera, microphone, location, or notification permissions depending on the workflow selected by the user.

PoliSync Africa does not represent itself as an electoral commission or government authority. Election information and results should be independently verified against authoritative sources where applicable.

## Privacy and data disclosure preparation

The store submission must accurately disclose the final production behavior of the app. Potential data categories include account/profile information, authentication/session information, messages and uploaded files, location information, camera/microphone data during user-initiated features, device/notification identifiers, research submissions, and usage/security logs.

Only declare categories that the production build actually collects or shares. Do not claim that data is collected or shared merely because a capability exists.

Private communications, authentication credentials, secrets, and organization-restricted information must not be exposed through public endpoints.

## Permissions rationale

**Camera:** used when the user explicitly captures a photo or participates in video calling.

**Microphone:** used when the user explicitly starts voice/video calling or another audio feature.

**Location:** used for location-aware weather, field operations, navigation, and polling-station workflows when requested by the user.

**Notifications:** used for relevant account, messaging, operational, and system notifications after permission is granted.

**Photos/files:** used when the user chooses to upload or share files/photos.

## Reviewer / test-account preparation

Before submission, create a dedicated store-review account with only the minimum permissions required to demonstrate public/personal features. If private organization functionality must be reviewed, provide a safe demonstration organization and explicit reviewer instructions without exposing real confidential data.

Never put reviewer passwords, API secrets, database credentials, signing keys, or private certificates into GitHub.

## Required store assets before submission

- 1024×1024 master app icon source
- Android adaptive icon assets
- iOS App Store icon
- Phone screenshots for supported Android sizes
- iPhone screenshots for current required sizes
- iPad screenshots if iPad support is enabled
- Optional promotional graphics
- Support URL
- Privacy Policy URL
- Terms URL
- Marketing website URL

Planned website: `https://polysync.africa`
Current deployment during transition: `https://polisync-app.onrender.com`

## Release gates

Do not submit until:

1. Android and iOS production builds install successfully.
2. Login/OTP works on physical devices.
3. Seven-day session behavior is confirmed.
4. Camera and microphone permissions work only when required.
5. GPS works only when required.
6. Messaging, attachments and user search work.
7. Voice/video calling works across representative mobile networks.
8. Election/geography data loads without zero-data regressions.
9. Web and native clients use the intended production API.
10. Privacy policy and terms are publicly reachable.
11. Store privacy/data declarations match the actual production build.
12. Crash/error/loading states are tested.
13. Android and iOS release signing is performed outside the repository.

## Store submission status

- Google Play listing: PREPARED — account/upload still required
- Apple App Store listing: PREPARED — App Store Connect upload still required
- Production signed Android AAB: PENDING native build environment
- Production signed iOS archive: PENDING macOS/Xcode build environment
- Store screenshots: PENDING final device builds
- Final privacy declarations: PENDING production build verification
