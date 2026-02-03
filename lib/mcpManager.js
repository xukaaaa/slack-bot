/**
 * MCP Manager - Multi-Server Support with URL Query Params
 * Manages multiple MCP servers with dynamic configuration
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load MCP configuration from file
 * @returns {Object} MCP servers configuration
 */
function loadMCPConfig() {
  try {
    const configPath = join(__dirname, '..', 'mcp-config.json');
    const configData = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);

    // Process env variables in config
    const processed = substituteEnvVariables(config.mcpServers || {});

    console.log('[MCP Manager] Loaded servers:', Object.keys(processed).join(', '));
    return processed;

  } catch (error) {
    console.warn('[MCP Manager] No config file, using default');

    // Fallback to Redmine only
    return {
      redmine: {
        url: 'https://redmine-mcp-server.vercel.app/api/mcp',
        params: {
          redmine_url: process.env.REDMINE_URL || '',
          api_key: process.env.REDMINE_API_KEY || ''
        }
      }
    };
  }
}

/**
 * Substitute ${ENV_VAR} with process.env values
 * @param {*} obj - Object to process
 * @returns {*} Processed object
 */
function substituteEnvVariables(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      return process.env[varName] || '';
    });
  }

  if (Array.isArray(obj)) {
    return obj.map(item => substituteEnvVariables(item));
  }

  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVariables(value);
    }
    return result;
  }

  return obj;
}

/**
 * Build URL with query params
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} Complete URL
 */
function buildURL(baseUrl, params = {}) {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.append(key, value);
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Call MCP server tool
 * @param {string} serverUrl - Complete server URL with params
 * @param {string} toolName - Tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} Tool result
 */
async function callMCPServerTool(serverUrl, toolName, args = {}) {
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    // Extract JSON from SSE format (handles multi-line JSON)
    const dataMatch = text.match(/data: ({[\s\S]*})/);

    if (!dataMatch) {
      throw new Error('Invalid SSE format');
    }

    const data = JSON.parse(dataMatch[1]);

    // Extract text content
    if (data.result?.content?.[0]?.text) {
      return {
        success: true,
        message: data.result.content[0].text,
        data: data.result.content[0].text
      };
    }

    return {
      success: true,
      data: data.result,
      message: 'Tool executed successfully'
    };

  } catch (error) {
    console.error('[MCP] Tool call error:', error.message);
    return {
      success: false,
      error: error.message,
      message: `Lỗi: ${error.message}`
    };
  }
}

/**
 * List tools from MCP server
 * @param {string} serverUrl - Complete server URL with params
 * @returns {Promise<Array>} List of tools
 */
async function listServerTools(serverUrl) {
  try {
    const response = await fetch(serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      })
    });

    const text = await response.text();
    // Extract JSON from SSE format (handles multi-line JSON)
    const dataMatch = text.match(/data: ({[\s\S]*})/);

    if (!dataMatch) {
      throw new Error('Invalid SSE format');
    }

    const data = JSON.parse(dataMatch[1]);

    return data.result?.tools || [];

  } catch (error) {
    console.error('[MCP] List tools error:', error);
    return [];
  }
}

/**
 * Discover all tools from all MCP servers
 * @returns {Promise<Object>} Tool registry
 */
export async function discoverAllMCPTools() {
  const mcpServers = loadMCPConfig();
  const toolRegistry = {};

  console.log('[MCP Manager] Discovering from', Object.keys(mcpServers).length, 'servers');

  for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
    try {
      const serverUrl = buildURL(serverConfig.url, serverConfig.params);
      console.log(`[MCP Manager] Connecting to ${serverName}`);

      const tools = await listServerTools(serverUrl);
      console.log(`[MCP Manager] ${serverName}: Found ${tools.length} tools`);

      for (const tool of tools) {
        const toolKey = `${serverName}_${tool.name}`;
        toolRegistry[toolKey] = {
          serverName,
          serverUrl,
          toolName: tool.name,
          description: tool.description || '',
          inputSchema: tool.inputSchema || {}
        };
      }

    } catch (error) {
      console.error(`[MCP Manager] Failed ${serverName}:`, error.message);
    }
  }

  console.log('[MCP Manager] Total tools:', Object.keys(toolRegistry).length);
  return toolRegistry;
}

/**
 * Call MCP tool
 * @param {string} toolKey - Format: "serverName_toolName"
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} Tool result
 */
export async function callMCPTool(toolKey, args = {}) {
  const toolRegistry = await discoverAllMCPTools();

  const toolInfo = toolRegistry[toolKey];
  if (!toolInfo) {
    return {
      success: false,
      error: 'Tool not found',
      message: `Tool ${toolKey} không tồn tại`
    };
  }

  console.log(`[MCP] Calling ${toolKey}:`, args);
  return await callMCPServerTool(toolInfo.serverUrl, toolInfo.toolName, args);
}
