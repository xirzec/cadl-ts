// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Program,
  Type,
  ModelType,
  ModelTypeProperty,
  getIntrinsicModelName,
} from "@cadl-lang/compiler";
import { http as RestHttp, getDiscriminator as getRestDiscriminator } from "@cadl-lang/rest";
import { error } from "../util/log.js";
import {
  ModelProperty,
  Response,
  ResponseLocation,
  RestType,
  ModelType as EmitterModelType,
} from "./model.js";
const { isHeader, isBody, getHeaderFieldName } = RestHttp;

export interface Context {
  program: Program;
  responseCache: WeakMap<ModelType, Response>;
  modelCache: WeakMap<ModelType, EmitterModelType>;
}

export function createRestType(context: Context, type: Type): RestType | undefined {
  if (type.kind === "Array") {
    const elementType = createRestType(context, type.elementType);
    if (elementType) {
      return {
        kind: "array",
        elementType,
      };
    } else {
      error(
        context.program,
        `Can't make RestType out of array element type: ${type.elementType.kind}`,
        type.elementType
      );
      return undefined;
    }
  } else if (type.kind === "Model") {
    const name = getIntrinsicModelName(context.program, type);
    if (name) {
      switch (name) {
        case "boolean":
          return {
            kind: "boolean",
          };
        // TODO: handle all number types
        case "int8":
        case "int16":
        case "int32":
        case "int64":
        case "float32":
        case "float64":
        case "safeint":
        case "uint8":
        case "uint16":
        case "uint32":
        case "uint64":
          return {
            kind: "number",
          };
        case "string":
          return {
            kind: "string",
          };
        case "Map":
          return createMapType(context, type);
        case "zonedDateTime":
          // TODO: handle the formatting
          return {
            kind: "string",
          };
        default:
          error(context.program, `Can't make RestType out of intrinsic ${type.name}`, type);
          return undefined;
      }
    }
    const cachedModel = context.modelCache.get(type);
    if (cachedModel) {
      return cachedModel;
    }
    const properties = new Map<string, ModelProperty>();
    const model: EmitterModelType = {
      kind: "model",
      name: type.name,
      properties,
      discriminator: getDiscriminator(context, type),
    };
    context.modelCache.set(type, model);
    // TODO: handle inheritance?
    for (const prop of getAllModelProperties(type)) {
      const propertyType = createModelProperty(context, prop);
      if (propertyType) {
        properties.set(prop.name, propertyType);
      }
    }
    return model;
  } else if (type.kind === "Boolean") {
    return {
      kind: "boolean",
      constant: type.value,
    };
  } else if (type.kind === "Number") {
    return {
      kind: "number",
      constant: type.value,
    };
  } else if (type.kind === "String") {
    return {
      kind: "string",
      constant: type.value,
    };
  } else if (type.kind === "Union") {
    const options: RestType[] = [];

    for (const option of type.options) {
      const optionType = createRestType(context, option);
      if (optionType) {
        options.push(optionType);
      }
    }

    return {
      kind: "union",
      options,
    };
  } else {
    error(context.program, `Can't make RestType out of ${type.kind}`, type);
    return undefined;
  }
}

function createMapType(context: Context, type: ModelType): RestType | undefined {
  const valueProp = type.properties.get("v");
  if (valueProp) {
    const valueType = createRestType(context, valueProp.type);
    if (valueType) {
      return {
        kind: "map",
        valueType,
      };
    }
  }
  return undefined;
}

export function createModelProperty(
  context: Context,
  prop: ModelTypeProperty
): ModelProperty | undefined {
  let location: ResponseLocation | undefined;
  let serializedName: string | undefined;
  if (isHeader(context.program, prop)) {
    location = "header";
    serializedName = getHeaderFieldName(context.program, prop);
  } else if (isBody(context.program, prop)) {
    location = "body";
  }

  const type = createRestType(context, prop.type);

  if (type) {
    return {
      name: prop.name,
      serializedName,
      location,
      optional: prop.optional,
      type,
    };
  } else {
    return undefined;
  }
}

export function* getAllModelProperties(model: ModelType): IterableIterator<ModelTypeProperty> {
  if (model.baseModel) {
    yield* getAllModelProperties(model.baseModel);
  }
  yield* model.properties.values();
}

export function getDiscriminator(context: Context, model: ModelType): string | undefined {
  const discriminator: { propertyName: string } | undefined = getRestDiscriminator(
    context.program,
    model
  );
  return discriminator?.propertyName;
}
