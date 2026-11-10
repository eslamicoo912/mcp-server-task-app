import { ai, MODEL } from "./llm.js";

export async function askAgent(
    mcpClient: any,
    userMessage: string
) {
    // 1. Discover MCP tools and convert them to Gemini function declarations format
    const { tools: mcpTools } = await mcpClient.listTools();

    // Gemini expects an array of function declarations under a `functionDeclarations` object
    const geminiTools = [{
        functionDeclarations: mcpTools.map((tool: any) => ({
            name: tool.name,
            description: tool.description ?? "",
            parameters: tool.inputSchema,
        }))
    }];

    // 2. Initialize the chat session with system instructions and user message
    const chat = ai.chats.create({
        model: MODEL,
        config: {
            systemInstruction: "You are a helpful Task Manager assistant. Use available tools when needed.",
            tools: geminiTools,
        }
    });

    // 3. Send the user message to start the agent loop
    let response = await chat.sendMessage({ message: userMessage });

    // 4. Agent Loop
    const MAX_ITERATIONS = 5;

    for (let i = 0; i <= MAX_ITERATIONS; i++) {
        // Check if Gemini requested any function calls
        const functionCalls = response.functionCalls;

        // If no function calls are requested, return the final text response
        if (!functionCalls || functionCalls.length === 0) {
            return response.text ?? "";
        }

        // 5. Execute requested tools and send their results back
        // Gemini's SDK handles sending multiple tool responses in a single turn via functionResponses
        const functionResponses = [];

        for (const call of functionCalls) {
            console.log(`Executing MCP tool: ${call.name}`);

            const result = await mcpClient.callTool({
                name: call.name,
                arguments: call.args
            });

            // Extract the text payload from MCP's content array
            const textContent = result.content?.[0]?.text;
            let toolOutput;

            try {
                // Parse if it's a JSON string (which your get_tasks tool returns via JSON.stringify)
                toolOutput = JSON.parse(textContent);
            } catch {
                toolOutput = textContent;
            }

            // Construct the proper Gemini function response structure
            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: { result: toolOutput }
                }
            });
        }

        // 6. Send the tool execution outputs back to the chat session
        response = await chat.sendMessage({
            message: functionResponses
        });
    }

    throw new Error("Agent exceeded maximum iterations");
}