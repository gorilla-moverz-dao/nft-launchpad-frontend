import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

// Search params validation
export type CollectionSearch = {
  search: string;
  sort: "newest" | "oldest" | "name" | "rarity";
  view: "grid" | "list";
  page: number;
  filter: "all" | "owned" | "available";
  traits: Record<string, Array<string>>;
};

export function useCollectionSearch() {
  const search = useSearch({ from: "/collections/$collectionId" });
  const navigate = useNavigate();
  const { collectionId } = useParams({ from: "/collections/$collectionId" });

  // Helper function to update search params
  const updateSearchParams = (updates: Partial<CollectionSearch>) => {
    navigate({
      to: "/collections/$collectionId",
      params: { collectionId },
      search: (prev) => ({
        search: prev.search ?? "",
        sort: prev.sort ?? "newest",
        view: prev.view ?? "grid",
        page: prev.page ?? 1,
        filter: prev.filter ?? "all",
        traits: prev.traits ?? {},
        ...updates,
      }),
    });
  };

  // Helper function to clear all filters
  const clearAllFilters = () => {
    updateSearchParams({
      search: "",
      sort: "newest",
      filter: "all",
      traits: {},
      page: 1,
    });
  };

  const handleSearchChange = (value: string) => {
    updateSearchParams({ search: value, page: 1 });
  };

  // Handle sort change
  const handleSortChange = (value: CollectionSearch["sort"]) => {
    updateSearchParams({ sort: value, page: 1 });
  };

  // Handle view change
  const handleViewChange = (value: CollectionSearch["view"]) => {
    updateSearchParams({ view: value });
  };

  // Handle filter change
  const handleFilterChange = (value: CollectionSearch["filter"]) => {
    updateSearchParams({ filter: value, page: 1 });
  };

  // Handle trait removal
  const removeTrait = (traitType: string) => {
    const newTraits = { ...search.traits };
    delete newTraits[traitType];
    updateSearchParams({ traits: newTraits, page: 1 });
  };

  return {
    search,
    collectionId,
    updateSearchParams,
    clearAllFilters,
    handleSearchChange,
    handleSortChange,
    handleViewChange,
    handleFilterChange,
    removeTrait,
  };
}
