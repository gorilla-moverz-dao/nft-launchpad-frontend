import { createFileRoute, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, Grid, List, Search } from "lucide-react";

import type { NFTData } from "@/components/AssetDetailDialog";
import { AssetDetailDialog } from "@/components/AssetDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlassCard } from "@/components/GlassCard";
import { NFTThumbnail } from "@/components/NFTThumbnail";
import { useCollectionData } from "@/hooks/useCollectionData";
import { useCollectionNFTs } from "@/hooks/useCollectionNFTs";

// Search params validation
type CollectionSearch = {
  search: string;
  sort: "newest" | "oldest" | "name" | "rarity";
  view: "grid" | "list";
  page: number;
  filter: "all" | "owned" | "available";
};

export const Route = createFileRoute("/collections/$collectionId")({
  validateSearch: (search: Record<string, unknown>): CollectionSearch => {
    return {
      search: (search.search as string) || "",
      sort: (search.sort as CollectionSearch["sort"] | undefined) || "newest",
      view: (search.view as CollectionSearch["view"] | undefined) || "grid",
      page: Number(search.page) || 1,
      filter: (search.filter as CollectionSearch["filter"] | undefined) || "all",
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { collectionId } = useParams({ from: "/collections/$collectionId" });
  const search = useSearch({ from: "/collections/$collectionId" });
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(search.search);
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch collection details
  const { data: collectionData, isLoading: collectionLoading } = useCollectionData(collectionId as `0x${string}`);

  // Fetch NFTs in the collection
  const { data: nftsData, isLoading: nftsLoading } = useCollectionNFTs(search.filter === "owned", [collectionId]);

  // Filter and sort NFTs
  const filteredAndSortedNFTs = useMemo(() => {
    if (!nftsData?.current_token_ownerships_v2) return [];

    const filtered = nftsData.current_token_ownerships_v2.filter((nft: any) => {
      const searchTerm = search.search.toLowerCase();
      const tokenName = nft.current_token_data?.token_name?.toLowerCase() || "";
      const description = nft.current_token_data?.description?.toLowerCase() || "";
      const tokenId = nft.token_data_id.toLowerCase();

      // Apply search filter
      if (search.search && !tokenName.includes(searchTerm) && !description.includes(searchTerm) && !tokenId.includes(searchTerm)) {
        return false;
      }

      // Apply ownership filter
      if (search.filter === "owned") {
        // You might want to check if the current user owns this NFT
        // For now, we'll show all NFTs
        return true;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      switch (search.sort) {
        case "newest":
          // Since we don't have last_transaction_timestamp, we'll sort by token_data_id
          return b.token_data_id.localeCompare(a.token_data_id);
        case "oldest":
          return a.token_data_id.localeCompare(b.token_data_id);
        case "name":
          return (a.current_token_data?.token_name || "").localeCompare(b.current_token_data?.token_name || "");
        case "rarity":
          // You could implement rarity calculation here based on token_properties
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [nftsData, search.search, search.sort, search.filter]);

  const totalPages = collectionData ? Math.ceil((collectionData.collection.current_supply || 0) / 20) : 0;

  // Dialog handlers
  const handleNFTClick = (nft: any) => {
    setSelectedNFT(nft);
    setIsDialogOpen(true);
  };

  // Helper function to update search params
  const updateSearchParams = (updates: Partial<CollectionSearch>) => {
    navigate({
      to: "/collections/$collectionId",
      params: { collectionId },
      search: (prev) => ({
        search: prev.search || "",
        sort: prev.sort || "newest",
        view: prev.view || "grid",
        page: prev.page || 1,
        filter: prev.filter || "all",
        ...updates,
      }),
    });
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

      {/* Filters and Search */}
      <GlassCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by name, description, or token ID..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateSearchParams({ search: localSearch, page: 1 });
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => {
                updateSearchParams({ search: localSearch, page: 1 });
              }}
            >
              Search
            </Button>
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort by:</span>
              <Select
                value={search.sort}
                onValueChange={(value) => {
                  updateSearchParams({ sort: value as CollectionSearch["sort"] });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="rarity">Rarity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter:</span>
              <Select
                value={search.filter}
                onValueChange={(value) => {
                  updateSearchParams({ filter: value as CollectionSearch["filter"] });
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All NFTs</SelectItem>
                  <SelectItem value="owned">Owned</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium">View:</span>
              <div className="flex border rounded-md">
                <Button
                  variant={search.view === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    updateSearchParams({ view: "grid" });
                  }}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={search.view === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    updateSearchParams({ view: "list" });
                  }}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAndSortedNFTs.length} of {collectionData.collection.current_supply} NFTs
          {search.search && ` matching "${search.search}"`}
        </div>
      </div>

      {/* NFTs Grid/List */}
      {nftsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-lg">Loading NFTs...</div>
        </div>
      ) : filteredAndSortedNFTs.length === 0 ? (
        <GlassCard>
          <CardContent className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-2">
              <div className="text-lg font-medium">No NFTs found</div>
              <div className="text-sm text-muted-foreground">
                {search.search ? `No NFTs match "${search.search}"` : "This collection has no NFTs yet"}
              </div>
            </div>
          </CardContent>
        </GlassCard>
      ) : (
        <>
          {search.view === "grid" ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredAndSortedNFTs.map((nft) => (
                <NFTThumbnail key={nft.token_data_id} nft={nft} collectionData={collectionData} onClick={() => handleNFTClick(nft)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedNFTs.map((nft) => (
                <GlassCard
                  key={nft.token_data_id}
                  className="p-4 cursor-pointer hover:bg-white/10 transition-all duration-200 backdrop-blur-sm bg-white/5 border border-white/20"
                  onClick={() => handleNFTClick(nft)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                      <img
                        src={nft.current_token_data?.token_uri}
                        alt={nft.current_token_data?.token_name || "NFT"}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = collectionData.collection.uri || "/favicon.png")}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{nft.current_token_data?.token_name || `Token ${nft.token_data_id}`}</h4>
                      <p className="text-sm text-muted-foreground">{nft.current_token_data?.description}</p>
                      <p className="text-xs text-muted-foreground">Token ID: {nft.token_data_id.split("::")[2]}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">#{nft.token_data_id.split("::")[2]}</Badge>
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
