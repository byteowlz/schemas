#!/usr/bin/env bun

/**
 * Generate JSON Schema files from TypeScript/TypeBox definitions for pi-mono.
 * currently placed in the parent directory of pi-agent and run from there
 *
 * Generates into ../schemas/pi-agent/:
 * - settings.schema.json - Settings file schema
 * - models.schema.json - Custom models configuration schema
 * - auth.schema.json - Auth credentials schema
 *
 * Usage: bun run generate-schemas.ts
 */

import { Type, type TSchema } from "@sinclair/typebox";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const schemasDir = join(__dirname, "../schemas/pi-agent");

// =============================================================================
// Settings Schema (from settings-manager.ts)
// =============================================================================

const CompactionSettingsSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean({ description: "Enable automatic context compaction (default: true)" })),
    reserveTokens: Type.Optional(
      Type.Number({ description: "Tokens reserved for prompt + LLM response (default: 16384)" }),
    ),
    keepRecentTokens: Type.Optional(
      Type.Number({ description: "Tokens to keep from recent messages (default: 20000)" }),
    ),
  },
  { additionalProperties: false },
);

const BranchSummarySettingsSchema = Type.Object(
  {
    reserveTokens: Type.Optional(
      Type.Number({ description: "Tokens reserved for prompt + LLM response (default: 16384)" }),
    ),
  },
  { additionalProperties: false },
);

const RetrySettingsSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean({ description: "Enable automatic retries on transient errors (default: true)" })),
    maxRetries: Type.Optional(Type.Number({ description: "Maximum retry attempts (default: 3)" })),
    baseDelayMs: Type.Optional(
      Type.Number({ description: "Base delay for exponential backoff in ms (default: 2000)" }),
    ),
  },
  { additionalProperties: false },
);

const TerminalSettingsSchema = Type.Object(
  {
    showImages: Type.Optional(
      Type.Boolean({ description: "Show images in terminal if supported (default: true)" }),
    ),
  },
  { additionalProperties: false },
);

const ImageSettingsSchema = Type.Object(
  {
    autoResize: Type.Optional(
      Type.Boolean({ description: "Resize images to 2000x2000 max for better model compatibility (default: true)" }),
    ),
    blockImages: Type.Optional(
      Type.Boolean({ description: "Prevent all images from being sent to LLM providers (default: false)" }),
    ),
  },
  { additionalProperties: false },
);

const ThinkingBudgetsSettingsSchema = Type.Object(
  {
    minimal: Type.Optional(Type.Number({ description: "Token budget for minimal thinking level" })),
    low: Type.Optional(Type.Number({ description: "Token budget for low thinking level" })),
    medium: Type.Optional(Type.Number({ description: "Token budget for medium thinking level" })),
    high: Type.Optional(Type.Number({ description: "Token budget for high thinking level" })),
  },
  { additionalProperties: false },
);

const MarkdownSettingsSchema = Type.Object(
  {
    codeBlockIndent: Type.Optional(Type.String({ description: 'Indentation for code blocks (default: "  ")' })),
  },
  { additionalProperties: false },
);

const PackageSourceObjectSchema = Type.Object(
  {
    source: Type.String({ description: "npm package name or git URL" }),
    extensions: Type.Optional(Type.Array(Type.String(), { description: "Filter to specific extensions" })),
    skills: Type.Optional(Type.Array(Type.String(), { description: "Filter to specific skills" })),
    prompts: Type.Optional(Type.Array(Type.String(), { description: "Filter to specific prompt templates" })),
    themes: Type.Optional(Type.Array(Type.String(), { description: "Filter to specific themes" })),
  },
  { additionalProperties: false },
);

const PackageSourceSchema = Type.Union([
  Type.String({ description: "npm package name or git URL (loads all resources)" }),
  PackageSourceObjectSchema,
]);

const SettingsSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String({ description: "JSON Schema reference" })),
    lastChangelogVersion: Type.Optional(Type.String({ description: "Last seen changelog version (internal use)" })),
    defaultProvider: Type.Optional(Type.String({ description: "Default LLM provider (e.g., 'anthropic', 'openai')" })),
    defaultModel: Type.Optional(Type.String({ description: "Default model ID (e.g., 'claude-sonnet-4-20250514')" })),
    defaultThinkingLevel: Type.Optional(
      Type.Union(
        [
          Type.Literal("off"),
          Type.Literal("minimal"),
          Type.Literal("low"),
          Type.Literal("medium"),
          Type.Literal("high"),
          Type.Literal("xhigh"),
        ],
        { description: "Default thinking/reasoning level for models that support it" },
      ),
    ),
    steeringMode: Type.Optional(
      Type.Union([Type.Literal("all"), Type.Literal("one-at-a-time")], {
        description: "How to handle multiple steering messages (default: 'one-at-a-time')",
      }),
    ),
    followUpMode: Type.Optional(
      Type.Union([Type.Literal("all"), Type.Literal("one-at-a-time")], {
        description: "How to handle multiple follow-up messages (default: 'one-at-a-time')",
      }),
    ),
    theme: Type.Optional(Type.String({ description: "Theme name (e.g., 'dark', 'light', 'solarized')" })),
    compaction: Type.Optional(CompactionSettingsSchema),
    branchSummary: Type.Optional(BranchSummarySettingsSchema),
    retry: Type.Optional(RetrySettingsSchema),
    hideThinkingBlock: Type.Optional(
      Type.Boolean({ description: "Hide the thinking/reasoning block in output (default: false)" }),
    ),
    shellPath: Type.Optional(Type.String({ description: "Custom shell path (e.g., for Cygwin users on Windows)" })),
    quietStartup: Type.Optional(Type.Boolean({ description: "Suppress startup messages (default: false)" })),
    shellCommandPrefix: Type.Optional(
      Type.String({
        description: 'Prefix prepended to every bash command (e.g., "shopt -s expand_aliases" for alias support)',
      }),
    ),
    collapseChangelog: Type.Optional(
      Type.Boolean({ description: "Show condensed changelog after update (default: false)" }),
    ),
    packages: Type.Optional(
      Type.Array(PackageSourceSchema, { description: "npm/git packages to load extensions, skills, prompts, themes from" }),
    ),
    extensions: Type.Optional(Type.Array(Type.String(), { description: "Local extension file paths or directories" })),
    skills: Type.Optional(Type.Array(Type.String(), { description: "Local skill file paths or directories" })),
    prompts: Type.Optional(Type.Array(Type.String(), { description: "Local prompt template paths or directories" })),
    themes: Type.Optional(Type.Array(Type.String(), { description: "Local theme file paths or directories" })),
    enableSkillCommands: Type.Optional(
      Type.Boolean({ description: "Register skills as /skill:name commands (default: true)" }),
    ),
    terminal: Type.Optional(TerminalSettingsSchema),
    images: Type.Optional(ImageSettingsSchema),
    enabledModels: Type.Optional(
      Type.Array(Type.String(), { description: "Model patterns for cycling (same format as --models CLI flag)" }),
    ),
    doubleEscapeAction: Type.Optional(
      Type.Union([Type.Literal("fork"), Type.Literal("tree")], {
        description: 'Action for double-escape with empty editor (default: "tree")',
      }),
    ),
    thinkingBudgets: Type.Optional(ThinkingBudgetsSettingsSchema),
    editorPaddingX: Type.Optional(
      Type.Number({ minimum: 0, maximum: 3, description: "Horizontal padding for input editor (default: 0)" }),
    ),
    showHardwareCursor: Type.Optional(
      Type.Boolean({ description: "Show terminal cursor while still positioning it for IME (default: false)" }),
    ),
    markdown: Type.Optional(MarkdownSettingsSchema),
  },
  {
    $id: "https://buildwithpi.ai/schemas/settings.schema.json",
    title: "Pi Coding Agent Settings",
    description: "Configuration file for pi coding agent (~/.pi/agent/settings.json or .pi/settings.json)",
    additionalProperties: false,
  },
);

// =============================================================================
// Models Schema (from model-registry.ts)
// =============================================================================

const OpenRouterRoutingSchema = Type.Object(
  {
    only: Type.Optional(Type.Array(Type.String(), { description: "Only use these providers" })),
    order: Type.Optional(Type.Array(Type.String(), { description: "Prefer providers in this order" })),
  },
  { additionalProperties: false },
);

