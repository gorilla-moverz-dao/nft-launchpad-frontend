import { useWalletClient } from "@thalalabs/surf/hooks";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { ABI as coinABI } from "@/abi/coin";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";
import { ABI as nftStakingABI } from "@/abi/nft_staking";
import { ABI as stakingABI } from "@/abi/staking";
import { LAUNCHPAD_MODULE_ADDRESS, MOVE_NETWORK } from "@/constants";

export function useClients() {
  const { client } = useWalletClient();
  const { account, connected, network } = useWallet();

  const address = LAUNCHPAD_MODULE_ADDRESS;
  const coinWalletClient = client?.useABI(coinABI);
  const launchpadWalletClient = client?.useABI({ ...launchpadABI, address });
  const nftStakingWalletClient = client?.useABI(nftStakingABI);
  const stakingWalletClient = client?.useABI(stakingABI);

  const correctNetwork = network?.chainId === MOVE_NETWORK.chainId;

  return {
    account,
    connected,
    network,
    address: account?.address.toString(),
    coinWalletClient,
    launchpadWalletClient,
    nftStakingWalletClient,
    stakingWalletClient,
    correctNetwork,
  };
}
