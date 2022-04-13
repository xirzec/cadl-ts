// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  ModelProperty,
  RestType,
  ArrayType,
  ModelType,
  UnionType,
  MapType,
} from "../modeler/model.js";
import { CachedInterface, ClientContext } from "./cache.js";
import { quoteNameIfNeeded } from "./identifiers.js";

export function createInterfaces(context: ClientContext): string {
  const interfaces = Array.from(context.interfaceCache.values())
    .filter((i) => !i.inline)
    .map((i) => i.generatedText)
    .join("\n\n");
  const responses = Array.from(context.responseCache.values())
    .map((r) => r.generatedText)
    .join("\n\n");
  return `${interfaces}\n\n${responses}`;
}

function modelTypeToTypeScript(context: ClientContext, type: ModelType): string {
  const cachedModel = context.interfaceCache.get(type);
  if (cachedModel) {
    if (cachedModel.inline) {
      return cachedModel.generatedText;
    } else {
      return cachedModel.name;
    }
  }

  // TODO: uniqueness?
  const name = type.name;
  const inline = !type.name;

  const model: CachedInterface = {
    name,
    inline,
    generatedText: "",
  };

  context.interfaceCache.set(type, model);
  const props = Array.from(type.properties.values()).map((p) =>
    modelPropertyToTypeScript(context, p)
  );

  if (inline) {
    model.generatedText = `{ ${props.join(",")} }`;
    return model.generatedText;
  } else {
    model.generatedText = `export interface ${name} { ${props.join(",")} }`;
    return name;
  }
}

export function modelPropertyToTypeScript(context: ClientContext, property: ModelProperty): string {
  const separator = property.optional ? "?:" : ":";
  const value = restTypeToTypeScript(context, property.type);
  const name = quoteNameIfNeeded(property.name);
  return `${name} ${separator} ${value}`;
}

export function restTypeToTypeScript(context: ClientContext, type: RestType): string {
  switch (type.kind) {
    case "string":
      return type.constant === undefined ? "string" : `"${type.constant}"`;
    case "boolean":
    case "number":
      return String(type.constant ?? type.kind);
    case "array":
      return arrayTypeToTypeScript(context, type);
    case "model":
      return modelTypeToTypeScript(context, type);
    case "union":
      return unionTypeToTypeScript(context, type);
    case "map":
      return mapTypeToTypeScript(context, type);
    default:
      throw new Error(`Unknown RestType ${(type as RestType).kind}`);
  }
}

function arrayTypeToTypeScript(context: ClientContext, type: ArrayType): string {
  const elementKind = type.elementType.kind;
  if (elementKind === "array" || elementKind === "model") {
    return `Array<${restTypeToTypeScript(context, type.elementType)}>`;
  }
  return `${restTypeToTypeScript(context, type.elementType)}[]`;
}

function mapTypeToTypeScript(context: ClientContext, type: MapType): string {
  const valueType = restTypeToTypeScript(context, type.valueType);
  return `Map<string, ${valueType}>`;
}

function unionTypeToTypeScript(context: ClientContext, type: UnionType): string {
  return type.options.map((o) => restTypeToTypeScript(context, o)).join(" | ");
}
