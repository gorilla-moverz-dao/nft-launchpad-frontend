# Architecture

**Analysis Date:** 2026-03-01

## Pattern Overview

**Overall:** Layered frontend application with dual-mode wallet abstraction and data-driven component composition

**Key Characteristics:**
- React 19 with Vite build system and file-based routing via TanStack Router
- Dual-mode wallet support: Aptos wallet adapter (standard web) and Movement Mini App SDK (in-app execution)
- Server-driven data flow via GraphQL indexer and Aptos RPC with client-side query caching via TanStack Query
- Modular hook-based state management with composition over inheritance
- Type-safe transaction building via Surf ORM and generated code

## Layers

**UI Layer (Presentation):**
- Purpose: Render pages, components, and interactive elements with Tailwind + Radix UI
- Location: `src/components/`, `src/routes/`
- Contains: React components (.tsx), route definitions, modal dialogs, form inputs
- Depends on: Hooks layer (for state), Router layer (for navigation), UI libraries
- Used by: End users via browser/mini-app

**Hooks Layer (State & Data Orchestration):**
- Purpose: Coordinate data fetching, wallet interactions, and complex state logic
- Location: `src/hooks/`
- Contains: Custom React hooks using TanStack Query, wallet state management
- Depends on: Clients layer, GraphQL layer, Aptos layer
- Used by: UI components via React hooks

**Clients Layer (Transaction & Data Access):**
- Purpose: Unify transaction submission and Aptos/GraphQL client access
- Location: `src/lib/DualModeWalletClient.ts`, `src/lib/aptos.ts`, `src/hooks/useClients.ts`
- Contains: Client initialization, dual-mode wallet routing, ABI-based method signatures
- Depends on: Wallet providers, Aptos SDK, Surf ORM
- Used by: Hooks layer for building and submitting transactions

**Provider Layer (Context & Setup):**
- Purpose: Initialize global contexts and provide root-level state
- Location: `src/provider/`, `src/integrations/tanstack-query/`
- Contains: Wallet provider wrapper, Query client setup, root route
- Depends on: Aptos wallet adapter, TanStack Query, TanStack Router
- Used by: Main app entry point (`src/main.tsx`)

**Utility & Configuration Layer:**
- Purpose: Constants, network config, ABI definitions, helper functions
- Location: `src/constants.ts`, `src/lib/networks.ts`, `src/lib/utils.ts`, `src/abi/`, `src/fragments/`
- Contains: Network definitions, module addresses, helper functions, GraphQL fragments
- Depends on: External SDKs (Aptos SDK, Surf)
- Used by: All layers

## Data Flow

**NFT Collection Loading Flow:**

1. User navigates to `/mint` → TanStack Router renders `MintStageCard` component
2. `MintStageCard` calls `useMintStages(address, collectionId)` hook
3. `useMintStages` hook:
   - Calls `useUserReductionNFTs()` to fetch reduction NFTs from GraphQL
   - Once loaded, calls `launchpadClient.view.get_mint_stages_info()` via Aptos RPC
   - Returns array of mint stages with pricing and timing
4. Hook returns data to component, component renders mint form
5. User submits mint transaction → `executeTransaction()` called
6. `useClients.launchpadClient.mint_nft()` routes to DualModeWalletClient
7. DualModeWalletClient detects environment (mini-app vs browser) and calls appropriate submit method:
   - In mini-app: `Movement SDK sendTransaction()`
   - In browser: `wallet.signAndSubmitTransaction()`
8. Transaction confirmed → `useTransaction` hook refetches related queries via invalidation

**GraphQL Query Flow:**

1. Hook calls `executeGraphQL(query, variables)`
2. `executeGraphQL.ts` POST to `MOVE_NETWORK.indexerUrl` with typed query document
3. Movement indexer returns typed result
4. TanStack Query caches with 60s stale time
5. On error or refetch, same flow repeats

**State Management:**

