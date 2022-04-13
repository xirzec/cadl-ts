// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { PipelineResponse, RestError } from "@azure/core-rest-pipeline";

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

export function getHeader(response: PipelineResponse, headerName: string): string {
  const value = response.headers.get(headerName);
  if (value === undefined) {
    throw new RestError(`Missing required response header ${headerName}`, {
      response,
      code: RestError.PARSE_ERROR,
    });
  }
  return value;
}
