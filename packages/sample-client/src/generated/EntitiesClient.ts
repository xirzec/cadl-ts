// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createPipelineRequest, Pipeline, PipelineOptions } from "@azure/core-rest-pipeline";
import {
  createClientPipeline,
  makeRequest,
  getRequestUrl,
  tryParseResponse,
  stringifyQueryParam,
} from "@azure-tools/cadl-ts-client";

export interface MultiLanguageBatchInput {
  documents: Array<MultiLanguageInput>;
}

export interface MultiLanguageInput {
  id: string;
  text: string;
  language?: string;
}

export interface DocumentEntities {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  entities: Array<Entity>;
}

export interface Warning {
  code: string;
  message: string;
  targetRef?: string;
}

export interface DocumentStatistics {
  charactersCount: number;
  transactionsCount: number;
}

export interface Entity {
  text: string;
  category: string;
  subcategory?: string;
  offset: number;
  length: number;
  confidenceScore: number;
}

export interface DocumentError {
  id: string;
  error: Error;
}

export interface Error {
  message: string;
  code: string;
  details?: Map<string, string>;
  target?: string;
  innererror?: InnerError;
}

export interface InnerError {
  message: string;
  code: string;
  details?: Map<string, string>;
  target?: string;
  innererror?: InnerError;
}

export interface RequestStatistics {
  documentsCount: number;
  validDocumentsCount: number;
  erroneousDocumentsCount: number;
  transactionsCount: number;
}

export interface EntitiesResult {
  documents: Array<DocumentEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface recognizeResponse {
  documents: Array<DocumentEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}
export class EntitiesClient {
  private _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: PipelineOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async recognize(
    input: MultiLanguageBatchInput,
    model_version?: string,
    loggingOptOut?: boolean,
    stringIndexType?: string,
    showStats?: boolean
  ): Promise<recognizeResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/entities/recognition/general",
      queryParams: {
        "model-version": model_version,
        loggingOptOut: stringifyQueryParam(loggingOptOut),
        stringIndexType,
        showStats: stringifyQueryParam(showStats),
      },
    });
    const request = createPipelineRequest({
      url,
      method: "POST",
    });

    request.body = JSON.stringify({ input });

    const response = await makeRequest(this._pipeline, request);
    if (response.status === 200) {
      const result = tryParseResponse(response) as EntitiesResult;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
}
