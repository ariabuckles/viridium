var _else = {identifier: 'else'};
var _if = function(cond1, lambda1, cond2, lambda2) {
    if (arguments.length % 2 !== 0) {
        throw new Error('if called with an odd number of arguments');
    }
    var i = 0;
    for (var i = 0; i < arguments.length; i += 2) {
        var condition = arguments[i];
        if (condition != null && condition !== false) {
            return arguments[i + 1].call(undefined);
        }
    }
};

var _while = function(conditionLambda, bodyLambda) {
    while (conditionLambda.call(undefined)) {
        bodyLambda.call(undefined);
    }
}

var assert = require("assert");
var _ = require("underscore");
var ParseTree = require("./parse-tree.js");
var SyntaxTree = require("./syntax-tree.js");
var ParseNode = ParseTree.ParseNode;
var SyntaxNode = SyntaxTree.SyntaxNode;
var is_instance = (function(a, A) {
return a instanceof A;
});
var isConstant = (function(parsed) {
return (! _.isArray(parsed) && ! is_instance(parsed, ParseNode));
});
var mapObject = (function(obj, func) {
var result = {

};
_.each(obj, (function(value, key) {
result[key] = func(value);
}));
return result;
});
var syntaxWithSameFields = (function(parse) {
return SyntaxNode(mapObject(parse, desugar));
});
var desugar = (function(node) {
return _if(_.isArray(node), (function(_it) {
return _.map(node, desugar);
}), is_instance(node, ParseNode), (function(_it) {
return desugar[node.type](node);
}), desugar[typeof(node)], (function(_it) {
return desugar[typeof(node)](node);
}), _else, (function(_it) {
return node;
}));
});
_.extend(desugar, {
assignment: syntaxWithSameFields,
lambda: syntaxWithSameFields,
"unit-list": syntaxWithSameFields,
"table-access": syntaxWithSameFields,
field: syntaxWithSameFields,
operation: syntaxWithSameFields,
variable: syntaxWithSameFields,
javascript: syntaxWithSameFields,
regex: syntaxWithSameFields,
"ret-lambda": (function(retlambda) {
var args = desugar(retlambda.arguments);
var expr = retlambda.expression;
var statement = _if((((expr.type === "unit-list") && (expr.units[0].type === "variable")) && (expr.units[0].name === "ret")), (function(_it) {
return desugar(expr);
}), _else, (function(_it) {
return SyntaxNode({
type: "unit-list",
units: [SyntaxNode({
type: "variable",
name: "ret"
}),
desugar(expr)]
});
}));
return SyntaxNode({
type: "lambda",
arguments: args,
statements: [statement]
});
}),
arrow: (function(arrowNode) {
var left = arrowNode.left;
var right = arrowNode.right;
assert((right.type === "unit-list"));
var units = [_.first(right.units),
left].concat(_.rest(right.units));
return SyntaxNode({
type: "unit-list",
units: _.map(units, desugar)
});
}),
table: (function(table) {
var fields = table.fields;
var forceObject = table.forceObject;
var isStrictArray = (! forceObject && _.all(fields, (function(field) {
return ((field.key === null) || (field.key === undefined));
})));
var isStrictObject = _.all(fields, (function(field) {
return (((field.key !== null) && (field.key !== undefined)) && isConstant(field.key));
}));
return _if(isStrictArray, (function(_it) {
return SyntaxNode({
type: "array",
value: _.map(fields, (function(field) {
return desugar(field.value);
}))
});
}), isStrictObject, (function(_it) {
var value = {

};
_.each(fields, (function(field) {
value[field.key] = desugar(field.value);
}));
return SyntaxNode({
type: "object",
value: value
});
}), _else, (function(_it) {
var keyedFields = _.where(fields, (function(field) {
return ((field.key !== null) && (field.key !== undefined));
}));
var unkeyedFields = _.where(fields, (function(field) {
return ((field.key === null) || (field.key === undefined));
}));
var array = [];
var extensions = {

};
_.each(keyedFields, (function(field) {
_if((typeof(field.key) === "number"), (function(_it) {
array[field.key] = desugar(field.value);
}), _else, (function(_it) {
extensions[field.key] = desugar(field.value);
}));
}));
var next_index = 0;
_.each(unkeyedFields, (function(field) {
_while((function(_it) {
return _.has(array, next_index);
}), (function(_it) {
next_index = (next_index + 1);
}));
array[next_index] = field.value;
}));
return SyntaxNode({
type: "extended-array",
array: array,
extensions: extensions
});
}));
})
});
module.exports = desugar;
