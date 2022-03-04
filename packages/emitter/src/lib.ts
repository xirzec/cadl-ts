import { createCadlLibrary } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-ts-emitter",
  diagnostics: {},
  emitter: {
    names: ["ts"],
  },
} as const;
const lib = createCadlLibrary(libDef);
export const { reportDiagnostic } = lib;

export type TSLibrary = typeof lib;