const OpenAICompletionsCompatSchema = Type.Object(
  {
    supportsStore: Type.Optional(Type.Boolean({ description: "Supports store parameter" })),
    supportsDeveloperRole: Type.Optional(Type.Boolean({ description: "Supports developer role messages" })),
    supportsReasoningEffort: Type.Optional(Type.Boolean({ description: "Supports reasoning_effort parameter" })),
    supportsUsageInStreaming: Type.Optional(Type.Boolean({ description: "Reports usage in streaming responses" })),
    maxTokensField: Type.Optional(
      Type.Union([Type.Literal("max_completion_tokens"), Type.Literal("max_tokens")], {
        description: "Which field to use for max tokens",
      }),
    ),
    requiresToolResultName: Type.Optional(Type.Boolean({ description: "Requires name field in tool results" })),
    requiresAssistantAfterToolResult: Type.Optional(
      Type.Boolean({ description: "Requires assistant message after tool result" }),
    ),
    requiresThinkingAsText: Type.Optional(Type.Boolean({ description: "Requires thinking content as text" })),
    requiresMistralToolIds: Type.Optional(Type.Boolean({ description: "Requires Mistral-style tool IDs" })),
    thinkingFormat: Type.Optional(
      Type.Union([Type.Literal("openai"), Type.Literal("zai")], { description: "Thinking block format" }),
    ),
    openRouterRouting: Type.Optional(OpenRouterRoutingSchema),
  },
  { additionalProperties: false },
);

const OpenAIResponsesCompatSchema = Type.Object({}, { additionalProperties: false, description: "Reserved for future use" });

const OpenAICompatSchema = Type.Union([OpenAICompletionsCompatSchema, OpenAIResponsesCompatSchema], {
  description: "OpenAI API compatibility settings",
});

const ModelCostSchema = Type.Object(
  {
    input: Type.Number({ description: "Cost per million input tokens in USD" }),
    output: Type.Number({ description: "Cost per million output tokens in USD" }),
    cacheRead: Type.Number({ description: "Cost per million cached input tokens in USD" }),
    cacheWrite: Type.Number({ description: "Cost per million cache write tokens in USD" }),
  },
  { additionalProperties: false },
);

const ModelDefinitionSchema = Type.Object(
  {
    id: Type.String({ minLength: 1, description: "Model ID (e.g., 'gpt-4o')" }),
    name: Type.String({ minLength: 1, description: "Display name (e.g., 'GPT-4o')" }),
    api: Type.Optional(
      Type.String({
        minLength: 1,
        description: "API type (overrides provider-level api). E.g., 'openai-chat-stream', 'anthropic-stream'",
      }),
    ),
    reasoning: Type.Boolean({ description: "Whether the model supports extended thinking/reasoning" }),
    input: Type.Array(Type.Union([Type.Literal("text"), Type.Literal("image")]), {
      description: "Supported input modalities",
    }),
    cost: ModelCostSchema,
    contextWindow: Type.Number({ minimum: 1, description: "Maximum context window size in tokens" }),
    maxTokens: Type.Number({ minimum: 1, description: "Maximum output tokens" }),
    headers: Type.Optional(
      Type.Record(Type.String(), Type.String(), { description: "Custom headers for this model (overrides provider headers)" }),
    ),
    compat: Type.Optional(OpenAICompatSchema),
  },
  { additionalProperties: false },
);

const ProviderConfigSchema = Type.Object(
  {
    baseUrl: Type.Optional(Type.String({ minLength: 1, description: "Base URL for API requests" })),
    apiKey: Type.Optional(
      Type.String({
        minLength: 1,
        description: "API key, env var name, or shell command (prefix with !). E.g., 'OPENAI_API_KEY' or '!op read ...'",
      }),
    ),
    api: Type.Optional(
      Type.String({
        minLength: 1,
        description: "Default API type for all models. E.g., 'openai-chat-stream', 'anthropic-stream'",
      }),
    ),
    headers: Type.Optional(
      Type.Record(Type.String(), Type.String(), {
        description: "Custom headers for all models. Values can be env var names or shell commands (prefix with !)",
      }),
    ),
    authHeader: Type.Optional(
      Type.Boolean({ description: "Add Authorization: Bearer header with resolved apiKey (default: false)" }),
    ),
    models: Type.Optional(Type.Array(ModelDefinitionSchema, { description: "Custom model definitions" })),
  },
  { additionalProperties: false },
);

