// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  InternalPipelineOptions,
  Pipeline,
  PipelineRequest,
  PipelineResponse,
  createPipelineFromOptions,
  RestError,
} from "@azure/core-rest-pipeline";
import { getCachedDefaultHttpClient } from "./httpClientCache.js";

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

export function tryParseResponse(response: PipelineResponse): any {
  if (!response.bodyAsText) {
    throw new RestError("Expected non-empty body from response", {
      response,
      code: RestError.PARSE_ERROR,
    });
  }
  try {
    const result = JSON.parse(response.bodyAsText);
    return result;
  } catch (e) {
    throw new RestError(`Error parsing response body`, { response, code: RestError.PARSE_ERROR });
  }
}

export { UrlOptions, getRequestUrl } from "./urlHelpers.js";

export function stringifyQueryParam(value: boolean | number | undefined): string | undefined {
  if (value !== undefined) {
    return String(value);
  } else {
    return undefined;
  }
}
