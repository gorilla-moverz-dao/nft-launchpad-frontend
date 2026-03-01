# External Integrations

**Analysis Date:** 2026-03-01

## APIs & External Services

**Blockchain RPC:**
- Movement Network (Testnet: Barkdock Testnet, Mainnet)
  - RPC URL: `MOVE_NETWORK.rpcUrl` (configured in `src/lib/networks.ts`)
  - Testnet: `https://testnet.bardock.movementnetwork.xyz/v1`
  - Mainnet: `https://mainnet.movementnetwork.xyz/v1`
  - SDK/Client: `@aptos-labs/ts-sdk` via `aptos` instance in `src/lib/aptos.ts`
  - Used by: All blockchain reads/writes, account balance checks
  - Implementation: `AptosConfig` with Network.CUSTOM setup

**Movement Mini App SDK:**
- Service: Movement Mini App environment
  - SDK: `@movement-labs/miniapp-sdk`
  - Purpose: Provides dual-mode wallet integration (mini app + standard wallets)
  - Usage: `useMovementWallet()` hook in `src/hooks/useMovementWallet.ts`
  - Exports: `isInMovementApp()`, `useMovementSDK()`, transaction submission interface
  - Type: `TransactionPayload`, `TransactionResult` exported from SDK

**Movement Explorer:**
- Service: Block explorer integration
  - URL pattern: `https://explorer.movementnetwork.xyz/{0}?network=[network]`
  - Purpose: Link generation for transaction/address exploration
  - Configuration: `MOVE_NETWORK.explorerUrl` in `src/lib/networks.ts`

## Data Storage

**Databases:**
- None - This is a frontend-only SPA

**GraphQL Indexer:**
- Movement Network Indexer (Hasura-based)
  - Testnet: `https://hasura.testnet.movementnetwork.xyz/v1/graphql`
  - Mainnet: `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`
  - Client: Native `fetch` API via `executeGraphQL()` in `src/graphql/executeGraphQL.ts`
  - Query pattern: POST to indexer URL with GraphQL query and variables
  - Authentication: None (public queries)
  - Used for: NFT collection data, mint stages, account transactions
  - Generated types: `src/graphql/gql.ts`, `src/graphql/graphql.ts`
  - Fragments: `src/fragments/collection.ts`, `src/fragments/nft.ts`

**File Storage:**
- Local filesystem only
- Public assets in `public/` directory (images, manifest.json, favicon)

**Caching:**
- TanStack Query - Client-side cache for GraphQL/API responses
  - QueryClient configured in `src/integrations/tanstack-query/root-provider.tsx`
  - Used in hooks for collection data, NFTs, mint balance, etc.
  - No server-side caching layer

## Authentication & Identity

**Wallet Authentication:**
- Standard: Aptos Wallet Adapter (multi-wallet support)
  - Provider: `@aptos-labs/wallet-adapter-react`
  - Supported wallets: Nightly, Razor Wallet, Leap Wallet
  - Auto-connect enabled in `src/provider/WalletProvider.tsx`
  - Configured in: `src/provider/WalletProvider.tsx`

- Mini App: Movement Mini App SDK wallet
  - Provider: `@movement-labs/miniapp-sdk`
  - Dual-mode handling: `useMovementWallet()` detects if running inside mini app
  - Implementation: `src/lib/DualModeWalletClient.ts` provides unified interface
  - When in mini app: Uses SDK transaction submission
  - When not in mini app: Falls back to standard wallet adapter

**Authorization:**
- On-chain verification only (wallet signatures)
- No server-side API authentication required
- Network chain ID verification: Checks `walletState.network?.chainId` or `sdkState` chainId

## Monitoring & Observability

**Error Tracking:**
- None - Manual error handling only

**Logs:**
- Console logging only (console.log in error handlers)
- Example: `src/provider/WalletProvider.tsx` logs wallet errors to console

**Web Vitals:**
- @vercel/analytics 1.5.0 - Performance monitoring
- web-vitals 4.2.4 - Core Web Vitals (CLS, INP, FCP, LCP, TTFB)
- Implementation: `src/reportWebVitals.ts` - conditionally reports metrics if callback provided
- Currently: Not actively reported to endpoint (callback setup needed)

**Notifications:**
- Sonner 2.0.6 - Toast notifications
  - Used for error messages: "Please switch to {network}" (WalletSelector.tsx)
  - Used for validation: "Please enter a valid mint amount" (MintStageCard.tsx)
  - Used for transaction errors: Error message display (useTransaction.ts)

## CI/CD & Deployment

**Hosting:**
- Vercel (analytics integration configured)
- Static SPA deployment
- Entry point: `index.html` → `src/main.tsx`

**CI Pipeline:**
- None detected - Configuration likely in separate deployment config

**Build Process:**
- Vite build command: `vite build && tsc`
- Linting as pre-build step: `npm run lint && vite build && tsc`
- Output directory: `dist/`
- Assets: `public/` copied to output

## Environment Configuration

**Required env vars:**
- `VITE_NETWORK` - Network selection (TESTNET or MAINNET)
  - Default: "MAINNET" (fallback in `src/constants.ts`)
  - Used by: `codegen.ts`, `src/lib/networks.ts`

**Network Configuration:**
- RPC URLs: Derived from `VITE_NETWORK` value
- Indexer URLs: Derived from `VITE_NETWORK` value
- Faucet URLs: Testnet only
- Explorer URLs: Template-based

**Secrets location:**
- `.env` file (present, minimal config)
- No sensitive data required for client-side operation
- Wallet keys held by wallet extensions (not in app code)

## Webhooks & Callbacks

**Incoming:**
- None - Frontend application

**Outgoing:**
- Vercel Analytics - Passive metrics collection only (no outbound webhooks)
- Transaction submission to Movement Network RPC endpoint

## Contract Interaction

**Smart Contracts:**
- NFT Launchpad Contract
  - Address: `0xe4fa259d7f337bf12723b7fc3606399955758cdef49a0303ce8d265f6dbe7e71`
  - ABI: `src/abi/nft_launchpad.ts`
  - Client: Surf-based wrapper in `src/lib/aptos.ts` as `launchpadClient`
  - Methods: Contract entry functions accessed via ABI

- NFT Reduction Manager Contract
  - Address: Same as launchpad (LAUNCHPAD_MODULE_ADDRESS)
  - ABI: `src/abi/nft_reduction_manager.ts`
  - Client: Surf-based wrapper in `src/lib/aptos.ts` as `nftReductionManagerClient`

- Coin Contract (Standard Aptos)
  - Address: `0x1` (standard library)
  - ABI: `src/abi/coin.ts`
  - Purpose: Native coin operations (balance checks, transfers)

**Transaction Submission:**
- Dual-mode routing in `src/lib/DualModeWalletClient.ts`
- Converts Surf payloads to wallet-compatible format
- Routes to either SDK or wallet adapter based on environment

---

*Integration audit: 2026-03-01*
