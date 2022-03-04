import { Program, resolvePath, getServiceNamespaceString } from "@cadl-lang/compiler";
import { debugLog } from "./log.js";
import { render } from "./render.js";
import { Package } from "./model.js";
import { emit } from "./printer.js";

export interface TSEmitterOptions {
  outputPath: string;
}

export async function $onEmit(p: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: p.compilerOptions.outputPath || resolvePath("./ts/"),
  };

  const ns = getServiceNamespaceString(p);
  debugLog(p, ns);
  debugLog(p, options.outputPath);

  if (!p.compilerOptions.noEmit) {
    const output = render(createExamplePackage());
    await emit(p.host, options.outputPath, output);
  }
}

function createExamplePackage(): Package {
  return {
    clients: [{ name: "ExampleClient", operations: [] }],
  };
}
