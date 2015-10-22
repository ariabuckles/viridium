viridium
========

a stateless password manager

Usage:

    viridium <domain> [<additional salts>]

This will prompt for a master password, and hash it with `<domain>`
(as well as any `<additional salts>` provided) using bcrypt. Note
that the master password will not be displayed as you type.
For example, to get your google.com password, you would type:

    > viridium google.com

which would prompt for your master password:

    password:

After typing your master password, viridium will output a hashed
password specific to google.com, looking something like:

    67q4opPqEVO/fMnAfela

(your actual password will be different).

viridium doesn't store any state on your computer. Because viridium
simply hashes your master password with the url, you can use it to
retrieve (regenerate) your passwords on any computer where you can
install it, and the command to generate a password for a new domain
is the same as the command to retrieve a password for a previous
domain.
