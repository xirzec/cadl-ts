// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Response, ModelType } from "../modeler/model.js";

export interface CachedInterface {
  name: string;
  generatedText: string;
  inline: boolean;
}

export interface ClientContext {
  interfaceCache: Map<ModelType, CachedInterface>;
  responseCache: Map<Response, CachedInterface>;
  extraCorePipelineImports: Set<string>;
  extraClientLibImports: Set<string>;
}
