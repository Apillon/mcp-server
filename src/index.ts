#!/usr/bin/env node
import { Storage } from "@apillon/sdk";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const apillonStorage = new Storage({
  apiUrl: "https://api-dev.apillon.io",
  key: process.env.APILLON_API_KEY || "",
  secret: process.env.APILLON_API_SECRET || "",
});

const ListBucketsArgsSchema = z.object({
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

const ListObjectsArgsSchema = z.object({
  bucketUuid: z.string(),
  directoryUuid: z.string().optional(),
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

const UploadFileArgsSchema = z.object({
  bucketUuid: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  directoryPath: z.string().optional(),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const server = new Server(
  { name: "apillon-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_buckets",
      description:
        "List all storage buckets in your Apillon account. " +
        "Returns a list of buckets with their details including UUID, name, and creation date.",
      inputSchema: zodToJsonSchema(ListBucketsArgsSchema) as ToolInput,
    },
    {
      name: "list_objects",
      description:
        "List objects (files and directories) in a specific bucket. " +
        "Optionally filter by directory UUID. Returns a list of objects with their details.",
      inputSchema: zodToJsonSchema(ListObjectsArgsSchema) as ToolInput,
    },
    {
      name: "upload_file",
      description:
        "Upload a file to a specific bucket. " +
        "Optionally specify a directory path within the bucket. Returns the uploaded file details.",
      inputSchema: zodToJsonSchema(UploadFileArgsSchema) as ToolInput,
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "list_buckets": {
        const parsed = ListBucketsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for list_buckets: ${parsed.error}`
          );
        }

        try {
          const buckets = await apillonStorage.listBuckets({
            limit: parsed.data.limit,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(buckets, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to list buckets: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
      case "list_objects": {
        const parsed = ListObjectsArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for list_objects: ${parsed.error}`
          );
        }

        try {
          const bucket = apillonStorage.bucket(parsed.data.bucketUuid);
          const objects = await bucket.listObjects({
            directoryUuid: parsed.data.directoryUuid,
            limit: parsed.data.limit,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(objects, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to list objects: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
      case "upload_file": {
        const parsed = UploadFileArgsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for upload_file: ${parsed.error}`);
        }

        try {
          const bucket = apillonStorage.bucket(parsed.data.bucketUuid);
          const fileBuffer = await fs.readFile(parsed.data.filePath);

          const uploadResult = await bucket.uploadFiles(
            [
              {
                fileName: parsed.data.fileName,
                contentType: "application/octet-stream",
                content: fileBuffer,
              },
            ],
            parsed.data.directoryPath
              ? { directoryPath: parsed.data.directoryPath }
              : undefined
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(uploadResult, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `Failed to upload file: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
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
  console.error("Apillon MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
