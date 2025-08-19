# Welcome to ASSPad

ASSPad is an NFT Launchpad that runs on the Movement Blockchain and is developed and maintained by GorillaMoverz.

You can use this project to build your own customized mint page.

## Getting Started

To run this application:

```bash
pnpm install
pnpm start
```

## Building for Production

To build this application for production:

```bash
pnpm build
```

## Build a customized mint page

- Fork the repository
- Set the COLLECTION_ID in [src/constants.ts](src/constants.ts) to your collection
- Adapt the color scheme in [styles.css](src/styles.css). Currently only the dark theme is used
- Adapt texts, images and what else you want to have changed
- Deploy the Mint page to Vercel or any other hosting providers

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses ESLint & Prettier for linting and formatting. The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Shadcn

Add components using the latest version of [Shadcn](https://ui.shadcn.com/):

```bash
pnpx shadcn@latest add button
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file-based router, which means that the routes are managed as files in `src/routes`.

## GraphQL Codegen

The project uses [GraphQL Codegen](https://the-guild.dev/graphql/codegen) to provide full type safety on queries and returned types without the need to manually create types.

## Aptos Wallet Adapter & Surf Client

Using [Surf](https://github.com/ThalaLabs/surf), you get full type support for calling Move Smart Contracts.
