_  = require "underscore"

parser = require "./parser.js"
desugar = require "./desugar.js"
primitivize = require "./primitivize.js"
error_check = require "./error-check.js"
rewrite = require "./rewrite-symbols.js"
codegen = require "./code-gen.js"

compile = [ source external_vars |
    parseTree = parser.parse source
    ast = desugar parseTree
    prim = primitivize ast
    error_check prim external_vars
    rewritten = rewrite prim
    gen = codegen rewritten
    ret gen
]

mutate module.exports = compile
