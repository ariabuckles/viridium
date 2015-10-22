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

var DEBUG_TYPES = false;
var console = global.console;
var SyntaxError = global.SyntaxError;
var Math = global.Math;
var assert = require("assert");
var _ = require("underscore");
var SyntaxNode = require("./syntax-tree").SyntaxNode;
var Context = require("./context");
var is_instance = (function(a, A) {
return a instanceof A;
});
var JSON = global.JSON;
var mapObject = (function(obj, func) {
var result = {

};
_.each(obj, (function(value, key) {
result[key] = func(value);
}));
return result;
});
var at_loc = (function(loc) {
return _if((loc === undefined), (function(_it) {
return "at location unknown";
}), _else, (function(_it) {
var line = loc.first_line;
var column = (loc.first_column + 1);
return ((("at line " + line) + ", col ") + column);
}));
});
var KEYWORD_VARIABLES = {
ret: true,
new: true,
not: true,
undefined: true,
null: true,
throw: true,
this: true
};
var FunctionType = (function(argTypes, resultType) {
var self = this;
return _if(! is_instance(self, FunctionType), (function(_it) {
return new FunctionType(argTypes, resultType);
}), _else, (function(_it) {
assert(_.isArray(argTypes));
assert(resultType);
self.argTypes = argTypes;
self.resultType = resultType;
return self;
}));
});
var randLetter = (function() {
var letters = "abcdefghijklmnopqrstuvwxyz";
var index = Math.floor((Math.random() * letters.length));
return letters[index];
});
var randGenericName = (function(_it) {
return _.uniqueId(randLetter());
});
var Generic = (function() {
var self = this;
return _if(! is_instance(self, Generic), (function(_it) {
return new Generic();
}), _else, (function(_it) {
self.name = randGenericName();
return self;
}));
});
var ArrayType = [{
length: "number",
concat: "?",
every: "?",
filter: "?",
forEach: "?",
indexOf: "?",
join: "?",
lastIndexOf: "?",
map: "?",
pop: "?",
push: "?",
reduce: "?",
reduceRight: "?",
reverse: "?",
shift: "?",
slice: "?",
some: "?",
sort: "?",
splice: "?",
toLocaleString: "?",
toString: "?",
unshift: "?"
}];
var LambdaWithContext = (function(lambda, context) {
this.lambda = lambda;
this.context = context;
});
var union = (function(typeA, typeB) {
return _if(((typeA === "?") || (typeB === "?")), (function(_it) {
return "?";
}), _else, (function(_it) {
return _.union(typeA, typeB);
}));
});
var subtypein = (function(subtype, exprtype) {
return _.any(exprtype, (function(subexprtype) {
return _.isEqual(subexprtype, subtype);
}));
});
var matchtypes = (function(exprtype, vartype) {
return _if((vartype === undefined), (function(_it) {
assert(false, ((("adding an unspecified key to a var doesn't need to " + "check the assignment... (this is safe to remove, but ") + "if you hit it, your understanding of this code needs ") + "improvement."));
return true;
}), (exprtype === undefined), (function(_it) {
return false;
}), ((vartype === "?") || (exprtype === "?")), (function(_it) {
return true;
}), _.isArray(exprtype), (function(_it) {
return _.all(exprtype, (function(subexprtype) {
return matchtypes(subexprtype, vartype);
}));
}), _.isArray(vartype), (function(_it) {
return _.any(vartype, (function(subvartype) {
return matchtypes(exprtype, subvartype);
}));
}), is_instance(vartype, FunctionType), (function(_it) {
return _if(is_instance(exprtype, FunctionType), (function(_it) {
var argsMatch = _.all(vartype.argTypes, (function(varArgType, i) {
var exprArgType = exprtype.argTypes[i];
return ((exprArgType === undefined) || ((varArgType !== undefined) && matchtypes(exprArgType, varArgType)));
}));
var resultMatches = matchtypes(exprtype.resultType, vartype.resultType);
return (argsMatch && resultMatches);
}), _else, (function(_it) {
return false;
}));
}), _.isObject(vartype), (function(_it) {
var varIsArray = _.isEqual(vartype, ArrayType[0]);
var exprIsArray = _.isEqual(exprtype, ArrayType[0]);
return _if((varIsArray || exprIsArray), (function(_it) {
return (varIsArray && exprIsArray);
}), _else, (function(_it) {
return (_.isObject(exprtype) && _.all(_.keys(vartype), (function(key) {
return matchtypes(exprtype[key], vartype[key]);
})));
}));
}), _else, (function(_it) {
return _.isEqual(exprtype, vartype);
}));
});
var nop = (function(node) {
return null;
});
var enqueue_lambdas = (function(queue, lambda) {
_if(is_instance(lambda, LambdaWithContext), (function(_it) {
queue.push(lambda);
}), _.isArray(lambda), (function(_it) {
var rlambdas = _.clone(lambda);
rlambdas.reverse();
_.each(rlambdas, (function(each_lambda) {
enqueue_lambdas(queue, each_lambda);
}));
}), _else, (function(_it) {
throw new Error((("ALC-INTERNAL-ERROR: " + "a non-lambda was passed to enqueue_lambdas: ") + lambda));
}));
});
var check_statements = (function(stmts, context) {
var lambdas_with_contexts = _.filter(_.map(stmts, (function(stmt) {
return get_type(stmt, context)[1];
})), _.identity);
var queue = [];
enqueue_lambdas(queue, lambdas_with_contexts);
_while((function(_it) {
return (queue.length !== 0);
}), (function(_it) {
var lambda_with_context = queue.pop();
var lambda = lambda_with_context.lambda;
var lambda_context = lambda_with_context.context;
var new_lambdas = get_type(lambda, lambda_context)[1];
enqueue_lambdas(queue, new_lambdas);
}));
});
var get_type = (function(node, context) {
assert(is_instance(context, Context), ("Not a Context: " + context));
var res = _if(is_instance(node, SyntaxNode), (function(_it) {
return get_type[node.type](node, context);
}), _else, (function(_it) {
return get_type[typeof(node)](node, context);
}));
_if(DEBUG_TYPES, (function(_it) {
console.log("get_type", res, node);
}));
_if((res.length !== 2), (function(_it) {
console.log(res);
assert((res.length === 2), "get_type returned a non-array:");
}));
assert((res[0] !== undefined), ("could not find type of node: " + JSON.stringify(node)));
assert((res[1] !== undefined));
return res;
});
var concat = (function(lambdas1, lambdas2) {
assert((lambdas1 !== undefined));
return _if((lambdas1 === null), (function(_it) {
return lambdas2;
}), _.isArray(lambdas1), (function(_it) {
return lambdas1.concat((lambdas2 || []));
}), _else, (function(_it) {
return [lambdas1].concat((lambdas2 || []));
}));
});
_.extend(get_type, {
number: (function(_it) {
return [["number"],
[]];
}),
string: (function(_it) {
return [["string"],
[]];
}),
undefined: (function(_it) {
return [["undefined"],
[]];
}),
boolean: (function(_it) {
return [["boolean"],
[]];
}),
operation: (function(op, context) {
var left = op.left;
var right = op.right;
var leftType = get_type(op.left, context);
var rightType = get_type(op.right, context);
var type = union(leftType[0], rightType[0]);
var lambdas = concat(leftType[1], rightType[1]);
return [type,
lambdas];
}),
javascript: (function(_it) {
return ["?",
[]];
}),
regex: (function(_it) {
return ["?",
[]];
}),
"table-access": (function(table_access, context) {
var table_type_and_lambdas = get_type(table_access.table, context);
var table_type = table_type_and_lambdas[0];
assert(((table_type === "?") || ((table_type.length > 0) && (table_type[0] !== undefined))), ("bad type for table" + JSON.stringify(table_access.table)));
var lambdas = table_type_and_lambdas[1];
assert((lambdas !== undefined), "get_type.table did not return lambdas");
var key = table_access.key;
var res = _if((typeof(key) !== "string"), (function(_it) {
var typeAndLambdas = get_type(key, context);
return ["?",
concat(lambdas, typeAndLambdas[1])];
}), _else, (function(_it) {
return _if((table_type === "?"), (function(_it) {
return ["?",
lambdas];
}), (table_type.length > 1), (function(_it) {
return ["?",
lambdas];
}), (table_type.length === 0), (function(_it) {
return [[],
lambdas];
}), _else, (function(_it) {
var single_table_type = table_type[0];
var property_type = single_table_type[key];
assert((property_type !== undefined), ((((("table type not found for key: " + key) + ", in: ") + JSON.stringify(table_access.table)) + ";; of type: ") + JSON.stringify(table_type)));
return [property_type,
lambdas];
}));
}));
return res;
}),
"unit-list": (function(unitList, context) {
var units = unitList.units;
return _if(((units[0].type === "variable") && (units[0].name === "ret")), (function(_it) {
return get_type(units[1], context);
}), _else, (function(_it) {
var func = units[0];
var func_type = get_type(func, context)[0];
var lambdas = _.filter(_.map(units, (function(unit) {
return _if((unit.type === "lambda"), (function(_it) {
return new LambdaWithContext(unit, context);
}), _else, (function(_it) {
return get_type(unit, context)[1];
}));
})), _.identity);
var res = _if((func_type === "?"), (function(_it) {
return "?";
}), _.isArray(func_type), (function(_it) {
return _if((func_type.length === 0), (function(_it) {
console.warn((("ALC: INTERNAL: Calling an empty-set type: `" + JSON.stringify(func)) + "`."));
return "?";
}), (func_type.length > 1), (function(_it) {
return "?";
}), _else, (function(_it) {
assert((func_type[0] !== undefined));
assert(is_instance(func_type[0], FunctionType), ("function is not a FunctionType: " + JSON.stringify(func_type[0])));
var func_result_type = func_type[0].resultType;
assert((func_result_type !== undefined), ("no result defined for FunctionType: " + JSON.stringify(func_type[0])));
return func_result_type;
}));
}), _else, (function(_it) {
console.warn((("ALC: INTERNAL: Calling a non-function: `" + JSON.stringify(func_type)) + "`."));
return "?";
}));
assert((res !== undefined));
return [res,
lambdas];
}));
}),
variable: (function(variable, context) {
return _if((! KEYWORD_VARIABLES[variable.name] && ! context.has(variable.name)), (function(_it) {
throw new SyntaxError((((("ALC: Use of undeclared variable `" + variable.name) + "` ") + at_loc(variable.loc)) + "."));
}), _else, (function(_it) {
_if(DEBUG_TYPES, (function(_it) {
console.log("context.get_type", variable.name, context.has(variable.name));
}));
return [context.get_type(variable.name),
[]];
}));
}),
object: (function(obj, context) {
var lambdas_with_contexts = _.filter(_.map(obj, (function(value, key) {
return _if((value.type === "lambda"), (function(_it) {
return new LambdaWithContext(value, context);
}), _else, (function(_it) {
return get_type(value, context)[1];
}));
})), _.identity);
var typeObj = _if((obj === null), (function(_it) {
return ["null"];
}), _.isArray(obj), (function(_it) {
return ArrayType;
}), _else, (function(_it) {
return [mapObject(obj, (function(val) {
return get_type(val, context)[0];
}))];
}));
assert(lambdas_with_contexts, "get_type.object not returning lambdas_with_contexts");
return [typeObj,
lambdas_with_contexts];
}),
lambda: (function(lambda, context) {
var innercontext = context.pushScope();
var argTypes = _.map(lambda.arguments, (function(arg) {
assert((arg.type === "variable"));
return _if((arg.type !== "variable"), (function(_it) {
throw new SyntaxError((((("ALC: Param must be a valid variable name, " + "but got ") + arg.type) + ": ") + JSON.stringify(arg)));
}), _else, (function(_it) {
return _if(! innercontext.may_be_param(arg.name), (function(_it) {
throw new SyntaxError((((("ALC: Param shadowing `" + arg.name) + "`") + at_loc(arg.loc)) + " not permitted. Use `mutate` to mutate."));
}), _else, (function(_it) {
_if(DEBUG_TYPES, (function(_it) {
console.log("declaring arg", arg.name, "as '?'");
}));
var argtype = _if((arg.vartype !== null), (function(_it) {
return arg.vartype;
}), _else, (function(_it) {
return "?";
}));
innercontext.declare("const", arg.name, argtype);
return arg.vartype;
}));
}));
}));
var inner_lambdas_with_contexts = _.filter(_.map(lambda.statements, (function(stmt) {
return get_type(stmt, innercontext)[1];
})), _.identity);
var lastStatement = _.last(lambda.statements);
var resultType = _if((((lastStatement.type === "unit-list") && (lastStatement.units[0].type === "variable")) && (lastStatement.units[0].name === "ret")), (function(_it) {
return get_type(lastStatement.units[1], innercontext)[0];
}), _else, (function(_it) {
return ["undefined",
[]];
}));
var res = [[FunctionType(argTypes, resultType)],
inner_lambdas_with_contexts];
_if(DEBUG_TYPES, (function(_it) {
console.log("function of type", global.JSON.stringify(res[0]));
}));
return res;
}),
assignment: (function(assign, context) {
assert(is_instance(context, Context), (Object.getPrototypeOf(context) + " is not a Context"));
var modifier = assign.modifier;
var left = assign.left;
var type = left.type;
assert(_.contains([null,
"mutable",
"mutate"], modifier), (("ALC: Unrecognized modifier `" + modifier) + "`"));
_if((type === "variable"), (function(_it) {
_if((((modifier === null) || (modifier === "const")) || (modifier === "mutable")), (function(_it) {
_if(! context.may_declare(left.name), (function(_it) {
throw new SyntaxError((((("ALC: Shadowing `" + left.name) + "` ") + at_loc(left.loc)) + " is not permitted. Use `mutate` to mutate."));
}), _else, (function(_it) {
context.declare(modifier, left.name, left.vartype, assign.right);
}));
}), (modifier === "mutate"), (function(_it) {
_if(! context.may_mutate(left.name), (function(_it) {
var declmodifiertype = context.get_modifier(left.name);
throw new SyntaxError((((((((("ALC: Mutating `" + left.name) + "`, which has ") + "modifier `") + declmodifiertype) + "` ") + at_loc(left.loc)) + "is not permitted. Declare with `mutable` ") + "to allow mutation."));
}));
}), _else, (function(_it) {
assert(false, ("Invalid modifier " + modifier));
}));
}), (type === "table-access"), (function(_it) {
nop();
}), _else, (function(_it) {
throw new Error(("ALINTERNAL: Unrecognized lvalue type: " + type));
}));
var right_side_lambdas = _if((assign.right.type === "lambda"), (function(_it) {
return new LambdaWithContext(assign.right, context);
}), _else, (function(_it) {
return get_type(assign.right, context)[1];
}));
_if((type === "variable"), (function(_it) {
var vartype = context.get_type(left.name)[0];
var righttype = get_type(assign.right, context)[0];
_if(DEBUG_TYPES, (function(_it) {
console.log("check var", vartype, left.name, assign.right);
}));
_if(! matchtypes(righttype, vartype), (function(_it) {
throw new SyntaxError((((((((("Type mismatch: `" + left.name) + "` of type `") + JSON.stringify(vartype)) + "` is incompatible with expression of type `") + JSON.stringify(righttype)) + "` ") + at_loc(assign.loc)) + "."));
}));
}), (type === "table-access"), (function(_it) {
var key = left.key;
_if((typeof(key) === "string"), (function(_it) {
var table_type = get_type(left.table, context)[0];
return _if((table_type === "?"), (function(_it) {
console.log("table access - giving up: type ?");
nop();
}), (table_type.length > 1), (function(_it) {
console.log("table access - giving up: length > 1", table_type);
nop();
}), (table_type.length === 0), (function(_it) {
throw new SyntaxError(((("ALC: Mutating table key `" + key) + "` which has ") + "type empty-set, is impossible."));
}), _else, (function(_it) {
var single_table_type = table_type[0];
var property_type = single_table_type[key];
var righttype = get_type(assign.right, context)[0];
_if(! matchtypes(property_type, righttype), (function(_it) {
throw new SyntaxError((((((((("Type mismatch: table key `" + key) + "` of type `") + JSON.stringify(property_type)) + "` is incompatible with expression of type `") + JSON.stringify(righttype)) + "`.") + "assignment: ") + JSON.stringify(assign)));
}));
}));
}));
}));
return [[],
right_side_lambdas];
})
});
var check_program = (function(stmts, external_vars) {
var context = new Context({
scope: null,
getExprType: (function(expr, context_) {
return get_type(expr, context_)[0];
})
});
context.declare("const", "true", ["boolean"]);
context.declare("const", "false", ["boolean"]);
context.declare("const", "undefined", ["undefined"]);
context.declare("const", "null", ["null"]);
context.declare("const", "not", [FunctionType([["boolean"]], ["boolean"])]);
context.declare("const", "this", "?");
context.declare("const", "if", "?");
context.declare("const", "else", "?");
context.declare("const", "while", "?");
context.declare("const", "throw", "?");
context.declare("const", "new", "?");
context.declare("const", "delete", "?");
context.declare("const", "typeof", "?");
context.declare("const", "global", "?");
context.declare("const", "require", "?");
context.declare("const", "module", "?");
context.declare("const", "__filename", "?");
context.declare("const", "Error", "?");
context.declare("const", "String", "?");
context.declare("const", "Function", "?");
context.declare("const", "Object", "?");
context.declare("const", "Number", "?");
context.declare("const", "RegExp", "?");
_.each(external_vars, (function(ext) {
return context.declare("const", ext, "?");
}));
check_statements(stmts, context);
});
module.exports = check_program;
