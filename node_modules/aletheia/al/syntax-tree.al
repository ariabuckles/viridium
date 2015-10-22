assert = require "assert"
_ = require "underscore"

is_instance = [a A | ret ```a instanceof A```]

SyntaxNode = [ options |
    self = this
    ret if (not (is_instance self SyntaxNode)) [
        ret new SyntaxNode options
    ] else [
        assert (options.type != null)
        // for occasional debugging
        // mutate self.__ = "SyntaxNode"
        _.extend self options
        ret self
    ]
]

SyntaxTree = {
    SyntaxNode: SyntaxNode

    StatementList: [ statements |
        ret new SyntaxNode {
            type: "statement-list"
            statements: statements
        }
    ]

    Assignment: [ modifier left right |
        ret new SyntaxNode {
            type: "assignment"
            modifier: modifier
            left: left
            right: right
        }
    ]

    Lambda: [ args stmts |
        ret new SyntaxNode {
            type: "lambda"
            arguments: args
            statements: stmts
        }
    ]

    UnitList: [ units |
        ret new SyntaxNode {
            type: "unit-list"
            units: units
        }
    ]

    Table: [ fields |
        ret new SyntaxNode {
            type: "table"
            fields: fields
        }
    ]

    Field: [ key value |
        ret new SyntaxNode {
            type: "field"
            key: key
            value: value
        }
    ]

    TableAccess: [ table key |
        ret new SyntaxNode {
            type: "table-access"
            table: table
            key: key
        }
    ]
}

mutate module.exports = SyntaxTree
