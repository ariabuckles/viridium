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
var mapObject = (function(obj, func) {
var result = {

};
_.each(obj, (function(value, key) {
result[key] = func(value);
}));
return result;
});
var primitivize = (function(parsed) {
var res = _if(_.isArray(parsed), (function(_it) {
return _.map(parsed, primitivize);
}), is_instance(parsed, SyntaxNode), (function(_it) {
var type = parsed.type;
return primitivize[type](parsed);
}), _else, (function(_it) {
return parsed;
}));
return res;
});
var passThrough = (function(parse) {
return SyntaxNode(mapObject(parse, primitivize));
});
_.extend(primitivize, {
assignment: passThrough,
lambda: passThrough,
"unit-list": passThrough,
"table-access": passThrough,
field: passThrough,
operation: passThrough,
variable: passThrough,
javascript: passThrough,
regex: passThrough,
array: (function(array) {
return _.map(array.value, primitivize);
}),
object: (function(obj) {
return mapObject(obj.value, primitivize);
}),
"extended-array": (function(table) {
return _.extend(table.array, table.extensions);
})
});
module.exports = primitivize;
