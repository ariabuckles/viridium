var fs = require("fs");

var ParseNode = require("./build/parse-tree.js").ParseNode;
var parser = require("./build/parser.js");
var desugar = require("./build/desugar.js");
var primitivize = require("./build/primitivize.js");
var rewrite = require("./build/rewrite-symbols.js");
var compile = require("./build/code-gen.js");

console.log("\n==== INPUT ====");
var program = fs.readFileSync("./test.al", {encoding: 'utf8'});
console.log(program);

console.log("\n==== PARSED ====");
var parseTree = parser.parse(program);
console.log(JSON.stringify(parseTree, null, 4));

console.log("\n==== NORMALIZED ====");
var ast = desugar(parseTree);
var primitivized = primitivize(ast);
console.log(JSON.stringify(primitivized, null, 4));

console.log("\n==== REWRITTEN ====");
var rewritten = rewrite(primitivized);
console.log(JSON.stringify(rewritten, null, 4));

console.log("\n==== OUTPUT ====");
var gen = compile(rewritten);
var code = gen.toString();
console.log(code);

fs.writeFileSync("./output.js", code, {encoding: 'utf8'});

console.log("\n==== EXECUTING ====");
require("./output.js");

module.exports = code;
