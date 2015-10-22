fs = require "fs"
path = require "path"
_  = require "underscore"

parser = require "./parser.js"
desugar = require "./desugar.js"
primitivize = require "./primitivize.js"
rewrite = require "./rewrite-symbols.js"
compile = require "./code-gen.js"

this_program_filename = path.basename __filename
this_program_regex = new RegExp (this_program_filename + "$")
exe_index = _.indexOf (_.map process.argv [ arg |
    ret this_program_regex.test(arg)
]) true
input_file = process.argv @ (exe_index + 1)
output_file = process.argv @ (exe_index + 2)
debug = process.argv @ (exe_index + 3) == "--debug"

if (exe_index < 0 or input_file == undefined or output_file == undefined) [
    console.log "usage: alc input_file.al output_file.js"
    process.exit 1
]

console.log ("Compiling '" + input_file + "' into '" + output_file + "':")

program = fs.readFileSync input_file {encoding: "utf8"}
parseTree = parser.parse program
ast = desugar parseTree
prim = primitivize ast
rewritten = rewrite prim
gen = compile rewritten
code = gen.toString()

fs.writeFileSync output_file code {encoding: "utf8"}
console.log (
    "Finished compiling '" +
    input_file +
    "' into '" +
    output_file +
    "'."
)

