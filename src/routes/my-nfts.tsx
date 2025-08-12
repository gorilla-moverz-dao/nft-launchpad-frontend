import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { GlassCard } from "@/components/GlassCard";
import { CardContent } from "@/components/ui/card";
import { NFTThumbnail } from "@/components/NFTThumbnail";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";
import { COLLECTION_ID, SINGLE_COLLECTION_MODE } from "@/constants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useListedCollections } from "@/hooks/useListedCollections";

export const Route = createFileRoute("/my-nfts")({
  component: RouteComponent,
});

function RouteComponent() {
  const [showAssetDetailDialog, setShowAssetDetailDialog] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(new Set());

  const { data: collections } = useListedCollections();
  const {
    data: nfts,
    isLoading,
    error,
  } = useCollectionNFTs({
    onlyOwned: true,
    collectionIds: SINGLE_COLLECTION_MODE ? [COLLECTION_ID] : collections?.map((collection) => collection.collection_id) || [],
  });

  useEffect(() => {
    if (collections && collections.length > 0) {
      setExpandedCollections(new Set(collections.map((collection) => collection.collection_id)));
    }
  }, [collections]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const collectionNfts = collections
    ?.map((collection) => {
      return {
        ...collection,
        nfts: nfts?.current_token_ownerships_v2.filter((nft) => nft.current_token_data?.collection_id === collection.collection_id),
      };
    })
    .filter((collection) => collection.nfts?.length);

  const handleNFTClick = (nft: any, collection: any) => {
    setSelectedCollection(collection);
    setSelectedNFT(nft);
    setShowAssetDetailDialog(true);
  };

  const toggleCollection = (collectionId: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl pb-0">My NFTs</h1>
      </div>
      <GlassCard className="w-full">
        <CardContent className="space-y-4">
          {collectionNfts &&
            collectionNfts.length > 0 &&
            collectionNfts.map((collection) => {
              const isExpanded = expandedCollections.has(collection.collection_id);
              const nftCount = collection.nfts?.length || 0;

              return (
                <Collapsible
                  key={collection.collection_id}
                  open={isExpanded}
                  onOpenChange={() => toggleCollection(collection.collection_id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                        <div className="text-left">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {collection.collection_name}{" "}
                            <span className="text-sm text-muted-foreground">
                              ({nftCount} NFT{nftCount !== 1 ? "s" : ""})
                            </span>
                          </h3>
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {collection.nfts?.map((nft) => (
                        <NFTThumbnail
                          key={nft.token_data_id}
                          nft={nft}
                          collectionData={collection}
                          onClick={() => handleNFTClick(nft, collection)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </CardContent>
      </GlassCard>

      {/* Asset Detail Dialog */}
      <AssetDetailDialog
        open={showAssetDetailDialog}
        onOpenChange={setShowAssetDetailDialog}
        nft={selectedNFT}
        collectionData={selectedCollection}
      />
    </div>
  );
}
