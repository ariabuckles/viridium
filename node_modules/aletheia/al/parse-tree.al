assert = require "assert"
_ = require "underscore"

strings = require "./strings"

is_instance = [a A | ret ```a instanceof A```]

JSON = global.JSON

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

    Declaration: [ left right loc |
        ret new ParseNode {
            type: "assignment"
            modifier: null
            left: left
            right: right
            loc: loc
        }
    ]

    Assignment: [ leftUnitList right loc |
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
                "Variable assignment may only have a word identifier. " +
                "Found `" + (units@0.type) + "`."
            )
        ]
        ret new ParseNode {
            type: "assignment"
            modifier: (units@0).name
            left: units@1
            right: right
            loc: loc
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

    ArrowApplication: [ leftArg rightUnitList |
        ret new ParseNode {
            type: "arrow"
            left: leftArg
            right: rightUnitList
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

    TableAccess: [ table key loc |
        ret new ParseNode {
            type: "table-access"
            table: table
            key: key
            loc: loc
        }
    ]

    Operation: [ left op right loc |
        ret new ParseNode {
            type: "operation"
            left: left
            operation: op
            right: right
            loc: loc
        }
    ]

    Variable: [ name type loc |
        assert (type != undefined)
        ret new ParseNode {
            type: "variable"
            name: name
            vartype: type
            loc: loc
        }
    ]

    Javascript: [ source loc |
        ret new ParseNode {
            type: "javascript"
            source: source
            loc: loc
        }
    ]
}

mutate module.exports = ParseTree

