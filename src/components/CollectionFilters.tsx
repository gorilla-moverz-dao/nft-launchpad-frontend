import { useEffect, useState } from "react";
import { Filter, Grid, List, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TraitFilterComponent } from "@/components/TraitFilter";
import { useClients } from "@/hooks/useClients";
import { useCollectionSearch } from "@/hooks/useCollectionSearch";

export function CollectionFilters() {
  const {
    search,
    updateSearchParams,
    clearAllFilters,
    handleSearchChange,
    handleSortChange,
    handleViewChange,
    handleFilterChange,
    removeTrait,
  } = useCollectionSearch();

  // Handle trait selection
  const handleTraitChange = (traitType: string, traitValue: string, checked: boolean) => {
    const currentTraits = search.traits;
    const traitValues = currentTraits[traitType] ?? [];

    let newTraitValues: Array<string>;
    if (checked) {
      newTraitValues = [...traitValues, traitValue];
    } else {
      newTraitValues = traitValues.filter((value) => value !== traitValue);
    }

    const newTraits: Record<string, Array<string>> = {
      ...currentTraits,
    };

    if (newTraitValues.length > 0) {
      newTraits[traitType] = newTraitValues;
    } else {
      delete newTraits[traitType];
    }

    updateSearchParams({ traits: newTraits, page: 1 });
  };

  const [localSearch, setLocalSearch] = useState(search.search);
  const { address } = useClients();

  // Sync local search state with prop changes (e.g., from URL updates)
  useEffect(() => {
    setLocalSearch(search.search);
  }, [search.search]);

  // Check if there are any active filters (non-default values)
  const hasActiveFilters = search.search || search.sort !== "newest" || search.filter !== "all" || Object.keys(search.traits).length > 0;

  return (
    <div className="space-y-4">
      {/* Search and Basic Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, description, or token ID..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchChange(localSearch);
              }
            }}
            className="pl-10"
          />
        </div>

        {/* Sort Dropdown */}
        <Select value={search.sort} onValueChange={(value) => handleSortChange(value as any)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="rarity">Rarity</SelectItem>
          </SelectContent>
        </Select>

        {/* Filter Dropdown */}
        {address && (
          <Select value={search.filter} onValueChange={(value) => handleFilterChange(value as any)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All NFTs</SelectItem>
              <SelectItem value="owned">Owned by Me</SelectItem>
              <SelectItem value="available">Available</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* View Toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={search.view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewChange("grid")}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={search.view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => handleViewChange("list")}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>

        {/* Trait Filters Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Trait Filters
              {Object.keys(search.traits).length > 0 && (
                <Badge variant="default" className="ml-2 h-5 w-5 p-0 text-xs">
                  {Object.keys(search.traits).length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Trait Filters
                {Object.keys(search.traits).length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Object.keys(search.traits).length} active
                  </Badge>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <TraitFilterComponent onTraitChange={handleTraitChange} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Filters Display */}
      {(search.search || Object.keys(search.traits).length > 0) && (
        <div className="flex flex-wrap gap-2">
          {search.search && (
            <Badge variant="default" className="flex items-center gap-1">
              Search: "{search.search}"
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                style={{ paddingInline: "4px" }}
                onClick={() => handleSearchChange("")}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {Object.entries(search.traits).map(([traitType, values]) => (
            <Badge key={traitType} variant="default" className="flex items-center gap-1">
              {traitType}: {values.join(", ")}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                style={{ paddingInline: "4px" }}
                onClick={() => removeTrait(traitType)}
              >
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              style={{ paddingInline: "4px", paddingRight: "8px" }}
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4 mr-0" />
              Clear All
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
