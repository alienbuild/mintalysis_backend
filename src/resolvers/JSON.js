import {GraphQLScalarType, Kind} from "graphql";

const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON scalar type',
    parseValue: value => value,
    serialize: value => value,
    parseLiteral(ast) {
        switch (ast.kind) {
            case Kind.STRING:
            case Kind.BOOLEAN:
                return ast.value;
            case Kind.INT:
            case Kind.FLOAT:
                return parseFloat(ast.value);
            case Kind.OBJECT: {
                const value = Object.create(null);
                ast.fields.forEach(field => {
                    value[field.name.value] = this.parseLiteral(field.value);
                });
                return value;
            }
            case Kind.LIST:
                return ast.values.map(this.parseLiteral);
            default:
                return null;
        }
    },
});
