_ = require "underscore"
checks = {
    require "./type-check.js"
}

error_check = [ ast external_vars |
    checks -> _.map [ check |
        check ast external_vars
    ]
]

mutate module.exports = error_check
