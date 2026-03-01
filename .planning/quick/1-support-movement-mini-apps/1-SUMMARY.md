---
phase: quick
plan: 1
subsystem: wallet-integration
tags: [mini-app, sdk, dual-mode, wallet]
dependency-graph:
  requires: []
  provides: [movement-miniapp-support, dual-mode-wallet]
  affects: [useClients, useTransaction, MintStageCard, WalletSelector, useGetAccountNativeBalance]
tech-stack:
  added: ["@movement-labs/miniapp-sdk"]
  patterns: [dual-mode-client, proxy-based-abi, factory-transaction]
key-files:
  created:
    - src/hooks/useMovementWallet.ts
    - src/lib/DualModeWalletClient.ts
  modified:
    - src/hooks/useClients.ts
    - src/hooks/useTransaction.ts
    - src/hooks/useGetAccountNativeBalance.ts
    - src/hooks/useMintBalance.ts
    - src/components/MintStageCard.tsx
    - src/components/WalletSelector.tsx
    - package.json
key-decisions:
  - Used Proxy-based DualModeWalletClient to keep components free of branching logic
  - Changed executeTransaction to accept factory functions for lazy evaluation
  - Derived ABI type from createEntryPayload parameters since ABIRoot is not exported from surf
metrics:
  duration: 4m31s
  completed: 2026-03-01
  tasks: 2/2
  files-created: 2
  files-modified: 7
---

# Quick Task 1: Support Movement Mini Apps Summary

Dual-mode wallet integration using Movement Mini App SDK with Proxy-based DualModeWalletClient for transparent transaction routing between standalone browser and mini app modes.

## What Was Done

### Task 1: Install SDK and create dual-mode wallet abstractions (a28adb8)
- Installed `@movement-labs/miniapp-sdk` from GitHub
- Created `useMovementWallet` hook that wraps both `useMovementSDK()` and `useWallet()` behind a single `MovementWalletState` interface, always calling both hooks unconditionally (React rules of hooks)
- Created `DualModeWalletClient` class with `useABI()` Proxy that builds `EntryPayload` via Surf's `createEntryPayload` and routes to either SDK `sendTransaction` or wallet adapter `signAndSubmitTransaction`

### Task 2: Wire dual-mode into existing hooks and components (82c0bb6)
- Replaced `useWalletClient` from `@thalalabs/surf/hooks` with `DualModeWalletClient` in `useClients`
- Changed `executeTransaction` from accepting `Promise<T>` to accepting `() => Promise<T> | undefined` (factory pattern)
- Updated `MintStageCard` to use factory pattern: `executeTransaction(() => launchpadClient?.mint_nft(...))`
- Switched `useGetAccountNativeBalance` from `useWallet()` to `useMovementWallet()` for address resolution in both modes
- Added `MiniAppWalletDisplay` component in `WalletSelector` that shows truncated address without connect button when running inside Movement wallet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed address type mismatch in useMintBalance**
- **Found during:** Task 2
- **Issue:** Changing `useClients` to return `string | undefined` address (from `useMovementWallet`) instead of the previous `AccountInfo.address.toString()` caused a type error in `useMintBalance.ts` where the address was passed to a function expecting `` `0x${string}` ``
- **Fix:** Added explicit type cast `address as \`0x${string}\`` matching the pattern from the banana-fun reference
- **Files modified:** src/hooks/useMintBalance.ts
- **Commit:** 82c0bb6

## Verification Results

- TypeScript compiles with zero errors (`npx tsc --noEmit`)
- Build succeeds (`pnpm build`)
- No remaining `useWalletClient` imports from `@thalalabs/surf/hooks`
- `useMovementWallet` used in: useClients, useGetAccountNativeBalance, WalletSelector (+ its own definition)
- `DualModeWalletClient` used in: useClients (+ its own definition)
