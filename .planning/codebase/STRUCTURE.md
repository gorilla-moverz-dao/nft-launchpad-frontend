# Codebase Structure

**Analysis Date:** 2026-03-01

## Directory Layout

```
nft-launchpad-frontend/
├── src/
│   ├── main.tsx                          # Entry point, router + provider setup
│   ├── styles.css                        # Global Tailwind styles
│   ├── constants.ts                      # Module addresses, network, collection config
│   ├── reportWebVitals.ts                # Performance monitoring
│   ├── routeTree.gen.ts                  # Auto-generated TanStack Router tree
│   │
│   ├── routes/                           # File-based routing
│   │   ├── __root.tsx                    # Root layout (Header, Outlet, background)
│   │   ├── index.tsx                     # / (Collection browser for minting)
│   │   ├── mint.tsx                      # /mint (Landing page or child outlet)
│   │   ├── mint.$collectionId.tsx        # /mint/:collectionId (Mint stage cards)
│   │   ├── collections.tsx               # /collections (Collections browser)
│   │   ├── collections.$collectionId.tsx # /collections/:collectionId (Detail page)
│   │   ├── my-nfts.tsx                   # /my-nfts (User's owned NFTs)
│   │   └── support.tsx                   # /support (External link)
│   │
│   ├── components/                       # Reusable React components
│   │   ├── Header.tsx                    # Navigation + wallet selector
│   │   ├── CollectionBrowser.tsx         # Grid of collection cards with Link
│   │   ├── MintStageCard.tsx             # Single mint stage with form
│   │   ├── WalletSelector.tsx            # Wallet connect/disconnect UI
│   │   ├── AnimatedGradientBackground.tsx# Full-screen animated SVG background
│   │   ├── GlassCard.tsx                 # Reusable glass-effect card wrapper
│   │   ├── AssetDetailDialog.tsx         # NFT detail modal
│   │   ├── MintResultDialog.tsx          # Transaction result feedback
│   │   ├── NFTThumbnail.tsx              # Image with fallback
│   │   ├── CollectionFilters.tsx         # Filter UI for NFT browsing
│   │   ├── TraitFilter.tsx               # Trait checkbox group
│   │   │
│   │   ├── ui/                           # Radix UI + Tailwind primitives
│   │   │   ├── button.tsx, dialog.tsx, card.tsx, input.tsx
│   │   │   ├── select.tsx, checkbox.tsx, switch.tsx
│   │   │   ├── sheet.tsx, dropdown-menu.tsx, tooltip.tsx
│   │   │   └── [other UI primitives...]
│   │   │
│   │   └── staking/                      # Staking-related components (minimal content)
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useMovementWallet.ts          # Dual-mode wallet state (SDK vs adapter)
│   │   ├── useClients.ts                 # Initialize launchpadClient, coinClient
│   │   ├── useMintStages.ts              # Fetch mint stages via RPC
│   │   ├── useMintBalance.ts             # User's mint allowance per stage
│   │   ├── useCollectionNFTs.ts          # Query NFTs with filters/traits (GraphQL)
│   │   ├── useTraitAggregation.ts        # Helper for trait faceting
│   │   ├── useCollectionSearch.ts        # Search + sort parameters
│   │   ├── useCollectionData.ts          # Fetch single collection metadata
│   │   ├── useListedCollections.ts       # Fetch all collections (listed state)
│   │   ├── useMintingCollections.ts      # Fetch collections with active mints
│   │   ├── useUserReductionNFTs.ts       # Fetch user's reduction discount NFTs
│   │   ├── useGetAccountNativeBalance.ts # Native token (APT) balance
│   │   └── useTransaction.ts             # Transaction execution wrapper
│   │
│   ├── lib/                              # Utilities & client initialization
│   │   ├── DualModeWalletClient.ts       # Proxy-based transaction router
│   │   ├── aptos.ts                      # Aptos SDK client, Surf client setup
│   │   ├── networks.ts                   # TESTNET/MAINNET config
│   │   ├── utils.ts                      # oaptToApt(), toShortAddress(), etc.
│   │   └── initia-stub.ts                # Stub for @initia/initia.js alias
│   │
│   ├── provider/                         # Global context providers
│   │   └── WalletProvider.tsx            # Wraps AptosWalletAdapterProvider
│   │
│   ├── integrations/                     # Third-party integrations setup
│   │   └── tanstack-query/
│   │       ├── root-provider.tsx         # QueryClient initialization + Provider
│   │       └── layout.tsx                # TanStack Query DevTools
│   │
│   ├── graphql/                          # GraphQL queries & codegen
│   │   ├── gql.ts                        # Generated types + graphql tagged template
│   │   ├── graphql.ts                    # Generated types (466KB auto-generated)
│   │   ├── executeGraphQL.ts             # Fetch wrapper for GraphQL queries
│   │   ├── execute.ts                    # Apollo-style execute helper
│   │   ├── fragment-masking.ts           # Type-safe fragment handling
│   │   └── index.ts                      # Barrel export
│   │
│   ├── fragments/                        # GraphQL fragment definitions
│   │   ├── nft.ts                        # NFT fragment (token ownership + metadata)
│   │   └── collection.ts                 # Collection fragment
│   │
│   └── abi/                              # Move contract ABIs (generated)
│       ├── nft_launchpad.ts              # Launchpad contract functions
│       ├── nft_reduction_manager.ts      # Discount token contract
│       └── coin.ts                       # Native coin contract
│
├── public/                               # Static assets
│   └── images/                           # Logos, favicons
│
├── dist/                                 # Build output (generated)
├── node_modules/                         # Dependencies (pnpm)
├── .planning/                            # GSD planning documents
│
├── vite.config.js                        # Vite build config
├── tsconfig.json                         # TypeScript config
├── package.json                          # Dependencies & scripts
├── prettier.config.js                    # Code formatting
├── eslint.config.js                      # Linting rules
└── schema.graphql                        # GraphQL schema for IDE hints
```

