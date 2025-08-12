import { NFTThumbnail } from "./NFTThumbnail";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";

interface MintResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentlyMintedTokenIds: Array<string>;
  collectionData: any;
}

export function MintResultDialog({ open, onOpenChange, recentlyMintedTokenIds, collectionData }: MintResultDialogProps) {
  const { data: nfts, isLoading: isLoadingNFTs } = useCollectionNFTs({
    onlyOwned: false,
    collectionIds: [collectionData.collection.collection_id],
    tokenIds: recentlyMintedTokenIds,
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🎉 Mint Successful!</DialogTitle>
          <DialogDescription>You have successfully minted {recentlyMintedTokenIds.length} NFT(s) from the collection.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingNFTs ? (
            <div className="text-center py-8">Loading your newly minted NFTs...</div>
          ) : nfts?.current_token_ownerships_v2 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {nfts.current_token_ownerships_v2
                .filter((nft: any) => recentlyMintedTokenIds.includes(nft.token_data_id))
                .map((nft: any) => (
                  <NFTThumbnail key={nft.token_data_id} nft={nft} collectionData={collectionData} />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No NFTs found for the recently minted token IDs</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
