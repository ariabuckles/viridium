assert = require "assert"
fs = require "fs"
path = require "path"
read = require "read"
bcrypt = require "bcrypt-nodejs"

// Configurable Params
SEPARATOR = ' '
NUM_ROUNDS = 15
RESULT_LENGTH = 20

// Constants
SECONDS_PER_MINUTE = 60
MS_PER_SECOND = 1000
BCRYPT_HASH_LENGTH = 60
DEFAULT_ROUNDS = 15

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
    prompt: "number of rounds"
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND
    output: process.stderr
    default: String DEFAULT_ROUNDS
}

// Grab the command line arguments passed after this program is run
getArgs = [
    this_program_filename = path.basename __filename
    this_program_regex = new RegExp (this_program_filename + "$")

    // Look for our filename in the arguments list
    exe_index = (process.argv.map [ arg |
        ret this_program_regex.test arg
    ]).indexOf true

    // And return the arguments listed after our filename
    ret process.argv.slice (exe_index + 1)
]

HOME = process.env.HOME or process.env.HOMEPATH or process.env.USERPROFILE
CONFIG_FILE = HOME + "/.viridium.json"

createNewConfig = [
    read ROUNDS_PROMPT [ error roundsStr isDefault |
        rounds = if isDefault [DEFAULT_ROUNDS] else [
            ret ((String roundsStr) or DEFAULT_ROUNDS)
        ]

        salt = bcrypt.genSaltSync rounds

        fs.writeFileSync CONFIG_FILE (JSON.stringify {
            default: salt
        } null 4) {encoding: 'utf8'}

        console.error (
            "Salt saved in " + CONFIG_FILE + ". " +
            "Be sure to back this up. It is safe to store this file in a " +
            "publicly accessible location."
        )
    ]
]

main = [ salt |
    domain = getArgs().join SEPARATOR

    read PROMPT [ error master isDefault |
        // Check for "", timeout, or escaping with Ctrl-C
        isError = (error != null and error != undefined)
        isEmpty = isDefault or (master == "")
        isDomainEmpty = (domain == "")

        isValid = not (isError or isEmpty or isDomainEmpty)

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

if (fs.existsSync CONFIG_FILE) [
    configStr = fs.readFileSync CONFIG_FILE {encoding: 'utf8'}
    config = JSON.parse configStr
    main config.default
] else createNewConfig

