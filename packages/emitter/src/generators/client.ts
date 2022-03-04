export interface CreateClientOptions {
  clientName: string;
}
export function createClient(options: CreateClientOptions): string {
  const { clientName } = options;
  return `

export class ${clientName} {
  constructor() {

  }
}
`;
}
