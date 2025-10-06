import React from "react";
import { Link } from "@tanstack/react-router";
import { GlassCard } from "./GlassCard";
import { useMintingCollections } from "@/hooks/useMintingCollections";
import { useListedCollections } from "@/hooks/useListedCollections";
import { Button } from "@/components/ui/button";
import "@/carousel.css";

type Collection = {
  collection_id: string;
  collection_name: string;
  uri?: string | null;
  description?: string | null;
  current_supply?: number | null;
  max_supply?: number | null;
};

const curatedShowcase: Array<Collection> = [
  {
    collection_id: "curated-starfall",
    collection_name: "Starfall Voyagers",
    uri: "https://omxwswbsb3afnj4i34v6igyfhgdqjfrxla4citfok2g3vzr24bya.arweave.net/cy9pWDIOwFaniN8r5BsFOYcEljdYOCRMrlaNuuY64HA?auto=format&fit=crop&w=1200&q=80",
    description: "Celestial pioneers charting luminous routes through the Aptos ecosystem.",
    current_supply: 128,
    max_supply: 888,
  },
  {
    collection_id: "curated-synthwave",
    collection_name: "Synthwave Shards",
    uri: "https://xegaqwjj3zp3u42ei724lt6dm3s4wf4esi5bv5japlifdo25j3sa.arweave.net/uQwIWSneX7pzREf1xc_DZuXLF4SSOhr1IHrQUbtdTuQ?auto=format&fit=crop&w=1200&q=80",
    description: "Retro-futuristic artifacts forged for collectors chasing neon horizons.",
    current_supply: 420,
    max_supply: 2048,
  },
  {
    collection_id: "curated-aurora",
    collection_name: "Aurora Relics",
    uri: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
    description: "Mystic keepsakes imbued with polar light and multi-chain lore.",
    current_supply: 64,
    max_supply: 512,
  },
];

