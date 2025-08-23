import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stakingClient } from "@/lib/aptos";
import { useClients } from "@/hooks/useClients";
import { STAKING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransaction } from "@/hooks/useTransaction";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";

export const Route = createFileRoute("/staking")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address, stakingWalletClient } = useClients();
  const isAdmin = address === STAKING_MODULE_ADDRESS;
  const [collectionId, setCollectionId] = useState<string>("");
  const { transactionInProgress: addingCollection, executeTransaction } = useTransaction();
  const { transactionInProgress: creatingStaking, executeTransaction: executeCreateStaking } = useTransaction();

  const colId = "0x83dd3df737a8e86c41a8bdd2aaf9b9bdc4ae8e8b6d08911f0259f23278ff7798";

  const { data: stakingInfo, refetch: refetchStakingInfo } = useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      const [res] = await stakingClient.view.get_allowed_collections({
        functionArguments: [],
        typeArguments: [],
      });

      const [res2] = await stakingClient.view.view_active_staking_pools({
        functionArguments: [],
        typeArguments: [],
      });
      console.log(res2);

      return res;
    },
  });

  // TODO: Get collection Id from the staking info? But how?
  const { data: collectionNFTs } = useCollectionNFTs({
    enabled: !!stakingInfo,
    onlyOwned: true,
    collectionIds: [colId],
  });

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold">Allowed collections</h2>
        <div className="flex flex-col gap-2">{stakingInfo?.map((item) => <div key={item}>{item}</div>)}</div>
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
                if (!stakingWalletClient) {
                  return;
                }
                await executeTransaction(
                  stakingWalletClient.add_allowed_collection({
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

      <Button
        onClick={async () => {
          if (!stakingWalletClient) {
            return;
          }

          const dpr = 86400;
          const inititialStakingAmount = BigInt(1000000000000000000);
          const rewardMetadataObjectAddress = "0x17d965eb3affe4792b493cf5faad6c1e768bf94fe8ba846867ec3f05ac587463"; // BANANA A

          await executeCreateStaking(
            stakingWalletClient.create_staking({
              type_arguments: [],
              arguments: [dpr, colId, inititialStakingAmount, rewardMetadataObjectAddress, true],
            }),
          );
        }}
      >
        {creatingStaking ? "Creating..." : "Create staking"}
      </Button>

      <div>
        <h2 className="text-2xl font-bold">Stake NFTs</h2>
        <div className="flex flex-col gap-2">
          {collectionNFTs?.current_token_ownerships_v2.map((item) => (
            <div key={item.token_data_id} className="flex flex-row gap-2">
              <div>{item.token_data_id}</div>
              <Button
                key={item.token_data_id}
                onClick={() => {
                  if (!stakingWalletClient) {
                    return;
                  }
                  executeTransaction(
                    stakingWalletClient.stake_token({
                      arguments: [item.token_data_id as `0x${string}`],
                      type_arguments: [],
                    }),
                  );
                }}
              >
                Stake
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
