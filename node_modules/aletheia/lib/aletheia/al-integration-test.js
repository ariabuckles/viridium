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

var describe = global.describe;
var it = global.it;
var assert = require("assert");
var _ = require("underscore");
var exec = require("./exec-for-testing");
describe("aletheia-in-aletheia", (function() {
describe("function calls", (function() {
it("should execute a zero-arg call", (function() {
var called = undefined;
var callback = (function(_it) {
called = true;
});
var prgm = ["callback()"];
exec(prgm, {
callback: callback
});
assert(called);
}));
}));
describe("function definitions", (function() {
it("should work for a single param function", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["f = [ a | a + 1 ]",
"callback (f 2)"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 3);
}));
it("should have an implicit `_it` param if none are declared", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["f = [ _it + 1 ]",
"callback (f 2)"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 3);
}));
it("should have no parameters if explicitly declared as such", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["_it = 0",
"f = [ | _it + 1 ]",
"callback (f 2)"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 1);
}));
it("should work with a table param", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["f = [ a | a.a ]",
"callback (f {a: 5})"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 5);
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
"mutable a = 5",
"b = a + a  // or something",
"mutate a = b"];
exec(prgm, {

});
}));
}));
describe("regexes", (function() {
it("should parse a simple regex", (function() {
var prgm = ["callback /hi/"];
var nop = (function(a) {
return a;
});
exec(prgm, {
callback: nop
});
}));
it("should parse regexes with modifiers", (function() {
var prgm = ["callback /hi/g /hi/i /hi/m"];
var nop = (function(a) {
return a;
});
exec(prgm, {
callback: nop
});
}));
it("should parse regexes with modifiers", (function() {
var prgm = ["callback /hi/mig"];
var nop = (function(a) {
return a;
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
describe("arrows", (function() {
it("should call a function with a single arg", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["42 -> callback"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 42);
}));
it("should call a function with two args", (function() {
var result1 = undefined;
var result2 = undefined;
var callback = (function(value1, value2) {
result1 = value1;
result2 = value2;
});
var prgm = ["42 -> callback 6"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result1, 42);
assert.strictEqual(result2, 6);
}));
it("should call two function with a single arg each", (function() {
var result = undefined;
var callback = (function(value) {
result = value;
});
var prgm = ["f = [x | x + 1]",
"42 -> f -> callback"];
exec(prgm, {
callback: callback
});
assert.strictEqual(result, 43);
}));
it("should call two function with a single arg each", (function() {
var result = [];
var callback = (function(value) {
result.push(value);
});
var prgm = ["mylist = {1, 2, 3}",
"mylist -> _.map [x | x + 1] -> _.map callback"];
exec(prgm, {
callback: callback,
_: _
});
assert.deepEqual(result, [2,
3,
4]);
}));
}));
}));
