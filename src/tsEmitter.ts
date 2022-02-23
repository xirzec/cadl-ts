import { Program, resolvePath, getServiceNamespaceString } from "@cadl-lang/compiler";

export interface TSEmitterOptions {
  outputPath: string;
}

export async function $onEmit(p: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: p.compilerOptions.outputPath || resolvePath("./ts"),
  };

  const emitter = createTSEmitter(p, options);
  await emitter.emitTS();
}

function createTSEmitter(p: Program, options: TSEmitterOptions) {
  async function emitTS() {
    const ns = getServiceNamespaceString(p);
    console.log(ns);
    console.log(options.outputPath);
  }
  return {
    emitTS,
  };
}
