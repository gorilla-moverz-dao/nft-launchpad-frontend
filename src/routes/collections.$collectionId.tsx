import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { NFTData } from "@/components/AssetDetailDialog";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";
import { CollectionFilters } from "@/components/CollectionFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { NFTThumbnail } from "@/components/NFTThumbnail";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";
import { useCollectionSearch } from "@/hooks/useCollectionSearch";
import { toShortAddress } from "@/lib/utils";

// Search params validation
type CollectionSearch = {
  search: string;
  sort: "newest" | "oldest" | "name" | "rarity";
  view: "grid" | "list";
  page: number;
  filter: "all" | "owned" | "available";
  traits: Record<string, Array<string>>;
};

export const Route = createFileRoute("/collections/$collectionId")({
  validateSearch: (search: Record<string, unknown>): CollectionSearch => {
    return {
      search: (search.search as string) || "",
      sort: (search.sort as CollectionSearch["sort"] | undefined) || "newest",
      view: (search.view as CollectionSearch["view"] | undefined) || "grid",
      page: Number(search.page) || 1,
      filter: (search.filter as CollectionSearch["filter"] | undefined) || "all",
      traits: (search.traits as Record<string, Array<string>> | undefined) || {},
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { search, collectionId, updateSearchParams } = useCollectionSearch();
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch collection details
  const { data: collectionData, isLoading: collectionLoading } = useCollectionData(collectionId as `0x${string}`);

  // Fetch NFTs in the collection
  const { data: nftsData, isLoading: nftsLoading } = useCollectionNFTs(
    search.filter === "owned",
    [collectionId],
    search.sort,
    search.search,
    search.page,
    20,
    undefined,
    search.traits,
  );

  // Get the NFTs directly from the server response
  const nfts = nftsData?.current_token_ownerships_v2 || [];

  const totalPages = collectionData ? Math.ceil((collectionData.collection.current_supply || 0) / 20) : 0;

  // Dialog handlers
  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setIsDialogOpen(true);
  };

  if (collectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading collection...</div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-destructive">Collection not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Collection Header */}
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/20">
          <img
            src={collectionData.collection.uri}
            alt={collectionData.collection.collection_name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/favicon.png")}
          />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{collectionData.collection.collection_name}</h1>
            <p className="text-muted-foreground mt-2">{collectionData.collection.description}</p>
          </div>
          <div className="flex gap-4">
            <Badge variant="secondary">
              {collectionData.collection.current_supply} / {collectionData.collection.max_supply || "∞"} minted
            </Badge>
            <Badge variant="outline">
              Creator: {collectionData.collection.creator_address.slice(0, 8)}...{collectionData.collection.creator_address.slice(-6)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <CollectionFilters />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {nfts.length} of {nfts.length} NFTs
          {search.search && ` matching "${search.search}"`}
          {Object.keys(search.traits).length > 0 && ` with trait filters`}
        </div>
      </div>

      {/* NFTs Grid/List */}
      {nftsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading NFTs...</div>
        </div>
      ) : nfts.length === 0 ? (
        <GlassCard>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-2">
              <div className="text-lg font-medium">No NFTs found</div>
              <div className="text-sm text-muted-foreground">
                {search.search
                  ? `No NFTs match "${search.search}"`
                  : Object.keys(search.traits).length > 0
                    ? "No NFTs match the selected traits"
                    : "This collection has no NFTs yet"}
              </div>
            </div>
          </CardContent>
        </GlassCard>
      ) : (
        <>
          {search.view === "grid" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {nfts.map((nft) => (
                <NFTThumbnail key={nft.token_data_id} nft={nft} collectionData={collectionData} onClick={() => handleNFTClick(nft)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {nfts.map((nft) => (
                <GlassCard
                  hoverEffect={true}
                  key={nft.token_data_id}
                  className="p-2 cursor-pointer hover:bg-white/10 transition-all duration-200 backdrop-blur-sm bg-white/5 border border-white/20 group"
                  onClick={() => handleNFTClick(nft)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/20 transition-transform duration-300 group-hover:scale-120">
                      <img
                        src={nft.current_token_data?.token_uri}
                        alt={nft.current_token_data?.token_name || "NFT"}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = collectionData.collection.uri || "/favicon.png")}
                      />
                    </div>
                    <div className="flex-3">
                      <h4 className="font-medium">{nft.current_token_data?.token_name || `Token ${nft.token_data_id}`}</h4>
                      <p className="text-sm text-muted-foreground">{nft.current_token_data?.description}</p>
                      <p className="text-xs text-muted-foreground">Token ID: {toShortAddress(nft.token_data_id)}</p>
                    </div>
                    <div className="flex-2 text-right">
                      {Object.entries(nft.current_token_data?.token_properties || {}).map(([traitType, value], idx) => (
                        <Badge key={idx} variant="outline">
                          {traitType}: {value as string}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={search.page <= 1}
                onClick={() => {
                  updateSearchParams({ page: search.page - 1 });
                }}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {search.page} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={search.page >= totalPages}
                onClick={() => {
                  updateSearchParams({ page: search.page + 1 });
                }}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Asset Detail Dialog */}
      <AssetDetailDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} nft={selectedNFT} collectionData={collectionData.collection} />
    </div>
  );
}
