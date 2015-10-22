_ = require "underscore"
SourceMap = require "source-map"
SourceNode = SourceMap.SourceNode

SyntaxTree = require "./syntax-tree.js"
SyntaxNode = SyntaxTree.SyntaxNode
strings = require "./strings"

is_instance = [a A | ret ```a instanceof A```]

preambleStr = {
    // preamble if
    "var _else = {identifier: 'else'};"
    "var _if = function(cond1, lambda1, cond2, lambda2) {"
    "    if (arguments.length % 2 !== 0) {"
    "        throw new Error('if called with an odd number of arguments');"
    "    }"
    "    var i = 0;"
    "    for (var i = 0; i < arguments.length; i += 2) {"
    "        var condition = arguments[i];"
    "        if (condition != null && condition !== false) {"
    "            return arguments[i + 1].call(undefined);"
    "        }"
    "    }"
    "};"
    "" // preamble while
    "var _while = function(conditionLambda, bodyLambda) {"
    "    while (conditionLambda.call(undefined)) {"
    "        bodyLambda.call(undefined);"
    "    }"
    "}"
    ""
}.join "\n"

getPreamble = [
    ret new SourceNode null null null preambleStr
]

IDENTIFIER_REGEX = /^[_a-zA-Z0-9]+$/

// Does something like Array::join, but rets a new
// array with the value interleaved, rather than a
// string.
//
// Used to interleave ", " commas between parameters
//
// > interleave(array, value).join("") === array.join(value)
interleave = [ array value trailingValue |
    mutable result = {}
    _.each array [ elem i |
        result.push elem
        if (i + 1 != array.length or trailingValue) [
            result.push value
        ]
    ]
    ret result
]
//#test interleave [
//  #assert interleave(array, value).join("") === array.join(value)
//]

compile = [ node |
    res = if (is_instance node SyntaxNode) [
        ret compile@(node.type) node
    ] else [
        // compile time constant
        ret compile@(typeof node) node
    ]
    ret res
]
_.extend compile {
    "number": [ num |
        ret new SourceNode null null "source.al" (String num)
    ]

    "string": [ str |
        ret new SourceNode null null "source.al" (strings.escape str)
    ]

    "object": [ obj |
        ret if (obj == null) [
            ret new SourceNode null null "source.al" "null"
        ] (_.isArray obj) [
            fields = _.map obj compile
            ret new SourceNode null null "source.al" (_.flatten {
                "["
                interleave fields ",\n" false
                "]"
            })
        ] else [
            fields = _.map obj [ value key |
                result = {
                    compile@("table-key") key
                    ": "
                    compile value
                }
                ret result
            ]
            ret new SourceNode null null "source.al" (_.flatten {
                "{\n"
                interleave fields ",\n" false
                "\n}"
            })
        ]
    ]

    "table-key": [ key |
        ret if (IDENTIFIER_REGEX.test key) [
            ret key
        ] else [
            ret strings.escape key
        ]
    ]

    "undefined": [ undef |
        ret new SourceNode null null "source.al" "undefined"
    ]

    "boolean": [ boolVal |
        ret new SourceNode null null "source.al" (String boolVal)
    ]

    "statement-list": [ statements |
        output = interleave (_.map statements compile) ";\n" true
        ret new SourceNode null null "source.al" output
        
    ]

    assignment: [ assign |
        modifier = assign.modifier
        left = compile assign.left
        right = compile assign.right

        ret if (modifier == null or modifier == "mutable") [
            ret new SourceNode null null "source.al" {
                "var "
                left
                " = "
                right
            }
        ] (modifier == "mutate") [
            ret new SourceNode null null "source.al" {
                left
                " = "
                right
            }
        ] else [
            throw new Error ("Invalid assignment modifier: " + modifier)
        ]
    ]

    "lambda-args": [ args |
        output = interleave (_.map args compile) ", "
        ret new SourceNode null null "source.al" output
    ]

    lambda: [ lambda |
        args = lambda.arguments
        statements = lambda.statements
        mutable result = new SourceNode null null "source.al"

        result.add "(function("
        result.add (compile@("lambda-args") args)
        result.add ") {\n"
        result.add (compile@("statement-list") statements)
        result.add "})"

        ret result
    ]

    "unit-list": [ unitList |
        // If we got here, we're a function call, since
        // unit-lists as lambda parameters get code-gen'd in `lambda`
        result = new SourceNode null null "source.al"

        result.add (compile (_.first unitList.units))

        result.add "("

        params = _.rest unitList.units
        _.each params [ unit i |
            result.add (compile unit)
            if (i + 1 != params.length) [
                result.add ", "
            ]
        ]

        result.add ")"

        ret result
    ]

    "keyword-function": [ keyword |
        ret new SourceNode null null "source.al" {
            keyword.name
            " "
            (compile keyword.value)
        }
    ]

    "table-access": [ tableAccess |
        ret if ((typeof tableAccess.key) == "string" and
                (IDENTIFIER_REGEX.test tableAccess.key)) [
            ret new SourceNode null null "source.al" {
                compile tableAccess.table
                "."
                tableAccess.key
            }
        ] else [
            ret new SourceNode null null "source.al" {
                compile tableAccess.table
                "["
                compile tableAccess.key
                "]"
            }
        ]
    ]

    "operation": [ comp |
        left = new SourceNode null null "source.al" (compile comp.left)
        right = new SourceNode null null "source.al" (compile comp.right)

        op = if (comp.operation == "==") [
            ret "==="
        ] (comp.operation == "!=") [
            ret "!=="
        ] else [
            ret comp.operation
        ]

        ret new SourceNode null null "source.al" {
            "("
            // TODO(jack) we'll need to use something other than null here so
            // that we can use a null literal for compile time macros
            (if left [left] else [""])
            " "
            op
            " "
            (if right [right] else [""])
            ")"
        }
    ]

    "variable": [ variable |
        ret new SourceNode null null "source.al" variable.name
    ]

    "javascript": [ js |
        ret new SourceNode null null "source.al" js.source
    ]

    regex: [ regexNode |
        ret new SourceNode null null "source.al" regexNode.string
    ]
}

compileWithPreamble = [ fileNode |
    ret new SourceNode null null "source.al" {
        getPreamble()
        "\n"
        (compile@("statement-list") fileNode)
    }
]

mutate module.exports = compileWithPreamble
