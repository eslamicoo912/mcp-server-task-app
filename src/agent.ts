
import { ai, MODEL } from "./llm.js";

export async function createAgent(mcpClient: any) {
    // 1. Discover MCP tools once
    const { tools: mcpTools } = await mcpClient.listTools();

    const allowedTools = new Set(mcpTools.map((tool: any) => tool.name));

    // 2. Convert MCP tools to Gemini declarations
    const geminiTools = [{
        functionDeclarations: mcpTools.map((tool: any) => ({
            name: tool.name,
            description: tool.description ?? "",
            parameters: tool.inputSchema,
        }))
    }];

    // 3. Create ONE persistent chat session
    const chat = ai.chats.create({
        model: MODEL,
        config: {
            systemInstruction:
                "You are a helpful Task Manager assistant. Use available tools when needed.",
            tools: geminiTools,
        }
    });

    // 4. Return a reusable ask function
    async function ask(userMessage: string): Promise<string> {
        let response = await chat.sendMessage({
            message: userMessage
        });

        const MAX_ITERATIONS = 5;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const functionCalls = response.functionCalls;

            // No more function calls: final response
            if (!functionCalls?.length) {
                return response.text ?? "";
            }

            const functionResponses = [];

            for (const call of functionCalls) {
                if (!call.name || !allowedTools.has(call.name)) {
                    throw new Error(
                        `Unknown or unavailable tool: ${call.name}`
                    );
                }

                console.log(`Executing MCP tool: ${call.name}`);

                const result = await mcpClient.callTool({
                    name: call.name,
                    arguments: call.args ?? {}
                });

                const textContent = result.content
                    ?.filter((block: any) => block.type === "text")
                    .map((block: any) => block.text)
                    .join("\n");

                let toolOutput: unknown;

                try {
                    toolOutput = JSON.parse(textContent ?? "null");
                } catch {
                    toolOutput = textContent;
                }

                // Preserve tool execution errors for Gemini
                if (result.isError) {
                    toolOutput = {
                        error: true,
                        details: toolOutput
                    };
                }

                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: {
                            result: toolOutput
                        }
                    }
                });
            }

            // Send results back to the SAME chat session
            response = await chat.sendMessage({
                message: functionResponses
            });
        }

        if (response.functionCalls?.length) {
            throw new Error("Agent exceeded maximum iterations");
        }

        return response.text ?? "";
    }

    return {
        ask,
        getHistory: () => chat.getHistory(),
    };
}
