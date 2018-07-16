var _else = {identifier: 'else'};
var _if = function(cond1, lambda1, cond2, lambda2) {
    if (arguments.length % 2 !== 0) {
        throw new Error('if called with an odd number of arguments');
    }
    var i = 0;
    for (var i = 0; i < arguments.length; i += 2) {
        let condition = arguments[i];
        if (condition != null && condition !== false) {
            return arguments[i + 1].call(undefined);
        }
    }
};

var _while = function(conditionLambda, bodyLambda) {
    while (conditionLambda.call(undefined)) {
        bodyLambda.call(undefined);
    }
};

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var read = require("read");
var bcrypt = require("bcrypt-nodejs");
var commander = require("commander");
var u = require("underscore");
var package_ = require("./package.json");
var console = global.console;
var JSON = global.JSON;
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
var getPassword = (function(domain, salt) {
    read(PROMPT, (function(error, master, isDefault) {
        let isError = ((error !== null) && (error !== undefined));
        let isEmpty = (isDefault || (master === ""));
        let isValid = ! (isError || isEmpty);
        _if(isValid, (function(_it) {
            let result = bcrypt.hashSync(((master + SEPARATOR) + domain), salt);
            assert((result.length === BCRYPT_HASH_LENGTH));
            assert((RESULT_LENGTH <= 32));
            let slicedResult = result.slice((null - RESULT_LENGTH));
            console.log(slicedResult);
        }));
    }));
});
var main = (function(_it) {
    commander.parseExpectedArgs(["<domain>"]);
    commander.version(package_.version);
    commander.option("-s, --salt", "generate a salt for the specified domain, or 'default'");
    commander.parse(process.argv);
    let configExists = fs.existsSync(CONFIG_FILE);
    let shouldSetupSalt = (commander.salt || ! configExists);
    _if(((commander.args.length === 0) && ! shouldSetupSalt), (function(_it) {
        commander.help();
    }));
    let config = _if(configExists, (function(_it) {
        let configStr = fs.readFileSync(CONFIG_FILE, {
            encoding: "utf8"
        });
        return JSON.parse(configStr);
    }), _else, (function(_it) {
            return DEFAULT_CONFIG;
        }));
    let domain = commander.args.join(SEPARATOR);
    let salt = (config[domain] || config.default);
    _if((shouldSetupSalt || ! salt), (function(_it) {
        let saltDomain = _if(((domain !== "") && configExists), (function(_it) {
            return domain;
        }), _else, (function(_it) {
                return "default";
            }));
        createSalt(saltDomain, config);
    }), (domain !== ""), (function(_it) {
            getPassword(domain, salt);
        }));
});
var verifyDomain = (function(domain, config, callback) {
    _if(config[domain], (function(_it) {
        read({
            prompt: ((("The domain '" + domain) + "' already has a salt!\n") + "Are you sure you want to overwrite it? [y/N]"),
            timeout: ((5 * SECONDS_PER_MINUTE) * MS_PER_SECOND),
            output: process.stderr
        }, (function(error, confirmStr, isDefault) {
                _if(((! error && ! isDefault) && (confirmStr === "y")), callback, _else, (function(_it) {
                    console.error("Cancelled.");
                }));
            }));
    }), _else, callback);
});
var createSalt = (function(domain, config) {
    console.error((("Setting salt for domain '" + domain) + "'."));
    verifyDomain(domain, config, (function(_it) {
        read(ROUNDS_PROMPT, (function(error, roundsStr, isDefault) {
            let rounds = Number(roundsStr);
            _if(((u.isFinite(rounds) && (rounds >= 10)) && (rounds <= 30)), (function(_it) {
                let salt = bcrypt.genSaltSync(rounds);
                let newConfig = u.extend({

                }, config);
                newConfig[domain] = salt;
                let newConfigStr = JSON.stringify(newConfig, null, 4);
                fs.writeFileSync(CONFIG_FILE, newConfigStr, {
                    encoding: "utf8"
                });
                console.error(((((("Salt saved in " + CONFIG_FILE) + ".\n") + "Be sure to back this up.\n") + "It is safe to store this file in a ") + "publicly accessible location."));
            }), _else, (function(_it) {
                    console.error("Cancelled.");
                }));
        }));
    }));
});
main();
