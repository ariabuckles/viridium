viridium
========

a stateless password manager

First time usage:

    viridium

This will prompt you for the log of number of bcrypt rounds to hash
your passwords with. A higher number makes viridium take longer to
run but makes your passwords more secure. This command will create
a bcrypt salt in your home directory in a .viridium.json file. Be
sure to store this file in a place you will have access to in the
future. Because this file is just a salt, it should be safe to store
it in a publicly accessible location (such as a github dotfiles
repository), which is recommended.

General usage:

    viridium <domain> [<additional salts>]

This will prompt for a master password, and hash it with `<domain>`
and the salt stored in your ~/.viridium.json file using bcrypt.
Note that the master password will not be displayed as you type.
For example, to get your google.com password, you would type:

    > viridium google.com

which would prompt for your master password:

    password:

After typing your master password, viridium will output a hashed
password specific to google.com, looking something like:

    67q4opPqEVO/fMnAfela

(your actual password will be different).

viridium doesn't store any information about your passwords, either on
your computer or elsewhere. The salt file in ~/.viridium.json is only a
configuration file, which makes rainbow table attacks infeasible, and
releasing this information to an attacker does not make your passwords
significantly less secure. Because viridium simply hashes your master
password with the url and this file, you can use it to retrieve
(regenerate) your passwords on any computer where you can install it
and your hash file, and the command to generate a password for a new
domain is the same as the command to retrieve a password for a previous
domain.
