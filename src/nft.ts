import { Nft, CollectionType, EvmChain } from "@apillon/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ToolSchema } from "@modelcontextprotocol/sdk/types.js";

// Initialize Apillon NFT client
const apillonNft = new Nft({
  apiUrl: "https://api-dev.apillon.io",
  key: process.env.APILLON_API_KEY || "",
  secret: process.env.APILLON_API_SECRET || "",
});

// Schema definitions
export const ListCollectionsArgsSchema = z.object({
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

export const GetCollectionArgsSchema = z.object({
  uuid: z.string(),
});

export const CreateCollectionArgsSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  description: z.string().optional(),
  isRevokable: z.boolean(),
  isSoulbound: z.boolean(),
  isAutoIncrement: z.boolean().optional(),
  chain: z.enum(["MOONBEAM", "MOONBASE", "ASTAR"]),
  baseUri: z.string(),
  maxSupply: z.number().optional(),
  royaltiesAddress: z.string().optional(),
  royaltiesFees: z.number(),
  drop: z.boolean(),
  dropStart: z.number().optional(),
  dropPrice: z.number().optional(),
  dropReserve: z.number().optional(),
});

export const MintNftArgsSchema = z.object({
  collectionUuid: z.string(),
  quantity: z.number().optional().default(1),
  tokenId: z.number().optional(),
});

export const BurnNftArgsSchema = z.object({
  collectionUuid: z.string(),
  tokenId: z.string(),
});

export const TransferOwnershipArgsSchema = z.object({
  collectionUuid: z.string(),
  address: z.string(),
});

export const ListTransactionsArgsSchema = z.object({
  collectionUuid: z.string(),
  limit: z.number().optional().default(10),
  page: z.number().optional().default(0),
});

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

// NFT tools definition
export const nftTools = [
  {
    name: "list_collections",
    description:
      "List all NFT collections in your Apillon account. " +
      "Returns a list of collections with their details including UUID, name, and symbol.",
    inputSchema: zodToJsonSchema(ListCollectionsArgsSchema) as ToolInput,
  },
  {
    name: "get_collection",
    description:
      "Get details of a specific NFT collection by its UUID. " +
      "Returns detailed information about the collection including contract address and status.",
    inputSchema: zodToJsonSchema(GetCollectionArgsSchema) as ToolInput,
  },
  {
    name: "create_collection",
    description:
      "Create a new EVM NFT collection in your Apillon account. " +
      "Deploys a new smart contract for the collection.",
    inputSchema: zodToJsonSchema(CreateCollectionArgsSchema) as ToolInput,
  },
  {
    name: "mint_nft",
    description:
      "Mint new NFTs in a specific collection. " +
      "Optionally specify a token ID if the collection is not auto-increment.",
    inputSchema: zodToJsonSchema(MintNftArgsSchema) as ToolInput,
  },
  {
    name: "burn_nft",
    description:
      "Burn an NFT in a specific collection. " +
      "Only works if the collection is revokable.",
    inputSchema: zodToJsonSchema(BurnNftArgsSchema) as ToolInput,
  },
  {
    name: "transfer_ownership",
    description:
      "Transfer ownership of a collection to another address. " +
      "Once transferred, you cannot call mint methods anymore.",
    inputSchema: zodToJsonSchema(TransferOwnershipArgsSchema) as ToolInput,
  },
  {
    name: "list_transactions",
    description:
      "List all transactions for a specific NFT collection. " +
      "Returns a list of transactions with their status and details.",
    inputSchema: zodToJsonSchema(ListTransactionsArgsSchema) as ToolInput,
  },
];

// NFT tool handlers
export async function handleNftTool(name: string, args: any) {
  switch (name) {
    case "list_collections": {
      const parsed = ListCollectionsArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for list_collections: ${parsed.error}`
        );
      }

      try {
        const collections = await apillonNft.listCollections({
          limit: parsed.data.limit,
          page: parsed.data.page,
          status: 5,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(collections, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list collections: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "get_collection": {
      const parsed = GetCollectionArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for get_collection: ${parsed.error}`
        );
      }

      try {
        const collection = apillonNft.collection(parsed.data.uuid);
        const collectionDetails = await collection.get();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(collectionDetails, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to get collection: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "create_collection": {
      const parsed = CreateCollectionArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for create_collection: ${parsed.error}`
        );
      }

      try {
        // Map string chain to EvmChain enum
        const chainMap: Record<string, EvmChain> = {
          MOONBEAM: EvmChain.MOONBEAM,
          MOONBASE: EvmChain.MOONBASE,
          ASTAR: EvmChain.ASTAR,
        };

        const collection = await apillonNft.create({
          name: parsed.data.name,
          symbol: parsed.data.symbol,
          description: parsed.data.description,
          isRevokable: parsed.data.isRevokable,
          isSoulbound: parsed.data.isSoulbound,
          isAutoIncrement: parsed.data.isAutoIncrement,
          chain: chainMap[parsed.data.chain],
          collectionType: CollectionType.GENERIC,
          baseUri: parsed.data.baseUri,
          baseExtension: '.json',
          maxSupply: parsed.data.maxSupply,
          royaltiesAddress: parsed.data.royaltiesAddress,
          royaltiesFees: parsed.data.royaltiesFees,
          drop: parsed.data.drop,
          dropStart: parsed.data.dropStart,
          dropPrice: parsed.data.dropPrice,
          dropReserve: parsed.data.dropReserve,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(collection, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to create collection: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "mint_nft": {
      const parsed = MintNftArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for mint_nft: ${parsed.error}`
        );
      }

      try {
        const collection = apillonNft.collection(parsed.data.collectionUuid);
        const mintParams: any = {
          quantity: parsed.data.quantity,
        };

        if (parsed.data.tokenId !== undefined) {
          mintParams.tokenId = parsed.data.tokenId;
        }

        const result = await collection.mint(mintParams);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to mint NFT: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "burn_nft": {
      const parsed = BurnNftArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for burn_nft: ${parsed.error}`
        );
      }

      try {
        const collection = apillonNft.collection(parsed.data.collectionUuid);
        const result = await collection.burn(parsed.data.tokenId);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to burn NFT: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "transfer_ownership": {
      const parsed = TransferOwnershipArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for transfer_ownership: ${parsed.error}`
        );
      }

      try {
        const collection = apillonNft.collection(parsed.data.collectionUuid);
        const result = await collection.transferOwnership(parsed.data.address);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to transfer ownership: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    case "list_transactions": {
      const parsed = ListTransactionsArgsSchema.safeParse(args);
      if (!parsed.success) {
        throw new Error(
          `Invalid arguments for list_transactions: ${parsed.error}`
        );
      }

      try {
        const collection = apillonNft.collection(parsed.data.collectionUuid);
        const transactions = await collection.listTransactions({
          limit: parsed.data.limit,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(transactions, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(
          `Failed to list transactions: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    default:
      throw new Error(`Unknown NFT tool: ${name}`);
  }
}