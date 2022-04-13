// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export interface UrlOptions {
  base: string;
  path?: string;
  queryParams?: { [name: string]: string | string[] | undefined };
}
export function getRequestUrl(options: UrlOptions): string {
  const url = new URL(options.base);
  if (options.path) {
    appendPath(url, options.path);
  }

  if (options.queryParams) {
    appendQueryParams(url, options.queryParams);
  }

  return url.toString();
}

function appendPath(url: URL, pathToAppend: string) {
  let newPath = url.pathname;

  if (!newPath.endsWith("/")) {
    newPath = `${newPath}/`;
  }

  if (pathToAppend.startsWith("/")) {
    pathToAppend = pathToAppend.substring(1);
  }

  const searchStart = pathToAppend.indexOf("?");
  if (searchStart !== -1) {
    const path = pathToAppend.substring(0, searchStart);
    const search = pathToAppend.substring(searchStart + 1);
    newPath = newPath + path;
    if (search) {
      url.search = url.search ? `${url.search}&${search}` : search;
    }
  } else {
    newPath = newPath + pathToAppend;
  }

  url.pathname = newPath;
}

function appendQueryParams(
  url: URL,
  queryParams: { [name: string]: string | string[] | undefined }
): void {
  const searchPieces: string[] = [];
  for (const [name, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      // QUIRK: If we get an array of values, include multiple key/value pairs
      for (const subValue of value) {
        searchPieces.push(`${name}=${subValue}`);
      }
    } else if (value !== undefined) {
      searchPieces.push(`${name}=${value}`);
    }
  }
  // QUIRK: we have to set search manually as searchParams will encode comma when it shouldn't.
  url.search = searchPieces.length ? `?${searchPieces.join("&")}` : "";
}

export function stringifyQueryParam(value: boolean | number | undefined): string | undefined {
  if (value !== undefined) {
    return String(value);
  } else {
    return undefined;
  }
}

/**
 * Helper type used to detect parameters in a path template
 * text surrounded by \{\} will be considered a path parameter
 */
export type PathParameters<
  TRoute extends string,
  Replacements extends string = never
  // This is trying to match the string in TRoute with a template where HEAD/{PARAM}/TAIL
  // for example in the following path: /foo/{fooId}/bar/{barId}/baz the template will infer
  // HEAD: /foo
  // Param: fooId
  // Tail: /bar/{barId}/baz
  // The above sample path would return {fooId: string, barId: string}
> = TRoute extends `${infer _Head}{${infer Param}}${infer Tail}`
  ? // In case we have a match for the template above we know for sure
    // that we have at least one pathParameter, that's why we set the first pathParam
    // in the tuple. At this point we have only matched up until param, if we want to identify
    // additional parameters we can call RouteParameters recursively on the Tail to match the remaining parts,
    // in case the Tail has more parameters, it will return a tuple with the parameters found in tail.
    // We spread the second path params to end up with a single dimension tuple at the end.
    [...pathParameters: PathParameters<Tail, Replacements | Param>]
  : // When the path doesn't match the template, it means that we have no path parameters so we return
  // the computed Record or nothing if we never found a param name.
  [Replacements] extends [never]
  ? []
  : [values: Record<Replacements, string>];

export function replacePathParameters<TPath extends string>(
  path: TPath,
  ...args: PathParameters<TPath>
): string;
export function replacePathParameters<TPath extends string>(
  path: TPath,
  values?: Record<string, string>
): string {
  if (!values) {
    return path;
  }

  const replacements = new Map<string, string>(
    Object.entries(values).map(([name, value]) => [`{${name}}`, value])
  );
  return replaceAll(path, replacements);
}

function replaceAll(input: string, replacements: Map<string, string>): string {
  let result = input;
  for (const [searchValue, replaceValue] of replacements) {
    result = result.split(searchValue).join(replaceValue);
  }
  return result;
}
