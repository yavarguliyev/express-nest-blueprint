import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

export const GraphQLJSONObject = new GraphQLScalarType({
  name: 'JSONObject',
  description: 'Arbitrary JSON object',
  serialize: (value: unknown): unknown => value,
  parseValue: (value: unknown): unknown => value,
  parseLiteral: (ast: ValueNode): unknown => {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value) as unknown;
      } catch {
        return null;
      }
    }
    return null;
  }
});
