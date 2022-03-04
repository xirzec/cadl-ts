import * as Model from "./model.js";
import { createClient } from "./generators/client.js";

export interface File {
  path: string[];
  contents: string;
}

export interface Output {
  files: File[];
}

export function render(sdkPackage: Model.Package): Output {
  const files: File[] = [];
  for (const client of sdkPackage.clients) {
    files.push({
      path: [`${client.name}.ts`],
      contents: createClient({ clientName: client.name }),
    });
  }
  return {
    files,
  };
}
