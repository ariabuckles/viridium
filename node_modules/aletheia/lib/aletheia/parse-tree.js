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
var strings = require("./strings");
var is_instance = (function(a, A) {
return a instanceof A;
});
var JSON = global.JSON;
var ParseNode = (function(options) {
var self = this;
var res = _if(! is_instance(self, ParseNode), (function(_it) {
return new ParseNode(options);
}), _else, (function(_it) {
assert((options.type !== null));
_.extend(self, options);
return self;
}));
return res;
});
var ParseTree = {
ParseNode: ParseNode,
String: (function(escapedStr) {
return strings.unescape(escapedStr);
}),
Regex: (function(str) {
return new ParseNode({
type: "regex",
string: str
});
}),
StatementList: (function(statements) {
return new ParseNode({
type: "statement-list",
statements: statements
});
}),
Declaration: (function(left, right, loc) {
return new ParseNode({
type: "assignment",
modifier: null,
left: left,
right: right,
loc: loc
});
}),
Assignment: (function(leftUnitList, right, loc) {
var units = leftUnitList.units;
_if((units.length !== 2), (function(_it) {
throw new Error((("Variable assignment may have a single " + "modifier; got ") + JSON.stringify(leftUnitList)));
}));
_if((units[0].type !== "variable"), (function(_it) {
throw new Error(((("Variable assignment may only have a word identifier. " + "Found `") + units[0].type) + "`."));
}));
return new ParseNode({
type: "assignment",
modifier: units[0].name,
left: units[1],
right: right,
loc: loc
});
}),
Lambda: (function(args, statements) {
return new ParseNode({
type: "lambda",
arguments: args,
statements: statements
});
}),
RetLambda: (function(args, expr) {
return new ParseNode({
type: "ret-lambda",
arguments: args,
expression: expr
});
}),
UnitList: (function(units) {
return new ParseNode({
type: "unit-list",
units: units
});
}),
ArrowApplication: (function(leftArg, rightUnitList) {
return new ParseNode({
type: "arrow",
left: leftArg,
right: rightUnitList
});
}),
Table: (function(fields, forceObject) {
return new ParseNode({
type: "table",
fields: fields,
forceObject: forceObject
});
}),
Field: (function(key, value) {
return new ParseNode({
type: "field",
key: key,
value: value
});
}),
TableAccess: (function(table, key, loc) {
return new ParseNode({
type: "table-access",
table: table,
key: key,
loc: loc
});
}),
Operation: (function(left, op, right, loc) {
return new ParseNode({
type: "operation",
left: left,
operation: op,
right: right,
loc: loc
});
}),
Variable: (function(name, type, loc) {
assert((type !== undefined));
return new ParseNode({
type: "variable",
name: name,
vartype: type,
loc: loc
});
}),
Javascript: (function(source, loc) {
return new ParseNode({
type: "javascript",
source: source,
loc: loc
});
})
};
module.exports = ParseTree;
