// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Type, ModelType, isErrorModel } from "@cadl-lang/compiler";
import { http as RestHttp } from "@cadl-lang/rest";
import { warn } from "../util/log.js";
import { ModelProperty, Response } from "./model.js";
import { Context, getDiscriminator, getAllModelProperties, createModelProperty } from "./common.js";
const { getStatusCodes, isStatusCode } = RestHttp;

export function getResponses(context: Context, responseType: Type): Response[] {
  const responses: Response[] = [];
  // gotta fish out all the status codes and the right shape
  // as well as maybe inferring it
  if (responseType.kind === "Union") {
    for (const option of responseType.options) {
      // recurse
      const result = getResponses(context, option);
      responses.push(...result);
    }
  } else if (responseType.kind === "Model") {
    responses.push(createResponseFromModel(context, responseType));
  } else {
    warn(context.program, `Unhandled responseType ${responseType.kind}`, responseType);
  }
  return responses;
}

function createResponseFromModel(context: Context, model: ModelType): Response {
  const cachedResponse = context.responseCache.get(model);
  if (cachedResponse) {
    return cachedResponse;
  }

  const statusCodes: string[] = [];
  const properties = new Map<string, ModelProperty>();
  const response: Response = {
    name: model.name,
    properties,
    isError: isErrorModel(context.program, model),
    statusCodes,
    discriminator: getDiscriminator(context, model),
  };

  context.responseCache.set(model, response);

  for (const prop of getAllModelProperties(model)) {
    if (isStatusCode(context.program, prop)) {
      const codes: string[] = getStatusCodes(context.program, prop);
      statusCodes.push(...codes);
    } else {
      const type = createModelProperty(context, prop);
      if (type) {
        properties.set(prop.name, type);
      }
    }
  }

  return response;
}
