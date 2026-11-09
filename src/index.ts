import { McpServer } from "@modelcontextprotocol/server"
import { serveStdio } from "@modelcontextprotocol/server/stdio"

import * as zod from "zod/v4"

// ==================================
// 1. Domain / Data Layer
// ==================================

type TaskStatus = "todo" | "in_progress" | "completed";

type Task = {
    id: number;
    title: string;
    status: TaskStatus;
};

const tasks: Task[] = [
    {
        id: 1,
        title: "Learn MCP fundamentals",
        status: "completed",
    },
    {
        id: 2,
        title: "Build an MCP Server",
        status: "in_progress",
    },
    {
        id: 3,
        title: "Build an MCP Client",
        status: "todo",
    },
];

function getTasks(status?: TaskStatus): Task[] {
    if (!status) {
        return tasks;
    }

    return tasks.filter((task) => task.status === status);
}


// ==================================
// 3. MCP Server Factory
// ==================================

function createMcpServer() {
    const server = new McpServer({
        name: 'task-manager',
        version: '1.0.0',
        description: "MCP server for executing tools on task manager app",
        title: "Task Manager MCP Server"
    });

    // ==================================
    // 4. Tool Registration
    // ==================================

    server.registerTool(
        "get_tasks",
        {
            description: "List the created tasks. Optionally filter by status",
            inputSchema: zod.object({
                status: zod.enum(["todo", "in_progress", "completed"]).optional().describe("Optional task status filter.")
            }),
        },

        // ==================================
        // 5. Tool Execution Handler
        // ==================================

        async ({ status }) => {
            const result = getTasks(status);

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            }
        }
    )

    return server;
}

// ==================================
// 6. Start MCP Server over STDIO
// ==================================

void serveStdio(createMcpServer);

console.error("Task Manager MCP Server is running");