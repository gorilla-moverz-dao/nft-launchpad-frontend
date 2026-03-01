import { isInMovementApp, useMovementSDK } from "@movement-labs/miniapp-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import type { TransactionPayload, TransactionResult } from "@movement-labs/miniapp-sdk";

export type SdkSendTransaction = (payload: TransactionPayload) => Promise<TransactionResult | null>;

export interface MovementWalletState {
  isInMiniApp: boolean;
  address: string | undefined;
  connected: boolean;
  isLoading: boolean;
  sdk: ReturnType<typeof useMovementSDK>["sdk"];
  sendTransaction: SdkSendTransaction | undefined;
  networkChainId: string | number | undefined;
}

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
    address: walletState.account?.address.toString(),
    connected: walletState.connected,
    isLoading: false,
    sdk: null,
    sendTransaction: undefined,
    networkChainId: walletState.network?.chainId,
  };
}
