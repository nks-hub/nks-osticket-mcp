# NKS osTicket MCP

A [Model Context Protocol](https://modelcontextprotocol.io/) server for
[osTicket](https://osticket.com/). It lets AI agents (Claude, etc.) list,
search, read, create, update, reply to and delete tickets, plus read stats,
manage parent/child subtickets and download attachments.

It talks to the companion
[NKS osTicket API plugin](https://github.com/nks-hub/nks-osticket-plugin),
which exposes a single JSON endpoint inside osTicket.

## Tools

| Tool | Purpose |
|---|---|
| `osticket_list_tickets` | List tickets (filter by status/department, paginated) |
| `osticket_search_tickets` | Full-text search by subject |
| `osticket_get_ticket` | One ticket with full message thread |
| `osticket_get_stats` | Total / open / closed / overdue counts |
| `osticket_list_statuses` | All ticket statuses |
| `osticket_create_ticket` | Create a ticket |
| `osticket_update_ticket` | Change status / due date / topic, add internal note |
| `osticket_reply_ticket` | Post a customer-facing reply (emailed) |
| `osticket_delete_ticket` | Delete a ticket (irreversible) |
| `osticket_link_subticket` | Link child under parent |
| `osticket_unlink_subticket` | Remove a child's parent link |
| `osticket_get_children` | List a parent's children |
| `osticket_get_parent` | Get a child's parent |
| `osticket_download_attachment` | Download an attachment (base64) |

## Requirements

- Node.js ≥ 18
- The NKS osTicket API plugin installed on your osTicket instance
- An osTicket API key (Admin → Manage → API Keys) with the permissions your
  tools need, bound to the source IP this server runs from

## Install

```bash
npm install
npm run build
```

## Configuration

Set via environment variables (see `.env.example`):

| Variable | Required | Default | Description |
|---|---|---|---|
| `NKS_OSTICKET_URL` | yes | – | URL of the API entry, `…/api/nks-osticket.php` |
| `NKS_OSTICKET_API_KEY` | yes | – | osTicket API key |
| `NKS_OSTICKET_TIMEOUT_MS` | no | `30000` | Request timeout |
| `NKS_OSTICKET_REJECT_UNAUTHORIZED` | no | `true` | `false` allows self-signed TLS |

## Use with Claude Code / Claude Desktop

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

## License

MIT — see [LICENSE](LICENSE).
