export function createSourceFile(text: string): string {
  return `// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

${text}
`;
}
