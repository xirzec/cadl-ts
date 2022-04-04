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
}

export function createClient(options: CreateClientOptions): string {
  const { name, operations } = options.client;
  const context: ClientContext = {
    interfaceCache: new Map(),
    responseCache: new Map(),
  };
  const operationText = operations.map((op) => createOperation(context, op)).join("");
  const importText = createImports();
  const interfaceText = createInterfaces(context);
  return createSourceFile(`
${importText}
${interfaceText}
export class ${name} {
  private _pipeline: Pipeline;

  constructor() {
    this._pipeline = createClientPipeline({});
  }
  ${operationText}
}`);
}

function createImports(): string {
  return `import { createPipelineRequest, Pipeline } from "@azure/core-rest-pipeline";
import { createClientPipeline, makeRequest } from "@azure-tools/cadl-ts-client";
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
  return `public async ${operation.name}(${params}): Promise<${returnType}> {
    const request = createPipelineRequest({
      url: "",
      method: "GET",
    });

    request.headers.set("foo", "bar");
    const body = {
      A: "B",
    };
    request.body = JSON.stringify(body);
    const response = await makeRequest(this._pipeline, request);
    if (!response.bodyAsText) {
      throw new Error("Well, that was unexpected");
    }
    const parsedResponse = JSON.parse(response.bodyAsText);
    return parsedResponse;
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

  const props = Array.from(response.properties.values()).map((p) =>
    modelPropertyToTypeScript(context, p)
  );

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
