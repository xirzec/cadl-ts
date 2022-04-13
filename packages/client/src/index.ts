// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export {
  createClientPipeline,
  makeRequest,
  AdditionalPolicyConfig,
  CommonClientOptions,
} from "./pipeline.js";
export {
  UrlOptions,
  getRequestUrl,
  stringifyQueryParam,
  PathParameters,
  replacePathParameters,
} from "./urlHelpers.js";
export { getHeader, tryParseResponse } from "./parsing.js";
