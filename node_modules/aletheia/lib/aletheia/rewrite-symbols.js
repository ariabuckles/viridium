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

var _ = require("underscore");
var SyntaxTree = require("./syntax-tree.js");
var SyntaxNode = SyntaxTree.SyntaxNode;
var is_instance = (function(a, A) {
return a instanceof A;
});
var translateSymbols = {
if: "_if",
else: "_else",
while: "_while",
for: "_for",
return: "__ret_is_reserved_use_ret"
};
var translateOperations = {
and: "&&",
or: "||"
};
var translateKeywordFunctions = {
ret: "return",
new: "new",
throw: "throw",
not: "!"
};
var mapObject = (function(obj, func) {
var result = {

};
_.each(obj, (function(value, key) {
result[key] = func(value);
}));
return result;
});
var rewrite = (function(node) {
return _if(_.isArray(node), (function(_it) {
return _.map(node, rewrite);
}), is_instance(node, SyntaxNode), (function(_it) {
return rewrite[node.type](node);
}), rewrite[typeof(node)], (function(_it) {
return rewrite[typeof(node)](node);
}), _else, (function(_it) {
return node;
}));
});
_.extend(rewrite, {
object: (function(obj) {
return _if((obj === null), (function(_it) {
return null;
}), _else, (function(_it) {
return mapObject(obj, rewrite);
}));
}),
variable: (function(variable) {
var optTranslate = translateSymbols[variable.name];
var name = _if(optTranslate, (function(_it) {
return optTranslate;
}), _else, (function(_it) {
return variable.name;
}));
return new SyntaxNode({
type: "variable",
name: name
});
}),
assignment: (function(assign) {
return new SyntaxNode({
type: "assignment",
modifier: assign.modifier,
left: rewrite(assign.left),
right: rewrite(assign.right)
});
}),
lambda: (function(lambda) {
return new SyntaxNode({
type: "lambda",
arguments: _.map(lambda.arguments, rewrite),
statements: _.map(lambda.statements, rewrite)
});
}),
"table-access": (function(tableAccess) {
return new SyntaxNode({
type: "table-access",
table: rewrite(tableAccess.table),
key: rewrite(tableAccess.key)
});
}),
"unit-list": (function(unitList) {
var units = unitList.units;
var func = _.first(units);
return _if(((func.type === "variable") && translateKeywordFunctions[func.name]), (function(_it) {
var value = _if((units.length === 2), (function(_it) {
return units[1];
}), _else, (function(_it) {
return new SyntaxNode({
type: "unit-list",
units: _.rest(units)
});
}));
return new SyntaxNode({
type: "keyword-function",
name: translateKeywordFunctions[func.name],
value: rewrite(value)
});
}), _else, (function(_it) {
return new SyntaxNode({
type: "unit-list",
units: _.map(unitList.units, rewrite)
});
}));
}),
operation: (function(comp) {
var op = (translateOperations[comp.operation] || comp.operation);
return new SyntaxNode({
type: "operation",
left: rewrite(comp.left),
operation: op,
right: rewrite(comp.right)
});
}),
javascript: (function(js) {
return js;
}),
regex: (function(regexNode) {
return regexNode;
})
});
module.exports = rewrite;
