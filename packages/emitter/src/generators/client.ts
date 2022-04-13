import { createSourceFile } from "./sourceFile.js";
import {
  Client,
  ModelProperty,
  Operation,
  Parameter,
  Response,
  RestType,
  ArrayType,
  ModelType,
  UnionType,
  MapType,
} from "../model.js";
export interface CreateClientOptions {
  client: Client;
}

interface CachedInterface {
  name: string;
  generatedText: string;
  inline: boolean;
}

interface ClientContext {
  interfaceCache: Map<ModelType, CachedInterface>;
  responseCache: Map<Response, CachedInterface>;
  extraCorePipelineImports: Set<string>;
  extraClientLibImports: Set<string>;
}

export function createClient(options: CreateClientOptions): string {
  const { name, operations } = options.client;
  const context: ClientContext = {
    interfaceCache: new Map(),
    responseCache: new Map(),
    extraCorePipelineImports: new Set(),
    extraClientLibImports: new Set(),
  };
  const operationText = operations.map((op) => createOperation(context, op)).join("");
  const importText = createImports(context);
  const interfaceText = createInterfaces(context);
  return createSourceFile(`
${importText}
${interfaceText}
export class ${name} {
  private _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: PipelineOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  ${operationText}
}`);
}

function createImports(context: ClientContext): string {
  const corePipelineImports = [
    "createPipelineRequest",
    "Pipeline",
    "PipelineOptions",
    ...context.extraCorePipelineImports,
  ];
  const tsClientImports = [
    "createClientPipeline",
    "makeRequest",
    "getRequestUrl",
    "tryParseResponse",
    "stringifyQueryParam",
    ...context.extraClientLibImports,
  ];
  return `import { ${corePipelineImports.join()} } from "@azure/core-rest-pipeline";
import { ${tsClientImports.join()} } from "@azure-tools/cadl-ts-client";
`;
}

function createInterfaces(context: ClientContext): string {
  const interfaces = Array.from(context.interfaceCache.values())
    .filter((i) => !i.inline)
    .map((i) => i.generatedText)
    .join("\n\n");
  const responses = Array.from(context.responseCache.values())
    .map((r) => r.generatedText)
    .join("\n\n");
  return `${interfaces}\n\n${responses}`;
}

function createOperation(context: ClientContext, operation: Operation): string {
  const params = createOperationParams(context, operation);
  const returnType = createReturnType(context, operation);
  const requestMethod = operation.verb !== "GET" ? `method: "${operation.verb}",` : "";
  const headers = getHeadersFromParameters(operation);
  const queryParams = getQueryParamsFromParameters(operation);
  const path = getPathFromParameters(context, operation);
  const body = getBody(operation);
  const parseResponse = getParseResponse(context, operation);
  return `public async ${operation.name}(${params}): Promise<${returnType}> {
    const url = getRequestUrl({
      base: this._endpoint,
      path: ${path},
      queryParams: ${queryParams},
    });
    const request = createPipelineRequest({
      url,
      ${requestMethod}
    });

    ${headers}
    ${body}
  
    const response = await makeRequest(this._pipeline, request);
    ${parseResponse}
  }`;
}

function createReturnType(context: ClientContext, operation: Operation): string {
  return operation.responses
    .filter(notErrorResponse)
    .map((r) => responseToTypeScript(context, r, operation.name))
    .join(" | ");
}

function notErrorResponse(response: Response): boolean {
  return !response.isError;
}

