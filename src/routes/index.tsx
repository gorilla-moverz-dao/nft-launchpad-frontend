import { createFileRoute } from "@tanstack/react-router";
import { SINGLE_COLLECTION_MODE } from "@/constants";
import { CollectionBrowser } from "@/components/CollectionBrowser";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const isSingleCollectionMode = SINGLE_COLLECTION_MODE;

  if (isSingleCollectionMode) {
    return <>Mint your NFTs</>;
  }

  return (
    <>
      <CollectionBrowser />
    </>
  );
}
