---
phase: quick
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - src/hooks/useMovementWallet.ts
  - src/lib/DualModeWalletClient.ts
  - src/hooks/useClients.ts
  - src/hooks/useTransaction.ts
  - src/hooks/useGetAccountNativeBalance.ts
  - src/components/MintStageCard.tsx
  - src/components/WalletSelector.tsx
autonomous: true
must_haves:
  truths:
    - "App works identically in standalone browser mode (no regressions)"
    - "App detects Movement wallet host via isInMovementApp()"
    - "In mini app mode, transactions route through SDK sendTransaction"
    - "In mini app mode, WalletSelector shows connected address without connect button"
  artifacts:
    - path: "src/hooks/useMovementWallet.ts"
      provides: "Unified wallet state for both modes"
      exports: ["useMovementWallet", "MovementWalletState"]
    - path: "src/lib/DualModeWalletClient.ts"
      provides: "Transparent transaction routing via useABI proxy"
      exports: ["DualModeWalletClient"]
  key_links:
    - from: "src/hooks/useClients.ts"
      to: "src/lib/DualModeWalletClient.ts"
      via: "constructs DualModeWalletClient based on isInMiniApp"
      pattern: "new DualModeWalletClient"
    - from: "src/hooks/useClients.ts"
      to: "src/hooks/useMovementWallet.ts"
      via: "useMovementWallet() hook call"
      pattern: "useMovementWallet"
    - from: "src/components/MintStageCard.tsx"
      to: "src/hooks/useTransaction.ts"
      via: "executeTransaction with factory function"
      pattern: "executeTransaction\\(\\(\\)"
---

<objective>
Add Movement Mini App SDK support so the NFT launchpad works both as a standalone web app and inside the Movement wallet as a mini app.

Purpose: Expand reach by supporting the Movement wallet's mini app platform without breaking the existing standalone experience.
Output: Dual-mode wallet integration -- transparent to components, single code path for transactions.
</objective>

<execution_context>
@/Users/urs/.claude/get-shit-done/workflows/execute-plan.md
@/Users/urs/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/quick/1-support-movement-mini-apps/RESEARCH.md
@src/hooks/useClients.ts
@src/hooks/useTransaction.ts
@src/hooks/useGetAccountNativeBalance.ts
@src/components/MintStageCard.tsx
@src/components/WalletSelector.tsx

<interfaces>
<!-- From @thalalabs/surf used by DualModeWalletClient -->
From @thalalabs/surf:
```typescript
import { createEntryPayload, type EntryPayload } from "@thalalabs/surf";
// EntryPayload has: function, typeArguments, functionArguments
```

From src/hooks/useClients.ts (current return shape to preserve):
```typescript
{ account, connected, network, address: string | undefined, coinClient, launchpadClient, correctNetwork: boolean }
```