export function CollectionBrowser({ path }: { path: "mint" | "collections" }) {
  const isMintPath = path === "mint";
  const mintingQuery = useMintingCollections({ enabled: isMintPath });
  const listedQuery = useListedCollections({ enabled: !isMintPath });
  const { data, isLoading, error } = isMintPath ? mintingQuery : listedQuery;

  const combinedCollections = React.useMemo<Array<Collection>>(() => {
    const fetched = (data as Array<Collection> | undefined) ?? [];
    if (!isMintPath) {
      return fetched;
    }
    const extras = curatedShowcase.filter(
      (extra) => !fetched.some((collection) => collection.collection_id === extra.collection_id),
    );
    return [...fetched, ...extras];
  }, [data, isMintPath]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [glowColor, setGlowColor] = React.useState<string>("255, 188, 65");
  const backgroundLayerRef = React.useRef<HTMLDivElement | null>(null);
  const [backwardPhase, setBackwardPhase] = React.useState<'idle' | 'init' | 'anim'>('idle');

  // Extract dominant color from image
  const extractDominantColor = React.useCallback((imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let r = 0, g = 0, b = 0;
        const step = 10;
        
        for (let i = 0; i < imageData.length; i += 4 * step) {
          r += imageData[i];
          g += imageData[i + 1];
          b += imageData[i + 2];
        }
        
        const pixelCount = imageData.length / (4 * step);
        r = Math.round(r / pixelCount);
        g = Math.round(g / pixelCount);
        b = Math.round(b / pixelCount);
        
        setGlowColor(`${r}, ${g}, ${b}`);
      } catch (err) {
        console.log('Could not extract color from image:', err);
      }
    };
    
    img.onerror = () => {
      setGlowColor("255, 188, 65");
    };
  }, []);

  // Reorder collections so active card is always first (must be before any conditional returns)
  const reorderedCollections = React.useMemo(() => {
    if (combinedCollections.length === 0) return [];
    const safeIndex = Math.max(0, Math.min(activeIndex, combinedCollections.length - 1));
    return [
      ...combinedCollections.slice(safeIndex),
      ...combinedCollections.slice(0, safeIndex)
    ];
  }, [combinedCollections, activeIndex]);

  // Update glow color when active collection changes
  React.useEffect(() => {
    if (!isMintPath || combinedCollections.length === 0) return;
    const safeIndex = Math.max(0, Math.min(activeIndex, combinedCollections.length - 1));
    const activeCollection = combinedCollections[safeIndex];
    
    if (activeCollection.uri) {
      extractDominantColor(activeCollection.uri);
    }
  }, [activeIndex, combinedCollections, isMintPath, extractDominantColor]);

  React.useEffect(() => {
    if (!isMintPath) return;
    if (typeof document === "undefined") return;

    const layer = document.createElement("div");
    layer.dataset.collectionBackdrop = "true";
    Object.assign(layer.style, {
      position: "fixed",
      inset: "0",
      zIndex: "5",
      pointerEvents: "none",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      transition: "opacity 0.3s ease",
      opacity: "1",
    });

    document.body.appendChild(layer);
    backgroundLayerRef.current = layer;

    return () => {
      const layerElement = backgroundLayerRef.current;
      if (layerElement && layerElement.parentNode) {
        layerElement.parentNode.removeChild(layerElement);
      }
      backgroundLayerRef.current = null;
    };
  }, [isMintPath]);

  React.useEffect(() => {
    if (!isMintPath) return;
    const layer = backgroundLayerRef.current;
    if (!layer || combinedCollections.length === 0) return;

    const safeIndex = Math.max(0, Math.min(activeIndex, combinedCollections.length - 1));
    const current = combinedCollections[safeIndex];
    const backgroundUrl = current.uri;
    
    if (backgroundUrl) {
      // Preload the image first, then update background
      const img = new Image();
      img.onload = () => {
        layer.style.backgroundImage = `linear-gradient(135deg, rgba(6, 6, 8, 0.86), rgba(8, 12, 18, 0.62)), url(${backgroundUrl})`;
      };
      img.onerror = () => {
        // If image fails to load, update anyway
        layer.style.backgroundImage = `linear-gradient(135deg, rgba(6, 6, 8, 0.86), rgba(8, 12, 18, 0.62)), url(${backgroundUrl})`;
      };
      img.src = backgroundUrl;
    }
  }, [activeIndex, combinedCollections, isMintPath]);

  // Preload all collection images on mount for instant switching
  React.useEffect(() => {
    if (!isMintPath || combinedCollections.length === 0) return;
    
    // Preload all images
    combinedCollections.forEach(collection => {
      if (collection.uri) {
        const img = new Image();
        img.src = collection.uri;
      }
    });
  }, [combinedCollections, isMintPath]);

  React.useEffect(() => {
    if (backwardPhase === 'init') {
      const raf = requestAnimationFrame(() => {
        setBackwardPhase('anim');
      });
      return () => cancelAnimationFrame(raf);
    }

    if (backwardPhase === 'anim') {
      const timeout = window.setTimeout(() => {
        setBackwardPhase('idle');
      }, 500);
      return () => window.clearTimeout(timeout);
    }
  }, [backwardPhase]);

  if (isLoading) return <div>Loading collections...</div>;
  if (error) return <div>Error loading collections: {error.message || "Failed to fetch data"}</div>;

  if (combinedCollections.length === 0) {
    return <div>No collections found.</div>;
  }

  const scrollPrev = () => {
    setBackwardPhase('init');
    setActiveIndex((prev) => (prev - 1 + combinedCollections.length) % combinedCollections.length);
  };
  const scrollNext = () => {
    setBackwardPhase('idle');
    setActiveIndex((prev) => (prev + 1) % combinedCollections.length);
  };
  const scrollTo = (index: number) => {
    if (index === activeIndex) return;
    setBackwardPhase(index < activeIndex ? 'init' : 'idle');
    setActiveIndex(index);
  };

  if (path === "mint") {
    const safeIndex = Math.max(0, Math.min(activeIndex, combinedCollections.length - 1));
    const activeCollection = combinedCollections[safeIndex];

    return (
      <section className="relative z-10 py-8 md:py-12">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
          <div className="flex-1 max-w-3xl space-y-6 text-white">
            <div className="text-sm uppercase tracking-[0.45em] text-white/60">Featured Drop</div>
            <div className="space-y-3">
              <h2 className="text-4xl font-bold sm:text-5xl md:text-6xl drop-shadow-[0_4px_20px_rgba(0,0,0,0.55)]">
                {activeCollection.collection_name}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
              {activeCollection.description ?? "Discover the next generation of Aptos-powered collections curated for the launchpad."}
            </p>
            <div className="flex flex-wrap items-center gap-8 text-sm text-white/70">
              {typeof activeCollection.current_supply === "number" && typeof activeCollection.max_supply === "number" ? (
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">Minted</div>
                  <div className="text-2xl font-semibold">
                    {activeCollection.current_supply}/{activeCollection.max_supply}
                  </div>
                </div>
              ) : null}
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">Network</div>
                <div className="text-2xl font-semibold">Aptos</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-white/50">Spotlight</div>
                <div className="text-2xl font-semibold">#{safeIndex + 1}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild size="lg" className="bg-white/90 text-black hover:bg-white">
                <Link to="/mint/$collectionId" params={{ collectionId: activeCollection.collection_id }}>
                  Mint now
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-white/80 hover:bg-white/10"
                onClick={scrollNext}
              >
                Next drop
              </Button>
            </div>
          </div>

          <div className="relative flex w-full flex-col gap-8 lg:max-w-2xl">
            <div className="relative w-full h-[400px]">
              <div
                className="carousel-slide absolute inset-0 flex items-center justify-center md:justify-start md:pl-16"
                data-backward-phase={backwardPhase !== 'idle' ? backwardPhase : undefined}
              >
                {reorderedCollections.map((collection, position) => {
                  const isActive = position === 0;
                  const originalIdx = combinedCollections.findIndex(c => c.collection_id === collection.collection_id);
                  
                  return (
                    <Link
                      key={collection.collection_id}
                      to="/mint/$collectionId"
                      params={{ collectionId: collection.collection_id }}
                      className="carousel-item absolute block h-[320px] w-[230px] transition-all duration-500 ease-out cursor-pointer"
                      data-position={position}
                      onClick={(e) => {
                        if (!isActive) {
                          e.preventDefault();
                          scrollTo(originalIdx);
                        }
                      }}
                    >
                      <div
                        className={`relative h-full overflow-hidden rounded-[28px] border bg-black/30 transition-all duration-500 ${
                          isActive 
                            ? "shadow-[0_12px_30px_rgba(0,0,0,0.6)]" 
                            : "shadow-[0_8px_20px_rgba(0,0,0,0.4)] border-white/5 brightness-90"
                        }`}
                        style={
                          isActive
                            ? {
                                boxShadow: `0 12px 40px rgba(${glowColor}, 0.4), 0 0 20px rgba(${glowColor}, 0.3)`,
                                borderColor: `rgba(${glowColor}, 0.5)`,
                              }
                            : {}
                        }
                      >
                        <img
                          src={collection.uri ?? "/images/banana-tree.webp"}
                          alt={collection.collection_name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-4">
                          <div className="text-[10px] uppercase tracking-[0.5em] text-white/60">Mint Collection</div>
                          <div className="text-base font-semibold text-white">{collection.collection_name}</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between text-white/70 pl-1">
              <button
                onClick={scrollPrev}
                className="rounded-full border border-white/30 bg-black/30 p-2 hover:bg-white/20"
                aria-label="Previous collection"
              >
                ◀
              </button>
              <div className="flex gap-2">
                {combinedCollections.map((collection, idx) => (
                  <button
                    key={collection.collection_id}
                    onClick={() => scrollTo(idx)}
                    className={`h-1.5 w-8 rounded-full transition-opacity ${idx === safeIndex ? "bg-white opacity-100" : "bg-white/40 opacity-60 hover:opacity-90"}`}
                    aria-label={`Go to ${collection.collection_name}`}
                  />
                ))}
              </div>
              <button
                onClick={scrollNext}
                className="rounded-full border border-white/30 bg-black/30 p-2 hover:bg-white/20"
                aria-label="Next collection"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
      {combinedCollections.map((collection: Collection, idx: number) => (
        <Link
          key={idx}
          to={`/${path}/$collectionId`}
          params={{ collectionId: collection.collection_id }}
          search={{
            search: '',
            sort: 'newest',
            view: 'grid',
            page: 1,
            filter: 'all',
            traits: {}
          }}
          className="block"
        >
          <GlassCard hoverEffect={true} className="flex flex-col items-center p-4 h-full group gap-2">
            <div className="w-full flex items-center justify-center mb-3 overflow-hidden rounded-lg border">
              <img
                src={collection.uri ?? "/images/banana-tree.webp"}
                alt={collection.collection_name}
                className="w-full h-full object-cover border-white/20 bg-white/10 transition-transform duration-300 group-hover:scale-110"
              />
            </div>
            <div className="font-semibold text-lg text-foreground truncate w-full" title={collection.collection_name}>
              {collection.collection_name}
            </div>
            <div className="text-sm text-muted-foreground w-full line-clamp-3" title={collection.description ?? undefined}>
              {collection.description}
            </div>
          </GlassCard>
        </Link>
      ))}
    </div>
  );
}
