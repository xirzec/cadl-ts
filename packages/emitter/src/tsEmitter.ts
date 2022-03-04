import { Program, resolvePath, getServiceNamespaceString, NoTarget } from "@cadl-lang/compiler";
import { createFile } from "./generators/sourceFile.js";
import { reportDiagnostic } from "./lib.js";

export interface TSEmitterOptions {
  outputPath: string;
}

function debugLog(p: Program, msg: string | undefined) {
  if (!msg) { 
    return;
  }
  reportDiagnostic(p, {
    code: "info",
    format: { message: msg },
    target: NoTarget,
  });
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
