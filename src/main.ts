
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { createAgent } from "./agent.js";

const mcpClient = new Client({
    name: "task-manager-ai-host",
    version: "1.0.0"
});

const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", "src/index.ts"]
});

async function main() {
    await mcpClient.connect(transport);

    try {
        // Create ONE agent for the conversation
        const agent = await createAgent(mcpClient);

        // First turn
        const answer1 = await agent.ask(
            "Show me all tasks."
        );

        console.log("\nAI Response 1:\n", answer1);

        // Second turn: uses previous conversation context
        const answer2 = await agent.ask(
            "Which of those tasks are completed?"
        );

        console.log("\nAI Response 2:\n", answer2);

        // Third turn
        const answer3 = await agent.ask(
            "How many are left?"
        );

        console.log("\nAI Response 3:\n", answer3);

        // Inspect conversation history
        const history = agent.getHistory();

        console.log("\nConversation History:");
        console.dir(history, { depth: null });

    } finally {
        await mcpClient.close();
    }
}

main().catch(console.error);
