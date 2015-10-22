
// Takes a string beginning and ending with a quote mark
unescape = [ escapedStr |
    jsonStr = if (escapedStr@0 == "'") [
        ret ('"' + ((escapedStr.replace /"/g '\\"').slice 1 -1) + '"')
    ] else [
        ret escapedStr
    ]
    ret JSON.parse jsonStr
]

// TODO: escape non-ascii characters here too
escape = [ unescapedStr |
    ret JSON.stringify unescapedStr
]

mutate module.exports = {
    unescape: unescape
    escape: escape
}
