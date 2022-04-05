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
