import { GlassCard } from "./GlassCard";
import { useMintingCollections } from "@/hooks/useMintingCollections";

export function CollectionBrowser() {
  const { data, isLoading, error } = useMintingCollections();

  if (isLoading) return <div>Loading collections...</div>;
  if (error) return <div>Error loading collections.</div>;
  if (!data || data.length === 0) return <div>No collections found.</div>;

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl pb-4">Active & Upcoming Mints</h1>
      </div>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
        {data.map((collection, idx) => (
          <GlassCard key={idx} hoverEffect={true} className="flex flex-col items-center p-4 h-full group gap-2 cursor-pointer">
            <div className="w-full aspect-square flex items-center justify-center mb-3 overflow-hidden">
              <img
                src={collection.uri}
                alt={collection.collection_name}
                className="w-full h-full object-cover rounded-lg border border-white/20 bg-white/10 transition-transform duration-300 group-hover:scale-110"
                onError={(e) => (e.currentTarget.src = "/favicon.png")}
              />
            </div>
            <div className="font-semibold text-lg text-foreground truncate w-full" title={collection.collection_name}>
              {collection.collection_name}
            </div>
            <div className="text-sm text-muted-foreground truncate w-full" title={collection.description}>
              {collection.description}
            </div>
          </GlassCard>
        ))}
      </div>
    </>
  );
}
