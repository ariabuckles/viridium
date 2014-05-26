assert = require "assert"
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
EMPTY_SALT = '$2a$' + NUM_ROUNDS + '$0000000000000000000000'

PROMPT = {
    prompt: "password: "
    silent: true
    timeout: 5 * SECONDS_PER_MINUTE * MS_PER_SECOND
    output: process.stderr  // We prompt on stderr, so that stdout is exactly
                            // the result password
    default: ""
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

domain = getArgs().join SEPARATOR

read PROMPT [ error master isDefault |
    // Check for "", timeout, or escaping with Ctrl-C
    isError = (error != null and error != undefined)
    isEmpty = isDefault or (master == "")
    isDomainEmpty = (domain == "")

    isValid = not (isError or isEmpty or isDomainEmpty)

    if isValid [
        // We use the EMPTY_SALT only to specify the round num. We can't
        // traditionally salt here, since we're not storing this result
        // anywhere. Instead, we "salt" with the domain
        result = bcrypt.hashSync (master + SEPARATOR + domain) EMPTY_SALT
        assert (result.length == BCRYPT_HASH_LENGTH)

        // The first 28 characters of the result are roughly the salt.
        // We grab RESULT_LENGTH characters from the tail of the result string
        assert (RESULT_LENGTH <= 32)
        slicedResult = result.slice (-RESULT_LENGTH)

        // And send that on stdout
        console.log slicedResult
    ]
]