## Directory Purposes

**`src/routes/`:**
- Purpose: File-based route definitions (auto-compiled by TanStack Router plugin)
- Contains: Route components exporting `Route` constant with configuration
- Key files: `__root.tsx` (layout), `mint.$collectionId.tsx` (main mint page)

**`src/components/`:**
- Purpose: Reusable presentational & container components
- Contains: React components organized by feature (ui/ for primitives, root level for features)
- Key files: `MintStageCard.tsx` (complex mint form), `Header.tsx` (navigation)

**`src/hooks/`:**
- Purpose: Custom hooks for state, data fetching, wallet integration
- Contains: Hooks using TanStack Query, Movement SDK, Aptos SDK
- Key files: `useMovementWallet.ts` (dual-mode wallet), `useMintStages.ts` (RPC query)

**`src/lib/`:**
- Purpose: Client initialization, utilities, configuration
- Contains: Wallet client abstractions, Aptos SDK setup, helper functions
- Key files: `DualModeWalletClient.ts` (transaction routing), `aptos.ts` (Aptos client)

**`src/provider/`:**
- Purpose: Global context providers and root-level setup
- Contains: Wallet adapter wrapper
- Key files: `WalletProvider.tsx`

**`src/integrations/`:**
- Purpose: Setup for third-party tools
- Contains: TanStack Query client initialization, DevTools
- Key files: `tanstack-query/root-provider.tsx`

**`src/graphql/`:**
- Purpose: GraphQL client, codegen outputs, query execution
- Contains: Auto-generated types, fetch wrapper, fragment masking
- Key files: `executeGraphQL.ts` (the fetch function), `gql.ts` (tagged template)

**`src/fragments/`:**
- Purpose: Reusable GraphQL fragment definitions for type safety
- Contains: Fragment imports used across queries
- Key files: `nft.ts`, `collection.ts`

**`src/abi/`:**
- Purpose: Move contract ABI definitions (auto-generated from contracts)
- Contains: TypeScript representations of contract functions
- Key files: `nft_launchpad.ts`, `nft_reduction_manager.ts`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Bootstrap app, initialize router and providers
- `src/routes/__root.tsx`: Root layout, header, background
- `src/routes/mint.$collectionId.tsx`: Main product page (mint NFTs)

