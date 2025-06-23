# Apillon MCP Server

[![npm version](https://badge.fury.io/js/@apillon%2Fmcp-server.svg)](https://badge.fury.io/js/@apillon%2Fmcp-server)

Welcome to the Apillon MCP Server repository. This project implements a server using the Model Context Protocol (MCP) to provide modules for Storage, Hosting, and NFT functionalities.

## Introduction to Model Context Protocol (MCP)

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to Large Language Models (LLMs). Think of MCP like a USB-C port for AI applications. Just as USB-C provides a standardized way to connect your devices to various peripherals and accessories, MCP provides a standardized way to connect AI models to different data sources and tools.

MCP helps you build agents and complex workflows on top of LLMs. LLMs frequently need to integrate with data and tools, and MCP provides:

- A growing list of pre-built integrations that your LLM can directly plug into.
- The flexibility to switch between LLM providers and vendors.
- Best practices for securing your data within your infrastructure.

For more information, visit the [Model Context Protocol Introduction](https://modelcontextprotocol.io/introduction).

## Project Overview

This project is developed by Apillon and provides a server implementation for the following modules:

### Storage Module
The Storage module provides comprehensive file management capabilities:
- Create and manage storage buckets
- Upload files and folders with support for directory structures
- List and manage objects (files and folders) within buckets
- Generate IPFS links for content addressing
- Manage IPNS records for persistent naming
- Delete files and directories
- Track file status and metadata

### Hosting Module
The Hosting module enables web application deployment:
- Create and manage website instances
- Upload website files from local folders or buffers
- Deploy to staging and production environments
- Monitor deployment status
- List and manage deployments
- Support for multiple deployment environments

### NFT Module
The NFT module provides comprehensive NFT management:
- Create NFT collections on various chains (EVM, Substrate, Unique)
- Configure collection parameters (name, symbol, royalties, etc.)
- Mint NFTs to specific addresses
- Support for nested NFTs (nestable collections)
- Burn/revoke NFTs (for revokable collections)
- Transfer collection ownership
- Monitor transaction status
- Support for drops with configurable parameters

## Using with Claude

To use this MCP with the Claude LLM, follow these steps:

1. **Install [Claude for Desktop](https://claude.ai/download)**

2. **Locate the Claude Desktop Configuration File**
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
  - Linux: `~/.config/Claude/claude_desktop_config.json`

3. **Add the Configuration**

Copy the configuration from [claude_desktop_config.json](./claude_desktop_config.json) and adjust it with your own parameters.

> ⚠️ **Important:** Make sure to modify the API key env variables and the allowed directories for the filesystem MCP.

```json
{
  "mcpServers": {
    "apillon-mcp-server": {
      "command": "npx",
      "args": ["-y", "@apillon/mcp-server"],
      "env": {
        "APILLON_API_KEY": "<APILLON_API_KEY>",
        "APILLON_API_SECRET": "<APILLON_API_SECRET>"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/your-username/Desktop"
      ]
    }
  }
}
```

4. **Restart Claude for Desktop**

After making these changes, restart Claude Desktop for the configuration to take effect.
You can now prompt Claude to perform any of the available actions using only the text chat.

## Local development

### Prerequisites

- Node.js 22 or higher
- npm 11 or higher
- TypeScript
- Apillon API key and secret (can be generated on https://app.apillon.io)

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Apillon/mcp-server.git
cd mcp-server
npm install
```

### Modify your local claude desktop config:
```json
{
  "mcpServers": {
    "apillon-mcp-server": {
      "command": "tsx",
      "args": ["/full/path/to/index.ts"],
      "env": {
        "APILLON_API_KEY": "<APILLON_API_KEY>",
        "APILLON_API_SECRET": "<APILLON_API_SECRET>"
      }
    }
  }
}

```
### Running the Server

**The preferred metho to test your server is to use Claude Dekstop with the above config.**
Alternatively, to start the server locally, use the following command,

```bash
npm start
```

### Building the Project

To build the project, run:

```bash
npm run build
```

## Contributing

We welcome contributions to the Apillon MCP Server. Please check the [issues](https://github.com/Apillon/mcp-server/issues) for any open tasks or bugs.

## License

This project is licensed under the MIT License.

## MCP Review

This MCP server is certified by [MCP review](https://mcpreview.com)

Visit our own [MCP Review page](https://mcpreview.com/mcp-servers/apillon/mcp-server)

## Contact

For more information, visit [Apillon's website](https://apillon.io) or reach out via [GitHub issues](https://github.com/Apillon/mcp-server/issues).

