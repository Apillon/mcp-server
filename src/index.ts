#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { storageTools, handleStorageTool } from "./storage";
import { hostingTools, handleHostingTool } from "./hosting";
import { nftTools, handleNftTool } from "./nft";

// Initialize the MCP server
const server = new Server(
  { name: "apillon-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [...storageTools, ...hostingTools, ...nftTools],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Handle storage tools
    if (storageTools.some((tool) => tool.name === name)) {
      return await handleStorageTool(name, args);
    }

    // Handle hosting tools
    if (hostingTools.some((tool) => tool.name === name)) {
      return await handleHostingTool(name, args);
    }

    // Handle NFT tools
    if (nftTools.some((tool) => tool.name === name)) {
      return await handleNftTool(name, args);
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Error so it doesn't interfere with the MCP server stdio output
  console.error(`Apillon MCP Server v${process.env.npm_package_version} running on stdio`);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