**Configuration:**
- `src/constants.ts`: LAUNCHPAD_MODULE_ADDRESS, network selection, single-collection mode flag
- `src/lib/networks.ts`: TESTNET/MAINNET chain IDs, RPC/indexer URLs
- `vite.config.js`: Build plugins, chunk splitting, path aliases

**Core Logic:**
- `src/hooks/useMovementWallet.ts`: Wallet mode detection and state
- `src/lib/DualModeWalletClient.ts`: Transaction routing layer
- `src/hooks/useCollectionNFTs.ts`: Complex GraphQL query building with traits/search
- `src/components/MintStageCard.tsx`: Complete mint flow (balance check → mint → refetch)

**Testing:**
- Test files follow naming convention `*.test.ts` or `*.spec.ts` (location TBD - vitest configured)

## Naming Conventions

**Files:**
- Components: PascalCase, e.g., `MintStageCard.tsx`, `WalletSelector.tsx`
- Hooks: camelCase with `use` prefix, e.g., `useMintStages.ts`, `useClients.ts`
- Utilities: camelCase, e.g., `utils.ts`, `networks.ts`
- Route files: kebab-case, e.g., `mint.$collectionId.tsx` (TanStack Router convention)

**Directories:**
- Feature directories: kebab-case, e.g., `tanstack-query`, `nft_launchpad`
- Primitive/ui directories: lowercase, e.g., `ui/`, `abi/`, `graphql/`

**Functions & Variables:**
- Hooks: `useXxx()` pattern
- Helper functions: camelCase, e.g., `oaptToApt()`, `getOrderBy()`
- Constants: UPPER_SNAKE_CASE, e.g., `LAUNCHPAD_MODULE_ADDRESS`, `MOVE_NETWORK`
- Types/Interfaces: PascalCase, e.g., `MintStageInfo`, `NFTQueryFilter`

## Where to Add New Code

**New Feature:**
- Primary code: Feature hook in `src/hooks/useXxx.ts` (handles queries/state)
- UI: Component in `src/components/Xxx.tsx` (uses the hook)
- Route: `src/routes/path.tsx` or `src/routes/path.$param.tsx`
- Tests: Co-located `src/hooks/useXxx.test.ts` (vitest)

**New Component/Module:**
- **Presentational component:** `src/components/Xxx.tsx` (no hooks, only props)
- **Container component:** `src/components/Xxx.tsx` (uses hooks, composes logic + UI)
- **UI primitive:** `src/components/ui/xxx.tsx` (Radix UI + Tailwind wrapper)
- **Custom hook:** `src/hooks/useXxx.ts` (state, queries, side effects)

**Utilities:**
- **Shared helpers:** `src/lib/utils.ts` or new file `src/lib/featureName.ts`
- **Wallet/Aptos logic:** `src/lib/DualModeWalletClient.ts` or extend with new class
- **Configuration:** `src/constants.ts` or `src/lib/config.ts`

**Data/GraphQL:**
- **New GraphQL query:** Add to hook (e.g., `useCollectionNFTs.ts`) or new hook file
- **New fragment:** `src/fragments/xxx.ts`, import in hooks/queries
- **New ABI:** Auto-generated in `src/abi/`, use via `useClients()` hook

## Special Directories

**`dist/`:**
- Purpose: Vite build output
- Generated: Yes (via `npm run build`)
- Committed: No

**`node_modules/`:**
- Purpose: pnpm dependencies
- Generated: Yes (via `pnpm install`)
- Committed: No

**`routeTree.gen.ts`:**
- Purpose: Auto-generated TanStack Router tree from `src/routes/` files
- Generated: Yes (via TanStack Router Vite plugin)
- Committed: No (or yes if committed but shouldn't be edited manually)

**`.planning/`:**
- Purpose: GSD architecture/planning documents
- Generated: Manually by GSD agents
- Committed: Yes

---

*Structure analysis: 2026-03-01*
