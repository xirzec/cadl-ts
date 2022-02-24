import { Program, resolvePath, getServiceNamespaceString } from "@cadl-lang/compiler";

export interface TSEmitterOptions {
  outputPath: string;
}

export async function $onEmit(p: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: p.compilerOptions.outputPath || resolvePath("./ts/"),
  };

  const ns = getServiceNamespaceString(p);
  console.log(ns);
  console.log(options.outputPath);
  if (!p.compilerOptions.noEmit) {
    const outFile = resolvePath(options.outputPath, "client.ts");
    await p.host.writeFile(outFile, "//hello world!");
  }
}
