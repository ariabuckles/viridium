#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const read = require('read');

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

const PROMPT = {
    prompt: 'password: ',
    silent: true,
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
    output: process.stderr, // We prompt on stderr, so that stdout is exactly
    // the result password
    default: ''
};

const ROUNDS_PROMPT = {
    prompt: 'number of rounds (15 recommended):',
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
    output: process.stderr
};

const HOME =
    process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const CONFIG_FILE = HOME + '/.viridium.json';

const getPassword = (domain, salt) => {
    read(PROMPT, (error, master, isDefault) => {
        // Check for "", timeout, or escaping with Ctrl-C
        const isError = error != null;
        const isEmpty = isDefault || master === '';

        const isValid = !(isError || isEmpty);

        if (isValid) {
            const result = bcrypt.hashSync(master + SEPARATOR + domain, salt);
            assert(result.length === BCRYPT_HASH_LENGTH);

            // The first 28 characters of the result are roughly the salt.
            // We grab RESULT_LENGTH characters from the tail of the result string
            assert(RESULT_LENGTH <= 32);
            const slicedResult = result.slice(-RESULT_LENGTH);

            // And send that on stdout
            console.log(slicedResult);
        }
    });
};

const main = () => {
    commander.parseExpectedArgs(['<domain>']);
    commander.version(package_.version);
    commander.option(
        '-s, --salt',
        "generate a salt for the specified domain, or 'default'"
    );
    commander.parse(process.argv);

    const configExists = fs.existsSync(CONFIG_FILE);
    const shouldSetupSalt = commander.salt || !configExists;
    if (commander.args.length === 0 && !shouldSetupSalt) {
        commander.help();
    }

    const config = configExists
        ? JSON.parse(fs.readFileSync(CONFIG_FILE, { encoding: 'utf8' }))
        : DEFAULT_CONFIG;

    const domain = commander.args.join(SEPARATOR);
    const salt = config[domain] || config.default;
    if (shouldSetupSalt || !salt) {
        const saltDomain = domain !== '' && configExists ? domain : 'default';
        createSalt(saltDomain, config);
    } else if (domain !== '') {
        getPassword(domain, salt);
    }
};

const verifyDomain = (domain, config, callback) => {
    if (config[domain]) {
        read(
            {
                prompt:
                    "The domain '" +
                    domain +
                    "' already has a salt!\n" +
                    'Are you sure you want to overwrite it? [y/N]',
                timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND,
                output: process.stderr
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

const createSalt = (domain, config) => {
    console.error("Setting salt for domain '" + domain + "'.");

    verifyDomain(domain, config, () => {
        read(ROUNDS_PROMPT, (error, roundsStr, isDefault) => {
            const rounds = Number(roundsStr);
            if (Number.isFinite(rounds) && rounds >= 10 && rounds <= 30) {
                const salt = bcrypt.genSaltSync(rounds);

                let newConfig = Object.assign({}, config);
                newConfig[domain] = salt;
                const newConfigStr = JSON.stringify(newConfig, null, 4);

                fs.writeFileSync(CONFIG_FILE, newConfigStr, {
                    encoding: 'utf8'
                });

                console.error(
                    'Salt saved in ' +
                        CONFIG_FILE +
                        '.\n' +
                        'Be sure to back this up.\n' +
                        'It is safe to store this file in a ' +
                        'publicly accessible location.'
                );
            } else {
                console.error('Cancelled.');
            }
        });
    });
};

main();
