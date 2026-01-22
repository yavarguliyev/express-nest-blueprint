import { FieldMetadata, OBJECT_TYPE_METADATA, INPUT_TYPE_METADATA, FIELD_METADATA, TypeFunc } from '../interfaces/graphql.interface';

export const ObjectType = (name?: string): ClassDecorator => {
  return (target: object): void => {
    const typeName = name || (target as { name: string }).name;
    Reflect.defineMetadata(OBJECT_TYPE_METADATA, { name: typeName }, target);
  };
};

export const InputType = (name?: string): ClassDecorator => {
  return (target: object): void => {
    const typeName = name || (target as { name: string }).name;
    Reflect.defineMetadata(INPUT_TYPE_METADATA, { name: typeName }, target);
  };
};

export function Field(options?: { nullable?: boolean }): PropertyDecorator;
export function Field(typeFunc: TypeFunc, options?: { nullable?: boolean }): PropertyDecorator;
export function Field (typeFuncOrOptions?: TypeFunc | { nullable?: boolean }, maybeOptions?: { nullable?: boolean }): PropertyDecorator {
  return (target: object, propertyKey: string | symbol): void => {
    let typeFunc: TypeFunc | undefined;
    let options: { nullable?: boolean } | undefined;

    if (typeof typeFuncOrOptions === 'function') {
      typeFunc = typeFuncOrOptions;
      options = maybeOptions;
    } else if (typeof typeFuncOrOptions === 'object') {
      options = typeFuncOrOptions as { nullable?: boolean };
    }

    if (!typeFunc) {
      const designType = Reflect.getMetadata('design:type', target, propertyKey) as unknown;
      if (designType) {
        typeFunc = () => designType;
      }
    }

    const existingFields = (Reflect.getMetadata(FIELD_METADATA, target.constructor as object) || []) as FieldMetadata[];

    existingFields.push({
      name: String(propertyKey),
      typeFunc,
      nullable: options?.nullable
    });

    Reflect.defineMetadata(FIELD_METADATA, existingFields, target.constructor as object);
  };
}
