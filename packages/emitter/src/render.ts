import { format, Options as PrettierOptions } from "prettier";
import * as Model from "./model.js";
import { createClient } from "./generators/client.js";

export interface File {
  path: string[];
  contents: string;
}

export interface Output {
  files: File[];
}

const prettierConfig: PrettierOptions = {
  parser: "typescript",
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "lf",
  printWidth: 100,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
};

function formatTypeScript(sourceText: string): string {
  try {
    return format(sourceText, prettierConfig);
  } catch (e) {
    return "// ERROR: Couldn't format, file probably malformed\n" + sourceText;
  }
}

export function render(sdkPackage: Model.Package): Output {
  const files: File[] = [];
  for (const client of sdkPackage.clients) {
    files.push({
      path: [`${client.name}.ts`],
      contents: formatTypeScript(createClient({ client })),
    });
  }
  return {
    files,
  };
}
