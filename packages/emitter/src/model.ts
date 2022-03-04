export interface Property {
  path: string[];
  serializedName: string;
}

export interface Request {
  route: string;
  verb?: "GET" | "POST" | "HEAD" | "PUT";
  body?: Property[];
  queryParameters?: Property[];
  headers?: Property[];
  urlParameters?: Property[];
}

export interface Response {
  headers?: Property[];
  body?: Property[];
}

export interface Operation {
  methodName?: string;
  request: Request;
  response: {
    [code: number]: Response;
    error: Response;
  };
}

export interface Client {
  name: string;
  operations: Operation[];
}

export interface Package {
  clients: Client[];
}
