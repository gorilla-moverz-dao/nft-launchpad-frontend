import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";
import type { MintStageInfo } from "@/hooks/useMintStages";
import { COLLECTION_ID, EXPLORER_NETWORK } from "@/constants";
import { useMintStages } from "@/hooks/useMintStages";
import { useCollectionData } from "@/hooks/useCollectionData";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { oaptToApt, toShortAddress } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";

export const Route = createFileRoute("/mint")({
  component: RouteComponent,
});

function RouteComponent() {
  const [mintAmount, setMintAmount] = useState<Record<string, number>>({});
  const [minting, setMinting] = useState<string | null>(null);
  const { address, launchpadClient } = useClients();

  const { data: stages = [], isLoading: isLoadingStages } = useMintStages(COLLECTION_ID as `0x${string}`);
  const { data: collectionData, isLoading: isLoadingCollection } = useCollectionData(COLLECTION_ID as `0x${string}`);

  const isLoading = isLoadingStages || isLoadingCollection;
  if (isLoading) return <div>Loading...</div>;

  async function handleMint(stage: MintStageInfo) {
    const amount = mintAmount[stage.name] || 1;
    if (!address || !collectionData || !launchpadClient) {
      toast.error("Connect your wallet to mint");
      return;
    }
    setMinting(stage.name);
    try {
      const tx = await launchpadClient.mint_nft({
        arguments: [collectionData.collection.collection_id as `0x${string}`, amount],
        type_arguments: [],
      });
      toast.success("Mint transaction submitted", { description: `Tx: ${tx.hash}` });
    } catch (err: any) {
      toast.error("Mint failed", { description: err?.message || String(err) });
    } finally {
      setMinting(null);
    }
  }

  const minted = collectionData?.collection.current_supply;
  const total = collectionData?.collection.max_supply;
  const reserved = collectionData?.ownerCount;
  const percent = Math.round((minted / total) * 100);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Left column: image and basic info */}
      <div className="w-full md:w-1/3 flex-shrink-0">
        <GlassCard className="w-full">
          <CardHeader>
            <div className="w-full aspect-square rounded-lg bg-background overflow-hidden border mb-2 flex items-center justify-center group">
              <img
                src={collectionData?.collection.uri}
                alt={collectionData?.collection.collection_name}
                className="object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105"
              />
            </div>
            <CardTitle className="truncate text-lg">{collectionData?.collection.collection_name}</CardTitle>
            <CardDescription className="truncate mb-1">{collectionData?.collection.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm break-all">
              <p className="font-semibold text-muted-foreground">Collection Address:</p>{" "}
              <a
                href={`https://explorer.movementnetwork.xyz/object/${collectionData?.collection.collection_id}?network=${EXPLORER_NETWORK}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center gap-1">
                  {toShortAddress(collectionData?.collection.collection_id ?? "")} <ExternalLinkIcon className="w-4 h-4" />
                </div>
              </a>
            </div>
          </CardContent>
        </GlassCard>
      </div>
      {/* Right column: progress, stages, mint actions */}
      <div className="flex-1 w-full space-y-6">
        <GlassCard className="w-full">
          <CardContent>
            <div className="flex items-center gap-4 mb-2">
              <span className="font-semibold text-lg">
                {minted} / {total}
              </span>
              <span className="text-xs text-muted-foreground">({reserved} reserved for creator)</span>
              <span className="ml-auto text-sm">{percent}%</span>
            </div>
            <Progress value={percent} className="h-3 mb-4 bg-muted/30" />
          </CardContent>
        </GlassCard>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard className="text-center">
            <CardContent>
              <div className="text-sm font-semibold text-muted-foreground mb-1">Minted</div>
              <div className="text-2xl font-bold">{minted?.toLocaleString() || 0}</div>
            </CardContent>
          </GlassCard>

          <GlassCard className="text-center">
            <CardContent>
              <div className="text-sm font-semibold text-muted-foreground mb-1">Max Supply</div>
              <div className="text-2xl font-bold">{total?.toLocaleString() || 0}</div>
            </CardContent>
          </GlassCard>

          <GlassCard className="text-center">
            <CardContent>
              <div className="text-sm font-semibold text-muted-foreground mb-1">Unique Holders</div>
              <div className="text-2xl font-bold">{reserved?.toLocaleString() || 0}</div>
            </CardContent>
          </GlassCard>
        </div>

        <div className="space-y-2">
          {stages.map((stage) => {
            const now = new Date();
            const start = new Date(Number(stage.start_time) * 1000);
            const end = new Date(Number(stage.end_time) * 1000);
            const isActive = now >= start && now <= end;

            return (
              <GlassCard
                key={stage.name}
                className={`mb-4 transition-all duration-300 pt-4 pb-2 ${isActive ? "relative z-10 bg-gradient-to-br from-primary/40 via-primary/20 to-background border-1 border-primary/50 shadow-lg shadow-primary/20 ring-1 ring-primary/30" : "z-0 bg-muted/20 hover:bg-muted/30"}`}
              >
                <CardHeader className="pb-2 flex flex-row items-center justify-between px-6">
                  <CardTitle className="text-base flex-1">{stage.name}</CardTitle>
                  {isActive && (
                    <span className="block text-right text-base text-muted-foreground mt-1 font-semibold min-w-[120px]">
                      Total: {((oaptToApt(stage.mint_fee) || 0) * (mintAmount[stage.name] ?? 1)).toLocaleString()} MOVE
                    </span>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row md:items-center gap-2 pb-4 px-6">
                  <div className="flex-1 text-xs space-y-1">
                    <div>Start: {start.toLocaleString()}</div>
                    <div>End: {end.toLocaleString()}</div>
                    <div>Mint Fee: {oaptToApt(stage.mint_fee)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive && (
                      <Input
                        type="number"
                        min={1}
                        value={mintAmount[stage.name] ?? 1}
                        onChange={(e) => {
                          const value = Math.max(1, Number(e.target.value));
                          setMintAmount((prev) => ({ ...prev, [stage.name]: value }));
                        }}
                        className="w-20"
                        disabled={minting === stage.name}
                        aria-label="Mint amount"
                      />
                    )}
                    <Button
                      disabled={!isActive || minting === stage.name}
                      className={!isActive ? "opacity-50 cursor-not-allowed" : ""}
                      onClick={() => handleMint(stage)}
                    >
                      {minting === stage.name ? "Minting..." : "Mint"}
                    </Button>
                  </div>
                </CardContent>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
