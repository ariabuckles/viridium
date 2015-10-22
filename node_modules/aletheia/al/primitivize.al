// primitivize
//
// Transforms a Syntax Tree from its full representation to a lightweight
// primitivized representation for macro transformations.

_ = require "underscore"

SyntaxTree = require "./syntax-tree.js"
SyntaxNode = SyntaxTree.SyntaxNode

is_instance = [a A | ret ```a instanceof A```]

mapObject = [ obj func |
    mutable result = {:}
    _.each obj [ value key |
        mutate result@key = func value
    ]
    ret result
]

// Converts a parse tree to a syntax tree
primitivize = [ parsed |
    res = if (_.isArray parsed) [
        // A generic list, process it as such
        ret _.map parsed primitivize

    ] (is_instance parsed SyntaxNode) [
        // A single node; dispatch to our normalization table of
        // functions
        type = parsed.type
        ret primitivize@type parsed

    ] else [
        // A compile-time constant.
        // Mostly, these are literals, like numbers or strings,
        // but it could also be a compile-time table
        ret parsed
    ]
    ret res
]

passThrough = [ parse |
    ret SyntaxNode (mapObject parse primitivize)
]

_.extend primitivize {
    assignment: passThrough  // just take the same fields
    lambda: passThrough
    "unit-list": passThrough
    "table-access": passThrough
    field: passThrough
    operation: passThrough
    variable: passThrough
    javascript: passThrough
    regex: passThrough

    array: [ array | _.map array.value primitivize ]
    object: [ obj | mapObject obj.value primitivize ]

    'extended-array': [ table |
        ret _.extend table.array table.extensions
    ]
}

mutate module.exports = primitivize
