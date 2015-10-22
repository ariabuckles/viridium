_ = require "underscore"
SyntaxTree = require "./syntax-tree.js"
SyntaxNode = SyntaxTree.SyntaxNode

is_instance = [a A | ret ```a instanceof A```]

translateSymbols = {
    if: "_if"
    else: "_else"
    while: "_while"
    for: "_for"
    return: "__ret_is_reserved_use_ret"  // reserved for future use
}

translateOperations = {
    "and": "&&"
    "or": "||"
}

translateKeywordFunctions = {
    ret: "return"
    new: "new"
    throw: "throw"
    not: "!"
}

mapObject = [ obj func |
    mutable result = {:}
    _.each obj [ value key |
        mutate result@key = func value
    ]
    ret result
]

rewrite = [ node |
    ret if (_.isArray node) [
        ret _.map node rewrite
    ] (is_instance node SyntaxNode) [
        ret rewrite@(node.type) node
    ] (rewrite@(typeof node)) [
        ret rewrite@(typeof node) node
    ] else [
        ret node
    ]
]

_.extend rewrite {
    object: [ obj |
        ret if (obj == null) [
            ret null
        ] else [
            ret mapObject obj rewrite
        ]
    ]

    variable: [ variable |
        optTranslate = translateSymbols@(variable.name)
        name = if optTranslate [optTranslate] else [variable.name]
        ret new SyntaxNode {
            type: "variable"
            name: name
        }
    ]

    assignment: [ assign |
        ret new SyntaxNode {
            type: "assignment"
            modifier: assign.modifier
            left: rewrite assign.left
            right: rewrite assign.right
        }
    ]

    lambda: [ lambda |
        ret new SyntaxNode {
            type: "lambda"
            arguments: _.map lambda.arguments rewrite
            statements: _.map lambda.statements rewrite
        }
    ]

    "table-access": [ tableAccess |
        ret new SyntaxNode {
            type: "table-access"
            table: rewrite tableAccess.table
            key: rewrite tableAccess.key
        }
    ]

    "unit-list": [ unitList |
        units = unitList.units
        func = _.first(units)
        // pull out keywords that act like functions, such as "ret/ret"
        // "new", "not"
        ret if (func.type == "variable" and translateKeywordFunctions@(func.name)) [
            value = if (units.length == 2) [
                ret units@1
            ] else [
                ret new SyntaxNode {
                    type: "unit-list"
                    units: _.rest(units)
                }
            ]
            ret new SyntaxNode {
                type: "keyword-function"
                name: translateKeywordFunctions@(func.name)
                value: rewrite value
            }
        ] else [
            ret new SyntaxNode {
                type: "unit-list"
                units: _.map unitList.units rewrite
            }
        ]
    ]

    "operation": [ comp |
        op = translateOperations@(comp.operation) or comp.operation
        ret new SyntaxNode {
            type: "operation"
            left: rewrite comp.left
            operation: op
            right: rewrite comp.right
        }
    ]

    "javascript": [ js |
        ret js
    ]

    regex: [ regexNode | regexNode ]
}

mutate module.exports = rewrite

