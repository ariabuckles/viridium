var _ = require("underscore");
var SourceMap = require('source-map');
var SourceNode = SourceMap.SourceNode;

var SyntaxTree = require("./syntax-tree.js");
var SyntaxNode = SyntaxTree.SyntaxNode;

var IDENTIFIER_REGEX = /^[_a-zA-Z0-9]+$/;

var preambleStr = [
    // preamble if
    "var _else = {identifier: 'else'};",
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
    "", // preamble while
    "var _while = function(conditionLambda, bodyLambda) {",
    "    while (conditionLambda.call(undefined)) {",
    "        bodyLambda.call(undefined);",
    "    }",
    "}",
    ""
].join("\n");

var getPreamble = function() {
    return new SourceNode(null, null, null, preambleStr);
};

// Does something like Array::join, but returns a new
// array with the value interleaved, rather than a
// string.
//
// Used to interleave ", " commas between parameters
//
// > interleave(array, value).join("") === array.join(value)
var interleave = function(array, value, trailingValue) {
    var result = [];
    _.each(array, function(elem, i) {
        result.push(elem);
        if (i + 1 !== array.length || trailingValue) {
            result.push(value);
        }
    });
    return result;
};
//#test interleave [
//  #assert interleave(array, value).join("") === array.join(value)
//]

var compile = function(node) {
    if (node instanceof SyntaxNode) {
        return compile[node.type](node);
    } else {
        // compile time constant
        return compile[typeof node](node);
    }
};
_.extend(compile, {
    "number": function(num) {
        return new SourceNode(null, null, "source.al", String(num));
    },

    "string": function(str) {
        return new SourceNode(null, null, "source.al", [
            '"', str, '"'
        ]);
    },

    "object": function(obj) {
        if (obj == null) {
            return new SourceNode(null, null, "source.al", "null");
        } else if (_.isArray(obj)) {
            var fields = _.map(obj, compile);
            return new SourceNode(null, null, "source.al", _.flatten([
                "[",
                interleave(fields, ",\n", false),
                "]"
            ]));
        } else {
            var fields = _.map(obj, function(value, key) {
                var result = [compile["table-key"](key), ': ', compile(value)];
                return result;
            });
            return new SourceNode(null, null, "source.al", _.flatten([
                "{\n",
                interleave(fields, ",\n", false),
                "\n}"
            ]));
        }
    },

    "table-key": function(key) {
        if (IDENTIFIER_REGEX.test(key)) {
            return key;
        } else {
            return '"' + key.replace('"', '\\"') + '"';
        }
    },

    "undefined": function(undef) {
        return new SourceNode(null, null, "source.al", "undefined");
    },

    "boolean": function(boolVal) {
        return new SourceNode(null, null, "source.al", String(boolVal));
    },

    "statement-list": function(statements) {
        return new SourceNode(null, null, "source.al",
            interleave(_.map(statements, compile), ";\n", true)
        );
    },

    assignment: function(assign) {
        var modifier = assign.modifier;
        var left = compile(assign.left);
        var right = compile(assign.right);
        if (modifier === null || modifier === "mutable") {
            return new SourceNode(null, null, "source.al", [
                "var ", left, " = ", right
            ]);
        } else if (modifier === "mutate") {
            return new SourceNode(null, null, "source.al", [
                left, " = ", right
            ]);
        } else {
            throw new Error("Invalid assignment modifier: " + modifier);
        }
    },

    "lambda-args": function(args) {
        return new SourceNode(null, null, "source.al",
            interleave(_.map(args, compile), ", ")
        );
    },

    lambda: function(lambda) {
        var args = lambda.arguments;
        var statements = lambda.statements;
        var result = new SourceNode(null, null, "source.al");

        result.add("(function(");
        result.add(compile["lambda-args"](args));
        result.add(") {\n");
        result.add(compile["statement-list"](statements));
        result.add("})");

        return result;
    },

    "unit-list": function(unitList) {
        // If we got here, we're a function call, since
        // unit-lists as lambda parameters get code-gen'd in `lambda`
        var result = new SourceNode(null, null, "source.al");

        result.add(compile(_.first(unitList.units)));

        result.add("(");

        var params = _.rest(unitList.units);
        _.each(params, function(unit, i) {
            result.add(compile(unit));
            if (i + 1 !== params.length) {
                result.add(", ");
            }
        });

        result.add(")");

        return result;
    },

    "keyword-function": function(keyword) {
        return new SourceNode(null, null, "source.al", [
            keyword.name,
            " ",
            compile(keyword.value)
        ]);
    },

    "table-access": function(tableAccess) {
        if (typeof tableAccess.key === "string" && IDENTIFIER_REGEX.test(tableAccess.key)) {
            return new SourceNode(null, null, "source.al", [
                compile(tableAccess.table),
                ".",
                tableAccess.key
            ]);
        } else {
            return new SourceNode(null, null, "source.al", [
                compile(tableAccess.table),
                "[",
                compile(tableAccess.key),
                "]"
            ]);
        }
    },

    "operation": function(comp) {
        var left = new SourceNode(null, null, "source.al", compile(comp.left));
        var right = new SourceNode(null, null, "source.al", compile(comp.right));
        var op = comp.operation;
        if (op === "==") {
            op = "===";
        } else if (op === "!=") {
            op = "!==";
        }
        return new SourceNode(null, null, "source.al", [
            "(",
            // TODO(jack) we'll need to use something other than null here so
            // that we can use a null literal for compile time macros
            (left != null ? left : ""),
            " ",
            op,
            " ",
            (right != null ? right : ""),
            ")"
        ]);
    },

    "variable": function(variable) {
        return new SourceNode(null, null, "source.al", variable.name);
    },

    "javascript": function(js) {
        return new SourceNode(null, null, "source.al", js.source);
    }
});

var compileWithPreamble = function(fileNode) {
    return new SourceNode(null, null, "source.al", [
        getPreamble(),
        "\n",
        compile["statement-list"](fileNode)
    ]);
};

module.exports = compileWithPreamble;
