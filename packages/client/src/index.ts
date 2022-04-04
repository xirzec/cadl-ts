// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  InternalPipelineOptions,
  Pipeline,
  PipelineRequest,
  PipelineResponse,
  createPipelineFromOptions,
} from "@azure/core-rest-pipeline";
import { getCachedDefaultHttpClient } from "./httpClientCache";

export function createClientPipeline(options: InternalPipelineOptions): Pipeline {
  return createPipelineFromOptions(options);
}

export function makeRequest(
  pipeline: Pipeline,
  request: PipelineRequest
): Promise<PipelineResponse> {
  const httpClient = getCachedDefaultHttpClient();
  return pipeline.sendRequest(httpClient, request);
}
