// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Operation } from "../modeler/model.js";
import { ClientContext } from "./cache.js";
import {
  createOperationParams,
  getPathFromParameters,
  getHeadersFromParameters,
  getQueryParamsFromParameters,
  getBody,
} from "./parameters.js";
import { getParseResponse, notErrorResponse, responseToTypeScript } from "./response.js";

export function createOperation(context: ClientContext, operation: Operation): string {
  const params = createOperationParams(context, operation);
  const returnType = createReturnType(context, operation);
  const requestMethod = operation.verb !== "GET" ? `method: "${operation.verb}",` : "";
  const headers = getHeadersFromParameters(operation);
  const queryParams = getQueryParamsFromParameters(operation);
  const path = getPathFromParameters(context, operation);
  const body = getBody(operation);
  const parseResponse = getParseResponse(context, operation);
  return `public async ${operation.name}(${params}): Promise<${returnType}> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: ${path},
      queryParams: ${queryParams},
    });
    const request = createPipelineRequest({
      url,
      ${requestMethod}
    });

    ${headers}
    ${body}
  
    const response = await makeRequest(this._pipeline, request);
    ${parseResponse}
  }`;
}

function createReturnType(context: ClientContext, operation: Operation): string {
  return operation.responses
    .filter(notErrorResponse)
    .map((r) => responseToTypeScript(context, r, operation.name))
    .join(" | ");
}