From src/hooks/useTransaction.ts (current signature to change):
```typescript
executeTransaction<T extends { hash: string }>(transaction: Promise<T>): Promise<{ tx: T; result: CommittedTransactionResponse }>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install SDK and create dual-mode wallet abstractions</name>
  <files>package.json, src/hooks/useMovementWallet.ts, src/lib/DualModeWalletClient.ts</files>
  <action>
1. Install the Movement Mini App SDK:
   ```
   pnpm add @movement-labs/miniapp-sdk@github:MoveIndustries/mini-app-sdk
   ```

2. Create `src/hooks/useMovementWallet.ts` -- copy the pattern from banana-fun exactly as provided in RESEARCH.md section 2.2. This hook:
   - Always calls both `useMovementSDK()` and `useWallet()` unconditionally (React rules of hooks)
   - Returns `MovementWalletState` interface with: `isInMiniApp, address, connected, isLoading, sdk, sendTransaction, networkChainId`
   - When `isInMovementApp()` is true, returns SDK state; otherwise returns wallet adapter state

3. Create `src/lib/DualModeWalletClient.ts` -- copy the pattern from banana-fun exactly as provided in RESEARCH.md section 2.3. This class:
   - Constructor takes `(wallet: Wallet | null, sdkSubmit: SdkSubmitFn | null)`
   - `submitTransaction(payload: EntryPayload)` routes to SDK or wallet adapter
   - `useABI(abi)` returns a Proxy where property access returns functions that build `EntryPayload` via `createEntryPayload` from `@thalalabs/surf` and call `submitTransaction()`
   - Import types: `TransactionPayload`, `TransactionResult` from `@movement-labs/miniapp-sdk`, `useWallet` type from `@aptos-labs/wallet-adapter-react`, `createEntryPayload`/`EntryPayload` from `@thalalabs/surf`
  </action>
  <verify>
    <automated>cd /Users/urs/code/gorilla-moverz/nft-launchpad-frontend && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>SDK installed, useMovementWallet hook and DualModeWalletClient class exist with no TypeScript errors</done>
</task>

<task type="auto">
  <name>Task 2: Wire dual-mode into existing hooks and components</name>
  <files>src/hooks/useClients.ts, src/hooks/useTransaction.ts, src/hooks/useGetAccountNativeBalance.ts, src/components/MintStageCard.tsx, src/components/WalletSelector.tsx</files>
  <action>
1. **Modify `src/hooks/useClients.ts`:**
   - Remove `import { useWalletClient } from "@thalalabs/surf/hooks"`
   - Add imports: `useMovementWallet` from `@/hooks/useMovementWallet`, `DualModeWalletClient` from `@/lib/DualModeWalletClient`, `useWallet` from `@aptos-labs/wallet-adapter-react`
   - Replace body:
     ```typescript
     const { isInMiniApp, address, connected, sendTransaction: sdkSendTransaction, networkChainId } = useMovementWallet();
     const wallet = useWallet();

     const client = isInMiniApp && sdkSendTransaction
       ? new DualModeWalletClient(null, sdkSendTransaction)
       : wallet.connected
         ? new DualModeWalletClient(wallet, null)
         : undefined;

     const coinClient = client?.useABI(coinABI);
     const launchpadClient = client?.useABI({ ...launchpadABI, address: LAUNCHPAD_MODULE_ADDRESS });
     const correctNetwork = isInMiniApp ? true : networkChainId === MOVE_NETWORK.chainId;
     ```
   - Return shape stays the same: `{ account: wallet.account, connected, network: wallet.network, address, coinClient, launchpadClient, correctNetwork }`

2. **Modify `src/hooks/useTransaction.ts`:**
   - Change `executeTransaction` signature from `(transaction: Promise<T>)` to `(transaction: (() => Promise<T>) | (() => Promise<T> | undefined))`
   - Inside try block, call the factory: `tx = await transaction()!;` (the `!` asserts defined since callers guard with address checks)
   - Handle case where factory returns undefined: add `const result_or_undefined = transaction(); if (!result_or_undefined) throw new Error("Transaction not available"); tx = await result_or_undefined;`

3. **Modify `src/components/MintStageCard.tsx`:**
   - Change the `executeTransaction` call on line 80-85 from:
     ```typescript
     await executeTransaction(
       launchpadClient.mint_nft({ arguments: [...], type_arguments: [] })
     );
     ```
     to:
     ```typescript
     await executeTransaction(() =>
       launchpadClient?.mint_nft({ arguments: [collectionId, amount, reductionTokenIds], type_arguments: [] })
     );
     ```
   - Update guard on line 70: change `if (!address || !launchpadClient)` to `if (!address)` (launchpadClient is checked lazily inside the factory)

4. **Modify `src/hooks/useGetAccountNativeBalance.ts`:**
   - Replace `import { useWallet } from "@aptos-labs/wallet-adapter-react"` with `import { useMovementWallet } from "@/hooks/useMovementWallet"`
   - Replace `const { account } = useWallet()` with `const { address: walletAddress } = useMovementWallet()`
   - Replace `const accountAddress = address || account?.address` with `const accountAddress = address || walletAddress`

5. **Modify `src/components/WalletSelector.tsx`:**
   - Add imports: `isInMovementApp` from `@movement-labs/miniapp-sdk`, `useMovementWallet` from `@/hooks/useMovementWallet`, `truncateAddress` is already imported
   - Add a `MiniAppWalletDisplay` component before `WalletSelector`:
     ```typescript
     function MiniAppWalletDisplay() {
       const { address, connected } = useMovementWallet();
       return (
         <Button variant="default" className="wallet-button" disabled>
           {connected && address ? truncateAddress(address) : "Connecting..."}
         </Button>
       );
     }
     ```
   - At the very top of the `WalletSelector` function, add early return:
     ```typescript
     if (isInMovementApp()) {
       return <MiniAppWalletDisplay />;
     }
     ```
  </action>
  <verify>
    <automated>cd /Users/urs/code/gorilla-moverz/nft-launchpad-frontend && npx tsc --noEmit --pretty 2>&1 | head -30 && pnpm build 2>&1 | tail -10</automated>
  </verify>
  <done>All hooks and components updated. TypeScript compiles with no errors. Build succeeds. Standalone mode works identically (no behavioral changes when isInMovementApp() returns false). Mini app mode routes transactions through SDK.</done>
</task>

</tasks>

<verification>
1. `pnpm build` completes without errors
2. `npx tsc --noEmit` passes with no type errors
3. Grep confirms no remaining direct `useWalletClient` imports from surf/hooks: `grep -r "useWalletClient" src/` should return nothing
4. Grep confirms `useMovementWallet` is used in useClients, useGetAccountNativeBalance, WalletSelector: `grep -rl "useMovementWallet" src/`
5. Grep confirms `DualModeWalletClient` is used in useClients: `grep -r "DualModeWalletClient" src/`
6. Start dev server (`pnpm dev`) and verify the app loads and wallet connection works in standalone mode (no regressions)
</verification>

<success_criteria>
- Build passes with zero errors
- No remaining imports of `useWalletClient` from `@thalalabs/surf/hooks`
- `useMovementWallet` hook provides unified wallet state
- `DualModeWalletClient` transparently routes transactions
- `executeTransaction` accepts factory functions
- WalletSelector shows simplified UI when in mini app mode
- All existing standalone functionality preserved (connect wallet, mint NFTs)
</success_criteria>

<output>
After completion, create `.planning/quick/1-support-movement-mini-apps/1-SUMMARY.md`
</output>
