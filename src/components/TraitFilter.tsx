import { GlassCard } from "./GlassCard";
import { useTraitAggregation } from "@/hooks/useCollectionNFTs";
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
      <CardContent className="space-y-4">
        {traitData.traits.map((trait) => (
          <div key={trait.trait_type} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium capitalize">{trait.trait_type.replace(/_/g, " ")}</h4>
            </div>
            <div className="space-y-1">
              {trait.values.map(({ value }) => (
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
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </GlassCard>
  );
}
