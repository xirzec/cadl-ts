// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { Operation, Parameter } from "../modeler/model.js";
import { ClientContext } from "./cache.js";
import { quoteNameIfNeeded } from "./identifiers.js";
import { restTypeToTypeScript } from "./interfaces.js";

export function createOperationParams(context: ClientContext, operation: Operation): string {
  return operation.parameters.map((p) => createParameter(context, p)).join(", ");
}

function createParameter(context: ClientContext, parameter: Parameter): string {
  const optional = parameter.optional ? "?" : "";
  const paramType = restTypeToTypeScript(context, parameter.type);
  const name = nameToIdentifier(parameter.name);
  return `${name}${optional}: ${paramType}`;
}

export function getPathFromParameters(context: ClientContext, operation: Operation): string {
  const pathParams = operation.parameters.filter((p) => p.location === "path");
  const pathString = `"${operation.path}"`;
  if (pathParams.length === 0) {
    return pathString;
  }

  context.extraClientLibImports.add("replacePathParameters");
  const pathParamsAsObj = pathParams
    .map((param) => {
      const name = quoteNameIfNeeded(param.name);
      const value = nameToIdentifier(param.name);
      return name === value ? name : `${name}: ${value}`;
    })
    .join(",");

  return `replacePathParameters(${pathString}, {${pathParamsAsObj}})`;
}

export function getHeadersFromParameters(operation: Operation): string {
  return operation.parameters
    .filter((p) => p.location === "header")
    .map((p) => {
      const identifier = nameToIdentifier(p.name);
      const setHeader = `request.headers.set("${p.serializedName}", ${identifier});`;
      if (p.optional) {
        return `if (${identifier}) {
          ${setHeader}
        }`;
      } else {
        return setHeader;
      }
    })
    .join("\n");
}

export function getQueryParamsFromParameters(operation: Operation): string {
  const body = operation.parameters
    .filter((p) => p.location === "query")
    .map((p) => {
      const name = quoteNameIfNeeded(p.name);
      const value = stringifyParamIfNeeded(p);
      return name === value ? name : `${name}:  ${value}`;
    })
    .join(",");
  return `{ ${body} }`;
}

function stringifyParamIfNeeded(p: Parameter): string {
  const kind = p.type.kind;
  const identifier = nameToIdentifier(p.name);
  if (kind === "string") {
    return identifier;
  } else if (kind === "boolean" || kind === "number") {
    return `stringifyQueryParam(${identifier})`;
  } else if (kind === "union") {
    // TODO: robustness
    const nonString = p.type.options.some((t) => t.kind !== "string");
    return nonString ? `stringifyQueryParam(${identifier})` : identifier;
  } else if (kind == "array") {
    if (p.type.elementType.kind !== "string") {
      throw new Error(`Non-string arrays not supported currently for query parameter ${p.name}`);
    }
    return identifier;
  } else {
    throw new Error(`No support for ${p.type.kind} in query parameter ${p.name}`);
  }
}

export function getBody(operation: Operation): string {
  const bodyParam = operation.parameters.find((p) => p.location === "body");
  if (!bodyParam) {
    return "";
  }
  const value = nameToIdentifier(bodyParam.name);

  // TODO: destructure the body model props?
  return `
request.body = JSON.stringify({ ...${value} });`;
}

function nameToIdentifier(name: string): string {
  // TODO: change foo-bar-baz into fooBarBaz
  // convert foo_bar_baz into fooBarBaz as well?
  // validate first character is not number?
  return name.replace(/[^A-Za-z0-9_$]/g, "_");
}
