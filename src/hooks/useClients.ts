import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMovementWallet } from "@/hooks/useMovementWallet";
import { DualModeWalletClient } from "@/lib/DualModeWalletClient";
import { ABI as coinABI } from "@/abi/coin";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";
import { LAUNCHPAD_MODULE_ADDRESS, MOVE_NETWORK } from "@/constants";

const launchpadABIWithAddress = { ...launchpadABI, address: LAUNCHPAD_MODULE_ADDRESS } as const;

export function useClients() {
  const { isInMiniApp, address, connected, sendTransaction: sdkSendTransaction, networkChainId } = useMovementWallet();
  const wallet = useWallet();

  let client: DualModeWalletClient | undefined;
  if (isInMiniApp && sdkSendTransaction) client = new DualModeWalletClient(null, sdkSendTransaction);
  else if (wallet.connected) client = new DualModeWalletClient(wallet, null);

  const coinClient = client?.useABI(coinABI);
  const launchpadClient = client?.useABI(launchpadABIWithAddress);

  const correctNetwork = isInMiniApp ? true : networkChainId === MOVE_NETWORK.chainId;

  return { account: wallet.account, connected, network: wallet.network, address, coinClient, launchpadClient, correctNetwork };
}
