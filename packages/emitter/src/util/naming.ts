// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const startsWithNumber = /^[0-9]/;
const allCaps = /^[A-Z0-9$]+$/;
const allLower = /^[a-z0-9$]+$/;

export function nameToIdentifier(name: string): string {
  if (name.length === 0) {
    throw new RangeError("Empty identifier not allowed.");
  }

  let result = name;

  if (startsWithNumber.test(result)) {
    result = `$${result}`;
  }

  result = replaceSeparator(result, /[-_]/);

  return result.replace(/[^A-Za-z0-9_$]/g, "");
}

function replaceSeparator(input: string, separator: RegExp): string {
  const parts = input.split(separator);

  // Special cases where we have no separators
  if (parts.length === 1 && parts[0]) {
    if (allCaps.test(parts[0])) {
      return parts[0].toLowerCase();
    } else if (!allLower.test(parts[0])) {
      // mixed caps are presumed to be PascalCase
      return lowercaseFirstLetter(parts[0]);
    } else {
      return parts[0];
    }
  }

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index > 0) {
        return capitalizeFirstLetter(lower);
      }
      return lower;
    })
    .join("");
}

function capitalizeFirstLetter(input: string): string {
  const firstLetter = input[0];
  if (firstLetter) {
    return `${firstLetter.toUpperCase()}${input.substring(1)}`;
  } else {
    return input;
  }
}

function lowercaseFirstLetter(input: string): string {
  const firstLetter = input[0];
  if (firstLetter) {
    return `${firstLetter.toLowerCase()}${input.substring(1)}`;
  } else {
    return input;
  }
}
