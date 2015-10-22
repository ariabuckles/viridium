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
var is_instance = (function(a, A) {
return a instanceof A;
});
var SyntaxNode = (function(options) {
var self = this;
return _if(! is_instance(self, SyntaxNode), (function() {
return new SyntaxNode(options);
}), _else, (function() {
assert((options.type !== null));
_.extend(self, options);
return self;
}));
});
var SyntaxTree = {
SyntaxNode: SyntaxNode,
StatementList: (function(statements) {
return new SyntaxNode({
type: "statement-list",
statements: statements
});
}),
Assignment: (function(modifier, left, right) {
return new SyntaxNode({
type: "assignment",
modifier: modifier,
left: left,
right: right
});
}),
Lambda: (function(args, stmts) {
return new SyntaxNode({
type: "lambda",
arguments: args,
statements: statements
});
}),
UnitList: (function(units) {
return new SyntaxNode({
type: "unit-list",
units: units
});
}),
Table: (function(fields) {
return new SyntaxNode({
type: "table",
fields: fields
});
}),
Field: (function(key, value) {
return new SyntaxNode({
type: "field",
key: key,
value: value
});
}),
TableAccess: (function(table, key) {
return new SyntaxNode({
type: "table-access",
table: table,
key: key
});
})
};
module.exports = SyntaxTree;
