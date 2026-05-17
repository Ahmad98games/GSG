// supabase/functions/deno.d.ts
/**
 * Local type definitions to suppress IDE errors when working on Supabase Edge Functions
 * in a non-Deno environment. These types are NOT used at runtime by Deno.
 */

// We use declare global to augment existing types if they exist, or provide them if they don't.
declare global {
  namespace Deno {
    export interface Env {
      get(key: string): string | undefined;
    }
    export const env: Env;
  }
}

// Ensure this file is treated as a module if we use 'export' or 'import', 
// otherwise keep it as a global declaration file.
export {};

