# Research: Adding Movement Mini App SDK Support

## 1. What the Movement Mini App SDK Does

The `@movement-labs/miniapp-sdk` allows a web app to run **inside the Movement wallet** as a "mini app" -- similar to Telegram mini apps or WeChat mini programs. When the app detects it is running inside the Movement wallet host, it uses the SDK to interact with the wallet instead of the standard Aptos wallet adapter.

### Key APIs Used by banana-fun

| API | Purpose |
|-----|---------|
| `isInMovementApp()` | Synchronous check: returns `true` when running inside the Movement wallet host |
| `useMovementSDK()` | React hook returning `{ sdk, isConnected, address, isLoading, sendTransaction, connect }` |
| `sdk.sendTransaction(payload)` | Submit a transaction via the host wallet. Payload: `{ function, arguments, type_arguments }` |
| `sdk.view()` | Call read-only Move view functions |
| `sdk.getBalance()` | Get MOVE token balance |
| `sdk.getContext()` | Get app context (user verification, platform, features) |
| `sdk.getTheme()` | Get light/dark theme from host |

The SDK also provides device features (haptics, QR scanner, share sheet, clipboard, notifications), cloud storage, UI components (MainButton, BackButton, popups), analytics, and MNS name resolution -- but banana-fun only uses the wallet/transaction features.

### Installation

```
npm install @movement-labs/miniapp-sdk
# or from GitHub:
"@movement-labs/miniapp-sdk": "github:MoveIndustries/mini-app-sdk"
```

The SDK has `react >= 18.0.0` as an optional peer dependency.

---

## 2. What banana-fun Changed (Final State After All 3 Commits)

banana-fun went through three iterations. The final architecture (after the "Code cleanup" commit `1b50870`) uses a **DualModeWalletClient** pattern that keeps components clean. Here is the file-by-file breakdown of the final state:

### 2.1 `package.json` -- Add SDK dependency

```diff
+ "@movement-labs/miniapp-sdk": "github:MoveIndustries/mini-app-sdk",
```

### 2.2 NEW: `src/hooks/useMovementWallet.ts` -- Unified wallet abstraction

A new hook that wraps both `useMovementSDK()` (from the mini app SDK) and `useWallet()` (from the Aptos wallet adapter) behind a single interface:

```typescript
import { isInMovementApp, useMovementSDK } from "@movement-labs/miniapp-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export function useMovementWallet(): MovementWalletState {
  const miniApp = isInMovementApp();
  const sdkState = useMovementSDK();
  const walletState = useWallet();

  if (miniApp) {
    return {
      isInMiniApp: true,
      address: sdkState.address ?? undefined,
      connected: sdkState.isConnected,
      isLoading: sdkState.isLoading,
      sdk: sdkState.sdk,
      sendTransaction: sdkState.sendTransaction,
      networkChainId: undefined,
    };
  }

  return {
    isInMiniApp: false,
    address: walletState.account?.address?.toString(),
    connected: walletState.connected,
    isLoading: false,
    sdk: null,
    sendTransaction: undefined,
    networkChainId: walletState.network?.chainId,
  };
}
```

Key design: both the SDK hook and the wallet adapter hook are always called (React hooks cannot be conditional), but only the relevant one's data is returned.

### 2.3 NEW: `src/lib/DualModeWalletClient.ts` -- Transparent transaction routing

A class that implements the same `useABI()` interface as Surf's `WalletClient`, but routes transactions to either the SDK or the wallet adapter:

- Constructor takes `(wallet: Wallet | null, sdkSubmit: SdkSubmitFn | null)`
- `useABI(abi)` returns a Proxy where each entry function call builds a payload via Surf's `createEntryPayload()` and submits it through `submitTransaction()`
- `submitTransaction()` routes to `sdkSubmit()` or `wallet.signAndSubmitTransaction()` depending on which is available

This means **components don't need any branching logic** -- they just call `launchpadClient.mint_nft(...)` and it works in both modes.

### 2.4 MODIFIED: `src/hooks/useClients.ts` -- Use DualModeWalletClient

