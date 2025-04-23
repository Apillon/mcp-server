import { DeployToEnvironment, Hosting } from "@apillon/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolSchema } from "@modelcontextprotocol/sdk/types.js";

// Initialize Apillon Hosting client
const apillonHosting = new Hosting({
  apiUrl: "https://api.apillon.io",
  key: process.env.APILLON_API_KEY || "",
  secret: process.env.APILLON_API_SECRET || "",
});

// Schema definitions
export const ListWebsitesArgsSchema = z.object({
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

export const GetWebsiteArgsSchema = z.object({
  uuid: z.string(),
});

export const CreateWebsiteArgsSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  domain: z.string().optional(),
  bucketUuid: z.string(),
});

export const UploadWebsiteFilesArgsSchema = z.object({
  websiteUuid: z.string(),
  folderPath: z.string(),
});

export const DeployWebsiteArgsSchema = z.object({
  websiteUuid: z.string(),
  environment: z.enum(["staging", "production"]),
});

export const ListDeploymentsArgsSchema = z.object({
  websiteUuid: z.string(),
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// Hosting tools definition
export const hostingTools = [
  {
    name: "list_websites",
    description:
      "List all websites in your Apillon account. " +
      "Returns a list of websites with their details including UUID, name, and domain.",
    inputSchema: zodToJsonSchema(ListWebsitesArgsSchema) as ToolInput,
  },
  {
    name: "get_website",
    description:
      "Get details of a specific website by its UUID. " +
      "Returns detailed information about the website including deployment status.",
    inputSchema: zodToJsonSchema(GetWebsiteArgsSchema) as ToolInput,
  },
  {
    name: "upload_website_files",
    description:
      "Upload website files from a local folder to a specific website. " +
      "The files will be uploaded to the website's associated bucket.",
    inputSchema: zodToJsonSchema(UploadWebsiteFilesArgsSchema) as ToolInput,
  },
  {
    name: "deploy_website",
    description:
      "Deploy a website to a specific environment (staging or production). " +
      "Returns information about the deployment process.",
    inputSchema: zodToJsonSchema(DeployWebsiteArgsSchema) as ToolInput,
  },
  {
    name: "list_deployments",
    description:
      "List all deployments for a specific website. " +
      "Returns a list of deployments with their status and details.",
    inputSchema: zodToJsonSchema(ListDeploymentsArgsSchema) as ToolInput,
  },
];

// Hosting tool handlers
export async function handleHostingTool(name: string, args: any) {
  switch (name) {
    case "list_websites": {
      const parsed = ListWebsitesArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for list_websites: ${parsed.error}`);
      }

      try {
        const websites = await apillonHosting.listWebsites({
          limit: parsed.data.limit,
          page: parsed.data.page,
          status: 5,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(websites, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list websites: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "get_website": {
      const parsed = GetWebsiteArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(`Invalid arguments for get_website: ${parsed.error}`);
      }

      try {
        const website = apillonHosting.website(parsed.data.uuid);
        const websiteDetails = await website.get();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(websiteDetails, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to get website: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "upload_website_files": {
      const parsed = UploadWebsiteFilesArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for upload_website_files: ${parsed.error}`
        );
      }

      try {
        const website = apillonHosting.website(parsed.data.websiteUuid);
        await website.uploadFromFolder(parsed.data.folderPath);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { success: true, message: "Files uploaded successfully" },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to upload website files: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "deploy_website": {
      const parsed = DeployWebsiteArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for deploy_website: ${parsed.error}`
        );
      }

      try {
        const website = apillonHosting.website(parsed.data.websiteUuid);

        // Map string to DeployToEnvironment enum
        const environmentMap: Record<string, DeployToEnvironment> = {
          staging: DeployToEnvironment.TO_STAGING,
          production: DeployToEnvironment.DIRECTLY_TO_PRODUCTION,
        };

        const deployment = await website.deploy(
          environmentMap[parsed.data.environment]
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deployment, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to deploy website: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "list_deployments": {
      const parsed = ListDeploymentsArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for list_deployments: ${parsed.error}`
        );
      }

      try {
        const website = apillonHosting.website(parsed.data.websiteUuid);
        const deployments = await website.listDeployments({
          limit: parsed.data.limit,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(deployments, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list deployments: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    default:
      throw new Error(`Unknown hosting tool: ${name}`);
  }
}
