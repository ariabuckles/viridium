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
var compile = require("./compile");
var exec = (function(source, context_) {
var source_str = _if(_.isArray(source), (function(_it) {
return source.join("\n");
}), _else, (function(_it) {
return source;
}));
var context = (context_ || {

});
var gen = compile(source_str, _.keys(context));
var js = gen.toString();
var prelude = _.map(_.keys(context), (function(key) {
return (((("var " + key) + " = context.") + key) + ";\n");
})).join("");
var jsFunc = new Function("context", (prelude + js));
jsFunc(context);
});
module.exports = exec;
