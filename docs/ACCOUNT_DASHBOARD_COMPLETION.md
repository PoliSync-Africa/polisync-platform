# PoliSync account dashboard completion contract

This document is the implementation contract for all non-Super-Admin dashboards.

## Shared behavior

Every authenticated non-Super-Admin dashboard must use the shared DashboardShell and receive:

- authenticated current-user identity from the backend
- real profile photo support
- live device-derived location rendered as a human-readable place name only
- live atmospheric temperature/weather
- notifications, messages, privacy/security, reminders, AI assistant and AI analyzer modules
- responsive mobile/tablet/desktop navigation
- one official PoliSync brand treatment
- one bottom gold search control; no duplicate white search field
- no demo names, counts, regions, constituencies, polling stations, election results, dates or fake notifications

## Role boundaries

Non-Super-Admin accounts never inherit Super Admin controls. Organization administrators operate within their own organization. Candidates operate within their candidate record/workspace. Observer users operate within their observer organization. Personal accounts operate within their own personal workspace.

## Real data requirement

Dashboard metrics and lists must be derived from authenticated API responses and MongoDB records. When the database has no record, the UI must show an empty state such as "No records yet" instead of inventing data.

## Geography requirement

Region, constituency and polling-station selectors must use the repository's electoral-geography API/data and must not contain hardcoded Ghana geography arrays.

## Results requirement

Results views must filter by organization and election type/election where applicable. Organization dashboards must only see records permitted by their organization role.
