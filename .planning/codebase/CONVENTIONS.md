# Coding Conventions

**Analysis Date:** 2026-03-01

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension (e.g., `MintStageCard.tsx`, `WalletSelector.tsx`)
- Hooks: camelCase with `use` prefix and `.ts` extension (e.g., `useCollectionNFTs.ts`, `useTransaction.ts`)
- Utilities: camelCase with `.ts` extension (e.g., `utils.ts`, `networks.ts`)
- Routes: kebab-case for path segments, PascalCase component (e.g., `collections.$collectionId.tsx`)
- Types/Interfaces: Files named after what they export (e.g., `fragment-masking.ts`)

**Functions:**
- camelCase for all function names
- Hooks use `use` prefix: `useCollectionNFTs`, `useTransaction`, `useClients`
- Helper functions use descriptive verbs: `getOrderBy()`, `getWhere()`, `extractTokenIds()`, `normalizeHexAddress()`
- React components use PascalCase: `RouteComponent`, `MiniAppWalletDisplay`, `WalletRow`

**Variables:**
- camelCase for all variables and constants
- Boolean variables often prefixed with `is` or `has`: `isActive`, `isPast`, `isLoadingNativeBalance`, `hasProperties`
- Map/Collection variables descriptive: `traitMap`, `valueMap`, `reductionTokenIds`
- State setter follows `set[Name]` pattern: `setMintAmount`, `setWalletSelectorModalOpen`, `setSelectedNFT`

**Types:**
- Interfaces: PascalCase, prefixed with name of component/hook (e.g., `MintStageCardProps`, `WalletSelectorProps`, `NFTQueryParams`)
- Type aliases: PascalCase (e.g., `CollectionSearch`, `TraitFilter`, `NFTQueryFilter`)
- GraphQL types: Auto-generated, PascalCase with descriptive purpose (e.g., `Current_Token_Ownerships_V2_Bool_Exp`)
- `interface` for component props, `type` for data structures and type aliases

## Code Style

**Formatting:**
- Prettier 3.5.3 with configuration in `prettier.config.js`
- Print width: 140 characters
- Trailing commas: all
- Indentation: 2 spaces (Prettier default)

**Linting:**
- ESLint 9.28.0 with TanStack config (`@tanstack/eslint-config`)
- Ignores: `vite.config.js`, `eslint.config.js`, `prettier.config.js`, `src/components/ui`, `src/abi`, `.vscode`
- Configuration in `eslint.config.js` (flat config format)

**TypeScript:**
- Target: ES2022
- Module: ESNext
- Strict mode enabled: `"strict": true`
- Unused locals/parameters flagged: `"noUnusedLocals": true`, `"noUnusedParameters": true`
- Module resolution: bundler
- JSX: react-jsx (automatic runtime, no React import needed in JSX files)

## Import Organization

**Order:**
1. React and framework imports (React, hooks from libraries)
2. Type imports from libraries (`import type { ... }`)
3. Internal absolute path imports using `@/` alias
4. Relative imports (less common, absolute preferred)
5. Styles

**Path Aliases:**
- `@/*` → `./src/*` (defined in `tsconfig.json` and `vite.config.js`)
- Special alias: `@initia/initia.js` → `./src/lib/initia-stub.ts` (stub for unneeded module)

**Example Pattern** (from `src/components/MintStageCard.tsx`):
```typescript
import { useState } from "react";
import { toast } from "sonner";
import type { MintStageInfo } from "@/hooks/useMintStages";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/GlassCard";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

## Error Handling

**Patterns:**
- Try-catch blocks with generic error message fallback
- Type assertion `as any` for error objects to safely access `.message` property
- Toast notifications for user-facing errors using `sonner` library
- Error logging via `console.log()` (minimal, used in `WalletProvider.tsx`)
- Error state stored in React state for recovery: `const [error, setError] = useState<Error | null>(null)`

**Example** (from `src/hooks/useTransaction.ts`):
```typescript
try {
  const pending = transaction();
  if (!pending) throw new Error("Transaction not available");
  tx = await pending;
  result = await aptos.waitForTransaction({ transactionHash: tx.hash });
  return { tx, result };
} catch (err: any) {
  if (showError) {
    toast.error(err?.message || String(err));
  }
  setError(err);
  throw err;
} finally {
  setTransactionInProgress(false);
}
```

**Throwing Errors:**
- Explicit error messages: `throw new Error("Transaction not available")`
- Error messages are user-friendly and descriptive
- Router redirects throw structured errors: `throw redirect({ to: "/mint" })`

## Logging

**Framework:** console (native browser API)

**Patterns:**
- Minimal logging in production code
- Only logged in error handlers (`console.log("error", error)` in `WalletProvider.tsx`)
- No debug logging or verbose tracing observed
- For async operations, errors are caught and handled via toast/error state

## Comments

**When to Comment:**
- Class/function purpose: JSDoc for public methods
- Complex algorithm explanation: Comments above helper functions (e.g., trait aggregation)
- TODO items: Mark temporary solutions (e.g., `// TODO: This is a temporary solution to aggregate traits. We need to aggregate on the server side.`)
- Intent for non-obvious code: Explain why, not what (e.g., `// Skip non-trait properties (like image, description, etc.)`)

