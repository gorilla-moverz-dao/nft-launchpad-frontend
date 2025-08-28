import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { nftStakingClient } from "@/lib/aptos";
import { useClients } from "@/hooks/useClients";
import { STAKING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransaction } from "@/hooks/useTransaction";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { GlassCard } from "@/components/GlassCard";
import { CardContent, CardHeader } from "@/components/ui/card";

export const Route = createFileRoute("/staking")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address, nftStakingWalletClient, stakingWalletClient } = useClients();
  const isAdmin = address === STAKING_MODULE_ADDRESS;
  const [collectionId, setCollectionId] = useState<string>("");
  const { transactionInProgress: addingCollection, executeTransaction: executeAddCollection } = useTransaction();
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

      const [rewards] = await nftStakingClient.view.get_user_accumulated_rewards({
        functionArguments: [address as `0x${string}`, "0x2d5a4b63d34407ba0270ec3532a675ac13d74e3b0f71356ef25cd6c36e7e088e"],
        typeArguments: [],
      });

      return {
        stakingInfo: res,
        stakedNfts: stakedNfts as Array<{
          nft_object_address: `0x${string}`;
          collection_addr: `0x${string}`;
          staked_at: string;
        }>,
        rewards: Number(rewards),
      };
    },
  });

  const { data: collectionNFTs } = useCollectionNFTs({
    enabled: !!stakingInfo && stakingInfo.stakingInfo.length > 0,
    onlyOwned: true,
    collectionIds: stakingInfo?.stakingInfo ?? [],
  });

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Allowed collections</h2>
        <div className="flex flex-col gap-2">{stakingInfo?.stakingInfo.map((item) => <div key={item}>{item}</div>)}</div>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Is admin</h2>
        <div>{isAdmin ? "Yes" : "No"}</div>
      </div>

      {isAdmin && (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Add allowed collection</h2>

          <div className="flex flex-row gap-2 ">
            <Input name="collectionId" value={collectionId} onChange={(e) => setCollectionId(e.target.value)} />

            <Button
              onClick={async () => {
                await executeAddCollection(
                  nftStakingWalletClient?.add_allowed_collection({
                    arguments: [collectionId as `0x${string}`],
                    type_arguments: [],
                  }),
                );
                await refetchStakingInfo();
              }}
            >
              {addingCollection ? "Adding..." : "Add allowed collection"}
            </Button>
          </div>
        </div>
      )}

      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Staked NFTs</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-2">
            <div>Pending rewards: {stakingInfo?.rewards}</div>
          </div>
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
          >
            Claim all rewards
          </Button>

          <div className="flex flex-col gap-2">
            {stakingInfo?.stakedNfts.map((item) => (
              <div key={item.nft_object_address} className="flex flex-row gap-2">
                <div>{item.nft_object_address}</div>

                <Button
                  onClick={async () => {
                    await executeStakeUnstakeNFT(
                      nftStakingWalletClient?.unstake_token({
                        arguments: [item.nft_object_address],
                        type_arguments: [],
                      }),
                    );
                    await refetchStakingInfo();
                  }}
                >
                  Unstake
                </Button>

                <Button
                  onClick={async () => {
                    await executeStakeUnstakeNFT(
                      nftStakingWalletClient?.claim_reward({
                        arguments: [item.nft_object_address],
                        type_arguments: [],
                      }),
                    );
                    await refetchStakingInfo();
                  }}
                >
                  Claim
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      <GlassCard className="flex flex-col gap-2 mt-4 pt-4">
        <CardHeader>
          <h2 className="text-2xl font-bold">Stake NFTs</h2>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {collectionNFTs?.current_token_ownerships_v2.map((item) => (
              <div key={item.token_data_id} className="flex flex-row gap-2">
                <div>{item.token_data_id}</div>
                <Button
                  key={item.token_data_id}
                  onClick={async () => {
                    await executeStakeUnstakeNFT(
                      nftStakingWalletClient?.stake_token({
                        arguments: [item.token_data_id as `0x${string}`],
                        type_arguments: [],
                      }),
                    );
                    await refetchStakingInfo();
                  }}
                >
                  Stake
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>
    </>
  );
}
