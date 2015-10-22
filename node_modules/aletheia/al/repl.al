// Aletheia repl
// Based on the CoffeeScript repl:
// https://github.com/jashkenas/coffeescript/blob/master/src/repl.coffee
// Available under the MIT license

vm = require 'vm'
node_repl = require 'repl'

_ = require "underscore"

compile = require "./compile"

_try = [ tryblock catchblock |
    ```try { catchblock; } catch (err) { catchblock(err); }```
]

repl_settings = {
    prompt = "aletheia> "
    eval = [ rawinput context filename callback |

        // Node's REPL sends the input ending with a newline and then wrapped in
        // parens. Unwrap all that.
        input = rawinput.replace /^\(([\s\S]*)\n\)$/m '$1'

        gen = compile input
        js = gen.toString()

        _try [
            result = if (context == global) [
                ret vm.runInThisContext js filename
            ] else [
                ret vm.runInContext js context filename
            ]

            callback null result
        ] [ err |
            callback err
        ]
    ]
}

start = [ options |
    merged_options = _.extend repl_settings options
    repl = node_repl.start merged_options
    repl.on 'exit' [ repl.outputStream.write '\n' ]
    ret repl
]

mutate module.exports = {
    start = start
}
