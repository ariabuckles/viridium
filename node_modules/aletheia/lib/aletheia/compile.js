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
var parser = require("./parser.js");
var desugar = require("./desugar.js");
var primitivize = require("./primitivize.js");
var error_check = require("./error-check.js");
var rewrite = require("./rewrite-symbols.js");
var codegen = require("./code-gen.js");
var compile = (function(source, external_vars) {
var parseTree = parser.parse(source);
var ast = desugar(parseTree);
var prim = primitivize(ast);
error_check(prim, external_vars);
var rewritten = rewrite(prim);
var gen = codegen(rewritten);
return gen;
});
module.exports = compile;
