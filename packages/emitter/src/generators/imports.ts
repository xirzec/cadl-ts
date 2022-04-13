// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ClientContext } from "./cache.js";

export function createImports(context: ClientContext): string {
  const corePipelineImports = [
    "createPipelineRequest",
    "Pipeline",
    ...context.extraCorePipelineImports,
  ];
  const tsClientImports = [
    "CommonClientOptions",
    "createClientPipeline",
    "makeRequest",
    "getRequestUrl",
    "tryParseResponse",
    "stringifyQueryParam",
    ...context.extraClientLibImports,
  ];
  return `import { ${corePipelineImports.join()} } from "@azure/core-rest-pipeline";
import { ${tsClientImports.join()} } from "@azure-tools/cadl-ts-client";
`;
}
