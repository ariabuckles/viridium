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

var unescape = (function(escapedStr) {
var jsonStr = _if((escapedStr[0] === "'"), (function() {
return (("\"" + escapedStr.replace(/"/g, "\\\"").slice(1, -1)) + "\"");
}), _else, (function() {
return escapedStr;
}));
return JSON.parse(jsonStr);
});
var escape = (function(unescapedStr) {
return JSON.stringify(unescapedStr);
});
module.exports = {
unescape: unescape,
escape: escape
};
