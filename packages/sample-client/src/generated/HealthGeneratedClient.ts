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

export interface MultiLanguageBatchInput {
  documents: Array<MultiLanguageInput>;
}

export interface MultiLanguageInput {
  id: string;
  text: string;
  language?: string;
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

export interface HealthcareResult {
  documents: Array<DocumentHealthcareEntities>;
  errors: Array<DocumentError>;
  statistics?: RequestStatistics;
  modelVersion: string;
}

export interface DocumentHealthcareEntities {
  id: string;
  warnings: Array<Warning>;
  statistics: Array<DocumentStatistics>;
  entities: Array<HealthcareEntity>;
  relations: Array<HealthcareRelation>;
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

export interface HealthcareEntity {
  text: string;
  category: string;
  subcategory: string;
  offset: number;
  length: number;
  confidenceScore: number;
  assertion?: HealthcareAssertion;
  name?: string;
  links?: Array<HealthcareEntityLink>;
}

export interface HealthcareAssertion {
  conditionality?: string;
  certainty?: string;
  association?: string;
}

export interface HealthcareEntityLink {
  dataSource: string;
  id: string;
}

export interface HealthcareRelation {
  entities: Array<HealthcareRelationEntity>;
  relationType: string;
}

export interface HealthcareRelationEntity {
  ref: string;
  role: string;
}

export interface DocumentError {
  id: string;
  error: Error;
}

export interface RequestStatistics {
  documentsCount: number;
  validDocumentsCount: number;
  erroneousDocumentsCount: number;
  transactionsCount: number;
}

export interface HealthcareJobState {
  createdDateTime: string;
  expirationDateTime: string;
  lastUpdateDateTime: string;
  jobId: string;
  status: string;
  errors?: Array<Error>;
  "@nextLink": string;
  results: HealthcareResult;
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
  results: HealthcareResult;
}
export class HealthGeneratedClient {
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  public async submit(
    input: MultiLanguageBatchInput,
    model_version?: string,
    loggingOptOut?: boolean,
    showStats?: boolean,
    stringIndexType?: string
  ): Promise<submitResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: "/entities/health/jobs",
      queryParams: {
        "model-version": model_version,
        loggingOptOut: stringifyQueryParam(loggingOptOut),
        showStats: stringifyQueryParam(showStats),
        stringIndexType,
      },
    });
    const request = createPipelineRequest({
      url,
      method: "POST",
    });

    request.body = JSON.stringify({ ...input });

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
      path: replacePathParameters("/entities/health/jobs/{jobId}", { jobId }),
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
      const result = tryParseResponse(response) as HealthcareJobState;

      // TODO: call onResponse
      return result;
    }

    const result = tryParseResponse(response) as Error;

    // TODO: call onResponse
    throw result;
  }
  public async cancel(jobId: string): Promise<submitResponse> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: replacePathParameters("/entities/health/jobs/{jobId}", { jobId }),
      queryParams: {},
    });
    const request = createPipelineRequest({
      url,
      method: "DELETE",
    });

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
}
