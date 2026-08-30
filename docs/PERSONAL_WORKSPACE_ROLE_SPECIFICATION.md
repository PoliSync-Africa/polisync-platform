# PoliSync Africa Personal Workspace Roles & Scope

## Account principle

A personal account is one human identity. During registration the user declares the primary purpose of the account:

- `personal_use` — Personal / Civic User
- `researcher` — Researcher
- `journalist` — Journalist
- `media_house` — Media House

The declaration determines the initial workspace, public-data permissions and default scope. It does **not** create a political-party organization. A user may later receive separate organization memberships without changing their personal identity.

## Data boundary

Personal workspaces are public/read-oriented by default. Private party, candidate, observer, administrative and platform-control data remains protected by organization membership and platform authorization.

## Personal / Civic User

**Scope:** public platform information.

**Core components:** election explorer, electoral geography, candidate directory, party directory, saved information, alerts, public calendar and AI Analyzer.

**Allowed:** browse public political/electoral information, compare public records, save public items and analyze supplied/public data.

**Not allowed:** organization administration, private party records, private observer records, polling-agent deployment, result submission or platform administration.

## Researcher

**Scope:** public platform data with research-oriented read/export permissions.

**Core components:** research desk, dataset library, electoral geography explorer, results laboratory, candidate/party directory, source & provenance library, methodology/data dictionary, geographic comparison lab, saved research, permitted data export and AI Analyzer.

**Research workflow:** question → dataset → geography → analysis → source/provenance → notes → export/citation.

## Journalist

**Scope:** public platform data with reporting/verification permissions.

**Core components:** election desk, live public results explorer, geographic context, candidate directory, fact-checking desk, source verification, evidence notes, press/election calendar, story evidence and AI Analyzer.

**Reporting workflow:** story → source → verification → geographic/election context → evidence → publication planning.

## Media House

**Scope:** public platform data with newsroom-oriented permissions.

**Core components:** newsroom command, assignment board, data desk, verification desk, staff/workflow controls, editorial calendar, election coverage workspace, candidate/geography intelligence and AI Analyzer.

**Newsroom workflow:** assignment → research → data/evidence → verification → editor review → publication.

## AI policy

- **AI Analyzer:** available in every dashboard/workspace and operates on the information/data supplied to it or permitted by the workspace.
- **AI Personal Assistant:** available **only to the PoliSync Africa Super Admin** and enforced at the API layer as well as the UI layer.

## Electoral geography foundation

The canonical hierarchy is:

`Ghana → Region → Constituency → Polling Station → EC Polling Station Code`

The platform now exposes authenticated APIs for region discovery, region-to-constituency loading, constituency-to-polling-station loading, station lookup, search and summary counts. Frontend party geography screens consume these APIs rather than maintaining constituency/polling-station placeholder arrays.
