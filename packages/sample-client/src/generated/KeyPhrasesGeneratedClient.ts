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

export interface MultiLanguageBatchInput {
  documents: Array<MultiLanguageInput>;
}

export interface MultiLanguageInput {
  id: string;
  text: string;
  language?: string;
}

export interface DocumentKeyPhrases {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  keyPhrases: string[];
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

export interface KeyPhraseResult {
  documents: Array<DocumentKeyPhrases>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface identifyKeyPhrasesResponse {
  documents: Array<DocumentKeyPhrases>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}
export class KeyPhrasesGeneratedClient {
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async identifyKeyPhrases(
    input: MultiLanguageBatchInput,
    modelVersion?: string,
    loggingOptOut?: boolean,
    showStats?: boolean
  ): Promise<identifyKeyPhrasesResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/keyPhrases",
      queryParams: {
        "model-version": modelVersion,
        loggingOptOut: stringifyQueryParam(loggingOptOut),
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
      const result = tryParseResponse(response) as KeyPhraseResult;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
}
