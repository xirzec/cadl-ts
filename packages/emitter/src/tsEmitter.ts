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
} from "./model.js";
import { emit } from "./printer.js";
import RestHttpVerb = RestHttp.HttpVerb;
const { getStatusCodes, isStatusCode, isHeader, isBody } = RestHttp;

export interface TSEmitterOptions {
  outputPath: string;
}

export async function $onEmit(p: Program): Promise<void> {
  const options: TSEmitterOptions = {
    outputPath: p.compilerOptions.outputPath || resolvePath("./ts/"),
  };

  const sdkPackage = createPackage(p);

  if (!p.compilerOptions.noEmit) {
    const output = render(sdkPackage);
    await emit(p.host, options.outputPath, output);
  }
}

function createPackage(p: Program): Package {
  const routes = getAllRoutes(p);
  const clients = new Map<string, Client>();
  for (const route of routes) {
    const name = route.groupName;
    let client = clients.get(name);
    if (!client) {
      client = {
        name: `${name}Client`,
        operations: [],
      };
      clients.set(client.name, client);
    }
    client.operations.push(createOperationFromRoute(p, route));
  }
  return {
    clients: Array.from(clients.values()),
  };
}

function createOperationFromRoute(p: Program, route: OperationDetails): Operation {
  return {
    name: route.operation.name,
    parameters: getParameters(p, route.parameters),
    responses: getResponses(p, route.operation.returnType),
    path: route.path,
    verb: restVerbToOperationVerb(route.verb),
  };
}

function getParameters(p: Program, params: HttpOperationParameters): Parameter[] {
  const result: Parameter[] = [];

  if (params.body) {
    const type = createRestType(p, params.body.type);
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
    const type = createRestType(p, param.param.type);
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

function getResponses(p: Program, responseType: Type): Response[] {
  const responses: Response[] = [];
  // gotta fish out all the status codes and the right shape
  // as well as maybe inferring it
  if (responseType.kind === "Union") {
    for (const option of responseType.options) {
      // recurse
      const result = getResponses(p, option);
      responses.push(...result);
    }
  } else if (responseType.kind === "Model") {
    responses.push(createResponseFromModel(p, responseType));
  } else {
    warn(p, `Unhandled responseType ${responseType.kind}`, responseType);
  }
  return responses;
}

function createRestType(p: Program, type: Type): RestType | undefined {
  if (type.kind === "Array") {
    const elementType = createRestType(p, type.elementType);
    if (elementType) {
      return {
        kind: "array",
        elementType,
      };
    } else {
      error(
        p,
        `Can't make RestType out of array element type: ${type.elementType.kind}`,
        type.elementType
      );
      return undefined;
    }
  } else if (type.kind === "Model") {
    const name = getIntrinsicModelName(p, type);
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
          return {
            kind: "number",
          };
        case "string":
          return {
            kind: "string",
          };
        default:
          error(p, `Can't make RestType out of intrinsic ${type.kind}`, type);
          return undefined;
      }
    }
    const properties = new Map<string, ModelProperty>();
    // TODO: handle inheritance?
    for (const prop of getAllModelProperties(type)) {
      const propertyType = createModelProperty(p, prop);
      if (propertyType) {
        properties.set(prop.name, propertyType);
      }
    }
    return {
      kind: "model",
      name: type.name,
      properties,
      discriminator: getDiscriminator(p, type),
    };
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
      const optionType = createRestType(p, option);
      if (optionType) {
        options.push(optionType);
      }
    }

    return {
      kind: "union",
      options,
    };
  } else {
    error(p, `Can't make RestType out of ${type.kind}`, type);
    return undefined;
  }
}

function createModelProperty(p: Program, prop: ModelTypeProperty): ModelProperty | undefined {
  let location: ResponseLocation | undefined;
  if (isHeader(p, prop)) {
    location = "header";
  } else if (isBody(p, prop)) {
    location = "body";
  }

  const type = createRestType(p, prop.type);

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

function getDiscriminator(p: Program, model: ModelType): string | undefined {
  const discriminator: { propertyName: string } | undefined = getRestDiscriminator(p, model);
  return discriminator?.propertyName;
}

function createResponseFromModel(p: Program, model: ModelType): Response {
  const statusCodes = [];
  const properties = new Map<string, ModelProperty>();

  for (const prop of getAllModelProperties(model)) {
    if (isStatusCode(p, prop)) {
      const codes: string[] = getStatusCodes(p, prop);
      statusCodes.push(...codes);
    } else if (isBody(p, prop) && prop.type.kind === "Model") {
      // flatten body model onto outer model
      for (const bodyProp of getAllModelProperties(prop.type)) {
        const type = createModelProperty(p, bodyProp);
        if (type) {
          type.location = "body";
          properties.set(bodyProp.name, type);
        }
      }
    } else {
      const type = createModelProperty(p, prop);
      if (type) {
        properties.set(prop.name, type);
      }
    }
  }

  return {
    name: model.name,
    properties,
    isError: isErrorModel(p, model),
    statusCodes,
    discriminator: getDiscriminator(p, model),
  };
}

function restVerbToOperationVerb(verb: RestHttpVerb): HttpVerb {
  // export declare type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";
  return verb.toUpperCase() as Uppercase<RestHttpVerb>;
}
