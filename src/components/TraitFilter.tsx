import React from "react";
import { GlassCard } from "./GlassCard";
import { useTraitAggregation } from "@/hooks/useCollectionNFTs";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useCollectionSearch } from "@/hooks/useCollectionSearch";

interface TraitFilterProps {
  onTraitChange?: (traitType: string, value: string, checked: boolean) => void;
}

export function TraitFilterComponent({ onTraitChange }: TraitFilterProps) {
  const { search, collectionId } = useCollectionSearch();
  const { data: traitData, isLoading, error } = useTraitAggregation(search.filter === "owned", [collectionId], [], search.search);

  if (isLoading) {
    return (
      <GlassCard>
        <CardContent className="p-4">
          <div className="text-center">Loading trait filters...</div>
        </CardContent>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard>
        <CardContent className="p-4">
          <div className="text-center text-destructive">Error loading trait filters</div>
        </CardContent>
      </GlassCard>
    );
  }

  if (!traitData?.traits || traitData.traits.length === 0) {
    return (
      <GlassCard>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">No traits found in this collection</div>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Trait Filters
          <Badge variant="outline">{traitData.traits.length} trait types</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {traitData.traits.map((trait) => (
          <div key={trait.trait_type} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium capitalize">{trait.trait_type.replace(/_/g, " ")}</h4>
              <Badge variant="outline">{trait.values.length}</Badge>
            </div>
            <div className="space-y-1">
              {trait.values.map(({ value, count }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${trait.trait_type}-${value}`}
                    checked={(search.traits[trait.trait_type] as Array<string> | undefined)?.includes(value) ?? false}
                    onCheckedChange={(checked: boolean) => {
                      onTraitChange?.(trait.trait_type, value, checked);
                    }}
                  />
                  <label htmlFor={`${trait.trait_type}-${value}`} className="text-sm flex-1 cursor-pointer">
                    {value}
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </GlassCard>
  );
}

export function TraitFilterExample() {
  const [selectedTraits, setSelectedTraits] = React.useState<Record<string, Array<string>>>({});

  const handleTraitChange = (traitType: string, value: string, checked: boolean) => {
    setSelectedTraits((prev) => {
      const currentValues = prev[traitType];
      const newValues = checked ? [...currentValues, value] : currentValues.filter((v) => v !== value);

      return {
        ...prev,
        [traitType]: newValues,
      };
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">NFT Trait Filters</h2>
      <TraitFilterComponent onTraitChange={handleTraitChange} />

      {Object.keys(selectedTraits).length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Selected Filters:</h3>
          {Object.entries(selectedTraits).map(([traitType, values]) => (
            <div key={traitType} className="mb-2">
              <span className="font-medium capitalize">{traitType.replace(/_/g, " ")}:</span>
              <span className="ml-2 text-sm">{values.join(", ")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
