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

export interface DocumentSentiment {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  sentiment: string;
  sentences: Array<SentenceSentiment>;
  confidenceScores: SentimentConfidenceScorePerLabel;
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

export interface SentenceSentiment {
  text: string;
  sentiment: string;
  confidenceScores: SentimentConfidenceScorePerLabel;
  offset: number;
  length: number;
  targets?: Array<SentenceTarget>;
}

export interface SentimentConfidenceScorePerLabel {
  positive: number;
  negative: number;
  neutral: number;
}

export interface SentenceTarget {
  sentiment: string;
  confidenceScores: TargetConfidenceScorePerLabel;
  offset: number;
  length: number;
  text: string;
  relations: Array<TargetRelation>;
}

export interface TargetConfidenceScorePerLabel {
  positive: number;
  negative: number;
}

export interface TargetRelation {
  relationType: string;
  ref: string;
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

export interface SentimentResult {
  documents: Array<DocumentSentiment>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface analyzeResponse {
  documents: Array<DocumentSentiment>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}
export class SentimentGeneratedClient {
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async analyze(
    input: MultiLanguageBatchInput,
    model_version?: string,
    loggingOptOut?: boolean,
    stringIndexType?: string,
    opinionMining?: boolean,
    showStats?: boolean
  ): Promise<analyzeResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/sentiment",
      queryParams: {
        "model-version": model_version,
        loggingOptOut: stringifyQueryParam(loggingOptOut),
        stringIndexType,
        opinionMining: stringifyQueryParam(opinionMining),
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
      const result = tryParseResponse(response) as SentimentResult;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
}
