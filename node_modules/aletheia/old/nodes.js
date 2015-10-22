
var StatementList = function(stmts) {
    console.log("StatementList", stmts);
    this.type = "StatementList";
    this.stmts = stmts;
};

var Declaration = function(isMutable, identifier, expr) {
    console.log("Declaration", isMutable, identifier, expr);
    this.type = "Declaration";
    this.isMutable = isMutable;
    this.identifier = identifier;
    this.expr = expr;
};

var Mutation = function(lvalue, expr) {
    console.log("Mutation", lvalue, expr);
    this.type = "Mutation";
    this.lvalue = lvalue;
    this.expr = expr;
};

var Function_ = function(args, stmts) {
    console.log("Function", args, stmts);
    this.type = "Function";
    this.args = args;
    this.stmts = stmts;
};

var FunctionCall = function(func, args) {
    console.log("FunctionCall", func, args);
    this.type = "FunctionCall";
    this.func = func;
    this.args = args;
};
FunctionCall.prototype.pushArg = function(arg) {
    this.args.push(arg);
};

var Table = function(fields) {
    this.type = "Table";
    this.fields = fields;
};

var Field = function(key, value) {
    this.type = "Field";
    this.key = key;
    this.value = value;
};

var TableAccess = function(table, key) {
    this.type = "TableAccess";
    this.table = table;
    this.key = key;
};

module.exports = {
    StatementList: StatementList,
    Declaration: Declaration,
    Mutation: Mutation,
    Function: Function_,
    FunctionCall: FunctionCall,
    Table: Table,
    Field: Field,
    TableAccess: TableAccess
};
