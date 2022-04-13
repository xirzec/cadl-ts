// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { http as RestHttp, HttpOperationParameters } from "@cadl-lang/rest";
import { Parameter } from "./model.js";
import { Context, createRestType } from "./common.js";
const { getHeaderFieldName } = RestHttp;

export function getParameters(context: Context, params: HttpOperationParameters): Parameter[] {
  const result: Parameter[] = [];

  if (params.body) {
    const type = createRestType(context, params.body.type);
    if (type) {
      result.push({
        name: params.body.name,
        location: "body",
        optional: params.body.optional,
        type,
      });
    }
  }

  for (const param of params.parameters) {
    const type = createRestType(context, param.param.type);
    if (type) {
      const serializedName = getHeaderFieldName(context.program, param.param);
      result.push({
        location: param.type,
        name: param.param.name,
        serializedName,
        optional: param.param.optional,
        type,
      });
    }
  }

  return result;
}
