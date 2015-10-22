var assert = require("assert");
var _ = require("underscore");

var ParseNode = function(options) {
    if (!(this instanceof ParseNode)) {
        return new ParseNode(options);
    }
    assert(options.type != null);
    _.extend(this, options);
};

var ParseTree = {
    ParseNode: ParseNode,

    StatementList: function(statements) {
        return new ParseNode({
            type: "statement-list",
            statements: statements
        });
    },

    Declaration: function(left, right) {
        return new ParseNode({
            type: "assignment",
            modifier: null,
            left: left,
            right: right
        });
    },

    Assignment: function(leftUnitList, right) {
        units = leftUnitList.units;
        if (units.length !== 2) {
            throw new Error("Variable assignment may have a single " +
                "modifier; got " + JSON.stringify(leftUnitList));
        }
        if (units[0].type !== "variable") {
            throw new Error("Variable assignment may only have a word identifier");
        }
        return new ParseNode({
            type: "assignment",
            modifier: units[0].name,
            left: units[1],
            right: right
        });
    },

    Lambda: function(args, statements) {
        return new ParseNode({
            type: "lambda",
            arguments: args,
            statements: statements
        });
    },

    UnitList: function(units) {
        return new ParseNode({
            type: "unit-list",
            units: units
        });
    },

    Table: function(fields, forceObject) {
        return new ParseNode({
            type: "table",
            fields: fields,
            forceObject: forceObject
        });
    },

    Field: function(key, value) {
        return new ParseNode({
            type: "field",
            key: key,
            value: value
        });
    },

    TableAccess: function(table, key) {
        return new ParseNode({
            type: "table-access",
            table: table,
            key: key
        });
    },

    Operation: function(left, op, right) {
        return new ParseNode({
            type: "operation",
            left: left,
            operation: op,
            right: right
        });
    },

    Variable: function(name) {
        return new ParseNode({
            type: "variable",
            name: name
        });
    },

    Javascript: function(source) {
        return new ParseNode({
            type: "javascript",
            source: source
        });
    }
};

module.exports = ParseTree;
