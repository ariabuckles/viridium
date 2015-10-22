// desugar
//
// Desugars fancy syntax, creating a SyntaxTree from the original
// ParseTree.

assert = require "assert"

_ = require "underscore"

ParseTree = require "./parse-tree.js"
SyntaxTree = require "./syntax-tree.js"

ParseNode = ParseTree.ParseNode
SyntaxNode = SyntaxTree.SyntaxNode

is_instance = [a A | ret ```a instanceof A```]

isConstant = [ parsed |
    ret ((not (_.isArray parsed)) and (not (is_instance parsed ParseNode)))
]

mapObject = [ obj func |
    mutable result = {=}
    _.each obj [ value key |
        mutate result@key = func value
    ]
    ret result
]

syntaxWithSameFields = [ parse |
    ret SyntaxNode (mapObject parse desugar)
]

desugar = [ node |
    ret if (_.isArray node) [
        ret _.map node desugar
    ] (is_instance node ParseNode) [
        ret desugar@(node.type) node
    ] (desugar@(typeof node)) [
        ret desugar@(typeof node) node
    ] else [
        ret node
    ]
]

_.extend desugar {
    assignment = syntaxWithSameFields  // just take the same fields
    lambda = syntaxWithSameFields
    "unit-list" = syntaxWithSameFields
    "table-access" = syntaxWithSameFields
    field = syntaxWithSameFields
    operation = syntaxWithSameFields
    variable = syntaxWithSameFields
    javascript = syntaxWithSameFields
    regex = syntaxWithSameFields

    "ret-lambda" = [ retlambda |
        args = desugar retlambda.arguments
        expr = retlambda.expression
        statement = if (expr.type == "unit-list" and
                (expr.units@0).type == "variable" and
                (expr.units@0).name == "ret") [
            ret desugar expr
        ] else [
            ret SyntaxNode {
                type = 'unit-list'
                units = {
                    SyntaxNode {
                        type = 'variable'
                        name = "ret"
                    }
                    desugar expr
                }
            }
        ]

        ret SyntaxNode {
            type: "lambda"
            arguments: args
            statements: {statement}
        }
    ]

    "arrow" = [ arrowNode |
        left = arrowNode.left
        right = arrowNode.right
        assert (right.type == 'unit-list')
        
        units = {_.first right.units, left}.concat (_.rest right.units)

        ret SyntaxNode {
            type: 'unit-list'
            units: _.map units desugar
        }
    ]

    table = [ table |
        fields = table.fields
        forceObject = table.forceObject

        isStrictArray = (not forceObject) and (_.all fields [ field |
            ret (field.key == null or field.key == undefined)
        ])

        isStrictObject = _.all fields [ field |
            ret (field.key != null and field.key != undefined and (isConstant field.key))
        ]

        ret if isStrictArray [
            // Strict array literals
            ret SyntaxNode {
                type = 'array'
                value = _.map fields [field | desugar field.value]
            }
        ] isStrictObject [
            // Strict object literals
            mutable value = {=}
            _.each fields [ field |
                mutate value@(field.key) = desugar field.value
            ]
            ret SyntaxNode {
                type = "object"
                value = value
            }
        ] else [
            keyedFields = _.where fields [ field |
                ret (field.key != null and field.key != undefined)
            ]
            unkeyedFields = _.where fields [ field |
                ret (field.key == null or field.key == undefined)
            ]

            mutable array = {}
            mutable extensions = {=}
            _.each keyedFields [ field |
                if ((typeof field.key) == 'number') [
                    mutate array@(field.key) = desugar field.value
                ] else [
                    mutate extensions@(field.key) = desugar field.value
                ]
            ]

            mutable next_index = 0
            _.each unkeyedFields [ field |
                while [_.has array next_index] [
                    mutate next_index = next_index + 1
                ]
                mutate array@next_index = field.value
            ]

            ret SyntaxNode {
                type = 'extended-array'
                array = array
                extensions = extensions
            }
        ]
    ]

}

mutate module.exports = desugar
