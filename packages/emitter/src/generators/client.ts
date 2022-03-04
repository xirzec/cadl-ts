import { createSourceFile } from "./sourceFile.js";
import { Client } from "../model.js";
export interface CreateClientOptions {
  client: Client;
}
export function createClient(options: CreateClientOptions): string {
  const { name } = options.client;
  return createSourceFile(`export class ${name} {
  constructor() {

  }
}`);
}
