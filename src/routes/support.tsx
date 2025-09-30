import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl pb-4">Support</h1>
      </div>
      <div className="flex flex-col gap-4">
        <p>
          If you have any questions or need help, go to the Discord Server here:
          <br />
          <a
            href="https://discord.com/channels/1204497818987921518/1378593562509443196"
            target="_blank"
            className="text-green-500 underline"
          >
            Gorilla Moverz Discord
          </a>
        </p>
      </div>
    </>
  );
}
