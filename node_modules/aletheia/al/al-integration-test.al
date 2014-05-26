assert = require "assert"
_ = require "underscore"

parser = require "./parser.js"
desugar = require "./desugar.js"
primitivize = require "./primitivize.js"
rewrite = require "./rewrite-symbols.js"
compile = require "./code-gen.js"

exec = [ source context |
    source_str = if (_.isArray source) [
        ret source.join "\n"
    ] else [
        ret source
    ]

    parseTree = parser.parse source_str
    ast = desugar parseTree
    primitivized = primitivize ast
    rewritten = rewrite primitivized 
    gen = compile rewritten
    js = gen.toString()

    prelude = (_.map context [value key |
        ret ("var " + key + " = context." + key + ";\n")
    ]).join ""

    jsFunc = new Function "context" (prelude + js)
    jsFunc context
]

describe "aletheia-in-aletheia" [
    describe "function calls" [
        it "should execute a zero-arg call" [
            mutable called = undefined
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

    describe "inline javascript" [
        it "should be able to be used as a statement" [
            mutable result = undefined
            callback = [ value |
                mutate result = value
            ]
            prgm = {
                "```callback(5)```"
            }
            exec prgm {callback: callback}
            assert.strictEqual result 5
        ]

        it "should be able to be used in an expression" [
            mutable result = undefined
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

    describe "comments" [
        it "should ignore comments in parsing" [
            prgm = {
                "// our first program!"
                "a = 5"
                "b = a + a  // or something"
                "a = b"
            }
            exec prgm {:}
        ]
    ]

    describe "regexes" [
        it "should parse a simple regex" [
            prgm = {
                "callback /hi/"
            }
            nop = [it | it]
            exec prgm {callback: nop}
        ]

        it "should parse regexes with modifiers" [
            prgm = {
                "callback /hi/g /hi/i /hi/m"
            }
            nop = [it | it]
            exec prgm {callback: nop}
        ]

        it "should parse regexes with modifiers" [
            prgm = {
                "callback /hi/mig"
            }
            nop = [it | it]
            exec prgm {callback: nop}
        ]

        it "should test a simple regex" [
            mutable result = undefined
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

    describe "newlines" [
        it "should allow multi-line statement continuation inside parens" [
            mutable result = undefined
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
]
