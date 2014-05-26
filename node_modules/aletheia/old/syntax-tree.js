var assert = require("assert");
var _ = require("underscore");

var SyntaxNode = function(options) {
    if (!(this instanceof SyntaxNode)) {
        return new SyntaxNode(options);
    }
    assert(options.type != null);
    _.extend(this, options);
};

var SyntaxTree = {
    SyntaxNode: SyntaxNode,

    StatementList: function(statements) {
        return new SyntaxNode({
            type: "statement-list",
            statements: statements
        });
    },

    Assignment: function(modifier, left, right) {
        return new SyntaxNode({
            type: "assignment",
            modifier: modifier,
            left: left,
            right: right
        });
    },

    Lambda: function(args, stmts) {
        return new SyntaxNode({
            type: "lambda",
            arguments: args,
            statements: statements
        });
    },

    UnitList: function(units) {
        return new SyntaxNode({
            type: "unit-list",
            units: units
        });
    },

    Table: function(fields) {
        return new SyntaxNode({
            type: "table",
            fields: fields
        });
    },

    Field: function(key, value) {
        return new SyntaxNode({
            type: "field",
            key: key,
            value: value
        });
    },

    TableAccess: function(table, key) {
        return new SyntaxNode({
            type: "table-access",
            table: table,
            key: key
        });
    }
};

module.exports = SyntaxTree;
