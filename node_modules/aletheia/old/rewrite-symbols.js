var _ = require("underscore");
var SyntaxTree = require("./syntax-tree.js");
var SyntaxNode = SyntaxTree.SyntaxNode;

var translateSymbols = {
    if: '_if',
    else: '_else',
    while: '_while',
    for: '_for',
    return: '__return_is_reserved_use_ret'  // reserved for future use
};

var translateOperations = {
    and: '&&',
    or: '||'
};

var translateKeywordFunctions = {
    ret: "return",
    new: "new",
    not: "!"
};

var mapObject = function(obj, func) {
    var result = {};
    _.each(obj, function(value, key) {
        result[key] = func(value);
    });
    return result;
};

var rewrite = function(node) {
    if (_.isArray(node)) {
        return _.map(node, rewrite);
    } else if (node instanceof SyntaxNode) {
        return rewrite[node.type](node);
    } else if (rewrite[typeof node]) {
        return rewrite[typeof node](node);
    } else {
        return node;
    }
};

_.extend(rewrite, {
    object: function(obj) {
        if (obj == null) {
            return null;
        }
        return mapObject(obj, rewrite);
    },

    variable: function(variable) {
        var optTranslate = translateSymbols[variable.name];
        var name = optTranslate ? optTranslate : variable.name;
        return new SyntaxNode({
            type: "variable",
            name: name
        });
    },

    assignment: function(assign) {
        return new SyntaxNode({
            type: "assignment",
            modifier: assign.modifier,
            left: rewrite(assign.left),
            right: rewrite(assign.right)
        });
    },

    lambda: function(lambda) {
        return new SyntaxNode({
            type: "lambda",
            arguments: _.map(lambda.arguments, rewrite),
            statements: _.map(lambda.statements, rewrite)
        });
    },

    "table-access": function(tableAccess) {
        return new SyntaxNode({
            type: "table-access",
            table: rewrite(tableAccess.table),
            key: rewrite(tableAccess.key)
        });
    },

    "unit-list": function(unitList) {
        var units = unitList.units;
        var func = _.first(units);
        // pull out keywords that act like functions, such as "ret/return",
        // "new", "not"
        if (func.type === 'variable' && translateKeywordFunctions[func.name]) {
            var value;
            if (units.length === 2) {
                value = units[1];
            } else {
                value = new SyntaxNode({
                    type: "unit-list",
                    units: _.rest(units)
                });
            }
            return new SyntaxNode({
                type: "keyword-function",
                name: translateKeywordFunctions[func.name],
                value: rewrite(value)
            });
        }
        return new SyntaxNode({
            type: "unit-list",
            units: _.map(unitList.units, rewrite)
        });
    },

    "operation": function(comp) {
        var op = translateOperations[comp.operation] || comp.operation;
        return new SyntaxNode({
            type: "operation",
            left: rewrite(comp.left),
            operation: op,
            right: rewrite(comp.right)
        });
    },

    "javascript": function(js) {
        return js;
    }
});

module.exports = rewrite;
