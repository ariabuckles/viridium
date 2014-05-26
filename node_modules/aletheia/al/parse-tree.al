assert = require "assert"
_ = require "underscore"

strings = require "./strings"

is_instance = [a A | ret ```a instanceof A```]

ParseNode = [ options |
    self = this
    res = if (not (is_instance self ParseNode)) [
        ret new ParseNode options
    ] else [
        assert (options.type != null)
        _.extend self options
        ret self
    ]
    ret res
]

ParseTree = {
    ParseNode: ParseNode
    String: [ escapedStr | strings.unescape escapedStr ]

    Regex: [ str |
        ret new ParseNode {
            type: "regex"
            string: str
        }
    ]

    StatementList: [ statements |
        ret new ParseNode {
            type: "statement-list"
            statements: statements
        }
    ]

    Declaration: [ left right |
        ret new ParseNode {
            type: "assignment"
            modifier: null
            left: left
            right: right
        }
    ]

    Assignment: [ leftUnitList right |
        units = leftUnitList.units
        if (units.length != 2) [
            throw new Error (
                "Variable assignment may have a single " +
                "modifier; got " +
                (JSON.stringify leftUnitList)
            )
        ]
        if ((units@0).type != "variable") [
            throw new Error (
                "Variable assignment may only have a word identifier"
            )
        ]
        ret new ParseNode {
            type: "assignment"
            modifier: (units@0).name
            left: units@1
            right: right
        }
    ]

    Lambda: [ args statements |
        ret new ParseNode {
            type: "lambda"
            arguments: args
            statements: statements
        }
    ]

    RetLambda: [ args expr |
        ret new ParseNode {
            type: "ret-lambda"
            arguments: args
            expression: expr
        }
    ]

    UnitList: [ units |
        ret new ParseNode {
            type: "unit-list"
            units: units
        }
    ]

    Table: [ fields forceObject |
        ret new ParseNode {
            type: "table"
            fields: fields
            forceObject: forceObject
        }
    ]

    Field: [ key value |
        ret new ParseNode {
            type: "field"
            key: key
            value: value
        }
    ]

    TableAccess: [ table key |
        ret new ParseNode {
            type: "table-access"
            table: table
            key: key
        }
    ]

    Operation: [ left op right |
        ret new ParseNode {
            type: "operation"
            left: left
            operation: op
            right: right
        }
    ]

    Variable: [ name |
        ret new ParseNode {
            type: "variable"
            name: name
        }
    ]

    Javascript: [ source |
        ret new ParseNode {
            type: "javascript"
            source: source
        }
    ]
}

mutate module.exports = ParseTree

