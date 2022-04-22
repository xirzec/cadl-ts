// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { createCadlLibrary, paramMessage } from "@cadl-lang/compiler";

export const libDef = {
  name: "@azure-tools/cadl-ts-emitter",
  diagnostics: {
    warn: {
      severity: "warning",
      messages: {
        default: paramMessage`WARN: ${"message"}`,
      },
    },
    error: {
      severity: "error",
      messages: {
        default: paramMessage`ERROR: ${"message"}`,
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
