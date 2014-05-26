# Meta-commands
build: build/alc jison copyjs compileal

.PHONY: install
install:
	npm install

.PHONY: test
test: build
	mocha -R spec build/*-test.js

.PHONY: clean
clean:
	-rm -rf ./build/

# ./lib updating
.PHONY: compiler
compiler: lib/aletheia
lib/aletheia: clean build
	@mkdir -p ./lib
	-rm -rf ./lib/aletheia
	cp -R ./build ./lib/aletheia

# Compilation variables
AL_COMPILER := ./lib/aletheia/alc
AL_SOURCE_FILES := $(wildcard al/*.al)
JS_SOURCE_FILES := $(wildcard js/*.js)
AL_OUTPUT_FILES := $(AL_SOURCE_FILES:al/%.al=build/%.js)
JS_OUTPUT_FILES := $(JS_SOURCE_FILES:js/%.js=build/%.js)
OUTPUT_FILES := build/parser.js $(JS_OUTPUT_FILES) $(AL_OUTPUT_FILES)

# JS meta-rule
.PHONY: copyjs
copyjs: $(JS_OUTPUT_FILES)
$(JS_OUTPUT_FILES): build/%.js: js/%.js
	@mkdir -p ./build
	cp $< $@

# Jison meta-rule
.PHONY: jison
jison: build/parser.js

build/parser.js: build/parser-generator.js
	@mkdir -p ./build
	-rm -f ./build/parser.js
	node build/parser-generator.js -o build/parser.js

build/parser-generator.js: jison/parser-generator.al
	@mkdir -p ./build
	$(AL_COMPILER) $< $@

# Al meta-rule
.PHONY: compileal
compileal: $(AL_OUTPUT_FILES) $(AL_COMPILER)

$(AL_OUTPUT_FILES): build/%.js: al/%.al
	@mkdir -p ./build
	$(AL_COMPILER) $< $@

# CLI meta-rule
build/alc: $(OUTPUT_FILES)
	echo '#!/usr/bin/env node' > build/alc
	cat build/alc.js >> build/alc
	chmod u+x build/alc

