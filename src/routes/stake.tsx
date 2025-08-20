import { NFTThumbnail } from "@/components/NFTThumbnail";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { COLLECTION_ID, SINGLE_COLLECTION_MODE } from "@/constants";
import type { Collection } from "@/fragments/collection";
import type { NFT } from "@/fragments/nft";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { useListedCollections } from "@/hooks/useListedCollections";
import { useStakingService } from "@/lib/staking";
import { resolveObjectForCollection } from "@/lib/tokenObjects";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { GlassCard } from "../components/GlassCard";

export const Route = createFileRoute("/stake")({
  component: RouteComponent,
});

function RouteComponent() {
  const { connected, account } = useWallet();
  const [showNFTSelectionModal, setShowNFTSelectionModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [selectedCollection, setSelectedNFTCollection] = useState<Collection | null>(null);
  const [stakedNFTs, setStakedNFTs] = useState<Array<{ nft: NFT; collection: Collection }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const stakingService = useStakingService();
  const { data: collections } = useListedCollections();
  const { data: nfts, isLoading: nftsLoading, error: nftsError } = useCollectionNFTs({
    onlyOwned: true,
    collectionIds: SINGLE_COLLECTION_MODE ? [COLLECTION_ID] : collections?.map((collection) => collection.collection_id) || [],
  });

  const collectionsWithStaking = collections || [];

  const handleStakeNFT = async () => {
    if (!selectedNFT || !selectedCollection || !stakingService || !account) return;
    setIsLoading(true);
    try {
      const tokenName = selectedNFT.current_token_data?.token_name || "";
      const collectionName = selectedCollection.collection_name || "";
      console.log("Resolving object address", { collectionName, tokenName });
      const objAddr = await resolveObjectForCollection(tokenName, collectionName);
      if (!objAddr) throw new Error(`NFT object not found for ${collectionName} / ${tokenName}`);
      console.log("Staking with object address", objAddr);
      await stakingService.stakeNFT(objAddr);
      toast.success(`Successfully staked ${collectionName} #${tokenName}`);
      setStakedNFTs((prev) => [...prev, { nft: selectedNFT, collection: selectedCollection }]);
      setShowNFTSelectionModal(false);
      setSelectedNFT(null);
      setSelectedNFTCollection(null);
    } catch (error: any) {
      toast.error(error?.message || "Failed to stake NFT");
      console.error("Staking error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstakeNFT = async (nft: NFT, collection: Collection) => {
    if (!stakingService) return;
    setIsLoading(true);
    try {
      const tokenName = nft.current_token_data?.token_name || "";
      const creatorAddress = collection.creator_address || "";
      const result = await stakingService.unstakeNFT(creatorAddress, collection.collection_name, tokenName);
      if (result.success) {
        toast.success(`Successfully unstaked ${collection.collection_name} #${tokenName}`);
        setStakedNFTs((prev) => prev.filter((item) => item.nft.token_data_id !== nft.token_data_id));
      }
    } catch (error) {
      toast.error("Failed to unstake NFT");
      console.error("Unstaking error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!stakingService) return;
    if (!stakedNFTs.length) return;
    setIsLoading(true);
    try {
      // Simple MVP: claim for each staked NFT
      for (const { nft, collection } of stakedNFTs) {
        const tokenName = nft.current_token_data?.token_name || "";
        const creatorAddress = collection.creator_address || "";
        await stakingService.claimRewards(collection.collection_name, tokenName, creatorAddress);
      }
      toast.success("Rewards claimed");
    } catch (error) {
      toast.error("Failed to claim rewards");
      console.error("Claim error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalEarningsDisplay = stakedNFTs.length ? "Calculating..." : "0";

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Stake</h1>
        <Button onClick={() => setShowNFTSelectionModal(true)} disabled={!connected}>
          Stake NFT
        </Button>
      </div>

      {/* My Staked NFTs */}
      <GlassCard>
        <CardHeader>
          <CardTitle>My Staked NFTs</CardTitle>
        </CardHeader>
        <CardContent>
          {stakedNFTs.length === 0 ? (
            <p className="text-muted-foreground">No NFTs are currently staked. Start staking to earn rewards!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stakedNFTs.map(({ nft, collection }) => (
                <div key={nft.token_data_id} className="flex flex-col gap-2">
                  <NFTThumbnail nft={nft} />
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => handleUnstakeNFT(nft, collection)} disabled={isLoading || !connected}>
                      Unstake
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </GlassCard>

      {/* Available Collections for Staking */}
      <GlassCard>
        <CardHeader>
          <CardTitle>Available Collections for Staking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collectionsWithStaking.map((collection) => (
              <div key={collection.collection_id} className="rounded-xl border/10 p-6 bg-white/5">
                <div className="text-lg font-semibold">{collection.collection_name}</div>
                <div className="text-sm text-muted-foreground mt-1">0 NFTs available for staking</div>
                <Button className="mt-4" variant="secondary" onClick={() => setShowNFTSelectionModal(true)} disabled={!connected}>
                  View NFTs
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      {/* My Earnings */}
      <GlassCard>
        <CardHeader>
          <CardTitle>My Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Current Earnings</div>
              <div className="text-xl font-medium">{totalEarningsDisplay}</div>
            </div>
            <Button onClick={handleClaimRewards} disabled={!stakedNFTs.length || isLoading}>
              Claim
            </Button>
          </div>
        </CardContent>
      </GlassCard>

      {/* Select NFT modal */}
      <Dialog open={showNFTSelectionModal} onOpenChange={setShowNFTSelectionModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select an NFT to Stake</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(nfts?.current_token_ownerships_v2 ?? []).map((nft: NFT) => (
              <button
                key={nft.token_data_id}
                className={`rounded-lg border p-2 text-left ${selectedNFT?.token_data_id === nft.token_data_id ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  setSelectedNFT(nft);
                  // Find the collection object for this NFT, if possible
                  const col = collections?.find((c) => c.collection_id === nft.current_token_data?.collection_id);
                  if (col) setSelectedNFTCollection(col);
                }}
              >
                <NFTThumbnail nft={nft} />
                <div className="mt-2 text-sm font-medium">{nft.current_token_data?.token_name}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowNFTSelectionModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStakeNFT} disabled={!selectedNFT || !selectedCollection || isLoading}>
              Confirm Stake
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 