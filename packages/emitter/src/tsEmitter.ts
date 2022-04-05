import {
  Program,
  resolvePath,
  Type,
  ModelType,
  isErrorModel,
  ModelTypeProperty,
  getIntrinsicModelName,
} from "@cadl-lang/compiler";
import {
  getAllRoutes,
  OperationDetails,
  http as RestHttp,
  HttpOperationParameters,
  getDiscriminator as getRestDiscriminator,
} from "@cadl-lang/rest";
import { warn, error } from "./log.js";
import { render } from "./render.js";
import {
  Client,
  HttpVerb,
  ModelProperty,
  Operation,
  Package,
  Parameter,
  Response,
  ResponseLocation,
  RestType,
  ModelType as EmitterModelType,
} from "./model.js";
import { emit } from "./printer.js";
import RestHttpVerb = RestHttp.HttpVerb;
const { getStatusCodes, isStatusCode, isHeader, isBody } = RestHttp;

export interface TSEmitterOptions {
  outputPath: string;
}

interface Context {
  program: Program;
  responseCache: WeakMap<ModelType, Response>;
  modelCache: WeakMap<ModelType, EmitterModelType>;
}

export async function $onEmit(program: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: program.compilerOptions.outputPath || resolvePath("./ts/"),
  };

  const context: Context = {
    program,
    responseCache: new WeakMap(),
    modelCache: new WeakMap(),
  };

  const sdkPackage = createPackage(context);
  if (!program.compilerOptions.noEmit) {
    const output = render(sdkPackage);
    await emit(program.host, options.outputPath, output);
  }
}

function createPackage(context: Context): Package {
  const routes = getAllRoutes(context.program);
  const clients = new Map<string, Client>();
  for (const route of routes) {
    const name = route.groupName;
    let client = clients.get(name);
    if (!client) {
      client = {
        name: `${name}Client`,
        operations: [],
      };
      clients.set(name, client);
    }
    client.operations.push(createOperationFromRoute(context, route));
  }
  return {
    clients: Array.from(clients.values()),
  };
}

function createOperationFromRoute(context: Context, route: OperationDetails): Operation {
  // debugLog(context.program, `route: ${route.operation.name}:${route.verb} ${route.path}`);
  return {
    name: route.operation.name,
    parameters: getParameters(context, route.parameters),
    responses: getResponses(context, route.operation.returnType),
    path: route.path,
    verb: restVerbToOperationVerb(route.verb),
  };
}

function getParameters(context: Context, params: HttpOperationParameters): Parameter[] {
  const result: Parameter[] = [];

  if (params.body) {
    const type = createRestType(context, params.body.type);
    if (type) {
      result.push({
        name: params.body.name,
        location: "body",
        optional: params.body.optional,
        type,
      });
    }
  }

  for (const param of params.parameters) {
    const type = createRestType(context, param.param.type);
    if (type) {
      result.push({
        location: param.type,
        name: param.name,
        optional: param.param.optional,
        type,
      });
    }
  }

  return result;
}

function getResponses(context: Context, responseType: Type): Response[] {
  const responses: Response[] = [];
  // gotta fish out all the status codes and the right shape
  // as well as maybe inferring it
  if (responseType.kind === "Union") {
    for (const option of responseType.options) {
      // recurse
      const result = getResponses(context, option);
      responses.push(...result);
    }
  } else if (responseType.kind === "Model") {
    responses.push(createResponseFromModel(context, responseType));
  } else {
    warn(context.program, `Unhandled responseType ${responseType.kind}`, responseType);
  }
  return responses;
}

function createRestType(context: Context, type: Type): RestType | undefined {
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

function createModelProperty(context: Context, prop: ModelTypeProperty): ModelProperty | undefined {
  let location: ResponseLocation | undefined;
  if (isHeader(context.program, prop)) {
    location = "header";
  } else if (isBody(context.program, prop)) {
    location = "body";
  }

  const type = createRestType(context, prop.type);

  if (type) {
    return {
      name: prop.name,
      location,
      optional: prop.optional,
      type,
    };
  } else {
    return undefined;
  }
}

function* getAllModelProperties(model: ModelType): IterableIterator<ModelTypeProperty> {
  if (model.baseModel) {
    yield* getAllModelProperties(model.baseModel);
  }
  yield* model.properties.values();
}

function getDiscriminator(context: Context, model: ModelType): string | undefined {
  const discriminator: { propertyName: string } | undefined = getRestDiscriminator(
    context.program,
    model
  );
  return discriminator?.propertyName;
}

function createResponseFromModel(context: Context, model: ModelType): Response {
  const cachedResponse = context.responseCache.get(model);
  if (cachedResponse) {
    return cachedResponse;
  }

  const statusCodes: string[] = [];
  const properties = new Map<string, ModelProperty>();
  const response: Response = {
    name: model.name,
    properties,
    isError: isErrorModel(context.program, model),
    statusCodes,
    discriminator: getDiscriminator(context, model),
  };

  context.responseCache.set(model, response);

  for (const prop of getAllModelProperties(model)) {
    if (isStatusCode(context.program, prop)) {
      const codes: string[] = getStatusCodes(context.program, prop);
      statusCodes.push(...codes);
    } else {
      const type = createModelProperty(context, prop);
      if (type) {
        properties.set(prop.name, type);
      }
    }
  }

  return response;
}

function restVerbToOperationVerb(verb: RestHttpVerb): HttpVerb {
  // export declare type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";
  return verb.toUpperCase() as Uppercase<RestHttpVerb>;
}
