# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

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
