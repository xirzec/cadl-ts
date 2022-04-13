// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createPipelineRequest, Pipeline } from "@azure/core-rest-pipeline";
import {
  CommonClientOptions,
  createClientPipeline,
  makeRequest,
  getRequestUrl,
  tryParseResponse,
  stringifyQueryParam,
} from "@azure-tools/cadl-ts-client";

export interface LanguageBatchInput {
  documents: Array<LanguageInput>;
}

export interface LanguageInput {
  id: string;
  text: string;
  countryHint?: string;
}

export interface DocumentLanguage {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  detectedLanguage: DetectedLanguage;
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

export interface DetectedLanguage {
  name: string;
  iso6391Name: string;
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

export interface LanguageResult {
  documents: Array<DocumentLanguage>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface detectResponse {
  documents: Array<DocumentLanguage>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}
export class LanguagesClient {
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async detect(
    input: LanguageBatchInput,
    model_version?: string,
    loggingOptOut?: boolean,
    stringIndexType?: string,
    showStats?: boolean
  ): Promise<detectResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/languages",
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

    request.body = JSON.stringify({ ...input });

    const response = await makeRequest(this._pipeline, request);
    if (response.status === 200) {
      const result = tryParseResponse(response) as LanguageResult;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
}
