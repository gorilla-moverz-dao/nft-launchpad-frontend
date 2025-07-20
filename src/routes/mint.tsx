import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalLinkIcon } from "lucide-react";
import type { MintStageInfo } from "@/hooks/useMintStages";
import { COLLECTION_ID, EXPLORER_NETWORK } from "@/constants";
import { useMintStages } from "@/hooks/useMintStages";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { GlassCard } from "@/components/shared/GlassCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { oaptToApt, toShortAddress } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { WalletSelector } from "@/components/WalletSelector";
import { useMintBalance } from "@/hooks/useMintBalance";
import { aptos } from "@/lib/aptos";
import { MintResultDialog } from "@/components/MintResultDialog";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";

export const Route = createFileRoute("/mint")({
  component: RouteComponent,
});

function RouteComponent() {
  const [mintAmount, setMintAmount] = useState<Record<string, number>>({});
  const [minting, setMinting] = useState<string | null>(null);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [recentlyMintedTokenIds, setRecentlyMintedTokenIds] = useState<Array<string>>([]);
  const [showAssetDetailDialog, setShowAssetDetailDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const { address, launchpadClient, connected, network } = useClients();

  console.log(network);
  const { data: stages = [], isLoading: isLoadingStages } = useMintStages(COLLECTION_ID as `0x${string}`);
  const {
    data: mintBalance,
    isLoading: isLoadingMintBalance,
    refetch: refetchMintBalance,
  } = useMintBalance(COLLECTION_ID as `0x${string}`);
  const { data: collectionData, isLoading: isLoadingCollection } = useCollectionData(COLLECTION_ID as `0x${string}`);
  const { data: nfts, isLoading: isLoadingNFTs, refetch: refetchNFTs } = useCollectionNFTs(COLLECTION_ID as string);

  const isLoading = isLoadingStages || isLoadingCollection || isLoadingMintBalance;
  if (isLoading) return <div>Loading...</div>;

  // Function to extract token IDs from mint result
  const extractTokenIds = (result: any): Array<string> => {
    const tokenIds: Array<string> = [];

    // Navigate through the result structure to find token IDs
    if (result?.events) {
      result.events.forEach((event: any) => {
        // Check for BatchMintNftsEvent structure
        if (event?.type?.includes("BatchMintNftsEvent") && event?.data?.nft_objs) {
          event.data.nft_objs.forEach((nftObj: any) => {
            if (nftObj?.inner) {
              tokenIds.push(nftObj.inner);
            }
          });
        }
      });
    }
    return tokenIds;
  };

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
      const result = await aptos.waitForTransaction({
        transactionHash: tx.hash,
      });
      refetchMintBalance();
      refetchNFTs();

      // Extract token IDs from the result
      const newTokenIds = extractTokenIds(result);
      if (newTokenIds.length > 0) {
        setRecentlyMintedTokenIds(newTokenIds);
        setShowMintDialog(true);
        toast.success(`Successfully minted ${newTokenIds.length} NFT(s)`, {
          description: `Token IDs: ${newTokenIds.join(", ")}`,
        });
      } else {
        toast.success("Mint transaction submitted", { description: `Tx: ${tx.hash}` });
      }
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

  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setShowAssetDetailDialog(true);
  };

  return (
    <div className="flex flex-col gap-8">
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
              const walletBalance = Number(mintBalance?.find((b) => b.stage === stage.name)?.balance || 0);

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
                    <div className="flex flex-col items-end gap-2">
                      {walletBalance > 0 && <div className="text-xs text-muted-foreground">Mint spots: {walletBalance}</div>}
                      {walletBalance === 0 && <div className="text-xs text-destructive">No spots left</div>}

                      <div className="flex items-center gap-2">
                        {isActive && (
                          <Input
                            type="number"
                            min={1}
                            max={walletBalance}
                            value={mintAmount[stage.name] ?? 1}
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(walletBalance, Number(e.target.value)));
                              setMintAmount((prev) => ({ ...prev, [stage.name]: value }));
                            }}
                            className="w-20"
                            disabled={minting === stage.name || walletBalance === 0}
                            aria-label="Mint amount"
                          />
                        )}
                        {connected && (
                          <Button
                            disabled={!isActive || minting === stage.name || walletBalance === 0}
                            className={!isActive ? "opacity-50 cursor-not-allowed" : ""}
                            onClick={() => handleMint(stage)}
                          >
                            {minting === stage.name ? "Minting..." : "Mint"}
                          </Button>
                        )}
                        {!connected && isActive && <WalletSelector />}
                      </div>
                    </div>
                  </CardContent>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* My NFTs Section */}
      {connected && (
        <GlassCard className="w-full">
          <CardHeader>
            <CardTitle>My NFTs</CardTitle>
            <CardDescription>NFTs from this collection in your wallet</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingNFTs ? (
              <div className="text-center py-8">Loading your NFTs...</div>
            ) : nfts?.current_token_ownerships_v2 && nfts.current_token_ownerships_v2.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {nfts.current_token_ownerships_v2.map((nft, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-2 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200"
                    onClick={() => handleNFTClick(nft)}
                  >
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                      {nft.current_token_data?.token_uri ? (
                        <img
                          src={nft.current_token_data.token_uri}
                          alt={nft.current_token_data.token_name || "NFT"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = collectionData?.collection.uri || "";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold truncate">{nft.current_token_data?.token_name || `Token ${index + 1}`}</h4>
                      {nft.current_token_data?.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{nft.current_token_data.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">Token ID: {toShortAddress(nft.token_data_id)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No NFTs found in your wallet for this collection</div>
            )}
          </CardContent>
        </GlassCard>
      )}

      {/* Mint Success Dialog */}
      <MintResultDialog
        open={showMintDialog}
        onOpenChange={setShowMintDialog}
        recentlyMintedTokenIds={recentlyMintedTokenIds}
        collectionData={collectionData}
      />

      {/* Asset Detail Dialog */}
      <AssetDetailDialog
        open={showAssetDetailDialog}
        onOpenChange={setShowAssetDetailDialog}
        nft={selectedNFT}
        collectionData={collectionData}
      />
    </div>
  );
}
