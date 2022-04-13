import { resolvePath, CompilerHost } from "@cadl-lang/compiler";
import { Output } from "./render.js";

export async function emit(host: CompilerHost, outputPath: string, output: Output): Promise<void> {
  for (const file of output.files) {
    const filePath = resolvePath(outputPath, ...file.path);
    await host.writeFile(filePath, file.contents);
  }
}