const ModelsConfigSchema = Type.Object(
  {
    $schema: Type.Optional(Type.String({ description: "JSON Schema reference" })),
    providers: Type.Record(Type.String(), ProviderConfigSchema, {
      description: "Provider configurations keyed by provider name",
    }),
  },
  {
    $id: "https://buildwithpi.ai/schemas/models.schema.json",
    title: "Pi Coding Agent Models Configuration",
    description: "Custom models and provider configuration (~/.pi/agent/models.json)",
    additionalProperties: false,
  },
);

// =============================================================================
// Auth Schema (from auth-storage.ts and pi-ai OAuthCredentials)
// =============================================================================

const ApiKeyCredentialSchema = Type.Object(
  {
    type: Type.Literal("api_key"),
    key: Type.String({ description: "The API key value" }),
  },
  { additionalProperties: false },
);

// OAuthCredentials from pi-ai uses: refresh, access, expires, plus [key: string]: unknown
const OAuthCredentialSchema = Type.Object(
  {
    type: Type.Literal("oauth"),
    access: Type.String({ description: "OAuth access token" }),
    refresh: Type.String({ description: "OAuth refresh token" }),
    expires: Type.Number({ description: "Token expiration timestamp (ms since epoch)" }),
    // Provider-specific fields (e.g., accountId for openai-codex)
    accountId: Type.Optional(Type.String({ description: "Account ID (provider-specific)" })),
  },
  { additionalProperties: true, description: "OAuth credentials (may include provider-specific fields)" },
);

const AuthCredentialSchema = Type.Union([ApiKeyCredentialSchema, OAuthCredentialSchema], {
  description: "Credential entry (API key or OAuth tokens)",
});

const AuthStorageSchema = Type.Record(Type.String(), AuthCredentialSchema, {
  $id: "https://buildwithpi.ai/schemas/auth.schema.json",
  title: "Pi Coding Agent Auth Storage",
  description: "Credential storage for API keys and OAuth tokens (~/.pi/agent/auth.json)",
});

// =============================================================================
// Schema Generation
// =============================================================================

/**
 * Convert TypeBox schema to JSON Schema.
 * TypeBox schemas are already JSON Schema compatible, we just need to
 * add the $schema property and clean up any TypeBox-specific properties.
 */
function toJsonSchema(schema: TSchema, title: string, description: string): object {
  // Deep clone to avoid modifying original
  const jsonSchema = JSON.parse(JSON.stringify(schema));

  // Add JSON Schema draft reference
  jsonSchema.$schema = "http://json-schema.org/draft-07/schema#";

  // Use title/description from schema if present, otherwise use provided values
  if (!jsonSchema.title) jsonSchema.title = title;
  if (!jsonSchema.description) jsonSchema.description = description;

  // Remove TypeBox-specific properties recursively
  function cleanSchema(obj: Record<string, unknown>): void {
    if (typeof obj !== "object" || obj === null) return;

    // Remove TypeBox internal symbols (they show up as [Symbol.for(...)] keys)
    for (const key of Object.keys(obj)) {
      if (key.startsWith("[Symbol")) {
        delete obj[key];
      }
    }

    // Recurse into nested objects and arrays
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === "object" && item !== null) {
            cleanSchema(item as Record<string, unknown>);
          }
        }
      } else if (typeof value === "object" && value !== null) {
        cleanSchema(value as Record<string, unknown>);
      }
    }
  }

  cleanSchema(jsonSchema);
  return jsonSchema;
}

function writeSchema(filename: string, schema: object): void {
  const path = join(schemasDir, filename);
  writeFileSync(path, JSON.stringify(schema, null, "\t") + "\n");
  console.log(`Generated: ${path}`);
}

// Main
mkdirSync(schemasDir, { recursive: true });

writeSchema(
  "settings.schema.json",
  toJsonSchema(SettingsSchema, "Pi Coding Agent Settings", "Configuration file for pi coding agent"),
);

writeSchema(
  "models.schema.json",
  toJsonSchema(ModelsConfigSchema, "Pi Coding Agent Models Configuration", "Custom models and provider configuration"),
);

writeSchema(
  "auth.schema.json",
  toJsonSchema(AuthStorageSchema, "Pi Coding Agent Auth Storage", "Credential storage for API keys and OAuth tokens"),
);

console.log("\nDone! Add $schema to your config files for IDE validation:");
console.log('  settings.json: "$schema": "./schemas/settings.schema.json"');
console.log('  models.json:   "$schema": "./schemas/models.schema.json"');
console.log('  auth.json:     "$schema": "./schemas/auth.schema.json"');
