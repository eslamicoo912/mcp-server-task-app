import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"
import { askAgent } from "./agent.js";

const mcpClient = new Client({
    name: 'task-manager-ai-host',
    version: "1.0.0"
});

const transport = new StdioClientTransport({
    command: "npx",
    args: ['tsx', 'src/index.ts']
});

async function main() {
    await mcpClient.connect(transport);
    try {
        const answer = await askAgent(
            mcpClient,
            "Show me completed tasks."
        );

        console.log("\nAI Response:\n", answer);
    } finally {
        await mcpClient.close();
    }
}

main().catch(console.error);