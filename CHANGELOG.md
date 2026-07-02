# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-07-01

### Added

- Search box to filter supplies (insumos) by name in the centro admin panel
  (accent- and case-insensitive).
- Ability for a logged-in centro to create a missing supply. New items are added
  to the shared catalog and become reusable by every centro.
- Pagination of the supplies list (12 per page) to keep the panel compact.
- Site-wide footer with a discreet "Administración" link (super-admin access),
  plus links to the changelog, license and source code.
- This `CHANGELOG.md`.
- `LICENSE` file with the GNU Affero General Public License v3.0 (AGPL-3.0).

### Changed

- Header: the "Soy un centro" action is now labeled "Mi Centro".
- Header: the "Registrar" link is hidden while a session is active.

### Removed

- Internal planning documents (`PRD*.md`) are no longer tracked in the
  repository (they are now ignored and purged from history).

## [0.5.0] - 2026-06

### Added

- Public browse of approved centros as a list and an OpenStreetMap map.
- Per-centro live product semaphore (crítico / necesita más / suficiente /
  abundante) with Supabase Realtime.
- Centro registration flow (pending approval) and per-centro password login.
- Super-admin panel to approve, reject, disable and re-enable centros.
- Effect-based data layer with typed errors and swappable live/mock repositories
  (demo mode when Supabase env vars are absent).

[0.6.0]: https://github.com/jmanzo/centros-de-acopio-ven/releases/tag/v0.6.0
[0.5.0]: https://github.com/jmanzo/centros-de-acopio-ven/releases/tag/v0.5.0
