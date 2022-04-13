// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { getAllRoutes, OperationDetails, http as RestHttp } from "@cadl-lang/rest";
import { Client, HttpVerb, Operation, Package } from "./model.js";
import { Context } from "./common.js";
import { getParameters } from "./parameters.js";
import { getResponses } from "./responses.js";
import RestHttpVerb = RestHttp.HttpVerb;

export function createPackage(context: Context): Package {
  const routes = getAllRoutes(context.program);
  const clients = new Map<string, Client>();
  for (const route of routes) {
    const name = route.groupName;
    let client = clients.get(name);
    if (!client) {
      client = {
        name: `${name}GeneratedClient`,
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

function restVerbToOperationVerb(verb: RestHttpVerb): HttpVerb {
  // export declare type HttpVerb = "get" | "put" | "post" | "patch" | "delete" | "head";
  return verb.toUpperCase() as Uppercase<RestHttpVerb>;
}
