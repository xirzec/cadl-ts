// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

export function quoteNameIfNeeded(name: string): string {
  if (/^[a-zA-Z0-9_]+$/.test(name)) {
    return name;
  } else {
    return `"${name}"`;
  }
}
