import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { toShortAddress } from "@/lib/utils";

interface MintResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentlyMintedTokenIds: Array<string>;
  collectionData: any;
}

export function MintResultDialog({ open, onOpenChange, recentlyMintedTokenIds, collectionData }: MintResultDialogProps) {
  const { data: nfts, isLoading: isLoadingNFTs } = useCollectionNFTs(collectionData.collection.collection_id, recentlyMintedTokenIds);
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
            <div className="flex flex-wrap gap-3">
              {nfts.current_token_ownerships_v2
                .filter((nft: any) => recentlyMintedTokenIds.includes(nft.token_data_id))
                .map((nft: any, index: number) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden border-2 border-primary/20">
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
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium truncate max-w-20">{nft.current_token_data?.token_name || `Token ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{toShortAddress(nft.token_data_id)}</p>
                    </div>
                  </div>
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
