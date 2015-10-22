describe = global.describe
it = global.it

assert = require "assert"
_ = require "underscore"

exec = require "./exec-for-testing"

describe "aletheia-in-aletheia" [|
    describe "function calls" [|
        it "should execute a zero-arg call" [|
            mutable called :: ? = undefined
            callback = [
                mutate called = true
            ]
            prgm = {
                "callback()"
            }
            exec prgm {callback: callback}
            assert called
        ]
    ]

    describe "function definitions" [|
        it "should work for a single param function" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "f = [ a | a + 1 ]"
                "callback (f 2)"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 3
        ]

        it "should have an implicit `_it` param if none are declared" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "f = [ _it + 1 ]"
                "callback (f 2)"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 3
        ]

        it "should have no parameters if explicitly declared as such" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "_it = 0"
                "f = [ | _it + 1 ]" // should return 0 + 1
                "callback (f 2)"  // even though we passed 2 as the first param
            }
            exec prgm {callback: callback}
            assert.strictEqual result 1
        ]

        it "should work with a table param" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "f = [ a | a.a ]"
                "callback (f {a: 5})"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 5
        ]

    ]

    describe "inline javascript" [|
        it "should be able to be used as a statement" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "```callback(5)```"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 5
        ]

        it "should be able to be used in an expression" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "callback ```3 + 3```"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 6
        ]
    ]

    describe "comments" [|
        it "should ignore comments in parsing" [|
            prgm = {
                "// our first program!"
                "mutable a = 5"
                "b = a + a  // or something"
                "mutate a = b"
            }
            exec prgm {:}
        ]
    ]

    describe "regexes" [|
        it "should parse a simple regex" [|
            prgm = {
                "callback /hi/"
            }
            nop = [a | a]
            exec prgm {callback: nop}
        ]

        it "should parse regexes with modifiers" [|
            prgm = {
                "callback /hi/g /hi/i /hi/m"
            }
            nop = [a | a]
            exec prgm {callback: nop}
        ]

        it "should parse regexes with modifiers" [|
            prgm = {
                "callback /hi/mig"
            }
            nop = [a | a]
            exec prgm {callback: nop}
        ]

        it "should test a simple regex" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "callback (/hi/.test '-hi-')"
            }
            exec prgm {callback: callback}
            assert.strictEqual result true
        ]
    ]

    describe "newlines" [|
        it "should allow multi-line statement continuation inside parens" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "(callback"
                "    true)"
            }
            exec prgm {callback: callback}
            assert.strictEqual result true
        ]
    ]

    describe "arrows" [|
        it "should call a function with a single arg" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "42 -> callback"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 42
        ]

        it "should call a function with two args" [|
            mutable result1 :: ? = undefined
            mutable result2 :: ? = undefined
            callback = [ value1 value2 |
                mutate result1 = value1
                mutate result2 = value2
            ]
            prgm = {
                "42 -> callback 6"
            }
            exec prgm {callback: callback}
            assert.strictEqual result1 42
            assert.strictEqual result2 6
        ]

        it "should call two function with a single arg each" [|
            mutable result :: ? = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "f = [x | x + 1]"
                "42 -> f -> callback"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 43
        ]
        it "should call two function with a single arg each" [|
            mutable result = {}
            callback = [ value |
                result.push value
            ]
            prgm = {
                "mylist = {1, 2, 3}"
                "mylist -> _.map [x | x + 1] -> _.map callback"
            }
            exec prgm {callback: callback, _: _}
            assert.deepEqual result {2, 3, 4}
        ]
    ]
]
