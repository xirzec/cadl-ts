// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Program, resolvePath } from "@cadl-lang/compiler";
import { render } from "./output/render.js";
import { emit } from "./output/printer.js";
import { createPackage, Context } from "./modeler/package.js";

export interface TSEmitterOptions {
  outputPath: string;
}

export async function $onEmit(program: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: program.compilerOptions.outputPath || resolvePath("./ts/"),
  };

  const context: Context = {
    program,
    responseCache: new WeakMap(),
    modelCache: new WeakMap(),
  };

  const sdkPackage = createPackage(context);
  if (!program.compilerOptions.noEmit) {
    const output = render(sdkPackage);
    await emit(program.host, options.outputPath, output);
  }
}
