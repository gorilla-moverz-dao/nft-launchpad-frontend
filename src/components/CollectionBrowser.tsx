import { Link } from "@tanstack/react-router";
import { GlassCard } from "./GlassCard";
import { useMintingCollections } from "@/hooks/useMintingCollections";
import { useListedCollections } from "@/hooks/useListedCollections";

export function CollectionBrowser({ path }: { path: "mint" | "collections" }) {
  const { data, isLoading, error } = path === "mint" ? useMintingCollections() : useListedCollections();

  if (isLoading) return <div>Loading collections...</div>;
  if (error) return <div>Error loading collections.</div>;
  if (!data || data.length === 0) return <div>No collections found.</div>;

  return (
    <>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
        {data.map((collection, idx) => (
          <Link key={idx} to={`/${path}/$collectionId`} params={{ collectionId: collection.collection_id }} className="block">
            <GlassCard hoverEffect={true} className="flex flex-col items-center p-4 h-full group gap-2">
              <div className="w-full flex items-center justify-center mb-3 overflow-hidden rounded-lg border">
                <img
                  src={collection.uri}
                  alt={collection.collection_name}
                  className="w-full h-full object-cover border-white/20 bg-white/10 transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => (e.currentTarget.src = "/images/favicon-1.png")}
                />
              </div>
              <div className="font-semibold text-lg text-foreground truncate w-full" title={collection.collection_name}>
                {collection.collection_name}
              </div>
              <div className="text-sm text-muted-foreground w-full line-clamp-3" title={collection.description}>
                {collection.description}
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </>
  );
}
