import { Storage } from "@apillon/sdk";
import { ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Initialize Apillon Storage client
const apillonStorage = new Storage({
  apiUrl: "https://api.apillon.io",
  key: process.env.APILLON_API_KEY || "",
  secret: process.env.APILLON_API_SECRET || "",
});

// Schema definitions
export const CreateBucketArgsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export const ListBucketsArgsSchema = z.object({
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

export const ListObjectsArgsSchema = z.object({
  bucketUuid: z.string(),
  directoryUuid: z.string().optional(),
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

export const UploadFileArgsSchema = z.object({
  bucketUuid: z.string(),
  fileName: z.string(),
  filePath: z.string(),
  directoryPath: z.string().optional(),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Storage tools definition
export const storageTools = [
  {
    name: "create_bucket",
    description:
      "Create a new storage bucket in your Apillon account. " +
      "Returns the created bucket details including UUID, name, and creation date.",
    inputSchema: zodToJsonSchema(CreateBucketArgsSchema) as ToolInput,
  },
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
];

// Storage tool handlers
export async function handleStorageTool(name: string, args: any) {
  switch (name) {
    case "create_bucket": {
      const parsed = CreateBucketArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for create_bucket: ${parsed.error}`);
      }

      try {
        const bucket = await apillonStorage.createBucket({
          name: parsed.data.name,
          description: parsed.data.description,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(bucket, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to create bucket: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "list_buckets": {
      const parsed = ListBucketsArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for list_buckets: ${parsed.error}`);
      }

      try {
        const buckets = await apillonStorage.listBuckets({
          limit: parsed.data.limit,
          page: parsed.data.page,
          status: 5,
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
        throw new Error(`Invalid arguments for list_objects: ${parsed.error}`);
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
      throw new Error(`Unknown storage tool: ${name}`);
  }
}
