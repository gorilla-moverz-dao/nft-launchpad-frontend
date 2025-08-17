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
  const {
    data: nfts,
    isLoading: nftsLoading,
    error: nftsError,
  } = useCollectionNFTs({
    onlyOwned: true,
    collectionIds: SINGLE_COLLECTION_MODE ? [COLLECTION_ID] : collections?.map((collection) => collection.collection_id) || [],
  });

  // Filter collections that have staking enabled
  const collectionsWithStaking = collections || [];

  const handleStakeNFT = async () => {
    if (!selectedNFT || !selectedCollection || !stakingService) return;
    
    setIsLoading(true);
    try {
      const tokenName = selectedNFT.current_token_data?.token_name || "";
      const propertyVersion = selectedNFT.property_version_v1 || 0;
      const creatorAddress = selectedCollection.creator_address || "";
      
      const result = await stakingService.stakeNFT(
        creatorAddress,
        selectedCollection.collection_name,
        tokenName,
        propertyVersion,
        1 // token amount
      );
      
      if (result.success) {
        toast.success(`Successfully staked ${selectedCollection.collection_name} #${tokenName}`);
        
        // Add to staked NFTs list
        setStakedNFTs(prev => [...prev, { nft: selectedNFT, collection: selectedCollection }]);
        
        // Close modal and reset selection
        setShowNFTSelectionModal(false);
        setSelectedNFT(null);
        setSelectedNFTCollection(null);
      }
    } catch (error) {
      toast.error("Failed to stake NFT");
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
      const propertyVersion = nft.property_version_v1 || 0;
      const creatorAddress = collection.creator_address || "";
      
      const result = await stakingService.unstakeNFT(
        creatorAddress,
        collection.collection_name,
        tokenName,
        propertyVersion
      );
      
      if (result.success) {
        toast.success(`Successfully unstaked ${collection.collection_name} #${tokenName}`);
        
        // Remove from staked NFTs list
        setStakedNFTs(prev => prev.filter(item => 
          item.nft.token_data_id !== nft.token_data_id
        ));
      }
    } catch (error) {
      toast.error("Failed to unstake NFT");
      console.error("Unstaking error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimRewards = async (nft: NFT, collection: Collection) => {
    if (!stakingService) return;
    
    try {
      const tokenName = nft.current_token_data?.token_name || "";
      const creatorAddress = collection.creator_address || "";
      
      const result = await stakingService.claimRewards(
        collection.collection_name,
        tokenName,
        creatorAddress
      );
      
      if (result.success) {
        toast.success(`Successfully claimed rewards for ${collection.collection_name} #${tokenName}`);
      }
    } catch (error) {
      toast.error("Failed to claim rewards");
      console.error("Claim rewards error:", error);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl pb-0">Stake</h1>
        </div>
        <GlassCard className="w-full">
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Please connect your wallet to start staking NFTs</p>
          </CardContent>
        </GlassCard>
      </div>
    );
  }

  if (nftsLoading) return <div>Loading...</div>;
  if (nftsError) return <div>Error: {nftsError.message}</div>;

  const availableNFTs = nfts?.current_token_ownerships_v2 || [];
  const availableCollections = collectionsWithStaking;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl pb-0">Stake</h1>
        <Button 
          onClick={() => setShowNFTSelectionModal(true)}
          disabled={availableNFTs.length === 0}
        >
          Stake NFT
        </Button>
      </div>

      {/* Staked NFTs Section */}
      <GlassCard className="w-full">
        <CardHeader>
          <CardTitle>My Staked NFTs</CardTitle>
        </CardHeader>
        <CardContent>
          {stakedNFTs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No NFTs are currently staked. Start staking to earn rewards!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stakedNFTs.map(({ nft, collection }) => (
                <div key={nft.token_data_id} className="relative">
                  <NFTThumbnail
                    nft={nft}
                    collectionData={collection}
                    onClick={() => {}} // No click action for staked NFTs
                  />
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClaimRewards(nft, collection)}
                      disabled={isLoading}
                    >
                      Claim Rewards
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnstakeNFT(nft, collection)}
                      disabled={isLoading}
                    >
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
      <GlassCard className="w-full">
        <CardHeader>
          <CardTitle>Available Collections for Staking</CardTitle>
        </CardHeader>
        <CardContent>
          {availableCollections.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No collections with staking enabled found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCollections.map((collection) => {
                const collectionNFTs = availableNFTs.filter(
                  (nft) => nft.current_token_data?.collection_id === collection.collection_id
                );
                
                return (
                  <div key={collection.collection_id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{collection.collection_name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {collectionNFTs.length} NFT{collectionNFTs.length !== 1 ? "s" : ""} available for staking
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowNFTSelectionModal(true)}
                      disabled={collectionNFTs.length === 0}
                    >
                      View NFTs
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </GlassCard>

      {/* NFT Selection Modal */}
      <Dialog open={showNFTSelectionModal} onOpenChange={setShowNFTSelectionModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select NFT to Stake</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {availableNFTs.map((nft) => {
              const collection = availableCollections.find(
                (c) => c.collection_id === nft.current_token_data?.collection_id
              );
              
              if (!collection) return null;
              
              return (
                <div
                  key={nft.token_data_id}
                  className={`cursor-pointer border rounded-lg p-2 transition-colors ${
                    selectedNFT?.token_data_id === nft.token_data_id
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedNFT(nft);
                    setSelectedNFTCollection(collection);
                  }}
                >
                  <NFTThumbnail
                    nft={nft}
                    collectionData={collection}
                    onClick={() => {}} // Prevent default click behavior
                  />
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium">
                      {collection.collection_name} #{nft.current_token_data?.token_name}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowNFTSelectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStakeNFT}
              disabled={!selectedNFT || isLoading}
            >
              {isLoading ? "Staking..." : "Stake Selected NFT"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 