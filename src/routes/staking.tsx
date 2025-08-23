import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { stakingClient } from "@/lib/aptos";
import { useClients } from "@/hooks/useClients";
import { STAKING_MODULE_ADDRESS } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTransaction } from "@/hooks/useTransaction";

export const Route = createFileRoute("/staking")({
  component: RouteComponent,
});

function RouteComponent() {
  const { address, stakingWalletClient } = useClients();
  const isAdmin = address === STAKING_MODULE_ADDRESS;
  const [collectionId, setCollectionId] = useState<string>("");
  const { transactionInProgress: addingCollection, executeTransaction } = useTransaction();
  const { transactionInProgress: creatingStaking, executeTransaction: executeCreateStaking } = useTransaction();

  const { data: stakingInfo, refetch: refetchStakingInfo } = useQuery({
    queryKey: ["staking-info"],
    queryFn: async () => {
      const [res] = await stakingClient.view.get_allowed_collections({
        functionArguments: [],
        typeArguments: [],
      });
      return res;
    },
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
          const colId = "0x4a401482b77148e0efeddc73052ac1ed7847793cdf3b2798ec461b9c0c5846ea";
          const inititialStakingAmount = 1000000000000000000;
          const rewardMetadataObjectAddress = "0x21d4d5406e3918c1bac02e3385e00078b8a2150e622d28bb1f66e9a38dc4750a"; // BANANA A

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
    </>
  );
}
