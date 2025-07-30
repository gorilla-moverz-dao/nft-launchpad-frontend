import { useWalletClient } from "@thalalabs/surf/hooks";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ABI as coinABI } from "@/abi/coin";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";
import { MOVE_NETWORK } from "@/constants";

export function useClients() {
  const { client } = useWalletClient();
  const { account, connected, network } = useWallet();

  const coinClient = client?.useABI(coinABI);
  const launchpadClient = client?.useABI(launchpadABI);

  const correctNetwork = network?.chainId === MOVE_NETWORK.chainId;

  return { account, connected, network, address: account?.address.toString(), coinClient, launchpadClient, correctNetwork };
}
