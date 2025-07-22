import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { COLLECTION_ID } from "@/constants";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { useCollectionData } from "@/hooks/useCollectionData";
import { GlassCard } from "@/components/GlassCard";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NFTThumbnail } from "@/components/NFTThumbnail";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";

export const Route = createFileRoute("/my-nfts")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showAssetDetailDialog, setShowAssetDetailDialog] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);

  const { data: nfts, isLoading, error } = useCollectionNFTs(COLLECTION_ID);
  const { data: collectionData } = useCollectionData(COLLECTION_ID as `0x${string}`);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setShowAssetDetailDialog(true);
  };

  return (
    <div className="flex flex-col gap-8">
      <GlassCard className="w-full">
        <CardHeader>
          <CardTitle>My NFTs</CardTitle>
          <CardDescription>All NFTs from this collection in your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {nfts?.current_token_ownerships_v2 && nfts.current_token_ownerships_v2.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nfts.current_token_ownerships_v2.map((nft) => (
                <NFTThumbnail key={nft.token_data_id} nft={nft} collectionData={collectionData} onClick={() => handleNFTClick(nft)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No NFTs found in your wallet for this collection.</p>
            </div>
          )}
        </CardContent>
      </GlassCard>

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
