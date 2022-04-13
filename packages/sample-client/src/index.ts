import { KeyCredential } from "@azure/core-auth";
import { CommonClientOptions } from "@azure-tools/cadl-ts-client";
import { LanguagesClient } from "./generated/LanguagesClient.js";
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
  LanguagesClient,
} from "./generated/LanguagesClient.js";

export class LanguagesClientConvenience extends LanguagesClient {
  constructor(endpoint: string, credential: KeyCredential, options?: CommonClientOptions) {
    const apiVersion = "v3.2-preview.2";
    // "{Endpoint}/text/analytics/{ApiVersion}"
    super(`${endpoint}/text/analytics/${apiVersion}`, options);
    this._pipeline.addPolicy(textAnalyticsAzureKeyCredentialPolicy(credential));
  }
}
