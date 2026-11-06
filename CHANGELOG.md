# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] - 2026-10-30

### Added
- `osticket_assign_ticket` assigns a ticket to an agent (`assigneeId`) through
  the plugin's `tickets.assign` (needs plugin 1.4.0), with optional `note`,
  `alert`, `staffId` (who assigned) and `reassign`.

## [1.2.0] - 2026-10-28

### Added
- `osticket_reply_ticket` takes `attachments`, a list of `{path, name?, type?}`.
  The server reads the files from its local disk and sends them base64-encoded
  to the plugin's `tickets.reply` (needs plugin 1.3.0). A missing file returns
  the read error instead of posting the reply.
- `osticket_reply_ticket` and `osticket_update_ticket` take `staffId`, and
  `osticket_reply_ticket` takes `replyTo` (`all`, `user`, `collabs`), matching
  plugin 1.2.0.

## [1.1.0] - 2026-07-07

### Changed
- `osticket_get_ticket` now documents the `attachments` array returned on each
  thread entry (`fileId`, `name`, `type`, `size`, `inline`, `cid`) and points
  to `osticket_download_attachment`, which now notes the `fileId` comes from
  there. Backed by plugin 1.1.0; no schema change on the MCP side.

## [1.0.0] - 2026-07-05

### Added
- MCP server (stdio) exposing the NKS osTicket API as 14 tools:
  `osticket_list_tickets`, `osticket_search_tickets`, `osticket_get_ticket`,
  `osticket_get_stats`, `osticket_list_statuses`, `osticket_create_ticket`,
  `osticket_update_ticket`, `osticket_reply_ticket`, `osticket_delete_ticket`,
  `osticket_link_subticket`, `osticket_unlink_subticket`,
  `osticket_get_children`, `osticket_get_parent`, `osticket_download_attachment`.
- Typed, timeout-guarded HTTP client with `{ok,data}` envelope unwrapping and
  clear error surfacing.
- Environment-based configuration with validation.
