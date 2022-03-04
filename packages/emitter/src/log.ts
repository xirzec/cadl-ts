import { Program, NoTarget } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export function debugLog(p: Program, message: string | undefined) {
  if (!message) { 
    return;
  }

  p.host.logSink.log({level: "debug", message})
  
}

export function warn(p: Program, message: string | undefined) {
  if (!message) { 
    return;
  }
  reportDiagnostic(p, {
    code: "warn",
    format: { message },
    target: NoTarget,
  });
  p.host.logSink.log({level: "info", message})
  
}