**JSDoc/TSDoc:**
- Used for class documentation (e.g., `DualModeWalletClient`)
- Parameter and return type description in class methods
- Component/hook documentation: Comments above definitions

**Example** (from `src/lib/DualModeWalletClient.ts`):
```typescript
/**
 * Routes transactions to either the Movement Mini App SDK or the standard
 * wallet adapter, providing a unified `useABI()` interface identical to Surf's
 * WalletClient. Despite the method name, `useABI()` is NOT a React hook -- it
 * returns a Proxy object (matching Surf's naming convention).
 */
export class DualModeWalletClient {
  // ...
}
```

## Function Design

**Size:**
- Generally 5-50 lines for most functions
- Large components (200+ lines) are acceptable for route handlers: `collections.$collectionId.tsx` (241 lines)
- Helper functions are extracted to reduce component size
- Inline helper functions in components for single-use logic (e.g., `extractTokenIds()` in `MintStageCard.tsx`)

**Parameters:**
- Props interface for components: Single destructured object parameter with type definition
- Hook parameters: Optional object with defaults (e.g., `{ showError = true }` in `useTransaction`)
- Utility functions: Typed parameters, no optional chaining defaults
- Generics used for reusable logic: `useQuery<T>`, `executeTransaction<T>`

**Return Values:**
- Components return JSX or null (conditional rendering pattern)
- Hooks return objects with destructurable properties: `{ transactionInProgress, error, executeTransaction }`
- Query hooks return `useQuery` result with typed data
- Async functions return Promise<T> with explicit type

**Example** (from `src/hooks/useCollectionNFTs.ts`):
```typescript
export const useCollectionNFTs = (params: NFTQueryParams) => {
  const { address, connected } = useMovementWallet();
  // ... setup code ...
  return useQuery({
    queryKey: ["nfts", address, params],
    enabled: (params.enabled ?? true) && (!params.onlyOwned || (!!address && connected)),
    staleTime: 1000 * 60,
    queryFn: async () => {
      const where = getWhere(params, address);
      const res = await executeGraphQL(query, { where, orderBy, limit, offset });
      return res;
    },
  });
};
```

## Module Design

**Exports:**
- Named exports preferred: `export function MintStageCard()`, `export const useCollectionNFTs`
- One main export per file (component or hook)
- Utility files export multiple functions: `export function cn()`, `export function aptToOapt()`, `export function oaptToApt()`
- Types exported separately: `export interface MintStageCardProps`

**Barrel Files:**
- Not observed in this codebase
- Components and hooks imported directly from their files
- UI components imported from `src/components/ui/` (Radix-based)

**Example** (from `src/lib/utils.ts`):
```typescript
export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

export function aptToOapt(apt: string | number): number {
  return Math.round(Number(apt) * 1e8);
}

export function oaptToApt(oapt: string | number): number {
  return Number(oapt) / 1e8;
}

export function toShortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const normalizeHexAddress = (hex: string): string => {
  const hexPart = hex.slice(2);
  const normalizedHex = hexPart.padStart(64, "0");
  return `0x${normalizedHex}`;
};
```

## Type Assertion Patterns

**When Used:**
- Casting generic SDK types: `as any` for Surf ABIs when type system can't infer
- Casting union types for specific branches: `as AvailableWallets`
- Casting response shapes: `as { hash: string }`
- GraphQL type narrowing with `as Order_By`, `as const`

**Guidelines:**
- Prefer proper typing over `as any`
- Use `as const` for type literals when needed for const correctness
- Minimize `as unknown` chains; prefer direct casting when safe

**Examples**:
```typescript
// From DualModeWalletClient.ts
const payload = createEntryPayload(abi as any, { /* ... */ });

// From WalletProvider.tsx
optInWallets={["Nightly", "Razor Wallet" as AvailableWallets, "Leap Wallet" as AvailableWallets]}

// From useCollectionNFTs.ts
return [{ last_transaction_timestamp: "desc" as Order_By }];
```

---

*Convention analysis: 2026-03-01*
