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

var vm = require("vm");
var node_repl = require("repl");
var _ = require("underscore");
var compile = require("./compile");
var _try = (function(tryblock, catchblock) {
try { catchblock; } catch (err) { catchblock(err); };
});
var repl_settings = {
prompt: "aletheia> ",
eval: (function(rawinput, context, filename, callback) {
var input = rawinput.replace(/^\(([\s\S]*)\n\)$/m, "$1");
var gen = compile(input);
var js = gen.toString();
_try((function(_it) {
var result = _if((context === global), (function(_it) {
return vm.runInThisContext(js, filename);
}), _else, (function(_it) {
return vm.runInContext(js, context, filename);
}));
callback(null, result);
}), (function(err) {
callback(err);
}));
})
};
var start = (function(options) {
var merged_options = _.extend(repl_settings, options);
var repl = node_repl.start(merged_options);
repl.on("exit", (function(_it) {
return repl.outputStream.write("\n");
}));
return repl;
});
module.exports = {
start: start
};
