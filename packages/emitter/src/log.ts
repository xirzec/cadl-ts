import { Program, NoTarget, DiagnosticTarget } from "@cadl-lang/compiler";
import { reportDiagnostic } from "./lib.js";

export function debugLog(p: Program, message: string | undefined) {
  if (!message) {
    return;
  }

  p.host.logSink.log({ level: "debug", message });
}

export function warn(p: Program, message: string | undefined, target?: DiagnosticTarget) {
  if (!message) {
    return;
  }
  reportDiagnostic(p, {
    code: "warn",
    format: { message },
    target: target ?? NoTarget,
  });
  p.host.logSink.log({ level: "info", message });
}

export function error(p: Program, message: string, target?: DiagnosticTarget) {
  reportDiagnostic(p, {
    code: "error",
    format: { message },
    target: target ?? NoTarget,
  });
  p.host.logSink.log({ level: "error", message });
}

export function stringify(obj: unknown): string {
  const seen = new Set<unknown>();
  return JSON.stringify(
    obj,
    (_key: string, value: unknown) => {
      if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
        if (seen.has(value)) {
          return "[Circular]";
        }
        seen.add(value);
      }
      if (value instanceof Map) {
        return Array.from(value.values());
      }

      return value;
    },
    2
  );
}
