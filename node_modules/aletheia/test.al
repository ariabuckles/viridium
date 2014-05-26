// Modified from https://github.com/Khan/KAS,
// which is MIT licensed

fs = require "fs"
path = require "path"
jison = require "jison"
outputFile = [ args |
    index = (args.indexOf "-o") + 1
    if (index == 0 or index == args.length) [
        throw new Error "Must supply an output file name with a -o option"
    ]
    ret args@index
] process.argv

grammar = {
    lex: {
        startConditions: {
            INSIDE_PARENS: 0 // 0 is inclusive; 1 is exclusive
                             // (whatever that means... on a plane so I
                             // can't look it up)
        }
        rules: {
            {"\\(",                 'this.pushState("INSIDE_PARENS"); return "(";'}
            {"\\)",                 'this.popState(); return ")";'}
            {"\\{",                 'this.pushState("INITIAL"); return "{";'}
            {"\\}",                 'this.popState(); return "}";'}
            {"\\[",                 'this.pushState("INITIAL"); return "[";'}
            {"\\]",                 'this.popState(); return "]";'}
            {"\\|",                 'return "|";'}

            {"(\\r\\n?|\\n)",       'return YY_START === "INITIAL" ? "NEWLINE" : null;'}
            {"[^\\S\\r\\n]+",       '/* skip other whitespace */'}
            {"\\/\\/.*?(\\r\\n?|\\n)",'return YY_START === "INITIAL" ? "NEWLINE" : null; /* skip comments */'}

            {"==|!=|<=|>=|<|>",     'return "SIGN";'}

            {"and",                 'return "AND";'}
            {"or",                  'return "OR";'}

            {"-[0-9]+",             'return "NEG_NUMBER";'}
            {"-([0-9]+)?\\.[0-9]+", 'return "NEG_NUMBER";'}
            {"[0-9]+",              'return "NUMBER";'}
            {"([0-9]+)?\\.[0-9]+",  'return "NUMBER";'}

            {"\\/(\\\\.|[^\\/\\n])*\\/[gim]*", 'return "REGEX";'}

            {"\\*",                 'return "*";'}
            {"\\/",                 'return "/";'}
            {"-",                   'return "-";'}
            {"\\+",                 'return "+";'}
            {"\\%",                 'return "%";'}
            {"@",                   'return "@";'}

            {"=",                   'return "=";'}
            {"\\!",                 'return "!";'}
            {"\\:",                 'return ":";'}
            {"\\.",                 'return "DOT";'}
            {",",                   'return ",";'}

            {'\\"(\\\\.|[^"\\n])*?\\"', 'return "STRING";'}
            {"\\'(\\\\.|[^'\\n])*?\\'", 'return "STRING";'}
            {"[a-zA-Z_$][a-zA-Z0-9_$]*", 'return "IDENTIFIER";'}

            {"```.*?```",           'return "JAVASCRIPT";'}

            {"$",                   'return "EOF";'}
            {".",                   'return "INVALID";'}
        },
        options: {}
    },
    operators: {
        // Things at the bottom happen before things at the top
        {"precedence", "IDENTIFIER", "NUMBER", "STRING"}
        {"nonassoc", "SIGN", "COMPARISON"}
        {"left", "+", "-", "NEG_NUMBER"}
        {"left", "*", "/", "%"}
        {"precedence", "UMINUS"}
        {"left", "DOT", "@"}
        {"left", "FUNC_CALL"}
        {"precedence", "(", "[", "{"}
        {"precedence", "WRAP_EXPR"}
        {"precedence", "STMT"}
        {"precedence", "STMT_LIST"}
        {"left", "_separator"}
    }
    start: "program"
    bnf: {
        "program": {
            {"statementList EOF", "return $1;"}
            {"EOF", "return [];"}
        }
        "statementList": {
            {"statementListBody", "$$ = $1;"}
            {"statementListBody separator", "$$ = $1;"}
            {"separator statementListBody", "$$ = $2;"}
            {"separator statementListBody separator", "$$ = $2;"}
        }
        "statementListBody": {
            {"statement", "$$ = [$1];", {prec: "STMT"}}
            {"statementListBody separator statement", "$$ = $1; $1.push($3);", {prec: "STMT_LIST"}}
        }
        "separator": {
            {"NEWLINE", "", {prec: "_separator"}}
            {"separator NEWLINE", "", {prec: "_separator"}}
        }
        "statement": {
            {"lvalue = expression", "$$ = yy.Declaration($1, $3);"}
            {"unitList = expression", "$$ = yy.Assignment($1, $3);"}
            {"expression", "$$ = $1;", {prec: "STATEMENT_BODY"}}
        }
        "expression": {
            {"unitList", "$$ = $1;", {prec: "WRAP_EXPR"}}
            {"additive", "$$ = $1;", {prec: "WRAP_EXPR"}}
            {"booleanOp", "$$ = $1", {prec: "WRAP_EXPR"}}
        }
        "booleanOp": {
            {"comparison", "$$ = $1"}
            {"booleanAndOp", "$$ = $1"}
            {"booleanOrOp", "$$ = $1"}
        }
        "booleanAndOp": {
            {"comparison AND comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"comparison AND unitExpression", "$$ = yy.Operation($1, $2, $3);"}
            {"unitExpression AND comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"unitExpression AND unitExpression", "$$ = yy.Operation($1, $2, $3);"}
            {"booleanAndOp AND comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"booleanAndOp AND unitExpression", "$$ = yy.Operation($1, $2, $3);"}
        }
        "booleanOrOp": {
            {"comparison OR comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"comparison OR unitExpression", "$$ = yy.Operation($1, $2, $3);"}
            {"unitExpression OR comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"unitExpression OR unitExpression", "$$ = yy.Operation($1, $2, $3);"}
            {"booleanOrOp OR comparison", "$$ = yy.Operation($1, $2, $3);"}
            {"booleanOrOp OR unitExpression", "$$ = yy.Operation($1, $2, $3);"}
        }
        "comparison": {
            {"additive SIGN additive", "$$ = yy.Operation($1, $2, $3);", {prec: "COMPARISON"}}
        }
        "unitExpression": {
            {"( expression )", "$$ = $2;"}
            {"function", "$$ = $1;"}
            {"literal", "$$ = $1;"}
            {"lvalue", "$$ = $1;"}
            {"singleUnitList", "$$ = $1;"}
            {"JAVASCRIPT", "$$ = yy.Javascript($1.slice(3, -3));"}
        }
        "lvalue": {
            {"IDENTIFIER", "$$ = yy.Variable($1);", {prec: "WRAP_EXPR"}}
            {"tableaccess", "$$ = $1;"}
        }
        "unitList": {
            {"unitExpression unitExpression", "$$ = yy.UnitList([$1, $2]);", {prec: "FUNC_CALL"}}
            {"unitExpression unitList", "$$ = $2; $2.units.unshift($1);", {prec: "FUNC_CALL"}}
        }
        "singleUnitList": {
            {"unitExpression ( )", "$$ = yy.UnitList([$1]);"}
        }
        "tableaccess": {
            {"unitExpression DOT IDENTIFIER", "$$ = new yy.TableAccess($1, $3);", {prec: "DOT"}}
            {"unitExpression @ unitExpression", "$$ = new yy.TableAccess($1, $3);", {prec: "@"}}
        }
        "literal": {
            {"tableNameLiteral", "$$ = $1;"}
            {"table", "$$ = $1;"}
            {"REGEX", "$$ = yy.Regex($1);"}
        }
        "tableNameLiteral": {
            {"NUMBER", "$$ = Number($1);"}
            {"NEG_NUMBER", "$$ = Number($1);"}
            {"STRING", "$$ = yy.String($1);"}
        }
        "table": {
            {"{ }", "$$ = new yy.Table([], false);"}
            {"{ : }", "$$ = new yy.Table([], true);"}
            {"{ = }", "$$ = new yy.Table([], true);"}
            {"{ fieldList }", "$$ = new yy.Table($2, false);"}
        }
        "fieldList": {
            {"fieldListBody", "$$ = $1;"}
            {"fieldListBody separator", "$$ = $1;"}
            {"separator fieldListBody", "$$ = $2;"}
            {"separator fieldListBody separator", "$$ = $2;"}
        }
        "fieldListBody": {
            {"field", "$$ = [$1];"}
            {"fieldListBody , field", "$$ = $1; $1.push($3);"}
            {"fieldListBody separator field", "$$ = $1; $1.push($3);"}
            {"fieldListBody , separator field", "$$ = $1; $1.push($4);"}
        }
        "field": {
            {"expression", "$$ = yy.Field(null, $1);"}
            {"IDENTIFIER : expression", "$$ = yy.Field($1, $3);"}
            {"IDENTIFIER = expression", "$$ = yy.Field($1, $3);"}
            {"tableNameLiteral : expression", "$$ = yy.Field($1, $3);"}
            {"tableNameLiteral = expression", "$$ = yy.Field($1, $3);"}
        }
        "function": {
            {"[ statement ]", "$$ = yy.RetLambda([], $2);"}
            {"[ unitList | statement ]", "$$ = yy.RetLambda($2.units, $4);"}
            {"[ unitExpression | statement ]", "$$ = yy.RetLambda([$2], $4);"}
            {"[ separator statementListBody separator ]", "$$ = yy.Lambda([], $3);"}
            {"[ unitList | separator statementListBody separator ]", "$$ = yy.Lambda($2.units, $5);"}
            {"[ unitExpression | separator statementListBody separator ]", "$$ = yy.Lambda([$2], $5);"}
        }
        "additive": {
            {"multiplicative", "$$ = $1;", {prec: "+"}}
            {"additive + additive", "$$ = yy.Operation($1, $2, $3);"}
            {"additive - additive", "$$ = yy.Operation($1, $2, $3);"}
//            {"additive NEG_NUMBER", "$$ = yy.Operation($1, '+', Number($2));"], // breaks f -1
//            {"- additive", "$$ = yy.Operation(null, $1, $2);", {prec: "UMINUS"}}
        }
        "multiplicative": {
            {"negative", "$$ = $1;"}
            {"multiplicative * multiplicative", "$$ = yy.Operation($1, $2, $3);"}
            {"multiplicative / multiplicative", "$$ = yy.Operation($1, $2, $3);"}
            {"multiplicative % multiplicative", "$$ = yy.Operation($1, $2, $3);"}
        }
        "negative": {
            {"- negative", "$$ = yy.Operation(null, $1, $2);", {prec: "UMINUS"}}
            {"unitExpression", "$$ = $1;", {prec: "UMINUS"}}
        }
    }
}

prelude = ""
parser = (new jison.Parser grammar {debug: true}).generate {moduleType: "js"}
postlude = "\n\nparser.yy = require('./parse-tree.js');\nmodule.exports = parser;\n"

fs.writeFileSync outputFile (prelude + parser + postlude)

