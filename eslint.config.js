import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        // Browser APIs
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        File: "readonly",
        FileReader: "readonly",
        Image: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLDivElement: "readonly",
        HTMLParagraphElement: "readonly",
        HTMLHeadingElement: "readonly",
        HTMLTableElement: "readonly",
        HTMLTableSectionElement: "readonly",
        HTMLTableRowElement: "readonly",
        HTMLTableCellElement: "readonly",
        HTMLTableCaptionElement: "readonly",
        HTMLUListElement: "readonly",
        HTMLLIElement: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLSpanElement: "readonly",
        HTMLVideoElement: "readonly",
        Event: "readonly",
        KeyboardEvent: "readonly",
        React: "readonly",
        // Timing APIs
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Dialog APIs
        alert: "readonly",
        confirm: "readonly",
        // Performance API
        performance: "readonly",
        // Node.js APIs
        require: "readonly",
        NodeJS: "readonly",
        // Crypto API
        crypto: "readonly",
        // Abort APIs
        AbortController: "readonly",
        AbortSignal: "readonly",
        // Test globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        jest: "readonly",
        vi: "readonly",
        vitest: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // Relax strict rules for development
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off", // Use TypeScript version instead
      "no-undef": "off", // TypeScript handles this better
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "no-empty": "warn",
      "no-case-declarations": "warn",
      "no-control-regex": "warn",
      "no-redeclare": "warn",
    },
  },
];
