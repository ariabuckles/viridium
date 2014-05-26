var fs = require("fs");
var _ = require("underscore");

var parser = require("./parser.js");
var normalize = require("./normalize.js");
var rewrite = require("./rewrite-symbols.js");
var compile = require("./code-gen.js");

// Some hacks to get access to node's global object and process
// without getting browserify's fake global or __browserify_process
var process = (function() {
    return this.process;
})();

var exe_index = _.indexOf(_.map(process.argv, function(arg) {
    return /alc$/.test(arg);
}), true);
var input_file = process.argv[exe_index + 1]
var output_file = process.argv[exe_index + 2]
var debug = process.argv[exe_index + 3] === "--debug";

if (!input_file || !output_file) {
    console.log("usage: alc input_file.al output_file.js");
    process.exit(1);
}

var debugLog = function(str) {
    if (debug) {
        console.log(str);
    }
};

console.log("Compiling '" + input_file + "' into '" + output_file + "':");

debugLog("\n==== INPUT ====\n");
var program = fs.readFileSync(input_file, {encoding: 'utf8'});
debugLog(program);

debugLog("\n==== PARSED ====\n");
var parseTree = parser.parse(program);
debugLog(JSON.stringify(parseTree, null, 4));

debugLog("\n==== REWRITTEN ====\n");
var ast = normalize(parseTree);
var rewritten = rewrite(ast);
debugLog(JSON.stringify(rewritten, null, 4));

debugLog("\n==== OUTPUT ====\n");
var gen = compile(rewritten);
var code = gen.toString();
debugLog(code);

fs.writeFileSync(output_file, code, {encoding: 'utf8'});
console.log(
    "Finished compiling '" + input_file + "' into '" + output_file + "'."
);
