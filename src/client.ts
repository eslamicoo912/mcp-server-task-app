import { Client } from "@modelcontextprotocol/client"
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio"

async function main() {
    const client = new Client({
        name: 'task-manager-client',
        version: '1.0.0'
    });

    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "src/index.ts"]
    });

    try {
        // 1. Connect to MCP Server
        await client.connect(transport)

        // 2. Discover available tools
        const { tools } = await client.listTools()

        for (const tool of tools) {
            console.log(`Tool ${tool.name}: ${tool.description}`);
        }

        // 3. Invoke get_tasks
        const invocation = await client.callTool({
            name: "get_tasks",
            arguments: {
                status: "todo"
            }
        })

        // 4. Read the response
        console.log("\nTool Result: ");

        if (invocation.isError) {
            console.error(`Tool error: ${invocation.content}`);
        }

        for (const result of invocation.content) {
            if (result.type === "text")
                console.log(result.text);
        }
    } finally {
        await client.close()
    }
}

main().catch(console.error)