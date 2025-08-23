import { useWalletClient } from "@thalalabs/surf/hooks";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ABI as coinABI } from "@/abi/coin";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";
import { ABI as stakingABI } from "@/abi/nft_staking";
import { MOVE_NETWORK } from "@/constants";

export function useClients() {
  const { client } = useWalletClient();
  const { account, connected, network } = useWallet();

  const coinWalletClient = client?.useABI(coinABI);
  const launchpadWalletClient = client?.useABI(launchpadABI);
  const stakingWalletClient = client?.useABI(stakingABI);

  const correctNetwork = network?.chainId === MOVE_NETWORK.chainId;

  return {
    account,
    connected,
    network,
    address: account?.address.toString(),
    coinWalletClient,
    launchpadWalletClient,
    stakingWalletClient,
    correctNetwork,
  };
}
