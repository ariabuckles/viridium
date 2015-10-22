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
var commander = require("commander");
var u = require("underscore");
var package = require("./package.json");
var SEPARATOR = " ";
var NUM_ROUNDS = 15;
var RESULT_LENGTH = 20;
var SECONDS_PER_MINUTE = 60;
var MS_PER_SECOND = 1000;
var BCRYPT_HASH_LENGTH = 60;
var DEFAULT_ROUNDS = 15;
var DEFAULT_CONFIG = [];
var process = global.process;
var PROMPT = {
prompt: "password: ",
silent: true,
timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
output: process.stderr,
default: ""
};
var ROUNDS_PROMPT = {
prompt: "number of rounds (15 recommended):",
timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
output: process.stderr
};
var HOME = ((process.env.HOME || process.env.HOMEPATH) || process.env.USERPROFILE);
var CONFIG_FILE = (HOME + "/.viridium.json");
var main = (function() {
commander.parseExpectedArgs(["<domain>"]);
commander.version(package.version);
commander.option("-s, --salt", "generate a salt for the specified domain, or 'default'");
commander.parse(process.argv);
_if(((commander.args.length === 0) && ! commander.salt), (function() {
commander.help();
}));
var configExists = fs.existsSync(CONFIG_FILE);
var config = _if(configExists, (function() {
var configStr = fs.readFileSync(CONFIG_FILE, {
encoding: "utf8"
});
return JSON.parse(configStr);
}), _else, DEFAULT_CONFIG);
var domain = commander.args.join(SEPARATOR);
var salt = (config[domain] || config.default);
_if((commander.salt || ! salt), (function() {
var saltDomain = _if((domain !== ""), (function() {
return domain;
}), _else, (function() {
return "default";
}));
createSalt(saltDomain, config);
}), (domain !== ""), (function() {
getPassword(domain, salt);
}));
});
var createSalt = (function(domain, config) {
console.error((("Setting salt for domain '" + domain) + "'."));
verifyDomain(domain, config, (function() {
read(ROUNDS_PROMPT, (function(error, roundsStr, isDefault) {
var rounds = Number(roundsStr);
_if(((u.isFinite(rounds) && (rounds >= 10)) && (rounds <= 30)), (function() {
var salt = bcrypt.genSaltSync(rounds);
var newConfig = u.extend({

}, config);
newConfig[domain] = salt;
var newConfigStr = JSON.stringify(newConfig, null, 4);
fs.writeFileSync(CONFIG_FILE, newConfigStr, {
encoding: "utf8"
});
console.error(((((("Salt saved in " + CONFIG_FILE) + ".\n") + "Be sure to back this up.\n") + "It is safe to store this file in a ") + "publicly accessible location."));
}), _else, (function() {
console.error("Cancelled.");
}));
}));
}));
});
var verifyDomain = (function(domain, config, callback) {
_if(config[domain], (function() {
read({
prompt: ((("The domain '" + domain) + "' already has a salt!\n") + "Are you sure you want to overwrite it? [y/N]"),
timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
output: process.stderr
}, (function(error, confirmStr, isDefault) {
_if(((! error && ! isDefault) && (confirmStr === "y")), callback, _else, (function() {
console.error("Cancelled.");
}));
}));
}), _else, callback);
});
var getPassword = (function(domain, salt) {
read(PROMPT, (function(error, master, isDefault) {
var isError = ((error !== null) && (error !== undefined));
var isEmpty = (isDefault || (master === ""));
var isValid = ! (isError || isEmpty);
_if(isValid, (function() {
var result = bcrypt.hashSync(((master + SEPARATOR) + domain), salt);
assert((result.length === BCRYPT_HASH_LENGTH));
assert((RESULT_LENGTH <= 32));
var slicedResult = result.slice((null - RESULT_LENGTH));
console.log(slicedResult);
}));
}));
});
main();
