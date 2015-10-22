assert = require "assert"
_ = require "underscore"

compile = require "./compile-for-testing"

describe = global.describe
it = global.it
SyntaxError = global.SyntaxError

compiles = [ prgm |
    assert.doesNotThrow [
        compile prgm
    ]
]

doesNotCompile = [ prgm |
    assert.throws [
        compile prgm
    ] SyntaxError
]

describe "type checking" [|
    describe "basic assignment" [|
        it "should work for nested tables" [|
            assert.doesNotThrow [
                compile {
                    "f = global.console.log"
                }
            ]
        ]
    ]

    describe "undeclared variables" [|
        it "use of an undeclared variable should throw a type error" [|
            assert.throws [
                compile {
                    "a = b"
                }
            ] SyntaxError
        ]

        it "use of a declared variable should not throw a type error" [|
            assert.doesNotThrow [
                compile {
                    "b = 6"
                    "a = b"
                }
            ]
        ]
    ]

    describe "shadowing" [|
        it "should not allow shadowing at the same scope" [|
            assert.throws [
                compile {
                    "a = 1"
                    "a = 2"
                }
            ] SyntaxError
        ]

        it "should not allow shadowing at an inner scope" [|
            assert.throws [
                compile {
                    "a = 1"
                    "if false ["
                    "    a = 2"
                    "]"
                }
            ] SyntaxError
        ]

        it "should not allow shadowing a mutable at the same scope" [|
            assert.throws [
                compile {
                    "mutable a = 1"
                    "a = 2"
                }
            ] SyntaxError
        ]

        it "should not allow shadowing a mutable in an inner scope" [|
            assert.throws [
                compile {
                    "mutable a = 1"
                    "if false ["
                    "    a = 2"
                    "]"
                }
            ] SyntaxError
        ]
    ]

    describe "variable mutation" [|
        it "should throw for mutating a const var" [|
            assert.throws [
                compile {
                    "a = 5"
                    "mutate a = 6"
                }
            ] SyntaxError
        ]

        it "should not throw for mutating a mutable" [|
            assert.doesNotThrow [
                compile {
                    "mutable a = 5"
                    "mutate a = 6"
                }
            ]
        ]
    ]

    describe "table mutation" [|
        it "should require a `mutate` modifier" [|
            doesNotCompile {
                "t = {a: 5, b: 6}"
                "t.a = 6"
            }

            compiles {
                "t = {a: 5, b: 6}"
                "mutate t.a = 6"
            }
        ]
    ]

    describe "variable types" [|
        it "should allow mutating a variable with the same type" [|
            assert.doesNotThrow [
                compile {
                    "mutable a = 5"
                    "mutate a = 6"
                }
            ]
        ]

        it "should not allow assigning an incompatible type to a new var" [|
            assert.throws [
                compile {
                    "a :: {'boolean'} = 5"
                }
            ] SyntaxError
        ]

        it "should not allow mutating a variable with an incompatible type" [|
            assert.throws [
                compile {
                    "mutable a = 5"
                    "mutate a = true"
                }
            ] SyntaxError
        ]

        it "should allow mutating a ? type variable to any type" [|
            assert.doesNotThrow [
                compile {
                    "mutable a :: ? = 5"
                    "mutate a = true"
                }
            ]
        ]

        it "type should be transitive through multiple assignments" [|
            assert.doesNotThrow [
                compile {
                    "a = 6"
                    "mutable b = a"
                    "mutate b = 7"
                }
            ]

            assert.throws [
                compile {
                    "a = 6"
                    "mutable b = a"
                    "mutate b = 'hi'"
                }
            ] SyntaxError
        ]

        it "an object with more keys should be assignable to a fewer-keyed variable" [|
            assert.doesNotThrow [
                compile {
                    "mutable t = {a: 1}"
                    "mutate t = {a: 2, b: 3}"
                }
            ]
        ]

        it "an object with fewer keys should not be assignable to a more-keyed variable" [|
            assert.throws [
                compile {
                    "mutable t = {a: 1, b: 2}"
                    "mutate t = {a: 3}"
                }
            ] SyntaxError
        ]

        it "an array and an object should be incompatible types" [|
            assert.throws [
                compile {
                    "mutable a = {:}"
                    "mutate a = {}"
                }
            ] SyntaxError

            assert.throws [
                compile {
                    "mutable a = {}"
                    "mutate a = {:}"
                }
            ] SyntaxError
        ]
    ]

    describe "table access types" [|
        it "should allow mutating a table field to a compatible value" [|
            assert.doesNotThrow [
                compile {
                    "mutable t = {a: 5, b: 6}"
                    "mutate t.a = t.b"
                }
            ]
        ]

        it "should not allow mutating a table field to an incompatible value" [|
            assert.throws [
                compile {
                    "mutable t = {a: 5, b: 6}"
                    "mutate t.a = true"
                }
            ] SyntaxError
        ]

        it "field type should infer variable type" [|
            assert.throws [
                compile {
                    "t = {a: 5, b: 6}"
                    "mutable c = t.a"
                    "mutate c = {}"
                }
            ] SyntaxError
        ]
    ]

    describe "typed functions" [|
        it "should figure out simple function types when arguments have declared types" [|
            compiles {
                "f = [ a::{'number'} | a + a ]"
                "b::{'number'} = f 2"
            }

            doesNotCompile {
                "f = [ a::{'number'} | a + a ]"
                "b::{'boolean'} = f 2"
            }
        ]

        it "should not crash on a recursive function" [|
            compiles {
                "f = [ a::{'number'} |"
                "   ret if (a < 1) [a] else ["
                "       ret ((f (a - 1)) + (f (a - 2)))"
                "   ]"
                "]"
                "b::{'number'} = f 2"
            }
        ]
    ]
]