Before (standalone only):
```typescript
const { client } = useWalletClient();
const launchpadClient = client?.useABI(launchpadABI);
```

After (dual-mode):
```typescript
const { isInMiniApp, address, connected, sendTransaction, networkChainId } = useMovementWallet();
const wallet = useWallet();

const client = isInMiniApp && sdkSendTransaction
  ? new DualModeWalletClient(null, sdkSendTransaction)
  : wallet.connected
    ? new DualModeWalletClient(wallet, null)
    : undefined;

const launchpadClient = client?.useABI({ ...launchpadABI, address: LAUNCHPAD_MODULE_ADDRESS });
```

The return type no longer exposes `isInMiniApp`, `sdk`, or `sendTransaction` -- the routing is fully encapsulated.

### 2.5 MODIFIED: `src/hooks/useTransaction.ts` -- Simplified

In the final version, `useTransaction` goes back to a simple signature:
```typescript
const executeTransaction = async <T extends { hash: string }>(
  transaction: () => Promise<T> | undefined
) => { ... }
```

It accepts a factory function `() => launchpadClient?.mint_nft({...})` rather than a raw Promise. The DualModeWalletClient handles the SDK vs adapter routing internally.

### 2.6 MODIFIED: `src/components/WalletSelector.tsx` -- Dual-mode UI

Added conditional rendering at the top level:
```typescript
import { isInMovementApp } from "@movement-labs/miniapp-sdk";
import { useMovementWallet } from "@/hooks/useMovementWallet";

export function WalletSelector(...) {
  if (isInMovementApp()) {
    return <MiniAppWalletDisplay />;  // Just shows truncated address, no connect button
  }
  return <StandaloneWalletSelector ... />;  // Original full wallet selector
}
```

The `MiniAppWalletDisplay` is a simple disabled button showing the address from `useMovementWallet()`.

### 2.7 MODIFIED: `src/hooks/useGetAccountNativeBalance.ts`

Changed from `useWallet()` to `useMovementWallet()` so the address is available in both modes:
```diff
- const { account } = useWallet();
- const accountAddress = address || account?.address;
+ const { address: walletAddress } = useMovementWallet();
+ const accountAddress = address || walletAddress;
```

### 2.8 MODIFIED: Component files (MintStageCard, RefundNFTsCard, MyNFTsCard, CreatorVestingCard)

In the final cleanup commit, the components become **simpler than before** because the branching is pushed into DualModeWalletClient:

```typescript
// Before (with dual-mode branching in component):
if (isInMiniApp && sendTransaction) {
  await executeSdkTransaction(sendTransaction, { function: "...", arguments: [...] });
} else if (launchpadClient) {
  await executeTransaction(launchpadClient.mint_nft({ arguments: [...] }));
}

// After (clean, single path):
await executeTransaction(() =>
  launchpadClient?.mint_nft({ arguments: [...], type_arguments: [] })
);
```

### 2.9 `src/hooks/useMintBalance.ts` -- Minor type fix

```diff
- functionArguments: [collectionAddress, stage.name, address],
+ functionArguments: [collectionAddress, stage.name, address as `0x${string}`],
```

---

## 3. How to Apply Similar Changes to nft-launchpad-frontend

### Current State of nft-launchpad-frontend

The project uses:
- `@aptos-labs/wallet-adapter-react` (v7.0.1) for wallet connection
- `@thalalabs/surf` (v1.9.6) for typed ABI interactions via `useWalletClient()`
- `@aptos-labs/ts-sdk` (v3.1.3) for direct Aptos client calls
- TanStack Router, React Query, Vite, React 19

The project does NOT have:
- Convex backend (banana-fun does; we do not)
- RefundNFTsCard, MyNFTsCard, CreatorVestingCard (banana-fun has these; we only have MintStageCard doing transactions)
- A vesting ABI (we have coin + nft_launchpad + nft_reduction_manager)

### Files That Need to Be Modified/Created

#### New Files

