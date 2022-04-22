// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { KeyCredential } from "@azure/core-auth";
import { CommonClientOptions } from "@azure-tools/cadl-ts-client";
import { LanguagesGeneratedClient } from "./generated/LanguagesGeneratedClient.js";
import { textAnalyticsAzureKeyCredentialPolicy } from "./textAnalyticsKeyCredentialPolicy.js";

export {
  DetectedLanguage,
  DocumentError,
  DocumentLanguage,
  DocumentStatistics,
  Error,
  InnerError,
  LanguageBatchInput,
  LanguageInput,
  LanguageResult,
  RequestStatistics,
  Warning,
  detectResponse,
  LanguagesGeneratedClient,
} from "./generated/LanguagesGeneratedClient.js";

export class LanguagesClient extends LanguagesGeneratedClient {
  constructor(endpoint: string, credential: KeyCredential, options?: CommonClientOptions) {
    const apiVersion = "v3.2-preview.2";
    // "{Endpoint}/text/analytics/{ApiVersion}"
    super(`${endpoint}/text/analytics/${apiVersion}`, options);
    this._pipeline.addPolicy(textAnalyticsAzureKeyCredentialPolicy(credential));
  }
}
