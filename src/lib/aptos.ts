import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { createSurfClient } from "@thalalabs/surf";
import { LAUNCHPAD_MODULE_ADDRESS, MOVE_NETWORK, STAKING_MODULE_ADDRESS } from "@/constants";
import { ABI as launchpadABI } from "@/abi/nft_launchpad";
import { ABI as nftReductionManagerABI } from "@/abi/nft_reduction_manager";
import { ABI as nftStakingABI } from "@/abi/nft_staking";
import { ABI as stakingABI } from "@/abi/staking";

// Network configuration
const config = new AptosConfig({
  network: Network.CUSTOM,
  fullnode: MOVE_NETWORK.rpcUrl,
  indexer: MOVE_NETWORK.indexerUrl,
  faucet: MOVE_NETWORK.faucetUrl,
});

// Initialize client
export const aptos = new Aptos(config);
export const launchpadClient = createSurfClient(aptos).useABI(launchpadABI, LAUNCHPAD_MODULE_ADDRESS);
export const nftReductionManagerClient = createSurfClient(aptos).useABI(nftReductionManagerABI, LAUNCHPAD_MODULE_ADDRESS);
export const nftStakingClient = createSurfClient(aptos).useABI(nftStakingABI, STAKING_MODULE_ADDRESS);
export const stakingClient = createSurfClient(aptos).useABI(stakingABI, LAUNCHPAD_MODULE_ADDRESS);

// Helper function to get account balance
export const getAccountBalance = async (address: string) => {
  const resources = await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
  return resources ? BigInt(resources.toString()) : BigInt(0);
};
