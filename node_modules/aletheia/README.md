aletheia
========

Aletheia is an experimental compiled-to-javascript programming language.

##### The goals of aletheia are to:
1. encourage safety
2. be concise
3. interop with javascript seamlessly

For 1 and 2, Aletheia's philosopy is to "make correct things easy, but make
incorrect things hard". For example, immutable variables require no prefix
to declare them. However, mutable variables require a prefix for both
declaration and mutation.

##### Language features:
 * variables are immutable and local by default
 * extremely concise lambda syntax encourages a functional programming style
 * extensible control-flow structures

##### Aletheia is quite alpha.

We're still missing some basic things, which we intend to implement in the
future:
 * for loops (but you could write your own!)
 * compile time enforcement of immutability, references, or well, anything, yet :)
 * `return`ing from a function inside an if-block
 * macros
 * types

## Examples
### if statements

    if ((1 + 1) == 2) [
        console.log "correct!"
    ]
    
### while loops

    mutable i = 0
    while [ret (i < 10)] [  // this is not the final syntax
        console.log i
        mutate i = i + 1
    ]

### function calls

    console.log "arg1" "arg2"

### function declarations

    f = [ n | ret n + 1 ]
    console.log (f 4)  // prints 5

### fibonacci

    fib = [ n |
        mutable a = 1
        mutable b = 0
        mutable i = 0
        while [ret (i < n)] [
            old_b = b
            mutate b = a + b
            mutate a = old_b
            mutate i = i + 1
        ]
        ret b
    ]
    
## Setup / Installation

Aletheia is quite unstable currently, but if you'd like to play with it (which I pretty much don't recommend at this point), the setup instructions are:

To install the current semistable library version of the compiler

    npm install -g aletheia
    alc <input_file.al> <output_file.js>

To install the current (unstable) library version of the compiler

    npm install -g git://github.com/jacktoole1/aletheia.git
    alc <input_file.al> <output_file.js>

To run the library compiler from the git repo:

    git clone https://github.com/jacktoole1/aletheia.git
    ./aletheia/lib/aletheia/alc <source .al input file> <destination .js output file>

To create the latest bootstrapped compiler:

    git clone https://github.com/jacktoole1/aletheia.git
    cd aletheia/
    npm install
    make build
    make test  # to run the tests
    ./build/alc [source .al input file] [destination .js output file]  # our created compiler
