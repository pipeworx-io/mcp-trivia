# @pipeworx/mcp-trivia

MCP server for trivia questions from [Open Trivia Database](https://opentdb.com/). Free, no auth required.

## Tools

| Tool | Description |
|------|-------------|
| `get_questions` | Fetch trivia questions with optional category, difficulty, and type filters |
| `list_categories` | List all available trivia categories and their IDs |
| `get_category_stats` | Get question counts for a specific category |

## Quickstart (Pipeworx Gateway)

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_questions",
      "arguments": { "amount": 5, "difficulty": "medium" }
    }
  }'
```

## License

MIT
