#!/usr/bin/env node
const assert = require('assert');
const child_process = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const bcrypt = require('bcryptjs');
const commander = require('commander');

const package_ = require('./package.json');

// Configurable Params
const SEPARATOR = ' ';
const NUM_ROUNDS = 15;
const RESULT_LENGTH = 20;

// Constants
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const BCRYPT_HASH_LENGTH = 60;
const DEFAULT_ROUNDS = 15;
const DEFAULT_CONFIG = {};
const DEFAULT_DOMAIN = 'default';
const CHECK_DOMAIN = '--check';

const PROMPT = {
    prompt: 'password: ',
    silent: true,
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
    output: process.stderr, // We prompt on stderr, so that stdout is exactly
    // the result password
    default: '',
};

const ROUNDS_PROMPT = {
    prompt: 'number of rounds (15 recommended):',
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
    output: process.stderr,
    silent: false,
};

const HOME =
    process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const CONFIG_FILE = HOME + '/.viridium.json';

// miniature read module ( https://www.npmjs.com/package/read )
const read = (options, callback) => {
    const output = options.output || process.stdout;
    output.write(options.prompt, 'utf8');

    const rl = readline.createInterface({
        input: options.input || process.stdin,
        output: options.silent ? null : output,
        terminal: true,
    });
    rl.on('SIGINT', () => {
        rl.close();
        process.exit(1);
    });
    rl.on('line', (line) => {
        rl.close();
        if (options.silent) {
            output.write('\r\n');
        }
        const result = line.replace(/[\r\n]/g, '');
        callback(null, result, false);
    });
};

const hash = (master, domain, salt) => {
    const result = bcrypt.hashSync(master + SEPARATOR + domain, salt);
    assert(result.length === BCRYPT_HASH_LENGTH);
    return result;
};

const getPassword = (callback) => {
    read(PROMPT, (error, master, isDefault) => {
        // Check for "", timeout, or escaping with Ctrl-C
        const isError = error != null;
        const isEmpty = isDefault || master === '';

        const isValid = !(isError || isEmpty);

        if (!isValid) {
            console.error('Cancelled.');
            return;
        }

        callback(master);
    });
};

const processPassword = (domain, salt, check) => {
    getPassword((master) => {
        let slicedResult = 'ERR: did not finish processing password';
        if (check) {
            checkPasswordAsync(master, (isCorrect) => {
                if (isCorrect) {
                    console.log(slicedResult);
                } else {
                    console.log('incorrect password');
                }
            });
        }

        const result = hash(master, domain, salt);

        // The first 28 characters of the result are roughly the salt.
        // We grab RESULT_LENGTH characters from the tail of the result string
        assert(RESULT_LENGTH <= 32);
        slicedResult = result.slice(-RESULT_LENGTH);

        // And send that on stdout
        if (!check) {
            console.log(slicedResult);
        }
    });
};

const checkPassword = (domain, salt) => {
    getPassword((master) => {
        const result = hash(master, domain, salt);

        // the hash result is stored in the salt
        const isCorrect = result === salt;
        console.log(isCorrect ? 'correct' : 'incorrect');
    });
};

const checkPasswordAsync = (password, callback) => {
    subprocess = child_process.fork('./viridium.js', ['--check'], {
        silent: true,
    });
    const rl = readline.createInterface({
        input: subprocess.stdout,
        output: null,
    });
    subprocess.stdin.end(password + '\r\n', 'utf8');
    rl.on('SIGINT', () => {
        console.error('could not check');
        rl.close();
        callback(true);
    });
    rl.on('line', (line) => {
        rl.close();
        const result = line.replace(/[\r\n]/g, '');
        callback(result === 'correct');
    });
    subprocess.on('error', (err) => {
        console.error('--check error', err);
    });
};

const main = () => {
    commander.parseExpectedArgs(['<domain>']);
    commander.version(package_.version);
    commander.option(
        '-s, --salt',
        "generate a salt for the specified domain, or 'default'"
    );
    commander.option(
        '-c, --check',
        'verify whether the input password is the correct password'
    );
    commander.option(
        '--create-check',
        'set up password check verification (aka -c -s)'
    );
    commander.parse(process.argv);

    const configExists = fs.existsSync(CONFIG_FILE);
    const shouldSetupSalt =
        commander.salt || !configExists || commander.createCheck;
    const isCheck = commander.check || commander.createCheck;
    if (commander.args.length === 0 && !shouldSetupSalt && !isCheck) {
        commander.help(); // exits
    }

    const config = configExists
        ? JSON.parse(fs.readFileSync(CONFIG_FILE, { encoding: 'utf8' }))
        : DEFAULT_CONFIG;

    const domain = isCheck ? CHECK_DOMAIN : commander.args.join(SEPARATOR);
    const salt = config[domain] || config[DEFAULT_DOMAIN];
    const saltDomain = domain !== '' && configExists ? domain : DEFAULT_DOMAIN;

    if (domain === CHECK_DOMAIN && shouldSetupSalt) {
        if (!configExists) {
            console.warn('Please set up a config file first');
            return;
        }
        createCheck(config);
    } else if (domain === CHECK_DOMAIN) {
        checkPassword(domain, salt);
    } else if (shouldSetupSalt || !salt) {
        createSalt(saltDomain, config);
    } else if (domain !== '') {
        processPassword(domain, salt, config[CHECK_DOMAIN] != null);
    }
};

const confirmNewSalt = (domain, config, callback) => {
    if (config[domain]) {
        read(
            {
                prompt:
                    "The domain '" +
                    domain +
                    "' already has a salt!\n" +
                    'Are you sure you want to overwrite it? [y/N]',
                timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
                output: process.stderr,
            },
            (error, confirmStr, isDefault) => {
                if (!error && !isDefault && confirmStr === 'y') {
                    callback();
                } else {
                    console.error('Cancelled.');
                }
            }
        );
    } else {
        callback();
    }
};

const getSalt = (domain, config, callback) => {
    confirmNewSalt(domain, config, () => {
        read(ROUNDS_PROMPT, (error, roundsStr, isDefault) => {
            const rounds = Number(roundsStr);
            if (Number.isFinite(rounds) && rounds >= 10 && rounds <= 30) {
                const salt = bcrypt.genSaltSync(rounds);
                callback(salt);
            } else {
                console.error('Cancelled.');
            }
        });
    });
};

const createSalt = (domain, config) => {
    console.error("Setting salt for domain '" + domain + "'.");

    getSalt(domain, config, (salt) => {
        let newConfig = Object.assign({}, config);
        newConfig[domain] = salt;
        const newConfigStr = JSON.stringify(newConfig, null, 4);

        fs.writeFileSync(CONFIG_FILE, newConfigStr, {
            encoding: 'utf8',
        });

        console.error(
            'Salt saved in ' +
                CONFIG_FILE +
                '.\n' +
                'Be sure to back this up.\n' +
                'It is safe to store this file in a ' +
                'publicly accessible location.'
        );
    });
};

const createCheck = (config) => {
    console.error('Setting up password verification');

    getSalt(CHECK_DOMAIN, config, (salt) => {
        getPassword((master) => {
            const result = hash(master, CHECK_DOMAIN, salt);
            let newConfig = Object.assign({}, config);
            newConfig[CHECK_DOMAIN] = result; // bcrypt results are also salts
            const newConfigStr = JSON.stringify(newConfig, null, 4);

            fs.writeFileSync(CONFIG_FILE, newConfigStr, {
                encoding: 'utf8',
            });

            console.error(
                'Hashed verification saved in ' + CONFIG_FILE + '.\n'
            );
        });
    });
};

main();
