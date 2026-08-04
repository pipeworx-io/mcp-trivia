# mcp-trivia

Trivia MCP — wraps Open Trivia Database (free, no auth)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_questions` | Get trivia questions from the Open Trivia Database. Optionally filter by category, difficulty, and question type. |
| `list_categories` | List all available trivia categories and their IDs. |
| `get_category_stats` | Get the total and per-difficulty question counts for a specific category. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "trivia": {
      "url": "https://gateway.pipeworx.io/trivia/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Trivia data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
