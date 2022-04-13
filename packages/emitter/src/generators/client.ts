// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createSourceFile } from "./sourceFile.js";
import { Client } from "../modeler/model.js";
import { ClientContext } from "./cache.js";
import { createImports } from "./imports.js";
import { createInterfaces } from "./interfaces.js";
import { createOperation } from "./operation.js";

export interface CreateClientOptions {
  client: Client;
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
  protected _pipeline: Pipeline;
  private _endpoint: string;

  constructor(endpoint: string, options?: CommonClientOptions) {
    this._endpoint = endpoint;
    this._pipeline = createClientPipeline(options ?? {});
  }
  ${operationText}
}`);
}
