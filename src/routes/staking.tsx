import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { aptos, nftStakingClient } from "@/lib/aptos";
import { useClients } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { useTransaction } from "@/hooks/useTransaction";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { GlassCard } from "@/components/GlassCard";
import { CardContent, CardHeader } from "@/components/ui/card";
import { toDecimals } from "@/lib/utils";
import { NFTThumbnail } from "@/components/NFTThumbnail";

export const Route = createFileRoute("/staking")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address, nftStakingWalletClient, stakingWalletClient } = useClients();
  const { executeTransaction: executeStakeUnstakeNFT } = useTransaction();

  const { data: stakingInfo, refetch: refetchStakingInfo } = useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      const [res] = await nftStakingClient.view.get_allowed_collections({
        functionArguments: [],
        typeArguments: [],
      });

      const [stakedNfts] = await nftStakingClient.view.get_staked_nfts({
        functionArguments: [address as `0x${string}`],
        typeArguments: [],
      });

      const rewards = await nftStakingClient.view
        .get_all_user_accumulated_rewards({
          functionArguments: [address as `0x${string}`],
          typeArguments: [],
        })
        .then((r) => r[0] as Array<{ fa_address: `0x${string}`; rewards: string }>);

      const metadata = await aptos.getFungibleAssetMetadata({
        options: {
          where: {
            asset_type: {
              _in: rewards.map((r) => r.fa_address),
            },
          },
        },
      });

      return {
        stakingInfo: res,
        stakedNfts: stakedNfts as Array<{
          nft_object_address: `0x${string}`;
          collection_addr: `0x${string}`;
          staked_at: string;
        }>,
        rewards: rewards.map((i) => ({
          ...i,
          metadata: metadata.find((m) => m.asset_type === i.fa_address),
        })),
      };
    },
  });

  const { data: collectionNFTs } = useCollectionNFTs({
    enabled: !!stakingInfo && stakingInfo.stakingInfo.length > 0,
    onlyOwned: true,
    collectionIds: stakingInfo?.stakingInfo ?? [],
  });

  const { data: stakedNFTs, isFetched: isStakedNFTsFetched } = useCollectionNFTs({
    enabled: !!stakingInfo && stakingInfo.stakedNfts.length > 0,
    onlyOwned: false,
    collectionIds: stakingInfo?.stakingInfo ?? [],
    tokenIds: stakingInfo?.stakedNfts.map((item) => item.nft_object_address) ?? [],
  });

  if (!address) return <div>Connect your wallet to view your staking info</div>;

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Allowed collections</h2>
        <div className="flex flex-col gap-2">{stakingInfo?.stakingInfo.map((item) => <div key={item}>{item}</div>)}</div>
      </div>

      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Staked NFTs</h2>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-row gap-2">
            {/* NFTs Grid */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 pr-4">
              {stakedNFTs?.current_token_ownerships_v2.map((item) => (
                <div key={item.token_data_id} className="relative group">
                  <div className="relative overflow-hidden rounded-lg">
                    <NFTThumbnail nft={item} />

                    {/* Overlay Unstake Button */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Button
                        onClick={async () => {
                          await executeStakeUnstakeNFT(
                            nftStakingWalletClient?.unstake_token({
                              arguments: [item.token_data_id as `0x${string}`],
                              type_arguments: [],
                            }),
                          );
                          await refetchStakingInfo();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300"
                      >
                        Unstake
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 items">
              <Button
                onClick={async () => {
                  await executeStakeUnstakeNFT(
                    stakingWalletClient?.claim_rewards({
                      arguments: [stakingInfo?.stakedNfts.map((item) => item.nft_object_address) ?? []],
                      type_arguments: [],
                    }),
                  );
                  await refetchStakingInfo();
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Claim all rewards
              </Button>

              {/* Rewards Table */}
              <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3 min-w-[260px]">
                <div className="space-y-1">
                  {stakingInfo?.rewards.map((item) => (
                    <div key={item.fa_address} className="flex flex-col justify-between text-sm">
                      <span className="font-medium">{item.metadata?.name}</span>
                      <span className="text-primary">
                        {toDecimals(Number(item.rewards), item.metadata?.decimals ?? 0).toFixed(item.metadata?.decimals ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {isStakedNFTsFetched && stakedNFTs?.current_token_ownerships_v2.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🍌</div>
              <h3 className="text-xl font-semibold mb-2">No Staked NFTs</h3>
              <p className="text-gray-400">Stake your NFTs to start earning rewards!</p>
            </div>
          )}
        </CardContent>
      </GlassCard>

      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Stake NFTs</h2>
        </CardHeader>
        <CardContent>
          {/* NFTs Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {collectionNFTs?.current_token_ownerships_v2.map((item) => (
              <div key={item.token_data_id} className="relative group">
                <div className="relative overflow-hidden rounded-lg">
                  <NFTThumbnail nft={item} />

                  {/* Overlay Stake Button */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      onClick={async () => {
                        await executeStakeUnstakeNFT(
                          nftStakingWalletClient?.stake_token({
                            arguments: [item.token_data_id as `0x${string}`],
                            type_arguments: [],
                          }),
                        );
                        await refetchStakingInfo();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300"
                    >
                      Stake
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(!collectionNFTs?.current_token_ownerships_v2 || collectionNFTs.current_token_ownerships_v2.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">No NFTs Available</h3>
              <p className="text-gray-400">You don't have any NFTs from allowed collections to stake.</p>
            </div>
          )}
        </CardContent>
      </GlassCard>
    </>
  );
}
