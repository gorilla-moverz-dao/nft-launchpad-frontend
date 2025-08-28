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
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/useCollections";

export const Route = createFileRoute("/staking")({
  component: RouteComponent,
});

function NFTsSkeleton({ gridCols }: { gridCols: string }) {
  return (
    <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
      <CardHeader>
        <Skeleton className={`h-8 w-32 bg-primary/20`} />
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-2 ${gridCols} gap-4`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <Skeleton className="aspect-square rounded-lg bg-primary/20" />
            </div>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  );
}

function RouteComponent() {
  const { address, nftStakingWalletClient, stakingWalletClient } = useClients();
  const { executeTransaction: executeStakeUnstakeNFT } = useTransaction();

  const { data: stakingInfo, refetch: refetchStakingInfo } = useQuery({
    queryKey: ["staking-info", address],
    queryFn: async () => {
      // Execute all queries in parallel
      const [allowedCollections, stakedNfts, rewards] = await Promise.all([
        nftStakingClient.view
          .get_allowed_collections({
            functionArguments: [],
            typeArguments: [],
          })
          .then((r) => r[0]),
        nftStakingClient.view
          .get_staked_nfts({
            functionArguments: [address as `0x${string}`],
            typeArguments: [],
          })
          .then((r) => r[0]),
        nftStakingClient.view
          .get_all_user_accumulated_rewards({
            functionArguments: [address as `0x${string}`],
            typeArguments: [],
          })
          .then((r) => r[0] as Array<{ fa_address: `0x${string}`; rewards: string }>),
      ]);

      // Only fetch metadata if there are rewards
      const metadata =
        rewards.length > 0
          ? await aptos.getFungibleAssetMetadata({
              options: {
                where: {
                  asset_type: {
                    _in: rewards.map((r) => r.fa_address),
                  },
                },
              },
            })
          : [];

      return {
        allowedCollections,
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

  const { data: collections } = useCollections({
    collectionIds: stakingInfo?.allowedCollections ?? [],
    enabled: !!stakingInfo && stakingInfo.allowedCollections.length > 0,
  });

  const { data: collectionNFTs, refetch: refetchCollectionNFTs } = useCollectionNFTs({
    enabled: !!stakingInfo && stakingInfo.allowedCollections.length > 0,
    onlyOwned: true,
    sort: "name",
    collectionIds: stakingInfo?.allowedCollections ?? [],
  });

  const hasStakedNFTs = !!stakingInfo && stakingInfo.stakedNfts.length > 0;

  const { data: stakedNFTs, refetch: refetchStakedNFTs } = useCollectionNFTs({
    enabled: hasStakedNFTs,
    onlyOwned: false,
    sort: "name",
    collectionIds: stakingInfo?.allowedCollections ?? [],
    tokenIds: stakingInfo?.stakedNfts.map((item) => item.nft_object_address) ?? [],
  });

  const refetchAll = () => {
    refetchStakingInfo();
    refetchCollectionNFTs();
    refetchStakedNFTs();
  };

  if (!address) return <div>Connect your wallet to view your staking info</div>;

  if (!stakingInfo || (hasStakedNFTs && !stakedNFTs) || !collectionNFTs || !collections)
    return (
      <div className="space-y-8">
        <NFTsSkeleton gridCols="xl:grid-cols-5" />
        <NFTsSkeleton gridCols="xl:grid-cols-5" />
        <NFTsSkeleton gridCols="xl:grid-cols-5" />
      </div>
    );

  return (
    <>
      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-xl font-semibold">Collections you can stake</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {collections.map((collection) => (
              <div key={collection.collection_id} className="relative group">
                <div className="relative overflow-hidden rounded-lg">
                  <div className="w-full flex items-center justify-center overflow-hidden rounded-lg">
                    <img
                      src={collection.uri}
                      alt={collection.collection_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => (e.currentTarget.src = "/favicon.png")}
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                    <div className="font-semibold text-sm text-white truncate" title={collection.collection_name}>
                      {collection.collection_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-xl font-semibold">Staked NFTs</h2>
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
                          refetchAll();
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

            {!!stakingInfo.rewards.length && stakingInfo.rewards.length > 0 && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={async () => {
                    await executeStakeUnstakeNFT(
                      stakingWalletClient?.claim_rewards({
                        arguments: [stakingInfo.stakedNfts.map((item) => item.nft_object_address)],
                        type_arguments: [],
                      }),
                    );
                    refetchAll();
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Claim all rewards
                </Button>

                {/* Rewards Table */}
                <div className="p-1 min-w-[260px]">
                  <div className="space-y-1">
                    {stakingInfo.rewards.map((item) => (
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
            )}
          </div>

          {/* Empty State */}
          {!hasStakedNFTs && (
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
          <h2 className="text-xl font-semibold">Stake NFTs</h2>
        </CardHeader>
        <CardContent>
          {/* NFTs Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            {collectionNFTs.current_token_ownerships_v2.map((item) => (
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
                        refetchAll();
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
          {collectionNFTs.current_token_ownerships_v2.length === 0 && (
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
