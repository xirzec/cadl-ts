export type ParameterLocation = "body" | "header" | "query" | "path";
export type ResponseLocation = "body" | "header";

export interface SimpleType {
  kind: "string" | "number" | "boolean";
}

export interface ModelType {
  kind: "model";
  discriminator: string | undefined;
  properties: Map<string, ModelProperty>;
}

export interface ArrayType {
  kind: "array";
  elementType: RestType;
}

export interface ModelProperty {
  name: string;
  optional: boolean;
  location: ResponseLocation | undefined;
  type: RestType;
}

export type RestType = ArrayType | ModelType | SimpleType;

// date, stream?, bytes?

export type HttpVerb = "GET" | "PUT" | "POST" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "TRACE";

export interface Response {
  discriminator: string | undefined;
  properties: Map<string, ModelProperty>;
  isError: boolean;
  statusCodes: string[];
}

export interface Parameter {
  name: string;
  location: ParameterLocation;
  type: RestType;
  optional: boolean;
}

export interface Operation {
  name: string;
  path: string;
  parameters: Parameter[];
  responses: Response[];
  verb: HttpVerb;
}

export interface Client {
  name: string;
  operations: Operation[];
}

export interface Package {
  clients: Client[];
}