1. **`src/hooks/useMovementWallet.ts`** -- Copy from banana-fun (the hook is project-agnostic). Provides unified `{ isInMiniApp, address, connected, isLoading, sdk, sendTransaction, networkChainId }`.

2. **`src/lib/DualModeWalletClient.ts`** -- Copy from banana-fun. Provides transparent routing via `useABI()` Proxy. Depends on `@thalalabs/surf`'s `createEntryPayload`.

#### Modified Files

3. **`package.json`** -- Add dependency:
   ```
   "@movement-labs/miniapp-sdk": "github:MoveIndustries/mini-app-sdk"
   ```

4. **`src/hooks/useClients.ts`** -- Replace `useWalletClient()` with `DualModeWalletClient`:
   - Import `useMovementWallet` and `DualModeWalletClient`
   - Create dual-mode client based on `isInMiniApp`
   - Keep the same return shape for backward compatibility
   - Set `correctNetwork = true` when in mini app mode

5. **`src/hooks/useTransaction.ts`** -- Change `executeTransaction` to accept a factory function `() => Promise<T> | undefined` instead of a raw `Promise<T>`. This allows the DualModeWalletClient to be called lazily.

6. **`src/components/WalletSelector.tsx`** -- Add mini app detection:
   - Import `isInMovementApp` and `useMovementWallet`
   - Add `MiniAppWalletDisplay` component (shows address, no connect button)
   - Gate at the top of `WalletSelector`: if in mini app, render simplified UI

7. **`src/hooks/useGetAccountNativeBalance.ts`** -- Replace `useWallet()` with `useMovementWallet()` so the address resolves in both modes.

8. **`src/components/MintStageCard.tsx`** -- Update the `handleMint` call to use the new factory pattern:
   ```typescript
   // Before:
   await executeTransaction(launchpadClient.mint_nft({ ... }));
   // After:
   await executeTransaction(() => launchpadClient?.mint_nft({ ... }));
   ```
   Also relax the guard: `if (!address)` instead of `if (!address || !launchpadClient)`.

### Implementation Order

1. Install `@movement-labs/miniapp-sdk` dependency
2. Create `src/hooks/useMovementWallet.ts`
3. Create `src/lib/DualModeWalletClient.ts`
4. Update `src/hooks/useClients.ts` to use DualModeWalletClient
5. Update `src/hooks/useTransaction.ts` to accept factory functions
6. Update `src/components/MintStageCard.tsx` to use new executeTransaction pattern
7. Update `src/hooks/useGetAccountNativeBalance.ts` to use useMovementWallet
8. Update `src/components/WalletSelector.tsx` with mini app mode UI
9. Test in standalone mode (should work identically to before)
10. Test inside Movement wallet host

### Important Notes

- The `useMovementSDK()` hook from the SDK and `useWallet()` from the adapter must **both** be called unconditionally (React rules of hooks). The `useMovementWallet` hook handles this correctly.
- `isInMovementApp()` is a synchronous function that checks `window.aptos` -- it can be called outside of React components/hooks.
- The `DualModeWalletClient.useABI()` is NOT a React hook despite the name -- it returns a Proxy object. This matches Surf's naming convention.
- View functions (read-only queries) via the Surf `createSurfClient(aptos)` in `src/lib/aptos.ts` do NOT need changes -- they don't go through the wallet at all.
- The `useMintBalance` hook uses the read-only Surf client from `aptos.ts`, not the wallet client, so it works unchanged in both modes.

### Differences from banana-fun

| Aspect | banana-fun | nft-launchpad-frontend |
|--------|-----------|----------------------|
| Backend | Convex | None (GraphQL indexer only) |
| Transaction components | MintStageCard, RefundNFTsCard, MyNFTsCard, CreatorVestingCard | MintStageCard only |
| ABIs | coin, nft_launchpad, vesting | coin, nft_launchpad, nft_reduction_manager |
| Package manager | bun | pnpm |
| Wallet adapter version | 7.2.2 | 7.0.1 |

The core SDK integration pattern is identical regardless of these differences. The nft-launchpad-frontend has fewer transaction-submitting components, making the migration simpler.
