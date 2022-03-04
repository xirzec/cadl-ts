import { Program, resolvePath, getServiceNamespaceString } from "@cadl-lang/compiler";
import { createFile } from "./generators/sourceFile.js";
import { debugLog } from "./log.js";

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
    const outFile = resolvePath(options.outputPath, "client.ts");
    await p.host.writeFile(outFile, createFile("//hello world!"));
  }
}
