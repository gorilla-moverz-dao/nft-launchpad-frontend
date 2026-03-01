import { createEntryPayload } from "@thalalabs/surf";
import type { EntryPayload } from "@thalalabs/surf";
import type { TransactionPayload } from "@movement-labs/miniapp-sdk";
import type { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { SdkSendTransaction } from "@/hooks/useMovementWallet";

type Wallet = ReturnType<typeof useWallet>;
type ABI = Parameters<typeof createEntryPayload>[0];

/**
 * Routes transactions to either the Movement Mini App SDK or the standard
 * wallet adapter, providing a unified `useABI()` interface identical to Surf's
 * WalletClient. Despite the method name, `useABI()` is NOT a React hook -- it
 * returns a Proxy object (matching Surf's naming convention).
 */
export class DualModeWalletClient {
  private wallet: Wallet | null;
  private sdkSubmit: SdkSendTransaction | null;

  constructor(wallet: Wallet | null, sdkSubmit: SdkSendTransaction | null) {
    this.wallet = wallet;
    this.sdkSubmit = sdkSubmit;
  }

  async submitTransaction(payload: EntryPayload): Promise<{ hash: string }> {
    if (this.sdkSubmit) {
      const sdkPayload: TransactionPayload = {
        function: payload.function,
        arguments: payload.functionArguments as Array<any>,
        type_arguments: payload.typeArguments,
      };
      const result = await this.sdkSubmit(sdkPayload);
      if (!result) throw new Error("SDK transaction returned null");
      return { hash: result.hash };
    }

    if (this.wallet?.signAndSubmitTransaction) {
      const response = await this.wallet.signAndSubmitTransaction({
        data: {
          function: payload.function,
          functionArguments: payload.functionArguments as Array<any>,
          typeArguments: payload.typeArguments as Array<any>,
          abi: payload.abi,
        },
      });
      // AptosSignAndSubmitTransactionOutput contains a hash property
      if ("hash" in response) {
        return { hash: (response as { hash: string }).hash };
      }
      return { hash: String(response) };
    }

    throw new Error("No wallet or SDK available for transaction submission");
  }

  useABI<T extends ABI>(abi: T & { address?: string }): Record<string, (...args: Array<any>) => Promise<{ hash: string }>> {
    return new Proxy({} as any, {
      get: (_target, prop: string) => {
        return (args: { arguments?: Array<any>; type_arguments?: Array<any>; functionArguments?: Array<any>; typeArguments?: Array<any> }) => {
          const payload = createEntryPayload(abi as any, {
            function: prop as any,
            functionArguments: (args.arguments ?? args.functionArguments ?? []) as any,
            typeArguments: (args.type_arguments ?? args.typeArguments ?? []) as any,
          });
          return this.submitTransaction(payload);
        };
      },
    });
  }
}
