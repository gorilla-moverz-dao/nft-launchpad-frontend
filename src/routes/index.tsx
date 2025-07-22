import { createFileRoute, redirect } from "@tanstack/react-router";
import { SINGLE_COLLECTION_MODE } from "@/constants";
import { CollectionBrowser } from "@/components/CollectionBrowser";

export const Route = createFileRoute("/")({
  component: App,
  beforeLoad: () => {
    if (SINGLE_COLLECTION_MODE) {
      throw redirect({
        to: "/mint",
      });
    }
  },
});

function App() {
  return (
    <>
      <CollectionBrowser />
    </>
  );
}
