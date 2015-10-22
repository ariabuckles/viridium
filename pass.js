var _else = {identifier: 'else'};
var _if = function(cond1, lambda1, cond2, lambda2) {
    if (arguments.length % 2 !== 0) {
        throw new Error('if called with an odd number of arguments');
    }
    var i = 0;
    for (var i = 0; i < arguments.length; i += 2) {
        var condition = arguments[i];
        if (condition != null && condition !== false) {
            return arguments[i + 1].call(undefined);
        }
    }
};

var _while = function(conditionLambda, bodyLambda) {
    while (conditionLambda.call(undefined)) {
        bodyLambda.call(undefined);
    }
}

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var read = require("read");
var bcrypt = require("bcrypt-nodejs");
var SEPARATOR = " ";
var NUM_ROUNDS = 15;
var RESULT_LENGTH = 20;
var SECONDS_PER_MINUTE = 60;
var MS_PER_SECOND = 1000;
var BCRYPT_HASH_LENGTH = 60;
var DEFAULT_ROUNDS = 15;
var process = global.process;
var PROMPT = {
prompt: "password: ",
silent: true,
timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
output: process.stderr,
default: ""
};
var ROUNDS_PROMPT = {
prompt: "number of rounds",
timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
output: process.stderr,
default: String(DEFAULT_ROUNDS)
};
var getArgs = (function() {
var this_program_filename = path.basename(__filename);
var this_program_regex = new RegExp((this_program_filename + "$"));
var exe_index = process.argv.map((function(arg) {
return this_program_regex.test(arg);
})).indexOf(true);
return process.argv.slice((exe_index + 1));
});
var HOME = ((process.env.HOME || process.env.HOMEPATH) || process.env.USERPROFILE);
var CONFIG_FILE = (HOME + "/.viridium.json");
var createNewConfig = (function() {
read(ROUNDS_PROMPT, (function(error, roundsStr, isDefault) {
var rounds = _if(isDefault, (function() {
return DEFAULT_ROUNDS;
}), _else, (function() {
return (String(roundsStr) || DEFAULT_ROUNDS);
}));
var salt = bcrypt.genSaltSync(rounds);
fs.writeFileSync(CONFIG_FILE, JSON.stringify({
default: salt
}, null, 4), {
encoding: "utf8"
});
console.error((((("Salt saved in " + CONFIG_FILE) + ". ") + "Be sure to back this up. It is safe to store this file in a ") + "publicly accessible location."));
}));
});
var main = (function(config) {
var domain = getArgs().join(SEPARATOR);
var salt = (config[domain] || config.default);
read(PROMPT, (function(error, master, isDefault) {
var isError = ((error !== null) && (error !== undefined));
var isEmpty = (isDefault || (master === ""));
var isDomainEmpty = (domain === "");
var isValid = ! ((isError || isEmpty) || isDomainEmpty);
_if(isValid, (function() {
var result = bcrypt.hashSync(((master + SEPARATOR) + domain), salt);
assert((result.length === BCRYPT_HASH_LENGTH));
assert((RESULT_LENGTH <= 32));
var slicedResult = result.slice((null - RESULT_LENGTH));
console.log(slicedResult);
}));
}));
});
_if(fs.existsSync(CONFIG_FILE), (function() {
var configStr = fs.readFileSync(CONFIG_FILE, {
encoding: "utf8"
});
var config = JSON.parse(configStr);
main(config.default);
}), _else, createNewConfig);
