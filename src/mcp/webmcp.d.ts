/**
 * Type declarations for the Web Model Context Protocol (WebMCP) API exposed
 * by Chrome as `navigator.modelContext` (and `document.modelContext` in some
 * builds). See https://github.com/webmachinelearning/webmcp
 *
 * This file is a global script declaration (no imports/exports) so the
 * augmentations apply project-wide.
 */

interface ModelContextToolDescriptor {
  /** Unique tool name in verb_noun form, e.g. "get_app_state". */
  name: string;
  /** Actionable description shown to connected agents. */
  description: string;
  /** JSON Schema (draft-07 subset) describing the tool arguments. */
  inputSchema: Record<string, unknown>;
  /** Tool implementation. Must return a JSON-serializable value. */
  execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

interface ModelContext {
  registerTool(tool: ModelContextToolDescriptor): void;
  getTools(): Promise<ModelContextToolDescriptor[]>;
  executeTool(name: string, args: unknown): Promise<unknown>;
}

interface Navigator {
  readonly modelContext?: ModelContext;
}

interface Document {
  readonly modelContext?: ModelContext;
}
