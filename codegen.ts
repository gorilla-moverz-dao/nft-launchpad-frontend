import { MOVE_NETWORK } from "./src/constants";
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: MOVE_NETWORK.indexerUrl,
  documents: ["src/**/*.tsx", "src/**/*.ts"],
  ignoreNoDocuments: true,

  generates: {
    "./src/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
        useTypeImports: true,
      },
      presetConfig: {
        fragmentMasking: false,
      },
    },
    "./schema.graphql": {
      plugins: ["schema-ast"],
      config: {
        includeDirectives: true,
      },
    },
  },
};

export default config;
