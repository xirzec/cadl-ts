// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Pipeline,
  PipelineRequest,
  PipelineResponse,
  createPipelineFromOptions,
  PipelinePolicy,
  PipelineOptions,
  HttpClient,
} from "@azure/core-rest-pipeline";
import { getCachedDefaultHttpClient } from "./httpClientCache.js";

/**
 * Used to configure additional policies added to the pipeline at construction.
 */
export interface AdditionalPolicyConfig {
  /**
   * A policy to be added.
   */
  policy: PipelinePolicy;
  /**
   * Determines if this policy be applied before or after retry logic.
   * Only use `perRetry` if you need to modify the request again
   * each time the operation is retried due to retryable service
   * issues.
   */
  position: "perCall" | "perRetry";
}

/**
 * The common set of options that high level clients are expected to expose.
 */
export interface CommonClientOptions extends PipelineOptions {
  /**
   * The HttpClient that will be used to send HTTP requests.
   */
  httpClient?: HttpClient;
  /**
   * Set to true if the request is sent over HTTP instead of HTTPS
   */
  allowInsecureConnection?: boolean;
  /**
   * Additional policies to include in the HTTP pipeline.
   */
  additionalPolicies?: AdditionalPolicyConfig[];
}

export function createClientPipeline(options: CommonClientOptions): Pipeline {
  const pipeline = createPipelineFromOptions(options);
  if (options.additionalPolicies?.length) {
    for (const { policy, position } of options.additionalPolicies) {
      // Sign happens after Retry and is commonly needed to occur
      // before policies that intercept post-retry.
      if (position === "perRetry") {
        pipeline.addPolicy(policy, { afterPhase: "Sign" });
      } else {
        pipeline.addPolicy(policy);
      }
    }
  }
  return pipeline;
}

export function makeRequest(
  pipeline: Pipeline,
  request: PipelineRequest
): Promise<PipelineResponse> {
  const httpClient = getCachedDefaultHttpClient();
  return pipeline.sendRequest(httpClient, request);
}
