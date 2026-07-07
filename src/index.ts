#!/usr/bin/env node
/**
 * NKS osTicket MCP server.
 *
 * Exposes the NKS osTicket JSON API as Model Context Protocol tools over
 * stdio. Each tool is a thin, typed wrapper that forwards to one API action;
 * the mapping lives in one table so tools stay consistent and easy to extend.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z, type ZodRawShape } from "zod";
import { loadConfig } from "./config.js";
import { OsticketClient, OsticketApiError } from "./client.js";

const SERVER_NAME = "nks-osticket-mcp";
const SERVER_VERSION = "1.1.0";

/** One MCP tool bound to a single API action. */
interface ToolDef {
  name: string;
  description: string;
  action: string;
  shape: ZodRawShape;
}

const ticketRef = {
  number: z.string().optional().describe('Public ticket number, e.g. "CH00072469"'),
  id: z.number().int().positive().optional().describe("Internal ticket id (alternative to number)"),
};

const TOOLS: ToolDef[] = [
  {
    name: "osticket_list_tickets",
    description:
      "List tickets, newest first. Filter by status (open/closed/resolved/archived or numeric id) and department. Paginated.",
    action: "tickets.list",
    shape: {
      status: z.string().optional().describe("open | closed | resolved | archived | <status id>"),
      department: z.string().optional().describe("Department name or id"),
      limit: z.number().int().min(1).max(100).optional().describe("Max results (default 20, max 100)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      sort: z.enum(["created", "updated", "number"]).optional().describe("Sort field (default created)"),
    },
  },
  {
    name: "osticket_search_tickets",
    description: "Full-text search tickets by subject. Optional status filter and pagination.",
    action: "tickets.search",
    shape: {
      query: z.string().min(1).describe("Search text matched against ticket subjects"),
      status: z.string().optional().describe("Optional status filter"),
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
      sort: z.enum(["created", "updated", "number"]).optional(),
    },
  },
  {
    name: "osticket_get_ticket",
    description:
      "Get one ticket with full detail including the message thread. Each thread entry may include an \"attachments\" array (fileId, name, type, size, inline, cid); pass an attachment's numeric fileId to osticket_download_attachment. Provide number or id.",
    action: "tickets.get",
    shape: { ...ticketRef },
  },
  {
    name: "osticket_get_stats",
    description: "Aggregate ticket statistics: total, open, closed, overdue.",
    action: "tickets.stats",
    shape: {},
  },
  {
    name: "osticket_list_statuses",
    description: "List all ticket statuses with their canonical state.",
    action: "tickets.statuses",
    shape: {},
  },
  {
    name: "osticket_create_ticket",
    description: "Create a new ticket. Requires subject and message.",
    action: "tickets.create",
    shape: {
      subject: z.string().min(1).describe("Ticket subject"),
      message: z.string().min(1).describe("Ticket body (message)"),
      name: z.string().optional().describe("Submitter name"),
      email: z.string().optional().describe("Submitter email"),
      topicId: z.number().int().positive().optional().describe("Help topic id"),
      priority: z.number().int().positive().optional().describe("Priority id (1=low..4=emergency)"),
    },
  },
  {
    name: "osticket_update_ticket",
    description:
      "Update a ticket: change status, set/clear due date, change help topic, and/or add an internal staff note.",
    action: "tickets.update",
    shape: {
      number: z.string().describe("Ticket number to update"),
      status: z.string().optional().describe("New status (open/closed/... or id)"),
      statusComment: z.string().optional().describe("Optional comment logged with a status change"),
      dueDate: z.string().nullable().optional().describe("Due date (ISO); null clears it"),
      topicId: z.number().int().positive().optional().describe("New help topic id"),
      note: z.string().optional().describe("Internal note (staff-only, not emailed)"),
      noteTitle: z.string().optional().describe("Title for the internal note"),
    },
  },
  {
    name: "osticket_reply_ticket",
    description: "Post a customer-facing reply to a ticket. This is emailed to the ticket's user.",
    action: "tickets.reply",
    shape: {
      number: z.string().describe("Ticket number to reply to"),
      response: z.string().min(1).describe("Reply body, sent to the customer"),
      title: z.string().optional().describe("Optional reply title"),
      alert: z.boolean().optional().describe("Email the user (default true)"),
    },
  },
  {
    name: "osticket_delete_ticket",
    description: "Permanently delete a ticket and its thread. Irreversible.",
    action: "tickets.delete",
    shape: { number: z.string().describe("Ticket number to delete") },
  },
  {
    name: "osticket_link_subticket",
    description: "Link a child ticket under a parent (parent/child relationship).",
    action: "subtickets.link",
    shape: {
      parent: z.string().describe("Parent ticket number"),
      child: z.string().describe("Child ticket number"),
    },
  },
  {
    name: "osticket_unlink_subticket",
    description: "Remove a child ticket's parent link.",
    action: "subtickets.unlink",
    shape: { child: z.string().describe("Child ticket number") },
  },
  {
    name: "osticket_get_children",
    description: "List all child tickets of a parent ticket.",
    action: "subtickets.children",
    shape: { number: z.string().describe("Parent ticket number") },
  },
  {
    name: "osticket_get_parent",
    description: "Get the parent ticket of a child ticket (null if none).",
    action: "subtickets.parent",
    shape: { number: z.string().describe("Child ticket number") },
  },
  {
    name: "osticket_download_attachment",
    description:
      "Download a ticket attachment by its numeric file id (from a thread entry's attachments[].fileId in osticket_get_ticket), returned as base64.",
    action: "attachments.download",
    shape: { fileId: z.number().int().positive().describe("Attachment file id") },
  },
];

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function errorResult(err: unknown) {
  const message =
    err instanceof OsticketApiError
      ? `osTicket API error (${err.status}): ${err.message}` +
        (err.extra ? ` ${JSON.stringify(err.extra)}` : "")
      : `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new OsticketClient(config);
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  for (const tool of TOOLS) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.shape },
      async (args: Record<string, unknown>) => {
        try {
          const data = await client.call(tool.action, args ?? {});
          return textResult(data);
        } catch (err) {
          return errorResult(err);
        }
      },
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Stderr is safe for logs; stdout is reserved for the MCP protocol.
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} ready (${TOOLS.length} tools)\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
