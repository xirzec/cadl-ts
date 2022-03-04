import { createCadlLibrary,paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-ts-emitter",
  diagnostics: {
    "info": {
      severity: "warning",
      messages: {
        default: paramMessage`INFO: ${"message"}`,
      },
    },
  },
  emitter: {
    names: ["ts"],
  },
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;

export type TSLibrary = typeof lib;