function responseToTypeScript(
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

function modelTypeToTypeScript(context: ClientContext, type: ModelType): string {
  const cachedModel = context.interfaceCache.get(type);
  if (cachedModel) {
    if (cachedModel.inline) {
      return cachedModel.generatedText;
    } else {
      return cachedModel.name;
    }
  }

  // TODO: uniqueness?
  const name = type.name;
  const inline = !type.name;

  const model: CachedInterface = {
    name,
    inline,
    generatedText: "",
  };

  context.interfaceCache.set(type, model);
  const props = Array.from(type.properties.values()).map((p) =>
    modelPropertyToTypeScript(context, p)
  );

  if (inline) {
    model.generatedText = `{ ${props.join(",")} }`;
    return model.generatedText;
  } else {
    model.generatedText = `export interface ${name} { ${props.join(",")} }`;
    return name;
  }
}

function modelPropertyToTypeScript(context: ClientContext, property: ModelProperty): string {
  const separator = property.optional ? "?:" : ":";
  const value = restTypeToTypeScript(context, property.type);
  const name = quoteNameIfNeeded(property.name);
  return `${name} ${separator} ${value}`;
}

function restTypeToTypeScript(context: ClientContext, type: RestType): string {
  switch (type.kind) {
    case "string":
      return type.constant === undefined ? "string" : `"${type.constant}"`;
    case "boolean":
    case "number":
      return String(type.constant ?? type.kind);
    case "array":
      return arrayTypeToTypeScript(context, type);
    case "model":
      return modelTypeToTypeScript(context, type);
    case "union":
      return unionTypeToTypeScript(context, type);
    case "map":
      return mapTypeToTypeScript(context, type);
    default:
      throw new Error(`Unknown RestType ${(type as RestType).kind}`);
  }
}

function arrayTypeToTypeScript(context: ClientContext, type: ArrayType): string {
  const elementKind = type.elementType.kind;
  if (elementKind === "array" || elementKind === "model") {
    return `Array<${restTypeToTypeScript(context, type.elementType)}>`;
  }
  return `${restTypeToTypeScript(context, type.elementType)}[]`;
}

function mapTypeToTypeScript(context: ClientContext, type: MapType): string {
  const valueType = restTypeToTypeScript(context, type.valueType);
  return `Map<string, ${valueType}>`;
}

function unionTypeToTypeScript(context: ClientContext, type: UnionType): string {
  return type.options.map((o) => restTypeToTypeScript(context, o)).join(" | ");
}

function createOperationParams(context: ClientContext, operation: Operation): string {
  return operation.parameters.map((p) => createParameter(context, p)).join(", ");
}

function createParameter(context: ClientContext, parameter: Parameter): string {
  const optional = parameter.optional ? "?" : "";
  const paramType = restTypeToTypeScript(context, parameter.type);
  const name = nameToIdentifier(parameter.name);
  return `${name}${optional}: ${paramType}`;
}

function getPathFromParameters(context: ClientContext, operation: Operation): string {
  const pathParams = operation.parameters.filter((p) => p.location === "path");
  const pathString = `"${operation.path}"`;
  if (pathParams.length === 0) {
    return pathString;
  }

  context.extraClientLibImports.add("replacePathParameters");
  const pathParamsAsObj = pathParams
    .map((param) => {
      const name = quoteNameIfNeeded(param.name);
      const value = nameToIdentifier(param.name);
      return name === value ? name : `${name}: ${value}`;
    })
    .join(",");

  return `replacePathParameters(${pathString}, {${pathParamsAsObj}})`;
}

function getHeadersFromParameters(operation: Operation): string {
  return operation.parameters
    .filter((p) => p.location === "header")
    .map((p) => {
      const identifier = nameToIdentifier(p.name);
      const setHeader = `request.headers.set("${p.serializedName}", ${identifier});`;
      if (p.optional) {
        return `if (${identifier}) {
          ${setHeader}
        }`;
      } else {
        return setHeader;
      }
    })
    .join("\n");
}

function getQueryParamsFromParameters(operation: Operation): string {
  const body = operation.parameters
    .filter((p) => p.location === "query")
    .map((p) => {
      const name = quoteNameIfNeeded(p.name);
      const value = stringifyParamIfNeeded(p);
      return name === value ? name : `${name}:  ${value}`;
    })
    .join(",");
  return `{ ${body} }`;
}

function stringifyParamIfNeeded(p: Parameter): string {
  const kind = p.type.kind;
  const identifier = nameToIdentifier(p.name);
  if (kind === "string") {
    return identifier;
  } else if (kind === "boolean" || kind === "number") {
    return `stringifyQueryParam(${identifier})`;
  } else if (kind === "union") {
    // TODO: robustness
    const nonString = p.type.options.some((t) => t.kind !== "string");
    return nonString ? `stringifyQueryParam(${identifier})` : identifier;
  } else if (kind == "array") {
    if (p.type.elementType.kind !== "string") {
      throw new Error(`Non-string arrays not supported currently for query parameter ${p.name}`);
    }
    return identifier;
  } else {
    throw new Error(`No support for ${p.type.kind} in query parameter ${p.name}`);
  }
}

function getParseResponse(context: ClientContext, operation: Operation): string {
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

function getBody(operation: Operation): string {
  const bodyParam = operation.parameters.find((p) => p.location === "body");
  if (!bodyParam) {
    return "";
  }

  const name = quoteNameIfNeeded(bodyParam.name);
  // TODO: destructure inputs?
  const value = nameToIdentifier(bodyParam.name);
  const bodyDecl = name === value ? name : `${name}: ${value}`;

  return `
request.body = JSON.stringify({ ${bodyDecl} });`;
}

function quoteNameIfNeeded(name: string): string {
  if (/^[a-zA-Z0-9_]+$/.test(name)) {
    return name;
  } else {
    return `"${name}"`;
  }
}

function nameToIdentifier(name: string): string {
  // TODO: change foo-bar-baz into fooBarBaz
  // convert foo_bar_baz into fooBarBaz as well?
  // validate first character is not number?
  return name.replace(/[^A-Za-z0-9_$]/g, "_");
}
