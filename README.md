# NKS osTicket MCP

[![Version](https://img.shields.io/badge/version-1.3.0-orange.svg)](CHANGELOG.md)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933.svg?logo=node.js&logoColor=white)](#requirements)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)](tsconfig.json)
[![MCP](https://img.shields.io/badge/MCP-stdio-111827.svg)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A [Model Context Protocol](https://modelcontextprotocol.io/) server for [osTicket](https://osticket.com/). It lets AI agents such as Claude list, search, read, create, update, reply to and delete tickets, plus read stats, manage parent/child subtickets and download attachments.

It talks to the companion [NKS osTicket API plugin](https://github.com/nks-hub/nks-osticket-plugin), which exposes a single JSON endpoint inside osTicket.

---

## Features

- 🎫 **Ticket CRUD** - List, search, read, create, update and delete tickets from an AI agent
- 💬 **Replies and notes** - Customer-facing replies (emailed) and internal notes, optionally posted as a specific agent (`staffId`) and with selectable recipients (`replyTo`)
- 📊 **Stats and statuses** - Total, open, closed and overdue counts; list of all ticket statuses
- 🌳 **Subtickets** - Link, unlink and browse parent/child tickets
- 📎 **Attachments** - Attach local files to a reply; thread entries list their attachments and any of them downloads as base64
- ⏱️ **Error reporting** - Requests time out after 30 s by default (504), network failures return 502, and API errors come back to the agent with osTicket's code and message; self-signed TLS can be allowed
- 🧩 **15 tools** - One MCP server over stdio, configured by environment variables

## Requirements

- Node.js 18 or later
- The [NKS osTicket API plugin](https://github.com/nks-hub/nks-osticket-plugin) installed on your osTicket instance
- An osTicket API key (Admin → Manage → API Keys) with the permissions your tools need, bound to the source IP this server runs from

## Installation

```bash
git clone https://github.com/nks-hub/nks-osticket-mcp.git
cd nks-osticket-mcp
npm install
npm run build
```

## Configuration

Set via environment variables (see `.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `NKS_OSTICKET_URL` | yes | – | URL of the API entry, `…/api/nks-osticket.php` |
| `NKS_OSTICKET_API_KEY` | yes | – | osTicket API key |
| `NKS_OSTICKET_TIMEOUT_MS` | no | `30000` | Request timeout in ms |
| `NKS_OSTICKET_REJECT_UNAUTHORIZED` | no | `true` | `false` allows self-signed TLS |

## Usage

### Claude Code / Claude Desktop

Add to your MCP server configuration:

```json
{
  "mcpServers": {
    "osticket": {
      "command": "node",
      "args": ["/absolute/path/to/nks-osticket-mcp/dist/index.js"],
      "env": {
        "NKS_OSTICKET_URL": "https://support.example.com/api/nks-osticket.php",
        "NKS_OSTICKET_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Tools

| Tool | Purpose |
|---|---|
| `osticket_list_tickets` | List tickets (filter by status/department, paginated) |
| `osticket_search_tickets` | Full-text search by subject |
| `osticket_get_ticket` | One ticket with full message thread |
| `osticket_get_stats` | Total / open / closed / overdue counts |
| `osticket_list_statuses` | All ticket statuses |
| `osticket_create_ticket` | Create a ticket |
| `osticket_update_ticket` | Change status / due date / topic, add internal note (optionally as agent `staffId`) |
| `osticket_reply_ticket` | Post a customer-facing reply (emailed; optional `staffId`, `replyTo`: `all`, `user`, `collabs`, and `attachments`) |
| `osticket_assign_ticket` | Assign a ticket to an agent (`assigneeId`; optional `note`, `alert`, `staffId`, `reassign`); needs plugin 1.4.0 |
| `osticket_delete_ticket` | Delete a ticket (irreversible) |
| `osticket_link_subticket` | Link child under parent |
| `osticket_unlink_subticket` | Remove a child's parent link |
| `osticket_get_children` | List a parent's children |
| `osticket_get_parent` | Get a child's parent |
| `osticket_download_attachment` | Download an attachment (base64) |

`attachments` on `osticket_reply_ticket` is a list of `{ "path": "C:/tmp/screenshot.jpg" }`, optionally with `name` and `type`. The server reads each file from its own disk, guesses the MIME type from the extension (jpg, png, gif, webp, pdf, txt, otherwise `application/octet-stream`) and sends it base64-encoded. Attaching files needs plugin 1.3.0 or later; osTicket's maximum file size setting caps each file.

## Development

```bash
npm run dev          # run from source with tsx
npm run type-check   # tsc --noEmit
npm run build        # compile to dist/
npm start            # run the compiled server
```

The project has no automated test suite yet; `npm run type-check` and `npm run build` are the checks. Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Contributing

Contributions are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: description'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- 📧 **Email:** dev@nks-hub.cz
- 🐛 **Bug reports:** [GitHub Issues](https://github.com/nks-hub/nks-osticket-mcp/issues)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/nks-hub">NKS Hub</a>
</p>
