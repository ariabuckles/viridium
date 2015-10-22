_ = require "underscore"
compile = require "./compile"

exec = [ source context_ |
    source_str = if (_.isArray source) [
        ret source.join "\n"
    ] else [
        ret source
    ]

    context = context_ or {:}

    gen = compile source_str (_.keys context)
    js = gen.toString()

    prelude = ((_.keys context) -> _.map [ key |
        ret ("var " + key + " = context." + key + ";\n")
    ]).join ""

    jsFunc = new Function "context" (prelude + js)
    jsFunc context
]

mutate module.exports = exec
