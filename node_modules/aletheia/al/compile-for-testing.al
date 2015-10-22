_ = require "underscore"
compile = require "./compile"

testing_compile = [ source context_ |
    source_str = if (_.isArray source) [
        ret source.join "\n"
    ] else [
        ret source
    ]

    context = context_ or {:}

    gen = compile source_str (_.keys context)
	ret gen
]

mutate module.exports = testing_compile
