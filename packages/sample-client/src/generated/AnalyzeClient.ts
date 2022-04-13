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
  getHeader,
  replacePathParameters,
} from "@azure-tools/cadl-ts-client";

export interface AnalyzeBatchInput {
  analysisInput: MultiLanguageBatchInput;
  displayName?: string;
  tasks: {
    entityRecognitionTasks?: Array<EntitiesTask>;
    entityRecognitionPiiTasks?: Array<PiiTask>;
    keyPhraseExtractionTasks?: Array<KeyPhraseTask>;
    entityLinkingTasks?: Array<EntityLinkingTask>;
    sentimentAnalysisTasks?: Array<SentimentTask>;
  };
}

export interface MultiLanguageBatchInput {
  documents: Array<MultiLanguageInput>;
}

export interface MultiLanguageInput {
  id: string;
  text: string;
  language?: string;
}

export interface EntitiesTask {
  taskName?: string;
  parameters: { "model-version"?: string; loggingOptOut?: boolean; stringIndexType?: string };
}

export interface PiiTask {
  taskName?: string;
  parameters: {
    "model-version"?: string;
    loggingOptOut?: boolean;
    stringIndexType?: string;
    domain?: "phi" | "none";
    piiCategories?: string[];
  };
}

export interface KeyPhraseTask {
  taskName?: string;
  parameters: { "model-version"?: string; loggingOptOut?: boolean };
}

export interface EntityLinkingTask {
  taskName?: string;
  parameters: { "model-version"?: string; loggingOptOut?: boolean; stringIndexType?: string };
}

export interface SentimentTask {
  taskName?: string;
  parameters: {
    "model-version"?: string;
    loggingOptOut?: boolean;
    stringIndexType?: string;
    opinionMining?: boolean;
  };
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

export interface EntityLinkingTaskResult {
  lastUpdateDateTime: string;
  taskName: string;
  status: string;
  results: EntityLinkingResult;
}

export interface EntityLinkingResult {
  documents: Array<DocumentLinkedEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface DocumentLinkedEntities {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  entities: Array<LinkedEntity>;
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

export interface LinkedEntity {
  name: string;
  matches: Array<Match>;
  language: string;
  id?: string;
  url: string;
  dataSource: string;
  bingId?: string;
}

export interface Match {
  confidenceScore: number;
  text: string;
  offset: number;
  length: number;
}

export interface DocumentError {
  id: string;
  error: Error;
}

export interface PiiTaskResult {
  lastUpdateDateTime: string;
  taskName: string;
  status: string;
  results: PiiResult;
}

export interface PiiResult {
  documents: Array<PiiDocumentEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface PiiDocumentEntities {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  redactedText: string;
  entities: Array<Entity>;
}

export interface Entity {
  text: string;
  category: string;
  subcategory?: string;
  offset: number;
  length: number;
  confidenceScore: number;
}

export interface EntitiesTaskResult {
  lastUpdateDateTime: string;
  taskName: string;
  status: string;
  results: EntitiesResult;
}

export interface EntitiesResult {
  documents: Array<DocumentEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface DocumentEntities {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  entities: Array<Entity>;
}

export interface KeyPhraseTaskResult {
  lastUpdateDateTime: string;
  taskName: string;
  status: string;
  results: KeyPhraseResult;
}

export interface KeyPhraseResult {
  documents: Array<DocumentKeyPhrases>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface DocumentKeyPhrases {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  keyPhrases: string[];
}

export interface SentimentTaskResult {
  lastUpdateDateTime: string;
  taskName: string;
  status: string;
  results: SentimentResult;
}

export interface SentimentResult {
  documents: Array<DocumentSentiment>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface DocumentSentiment {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  sentiment: string;
  sentences: Array<SentenceSentiment>;
  confidenceScores: SentimentConfidenceScorePerLabel;
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

export interface AnalyzeJobState {
  createdDateTime: string;
  expirationDateTime: string;
  lastUpdateDateTime: string;
  jobId: string;
  status: string;
  errors?: Array<Error>;
  "@nextLink": string;
  displayName?: string;
  completed: number;
  statistics?: RequestStatistics;
  tasks: {
    entityLinkingTasks: Array<EntityLinkingTaskResult>;
    entityRecognitionPiiTasks: Array<PiiTaskResult>;
    entityRecognitionTasks: Array<EntitiesTaskResult>;
    keyPhraseExtractionTasks: Array<KeyPhraseTaskResult>;
    sentimentAnalysisTasks: Array<SentimentTaskResult>;
  };
}

export interface submitResponse {
  operationLocation: string;
}

export interface getStatusResponse {
  createdDateTime: string;
  expirationDateTime: string;
  lastUpdateDateTime: string;
  jobId: string;
  status: string;
  errors?: Array<Error>;
  "@nextLink": string;
  displayName?: string;
  completed: number;
  statistics?: RequestStatistics;
  tasks: {
    entityLinkingTasks: Array<EntityLinkingTaskResult>;
    entityRecognitionPiiTasks: Array<PiiTaskResult>;
    entityRecognitionTasks: Array<EntitiesTaskResult>;
    keyPhraseExtractionTasks: Array<KeyPhraseTaskResult>;
    sentimentAnalysisTasks: Array<SentimentTaskResult>;
  };
}
export class AnalyzeClient {
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async submit(body: AnalyzeBatchInput): Promise<submitResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/analyze",
      queryParams: {},
    });
    const request = createPipelineRequest({
      url,
      method: "POST",
    });

    request.body = JSON.stringify({ ...body });

    const response = await makeRequest(this._pipeline, request);
    if (response.status === 202) {
      const result = {
        operationLocation: getHeader(response, "Operation-Location"),
      };
      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
  public async getStatus(
    jobId: string,
    showStats?: boolean,
    $top?: number,
    $skip?: number
  ): Promise<getStatusResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: replacePathParameters("/analyze/jobs/{jobId}", { jobId }),
      queryParams: {
        showStats: stringifyQueryParam(showStats),
        $top: stringifyQueryParam($top),
        $skip: stringifyQueryParam($skip),
      },
    });
    const request = createPipelineRequest({
      url,
    });

    const response = await makeRequest(this._pipeline, request);
    if (response.status === 200) {
      const result = tryParseResponse(response) as AnalyzeJobState;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
}
