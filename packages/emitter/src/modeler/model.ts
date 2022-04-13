export type ParameterLocation = "body" | "header" | "query" | "path";
export type ResponseLocation = "body" | "header";

export type SimpleType = StringType | NumberType | BooleanType;

export interface MapType {
  kind: "map";
  valueType: RestType;
}

export interface StringType {
  kind: "string";
  constant?: string;
}

export interface NumberType {
  kind: "number";
  constant?: number;
}

export interface BooleanType {
  kind: "boolean";
  constant?: boolean;
}

export interface ModelType {
  kind: "model";
  name: string;
  discriminator: string | undefined;
  properties: Map<string, ModelProperty>;
}

export interface UnionType {
  kind: "union";
  options: RestType[];
}

export interface ArrayType {
  kind: "array";
  elementType: RestType;
}

export interface ModelProperty {
  name: string;
  serializedName?: string | undefined;
  optional: boolean;
  location: ResponseLocation | undefined;
  type: RestType;
}

export type RestType = ArrayType | ModelType | SimpleType | UnionType | MapType;

// date, stream?, bytes?

export type HttpVerb = "GET" | "PUT" | "POST" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS" | "TRACE";

export interface Response {
  name: string;
  discriminator: string | undefined;
  properties: Map<string, ModelProperty>;
  isError: boolean;
  statusCodes: string[];
}

export interface Parameter {
  name: string;
  serializedName?: string | undefined;
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
