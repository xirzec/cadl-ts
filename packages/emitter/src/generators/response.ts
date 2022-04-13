// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { ModelProperty, Operation, Response } from "../modeler/model.js";
import { modelPropertyToTypeScript, restTypeToTypeScript } from "./interfaces.js";
import { ClientContext, CachedInterface } from "./cache.js";
import { quoteNameIfNeeded } from "./identifiers.js";

export function notErrorResponse(response: Response): boolean {
  return !response.isError;
}

export function responseToTypeScript(
  context: ClientContext,
  response: Response,
  operationName: string
): string {
  const cachedResponse = context.responseCache.get(response);
  if (cachedResponse) {
    return cachedResponse.name;
  }

  const name = `${operationName}Response`;

  const responseInterface: CachedInterface = {
    name,
    inline: false,
    generatedText: "",
  };

  context.responseCache.set(response, responseInterface);

  const props = Array.from(response.properties.values())
    .flatMap((p) => {
      if (p.location === "body" && p.type.kind === "model") {
        return Array.from(p.type.properties.values());
      } else {
        return p;
      }
    })
    .map((p) => modelPropertyToTypeScript(context, p));

  responseInterface.generatedText = `export interface ${name} { ${props.join(",")} }`;

  return responseInterface.name;
}

export function getParseResponse(context: ClientContext, operation: Operation): string {
  const hasDefault = operation.responses.some((r) => r.statusCodes.length === 0);
  if (!hasDefault) {
    context.extraCorePipelineImports.add("RestError");
  }
  const defaultHandler = hasDefault
    ? ""
    : `// TODO: call onResponse
throw new RestError("Unknown response code", { request, response});}`;
  const responseHandling = operation.responses
    .map((r) => getParseResponseForStatus(context, r))
    .join("\n");
  return `${responseHandling}

${defaultHandler} 
`;
}

function getHeadersFromResponseProperties(headers: ModelProperty[]): string {
  return headers
    .map((header) => {
      const name = quoteNameIfNeeded(header.name);
      return `${name}: getHeader(response, "${header.serializedName}")`;
    })
    .join(",");
}

function getParseResponseForStatus(context: ClientContext, response: Response): string {
  const isError = response.isError;
  const propArray = Array.from(response.properties.values());
  const headers = propArray.filter((p) => p.location === "header");
  const nonHeaders = propArray.filter((p) => p.location !== "header");
  let bodyType = nonHeaders.find((p) => p.location === "body");
  if (!bodyType && nonHeaders.length === 1) {
    // let's assume the body type is the first item if it's the only thing
    bodyType = nonHeaders[0];
  }
  if (!bodyType && headers.length === 0) {
    // void return
    return "return;";
  }
  let parseBodyCode = "";
  if (bodyType) {
    const responseBodyType = restTypeToTypeScript(context, bodyType.type);
    const parsedId = headers.length ? "parsedResponse" : "result";
    parseBodyCode = `const ${parsedId} = tryParseResponse(response) as ${responseBodyType};`;
  }

  let parseHeadersCode = "";
  if (headers.length) {
    context.extraClientLibImports.add("getHeader");
    const spreadBody = bodyType ? "...parsedResponse," : "";
    const setHeaders = getHeadersFromResponseProperties(headers);
    parseHeadersCode = `const result = {
      ${spreadBody}
      ${setHeaders}
    };`;
  }
  const parseCode = `
${parseBodyCode}
${parseHeadersCode}
// TODO: call onResponse
${isError ? "throw result;" : "return result;"}
`;
  const codes = response.statusCodes;
  if (codes.length === 0) {
    return parseCode;
  }
  const comparison =
    codes.length > 1
      ? `[${codes.join(",")}].includes(response.status)`
      : `response.status === ${codes[0]}`;
  return `if (${comparison}) {\n${parseCode}\n }`;
}
