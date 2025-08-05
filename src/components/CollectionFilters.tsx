import { useState } from "react";
import { Filter, Grid, List, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { TraitFilterComponent } from "@/components/TraitFilter";

interface CollectionFiltersProps {
  search: {
    search: string;
    sort: "newest" | "oldest" | "name" | "rarity";
    view: "grid" | "list";
    filter: "all" | "owned" | "available";
    traits: Record<string, Array<string>>;
    page: number;
  };
  onUpdateSearch: (updates: Partial<CollectionFiltersProps["search"]>) => void;
  onClearFilters: () => void;
  collectionId: string;
}

export function CollectionFilters({ search, onUpdateSearch, onClearFilters, collectionId }: CollectionFiltersProps) {
  const [localSearch, setLocalSearch] = useState(search.search);

  // Check if there are any active filters (non-default values)
  const hasActiveFilters = search.search || search.sort !== "newest" || search.filter !== "all" || Object.keys(search.traits).length > 0;

  const handleTraitChange = (traitType: string, value: string, checked: boolean) => {
    const currentTraits = search.traits;
    const currentValues = currentTraits[traitType] ?? [];
    const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value);

    const newTraits: Record<string, Array<string>> = { ...currentTraits };

    if (newValues.length > 0) {
      newTraits[traitType] = newValues;
    } else {
      delete newTraits[traitType];
    }

    onUpdateSearch({ traits: newTraits, page: 1 });
  };

  const removeTrait = (traitType: string) => {
    const newTraits = { ...search.traits };
    delete newTraits[traitType];
    onUpdateSearch({ traits: newTraits, page: 1 });
  };

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
                onUpdateSearch({ search: localSearch, page: 1 });
              }
            }}
            className="pl-10"
          />
        </div>

        {/* Sort Dropdown */}
        <Select value={search.sort} onValueChange={(value) => onUpdateSearch({ sort: value as any, page: 1 })}>
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
        <Select value={search.filter} onValueChange={(value) => onUpdateSearch({ filter: value as any, page: 1 })}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All NFTs</SelectItem>
            <SelectItem value="owned">Owned by Me</SelectItem>
            <SelectItem value="available">Available</SelectItem>
          </SelectContent>
        </Select>

        {/* View Toggle */}
        <div className="flex border rounded-md">
          <Button
            variant={search.view === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => onUpdateSearch({ view: "grid" })}
            className="rounded-r-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={search.view === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => onUpdateSearch({ view: "list" })}
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
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
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
              <TraitFilterComponent
                collectionIds={[collectionId]}
                onlyOwned={search.filter === "owned"}
                selectedTraits={search.traits}
                onTraitChange={handleTraitChange}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {(search.search || Object.keys(search.traits).length > 0) && (
        <div className="flex flex-wrap gap-2">
          {search.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{search.search}"
              <Button variant="ghost" size="sm" className="h-auto p-0 ml-1" onClick={() => onUpdateSearch({ search: "", page: 1 })}>
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          )}
          {Object.entries(search.traits).map(([traitType, values]) => (
            <Badge key={traitType} variant="secondary" className="flex items-center gap-1">
              {traitType}: {values.join(", ")}
              <Button variant="ghost" size="sm" className="h-auto p-0 ml-1" onClick={() => removeTrait(traitType)}>
                <X className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
