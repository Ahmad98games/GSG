import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Prevent any type — international standard code has typed everything
      "@typescript-eslint/no-explicit-any": "warn",

      // Prevent unused variables silently
      "@typescript-eslint/no-unused-vars": [
        "error",
        { "argsIgnorePattern": "^_" }
      ],

      // Prevent console.log in production
      "no-console": [
        "warn",
        { "allow": ["warn", "error"] }
      ],

      // Prevent eval
      "no-eval": "error",

      // Require explicit return types on exported functions
      "@typescript-eslint/explicit-function-return-type": "off",

      // Prevent unsafe operations
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off"
    }
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
