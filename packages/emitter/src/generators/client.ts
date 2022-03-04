import { createSourceFile } from "./sourceFile.js";
export interface CreateClientOptions {
  clientName: string;
}
export function createClient(options: CreateClientOptions): string {
  const { clientName } = options;
  return createSourceFile(`export class ${clientName} {
  constructor() {

  }
}`);
}
