import { createSourceFile } from "./sourceFile.js";
import { Client, Operation, Parameter } from "../model.js";
export interface CreateClientOptions {
  client: Client;
}
export function createClient(options: CreateClientOptions): string {
  const { name, operations } = options.client;
  const operationText = operations.map(createOperation).join();
  return createSourceFile(`export class ${name} {
  constructor() {

  }
  ${operationText}
}`);
}

function createOperation(operation: Operation): string {
  const params = createOperationParams(operation);
  const returnType = "any";
  return `public ${operation.name}(${params}): ${returnType} {
    // TODO: implement me
  }`;
}

function createOperationParams(operation: Operation): string {
  return operation.parameters.map(createParameter).join(", ");
}

function createParameter(parameter: Parameter): string {
  const optional = parameter.optional ? "?" : "";
  const paramType = "any";
  return `${parameter.name}${optional}: ${paramType}`;
}
