import OpenAI from "openai";
import { llm, MODEL } from "./llm.js";

export async function askAgent(
    mcpClient: any,
    userMessage: string
) {
    // 1. Discover MCP tools
    const { tools: mcpTools } = await mcpClient.listTools()

    // 2. Convert MCP tools to LLM tools
    const llmTools: OpenAI.Chat.Completions.ChatCompletionTool[] =
        mcpTools.map((tool: any) => ({
            type: "function",
            function: {
                name: tool.name,
                description: tool.description ?? "",
                parameters: tool.inputSchema,
            },
        }));

    // 3. Initialize conversation
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: "You are a helpful Task Manager assistant. Use available tools when needed.",
        },
        {
            role: "user",
            content: userMessage
        }
    ]

    // 4. Agent Loop
    const MAX_ITERATIONS = 5

    for (let i = 0; i <= MAX_ITERATIONS; i++) {
        const response = await llm.chat.completions.create({
            model: MODEL,
            messages,
            tools: llmTools,
        });
        const assistantMessage: any = response.choices[0]?.message;

        // Save the assistant response
        messages.push(assistantMessage);

        // 5. No tool call: return final answer
        if (!assistantMessage.tool_calls?.length)
            return assistantMessage.content ?? ""

        // 6. Execute requested tools
        for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArguments = JSON.parse(toolCall.function.arguments)

            console.log(`Executing MCP tool: ${toolName}`);

            const result = await mcpClient.callTool({
                name: toolName,
                arguments: toolArguments
            })

            // 7. Send tool result back to LLM
            messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: JSON.stringify(result.content)
            })
        }

        throw new Error("Agent exceeded maximum iterations");
    }

}