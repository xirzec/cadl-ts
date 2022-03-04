import { createCadlLibrary } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-ts",
  diagnostics: {},
} as const;
export const { reportDiagnostic } = createCadlLibrary(libDef);
