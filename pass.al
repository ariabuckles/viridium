assert = require "assert"
fs = require "fs"
path = require "path"
read = require "read"

bcrypt = require "bcrypt-nodejs"
commander = require "commander"
u = require "underscore"

package = require "./package.json"

// Configurable Params
SEPARATOR = ' '
NUM_ROUNDS = 15
RESULT_LENGTH = 20

// Constants
SECONDS_PER_MINUTE = 60
MS_PER_SECOND = 1000
BCRYPT_HASH_LENGTH = 60
DEFAULT_ROUNDS = 15
DEFAULT_CONFIG = {}

process = global.process

PROMPT = {
    prompt: "password: "
    silent: true
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND
    output: process.stderr  // We prompt on stderr, so that stdout is exactly
                            // the result password
    default: ""
}

ROUNDS_PROMPT = {
    prompt: "number of rounds (15 recommended):"
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND
    output: process.stderr
}

HOME = process.env.HOME or process.env.HOMEPATH or process.env.USERPROFILE
CONFIG_FILE = HOME + "/.viridium.json"

main = [
    commander.parseExpectedArgs {'<domain>'}
    commander.version package.version
    commander.option '-s, --salt' "generate a salt for the specified domain, or 'default'"
    commander.parse(process.argv)

    configExists = fs.existsSync CONFIG_FILE
    shouldSetupSalt = commander.salt or (not configExists)
    if (commander.args.length == 0 and (not shouldSetupSalt)) [
        commander.help()
    ]

    config = if configExists [
        configStr = fs.readFileSync CONFIG_FILE {encoding: 'utf8'}
        ret JSON.parse configStr
    ] else [DEFAULT_CONFIG]

    domain = commander.args.join SEPARATOR
    salt = config@domain or config.default
    if (shouldSetupSalt or (not salt)) [
        saltDomain = if (domain != "" and configExists) [domain] else ['default']
        createSalt saltDomain config
    ] (domain != "") [
        getPassword domain salt
    ]
]

createSalt = [ domain config |
    console.error (
        "Setting salt for domain '" + domain + "'."
    )

    verifyDomain domain config [
        read ROUNDS_PROMPT [ error roundsStr isDefault |
            rounds = Number roundsStr
            if ((u.isFinite rounds) and rounds >= 10 and rounds <= 30) [

                salt = bcrypt.genSaltSync rounds

                mutable newConfig = u.extend {:} config
                mutate newConfig@domain = salt
                newConfigStr = JSON.stringify newConfig null 4

                fs.writeFileSync CONFIG_FILE newConfigStr {encoding: 'utf8'}

                console.error (
                    "Salt saved in " + CONFIG_FILE + ".\n" +
                    "Be sure to back this up.\n" +
                    "It is safe to store this file in a " +
                    "publicly accessible location."
                )

            ] else [
                console.error "Cancelled."
            ]
        ]
    ]
]

verifyDomain = [ domain config callback |
    if config@domain [
        read {
            prompt: (
                "The domain '" + domain + "' already has a salt!\n" +
                "Are you sure you want to overwrite it? [y/N]"
            )
            timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND
            output: process.stderr
        
        } [ error confirmStr isDefault |
            if ((not error) and (not isDefault) and (confirmStr == 'y')) (
                callback
            ) else [
                console.error "Cancelled."
            ]
        ]
    ] else callback
]

getPassword = [ domain salt |
    read PROMPT [ error master isDefault |
        // Check for "", timeout, or escaping with Ctrl-C
        isError = (error != null and error != undefined)
        isEmpty = isDefault or (master == "")

        isValid = not (isError or isEmpty)

        if isValid [
            result = bcrypt.hashSync (master + SEPARATOR + domain) salt
            assert (result.length == BCRYPT_HASH_LENGTH)

            // The first 28 characters of the result are roughly the salt.
            // We grab RESULT_LENGTH characters from the tail of the result string
            assert (RESULT_LENGTH <= 32)
            slicedResult = result.slice (-RESULT_LENGTH)

            // And send that on stdout
            console.log slicedResult
        ]
    ]
]

main()
