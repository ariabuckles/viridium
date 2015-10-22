var assert = require("assert");
var _ = require("underscore");

var parser = require("./parser.js");
var desugar = require("./desugar.js");
var primitivize = require("./primitivize.js");
var rewrite = require("./rewrite-symbols.js");
var compile = require("./code-gen.js");

var exec = function(source, context) {
    if (_.isArray(source)) {
        source = source.join('\n');
    }
    var parseTree = parser.parse(source);
    var ast = desugar(parseTree);
    var primitivized = primitivize(ast);
    var rewritten = rewrite(primitivized);
    var gen = compile(rewritten);
    var js = gen.toString();
    var prelude = _.map(context, function(value, key) {
        return "var " + key + " = context." + key + ";\n";
    }).join("");
    var jsFunc = new Function('context', prelude + js);
    jsFunc(context);
};

describe("aletheia", function() {
    describe("function call parsing", function() {
        it("new Function should parse", function() {
            var prgm = [
                'f = new Function "context" (prelude + js)',
            ];
            exec(prgm, {prelude: "", js: "return 4;"});
        });

        it("calling a function with two arguments", function() {
            var prgm = [
                "f 1 (1 + 2)",
            ];
            exec(prgm, {f: function() { }});
        });
    });

    describe("if", function() {
        it("should execute for true", function() {
            var called = false;
            var callback = function() {
                called = true;
            };
            var prgm = [
                "if true [",
                "    callback undefined",
                "]"
            ];
            exec(prgm, {callback: callback});
            assert(called);
        });

        it("multi-if with false false true should execute lambda 3", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "if false [",
                "    callback 1",
                "] false [",
                "    callback 2",
                "] true [",
                "    callback 3",
                "]"
            ];
            exec(prgm, {callback: callback});
            assert.strictEqual(result, 3);
        });
    });

    describe("while", function() {
        it("should count to 10", function() {
            var result = [];
            var callback = function(param) {
                result.push(param);
            };
            var endResult;
            var endCallback = function(param) {
                endResult = param;
            };
            var prgm = [
                "mutable i = 0",
                "while [ret (i < 10)] [",
                "    callback i",
                "    mutate i = i + 1",
                "]",
                "endCallback i"
            ];
            exec(prgm, {callback: callback, endCallback: endCallback});
            assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            assert.deepEqual(endResult, 10);
        });

        it("condition should auto-ret", function() {
            var result = [];
            var callback = function(param) {
                result.push(param);
            };
            var endResult;
            var endCallback = function(param) {
                endResult = param;
            };
            var prgm = [
                "mutable i = 0",
                "while [ i < 10 ] [",
                "    callback i",
                "    mutate i = i + 1",
                "]",
                "endCallback i"
            ];
            exec(prgm, {callback: callback, endCallback: endCallback});
            assert.deepEqual(result, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
            assert.deepEqual(endResult, 10);
        });

        it("should be able to count in fibonacci", function() {
            var fib;
            var storeResult = function(setFib) {
                fib = setFib;
            };
            var prgm = [
                "fib = [ n |",
                "    mutable a = 1",
                "    mutable b = 0",
                "    mutable i = 0",
                "    while [ret (i < n)] [",
                "        old_b = b",
                "        mutate b = a + b",
                "        mutate a = old_b",
                "        mutate i = i + 1",
                "    ]",
                "    ret b",
                "]",
                "storeResult fib"
            ];
            exec(prgm, {storeResult: storeResult});
            assert.equal(fib(0), 0);
            assert.equal(fib(1), 1);
            assert.equal(fib(2), 1);
            assert.equal(fib(3), 2);
            assert.equal(fib(4), 3);
            assert.equal(fib(5), 5);
            assert.equal(fib(6), 8);
            assert.equal(fib(7), 13);
            assert.equal(fib(8), 21);
        });
    });

    describe("table literal", function() {
        it("should compile a simple table literal", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {",
                "    a: 5",
                "    b: 6",
                "}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, {a: 5, b: 6});
        }); 

        it("should compile a table literal with `=` delimiters", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {",
                "    a = 5",
                "    b = 6",
                "}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, {a: 5, b: 6});
        }); 

        it("should compile a table literal with quoted field names", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                'callback {',
                '    "a": 5',
                '    "b": 6',
                '}'
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, {a: 5, b: 6});
        }); 

        it("should compile a table literal with quoted non-identifier field names", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                'callback {',
                '    "a-b": 5',
                '    "c d": 6',
                '}'
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, {"a-b": 5, "c d": 6});
        }); 

        it("should compile a newline-delimited array literal", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {",
                "    4",
                "    5",
                "    6",
                "}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, [4, 5, 6]);
        }); 

        it("should compile an empty array literal", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, []);
            assert(_.isArray(result));
        }); 

        it("should compile a comma-delimited array literal", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {4, 5, 6}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, [4, 5, 6]);
        }); 

    });

    describe("table access", function() {
        it("should be able to access with dot notation", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "table = {",
                "    a: 5",
                "    b: 6",
                "}",
                "callback table.a"
            ];
            exec(prgm, {callback: callback});
            assert.equal(result, 5);
        }); 

        it("should be able to access with @ notation", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "table = {",
                "    a: 5",
                "    b: 6",
                "}",
                'callback table@"b"'
            ];
            exec(prgm, {callback: callback});
            assert.equal(result, 6);
        }); 

        it("should be able to access expressions with @ notation", function() {
            var result;
            var array = [1, 3, 6, 10, 15];
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                'callback array@(1+2)'
            ];
            exec(prgm, {array: array, callback: callback});
            assert.equal(result, 10);
        }); 

        it("should allow @ for non identifier strings", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                'table = {',
                '    "a-b": 5',
                '    "c-d": 6',
                '}',
                'callback table@"a-b"'
            ];
            exec(prgm, {callback: callback});
            assert.equal(result, 5);
        }); 

    });

    describe("boolean operators", function() {
        describe("and", function() {
            it("should return true for two truths", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 2 and 3 + 3 == 6)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, true);
            });

            it("should return false for two falsehoods", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 5 and 3 + 3 == 5)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, false);
            });

            it("should return false for a truth and a falsehood", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 2 and 3 + 3 == 5)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, false);
            });

            it("should return false for a falsehood and a truth", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 5 and 3 + 3 == 6)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, false);
            });
        });

        describe("or", function() {
            it("should return true for two truths", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 2 or 3 + 3 == 6)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, true);
            });

            it("should return false for two falsehoods", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 5 or 3 + 3 == 5)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, false);
            });

            it("should return true for a truth and a falsehood", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 2 or 3 + 3 == 5)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, true);
            });

            it("should return true for a falsehood and a truth", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (1 + 1 == 5 or 3 + 3 == 6)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, true);
            });
        });

        describe("not", function() {
            it("should negate true", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (not true)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, false);
            });

            it("should negate false", function() {
                var result;
                var callback = function(value) {
                    result = value;
                };
                var prgm = [
                    "callback (not false)"
                ];
                exec(prgm, {callback: callback});
                assert.equal(result, true);
            });
        });
    });

    describe("arithmetic", function() {
        it("should evaluate addition", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (1 + 2)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, 3);
        }); 

        it("should evaluate subtraction", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (1 - 2)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, -1);
        }); 

        /*it("should evaluate subtraction without spaces", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (1-2)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, -1);
        });*/

        it("should handle negative literals", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback -2"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, -2);
        }); 

        it("should handle negating expressions", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (-(1 + 3))"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, -4);
        }); 

        it("should evaluate multiplication", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (4 * 5)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, 20);
        });

        it("should evaluate division", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (1 / 2)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, 0.5);
        });

        it("should evaluate modulus", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = ["callback (7 % 2)"];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, 1);
        });
    });

    describe("rewrite", function() {
        it("should rewrite things inside of a table", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {",
                "    a: not (true and false)",
                "}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result.a, true);
        });

        it("should handle `return new` appropriately", function() {
            var result;
            var MyClass = function() { };
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback [",
                "    ret new MyClass()",
                "]()"
            ];
            exec(prgm, {MyClass: MyClass, callback: callback});
            assert(result instanceof MyClass);
        });
    });

    describe("inline javascript", function() {
        it("should work for quotes", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback ```'\"'```"
            ];
            exec(prgm, {callback: callback});
            assert.strictEqual(result, '"');
        });

        it("should work multiple times", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback (```1``` + ```2```)"
            ];
            exec(prgm, {callback: callback});
            assert.strictEqual(result, 3);
        });

        it("should work for quotes in arrays", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback {",
                "   (```'\"'```)",
                "   \"hi\"",
                "   (```'\"'```)",
                "}"
            ];
            exec(prgm, {callback: callback});
            assert.deepEqual(result, ['"', "hi", '"']);
        });
    });

    describe("string literals", function() {
        it("should be able to contain quotes", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                "callback '\"'"
            ];
            exec(prgm, {callback: callback});
            assert.strictEqual(result, '"');
        });

        it("should be able to escape quotes", function() {
            var result;
            var callback = function(param) {
                result = param;
            };
            var prgm = [
                'callback "\\""'
            ];
            exec(prgm, {callback: callback});
            assert.strictEqual(result, '"');
        });
    });
});
