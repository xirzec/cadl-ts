export function createFile(text: string): string {
  return `// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

${text}
`;
}
