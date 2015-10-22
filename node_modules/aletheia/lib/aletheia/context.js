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

var console = global.console;
var assert = require("assert");
var _ = require("underscore");
var DEBUG_CONTEXT = false;
var MAGIC = {
self: true,
this: true,
_it: true
};
var Context = (function(parentContext) {
this.parent = parentContext;
this.getExprType = this.parent.getExprType;
this.scope = Object.create(parentContext.scope);
delete(this.scope.x);
});
_.extend(Context.prototype, {
get: (function(varname) {
return this.scope[varname];
}),
has: (function(varname) {
assert(_.isString(varname), ("passed a non string to Context.has: " + varname));
return (this.get(varname) !== undefined);
}),
get_modifier: (function(varname) {
var vardata = this.get(varname);
return _if(vardata, (function(_it) {
return vardata.modifier;
}), _else, (function(_it) {
return "undeclared";
}));
}),
get_type: (function(varname) {
var self = this;
assert(_.isString(varname), ("varname is not a string: " + varname));
var vardata = this.get(varname);
var thisref = this;
var res = _if(! vardata, (function(_it) {
console.warn((("ALC INTERNAL-ERR: Variable `" + varname) + "` has not been declared."));
throw new Error("internal");
return ["undeclared"];
}), _else, (function(_it) {
return _if(vardata.exprtype, (function(_it) {
_if(DEBUG_CONTEXT, (function(_it) {
console.log("cached type", varname, vardata.exprtype);
}));
return _if((vardata.exprtype === "::TRAVERSING::"), (function(_it) {
return "?";
}), _else, (function(_it) {
return vardata.exprtype;
}));
}), _else, (function(_it) {
vardata.exprtype = "::TRAVERSING::";
var exprtype = self.getExprType(vardata.value, thisref);
assert(((exprtype === "?") || (typeof(exprtype) === "object")), (((("exprtype was not a valid expression type. instead, " + "found ") + JSON.stringify(exprtype)) + ";; for type ") + JSON.stringify(vardata.value)));
vardata.exprtype = exprtype;
_if(DEBUG_CONTEXT, (function(_it) {
console.log("inferred", varname, exprtype);
}));
return exprtype;
}));
}));
assert((res !== undefined), (("vardata error for `" + varname) + "`"));
return res;
}),
may_declare: (function(varname) {
_if(DEBUG_CONTEXT, (function(_it) {
console.log("may_declare", varname, this.get(varname), (this.get(varname) === undefined));
}));
return (this.get(varname) === undefined);
}),
may_be_param: (function(varname) {
return ((this.may_declare(varname) || MAGIC[varname]) === true);
}),
may_mutate: (function(varname) {
return (this.get_modifier(varname) === "mutable");
}),
declare: (function(modifier, varname, exprtype, value) {
var actual_modifier = _if(! modifier, (function(_it) {
return "const";
}), _else, (function(_it) {
return modifier;
}));
assert(actual_modifier);
assert(varname);
this.scope[varname] = {
modifier: actual_modifier,
exprtype: exprtype,
value: value,
context: this
};
}),
pushScope: (function(_it) {
return new Context(this);
}),
popScope: (function(_it) {
return this.parent;
})
});
module.exports = Context;