- **Query Cache:** TanStack Query (server state) - queries auto-invalidate on mutation success
- **Route State:** TanStack Router - URL params + search params
- **Wallet State:** Movement SDK hook (`useMovementWallet`) + Aptos adapter hook (`useWallet`)
- **Local Component State:** React `useState` for UI toggles, form inputs
- **Transaction Progress:** `useTransaction` hook tracks pending transactions and errors

## Key Abstractions

**DualModeWalletClient:**
- Purpose: Abstract away wallet selection and provide unified transaction submission
- Examples: `src/lib/DualModeWalletClient.ts`
- Pattern: Proxy-based dynamic method dispatch. Constructor takes `wallet` (Aptos adapter) OR `sdkSubmit` (Movement SDK callback). `useABI()` returns Proxy object that intercepts method calls and routes to correct submit path.

**NFT Query Builders:**
- Purpose: Compose complex GraphQL filters and aggregations
- Examples: `src/hooks/useCollectionNFTs.ts` (`getWhere`, `getOrderBy` helper functions)
- Pattern: Pure functions that build query objects (`Current_Token_Ownerships_V2_Bool_Exp`) from filter parameters. Trait filters built via nested `_and`, `_or` conditions.

**Hook Composition:**
- Purpose: Combine multiple data sources into single hook return
- Examples: `useClients()` combines `useMovementWallet()` + `useWallet()` + `launchpadClient` initialization
- Pattern: Higher-level hooks call lower-level hooks and return composed object with all necessary state/methods

**Mint Stage Card:**
- Purpose: Encapsulate all mint logic in reusable component
- Examples: `src/components/MintStageCard.tsx`
- Pattern: Component accepts `stage`, `collectionId`, `onMintSuccess` callback. Manages local `mintAmount` state. Composes 4+ hooks for stage info, balance, reduction NFTs. Handles validation, error toasts, refetch logic.

## Entry Points

**Application Entry (`src/main.tsx`):**
- Location: `src/main.tsx`
- Triggers: Browser loads `/index.html`
- Responsibilities: Initialize TanStack Router with route tree, wrap with Query provider, Wallet provider. Mount React app to DOM.

**Root Route (`src/routes/__root.tsx`):**
- Location: `src/routes/__root.tsx`
- Triggers: Router initialization
- Responsibilities: Define root layout with Header, outlet for child routes, Toaster for notifications, background animation. Set up router context with QueryClient.

**File Routes (Dynamic):**
- Location: `src/routes/*.tsx` (e.g., `/mint/$collectionId.tsx`)
- Triggers: URL navigation
- Responsibilities: Each file exports `Route` constant and component. Uses `beforeLoad` hooks for redirects (e.g., SINGLE_COLLECTION_MODE redirect from `/` to `/mint/$collectionId`).

## Error Handling

**Strategy:** Try-catch in async functions with user-facing toast notifications and fallback UI states

**Patterns:**
- GraphQL errors: `executeGraphQL` throws on non-200 response. Hooks catch and return error state. Components show "Error loading..." UI.
- Transaction errors: `useTransaction` hook catches errors, logs to console, shows toast via Sonner. Component disables mint button until retry.
- Network/wallet errors: Wallet adapter errors logged to console. `useMovementWallet` gracefully returns undefined wallet state if SDK unavailable.
- Missing data: Components check `isFetched` and `data` existence before render. Fallback: "Loading..." or "Not found" text.

## Cross-Cutting Concerns

**Logging:**
- Strategy: `console.log()` for debugging (e.g., `useMintStages` logs query params before RPC call)
- No centralized error tracking (errors logged locally)

**Validation:**
- Query validation: GraphQL schema validates types and fragments
- Form validation: Zod (dependency available) used in form hooks (not yet visible in this snapshot)
- Transaction validation: ABI type-checking via Surf prevents invalid function/argument combinations

**Authentication:**
- Strategy: Dual-mode (browser wallet vs in-app SDK)
- Browser: User selects wallet (Nightly, Razor, Leap). Adapter manages connection state.
- In-app: Movement Mini App SDK auto-manages auth via embedding app context
- Hook `useMovementWallet()` detects environment and returns appropriate account + send method

---

*Architecture analysis: 2026-03-01*
