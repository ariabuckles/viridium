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
var SourceMap = require("source-map");
var SourceNode = SourceMap.SourceNode;
var SyntaxTree = require("./syntax-tree.js");
var SyntaxNode = SyntaxTree.SyntaxNode;
var strings = require("./strings");
var is_instance = (function(a, A) {
return a instanceof A;
});
var preambleStr = ["var _else = {identifier: 'else'};",
"var _if = function(cond1, lambda1, cond2, lambda2) {",
"    if (arguments.length % 2 !== 0) {",
"        throw new Error('if called with an odd number of arguments');",
"    }",
"    var i = 0;",
"    for (var i = 0; i < arguments.length; i += 2) {",
"        var condition = arguments[i];",
"        if (condition != null && condition !== false) {",
"            return arguments[i + 1].call(undefined);",
"        }",
"    }",
"};",
"",
"var _while = function(conditionLambda, bodyLambda) {",
"    while (conditionLambda.call(undefined)) {",
"        bodyLambda.call(undefined);",
"    }",
"}",
""].join("\n");
var getPreamble = (function() {
return new SourceNode(null, null, null, preambleStr);
});
var IDENTIFIER_REGEX = /^[_a-zA-Z0-9]+$/;
var interleave = (function(array, value, trailingValue) {
var result = [];
_.each(array, (function(elem, i) {
result.push(elem);
_if((((i + 1) !== array.length) || trailingValue), (function() {
result.push(value);
}));
}));
return result;
});
var compile = (function(node) {
var res = _if(is_instance(node, SyntaxNode), (function() {
return compile[node.type](node);
}), _else, (function() {
return compile[typeof(node)](node);
}));
return res;
});
_.extend(compile, {
number: (function(num) {
return new SourceNode(null, null, "source.al", String(num));
}),
string: (function(str) {
return new SourceNode(null, null, "source.al", strings.escape(str));
}),
object: (function(obj) {
return _if((obj === null), (function() {
return new SourceNode(null, null, "source.al", "null");
}), _.isArray(obj), (function() {
var fields = _.map(obj, compile);
return new SourceNode(null, null, "source.al", _.flatten(["[",
interleave(fields, ",\n", false),
"]"]));
}), _else, (function() {
var fields = _.map(obj, (function(value, key) {
var result = [compile["table-key"](key),
": ",
compile(value)];
return result;
}));
return new SourceNode(null, null, "source.al", _.flatten(["{\n",
interleave(fields, ",\n", false),
"\n}"]));
}));
}),
"table-key": (function(key) {
return _if(IDENTIFIER_REGEX.test(key), (function() {
return key;
}), _else, (function() {
return strings.escape(key);
}));
}),
undefined: (function(undef) {
return new SourceNode(null, null, "source.al", "undefined");
}),
boolean: (function(boolVal) {
return new SourceNode(null, null, "source.al", String(boolVal));
}),
"statement-list": (function(statements) {
var output = interleave(_.map(statements, compile), ";\n", true);
return new SourceNode(null, null, "source.al", output);
}),
assignment: (function(assign) {
var modifier = assign.modifier;
var left = compile(assign.left);
var right = compile(assign.right);
return _if(((modifier === null) || (modifier === "mutable")), (function() {
return new SourceNode(null, null, "source.al", ["var ",
left,
" = ",
right]);
}), (modifier === "mutate"), (function() {
return new SourceNode(null, null, "source.al", [left,
" = ",
right]);
}), _else, (function() {
throw new Error(("Invalid assignment modifier: " + modifier));
}));
}),
"lambda-args": (function(args) {
var output = interleave(_.map(args, compile), ", ");
return new SourceNode(null, null, "source.al", output);
}),
lambda: (function(lambda) {
var args = lambda.arguments;
var statements = lambda.statements;
var result = new SourceNode(null, null, "source.al");
result.add("(function(");
result.add(compile["lambda-args"](args));
result.add(") {\n");
result.add(compile["statement-list"](statements));
result.add("})");
return result;
}),
"unit-list": (function(unitList) {
var result = new SourceNode(null, null, "source.al");
result.add(compile(_.first(unitList.units)));
result.add("(");
var params = _.rest(unitList.units);
_.each(params, (function(unit, i) {
result.add(compile(unit));
_if(((i + 1) !== params.length), (function() {
result.add(", ");
}));
}));
result.add(")");
return result;
}),
"keyword-function": (function(keyword) {
return new SourceNode(null, null, "source.al", [keyword.name,
" ",
compile(keyword.value)]);
}),
"table-access": (function(tableAccess) {
return _if(((typeof(tableAccess.key) === "string") && IDENTIFIER_REGEX.test(tableAccess.key)), (function() {
return new SourceNode(null, null, "source.al", [compile(tableAccess.table),
".",
tableAccess.key]);
}), _else, (function() {
return new SourceNode(null, null, "source.al", [compile(tableAccess.table),
"[",
compile(tableAccess.key),
"]"]);
}));
}),
operation: (function(comp) {
var left = new SourceNode(null, null, "source.al", compile(comp.left));
var right = new SourceNode(null, null, "source.al", compile(comp.right));
var op = _if((comp.operation === "=="), (function() {
return "===";
}), (comp.operation === "!="), (function() {
return "!==";
}), _else, (function() {
return comp.operation;
}));
return new SourceNode(null, null, "source.al", ["(",
_if(left, (function() {
return left;
}), _else, (function() {
return "";
})),
" ",
op,
" ",
_if(right, (function() {
return right;
}), _else, (function() {
return "";
})),
")"]);
}),
variable: (function(variable) {
return new SourceNode(null, null, "source.al", variable.name);
}),
javascript: (function(js) {
return new SourceNode(null, null, "source.al", js.source);
}),
regex: (function(regexNode) {
return new SourceNode(null, null, "source.al", regexNode.string);
})
});
var compileWithPreamble = (function(fileNode) {
return new SourceNode(null, null, "source.al", [getPreamble(),
"\n",
compile["statement-list"](fileNode)]);
});
module.exports = compileWithPreamble;
