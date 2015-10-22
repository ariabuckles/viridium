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
var parser = require("./parser.js");
var desugar = require("./desugar.js");
var primitivize = require("./primitivize.js");
var rewrite = require("./rewrite-symbols.js");
var compile = require("./code-gen.js");
var exec = (function(source, context) {
var source_str = _if(_.isArray(source), (function() {
return source.join("\n");
}), _else, (function() {
return source;
}));
var parseTree = parser.parse(source_str);
var ast = desugar(parseTree);
var primitivized = primitivize(ast);
var rewritten = rewrite(primitivized);
var gen = compile(rewritten);
var js = gen.toString();
var prelude = _.map(context, (function(value, key) {
return (((("var " + key) + " = context.") + key) + ";\n");
})).join("");
var jsFunc = new Function("context", (prelude + js));
jsFunc(context);
});
describe("aletheia-in-aletheia", (function() {
describe("function calls", (function() {
it("should execute a zero-arg call", (function() {
var called = undefined;
var callback = (function() {
called = true;
});
var prgm = ["callback()"];
exec(prgm, {
callback: callback
});
assert(called);
}));
}));
describe("inline javascript", (function() {
it("should be able to be used as a statement", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["```callback(5)```"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 5);
}));
it("should be able to be used in an expression", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["callback ```3 + 3```"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 6);
}));
}));
describe("comments", (function() {
it("should ignore comments in parsing", (function() {
var prgm = ["// our first program!",
"a = 5",
"b = a + a  // or something",
"a = b"];
exec(prgm, {

});
}));
}));
describe("regexes", (function() {
it("should parse a simple regex", (function() {
var prgm = ["callback /hi/"];
var nop = (function(it) {
return it;
});
exec(prgm, {
callback: nop
});
}));
it("should parse regexes with modifiers", (function() {
var prgm = ["callback /hi/g /hi/i /hi/m"];
var nop = (function(it) {
return it;
});
exec(prgm, {
callback: nop
});
}));
it("should parse regexes with modifiers", (function() {
var prgm = ["callback /hi/mig"];
var nop = (function(it) {
return it;
});
exec(prgm, {
callback: nop
});
}));
it("should test a simple regex", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["callback (/hi/.test '-hi-')"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, true);
}));
}));
describe("newlines", (function() {
it("should allow multi-line statement continuation inside parens", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["(callback",
"    true)"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, true);
}));
}));
}));
