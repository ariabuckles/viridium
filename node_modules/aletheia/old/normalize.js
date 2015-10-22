var _ = require("underscore");

var ParseTree = require("./parse-tree.js");
var SyntaxTree = require("./syntax-tree.js");

var ParseNode = ParseTree.ParseNode;
var SyntaxNode = SyntaxTree.SyntaxNode;

// Converts a parse tree to a syntax tree
var normalize; // forward-declaration

var isConstant = function(parsed) {
    return !_.isArray(parsed) && !(parsed instanceof ParseNode);
};

var mapObject = function(obj, func) {
    var result = {};
    _.each(obj, function(value, key) {
        result[key] = func(value);
    });
    return result;
};

var syntaxWithSameFields = function(parse) {
    return SyntaxNode(mapObject(parse, normalize));
};

// Converts an individual ParseNode to a SyntaxNode
var normalizationTable = {
    assignment: syntaxWithSameFields, // just take the same fields
    lambda: syntaxWithSameFields,
    "unit-list": syntaxWithSameFields,
    "table-access": syntaxWithSameFields,
    field: syntaxWithSameFields,
    operation: syntaxWithSameFields,
    variable: syntaxWithSameFields,
    javascript: syntaxWithSameFields,

    table: function(table) {
        var fields = table.fields;
        var forceObject = table.forceObject;

        // Array literals
        var isStrictArray = !forceObject && _.all(fields, function(field) {
            return field.key == null;
        });
        if (isStrictArray) {
            return _.pluck(fields, 'value');
        }

        // ObjectLiterals
        var isStrictObject = _.all(fields, function(field) {
            return field.key != null && isConstant(field.key);
        });
        if (isStrictObject) {
            var result = {};
            _.each(fields, function(field) {
                result[field.key] = normalize(field.value);
            });
            return result;
        }

        // else: dynamically keyed objects, or mixed array/object keys
        return SyntaxNode({
            type: "table",
            fields: normalize(fields)
        });
    }
};


// Converts a parse tree to a syntax tree
normalize = function(parsed) {
    if (_.isArray(parsed)) {
        // A generic list, process it as such
        return _.map(parsed, normalize);

    } else if (parsed instanceof ParseNode) {
        // A single node; dispatch to our normalization table of
        // functions
        var type = parsed.type;
        return normalizationTable[type](parsed);

    } else {
        // A compile-time constant.
        // Mostly, these are literals, like numbers or strings,
        // but it could also be a compile-time table
        return parsed;
    }
};

module.exports = normalize;

