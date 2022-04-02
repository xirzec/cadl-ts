import {
  DecoratorContext,
  Program,
  Type,
  validateDecoratorParamType,
  validateDecoratorTarget,
} from "@cadl-lang/compiler";

const clientNameKey = Symbol();
export function $clientName({ program }: DecoratorContext, entity: Type, name: string) {
  if (
    !validateDecoratorTarget(program, entity, "@clientName", "Operation") ||
    !validateDecoratorParamType(program, entity, name, "String")
  ) {
    return;
  }
  program.stateMap(clientNameKey).set(entity, name);
}

export function getClientName(program: Program, entity: Type): string | undefined {
  return program.stateMap(clientNameKey).get(entity);
}
