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
} from "../model.js";
export interface CreateClientOptions {
  client: Client;
}
export function createClient(options: CreateClientOptions): string {
  const { name, operations } = options.client;
  /*const debugText = JSON.stringify(
    options.client,
    (_key, value) => {
      if (value instanceof Map) {
        return Array.from(value.values());
      }
      return value;
    },
    2
  );*/
  const operationText = operations.map(createOperation).join();
  return createSourceFile(`export class ${name} {
  constructor() {

  }
  ${operationText}
}`);
}

function createOperation(operation: Operation): string {
  const params = createOperationParams(operation);
  const returnType = createReturnType(operation.responses);
  return `public ${operation.name}(${params}): ${returnType} {
    // TODO: implement me
  }`;
}

function createReturnType(responses: Response[]): string {
  return responses.filter(notErrorResponse).map(responseToTypeScript).join(" | ");
}

function notErrorResponse(response: Response): boolean {
  return !response.isError;
}

function responseToTypeScript(response: Response): string {
  return modelTypeOrResponseToTypeScript(response);
}

function modelTypeToTypeScript(type: ModelType): string {
  return modelTypeOrResponseToTypeScript(type);
}

function modelTypeOrResponseToTypeScript(type: ModelType | Response): string {
  const props = Array.from(type.properties.values()).map(modelPropertyToTypeScript);

  return `{ ${props.join(",")} }`;
}

function modelPropertyToTypeScript(property: ModelProperty): string {
  const separator = property.optional ? "?:" : ":";
  const value = restTypeToTypeScript(property.type);
  const name = quoteNameIfNeeded(property.name);
  return `${name} ${separator} ${value}`;
}

function restTypeToTypeScript(type: RestType): string {
  switch (type.kind) {
    case "string":
    case "boolean":
    case "number":
      return type.kind;
    case "array":
      return arrayTypeToTypeScript(type);
    case "model":
      return modelTypeToTypeScript(type);
    default:
      throw new Error(`Unknown RestType ${type}`);
  }
}

function arrayTypeToTypeScript(type: ArrayType): string {
  const elementKind = type.elementType.kind;
  if (elementKind === "array" || elementKind === "model") {
    return `Array<${restTypeToTypeScript(type.elementType)}>`;
  }
  return `${restTypeToTypeScript(type.elementType)}[]`;
}

function createOperationParams(operation: Operation): string {
  return operation.parameters.map(createParameter).join(", ");
}

function createParameter(parameter: Parameter): string {
  const optional = parameter.optional ? "?" : "";
  const paramType = restTypeToTypeScript(parameter.type);
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
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}
