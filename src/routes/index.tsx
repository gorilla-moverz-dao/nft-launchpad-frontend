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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl pb-4">Active & Upcoming Mints</h1>
      </div>
      <CollectionBrowser path="mint" />
    </>
  );
}
