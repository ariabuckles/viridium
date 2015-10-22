.PHONY: all build clean

all: build

AL_COMPILER = ./node_modules/.bin/alc
AL_SOURCE_FILES := $(wildcard *.al)
AL_OUTPUT_FILES := $(AL_SOURCE_FILES:%.al=%.js)
ENTRY_POINT = pass.js

build: viridium

viridium: $(AL_OUTPUT_FILES)
	echo '#!/usr/bin/env node' > viridium
	cat $(ENTRY_POINT) >> viridium
	chmod u+x viridium

$(AL_OUTPUT_FILES): %.js: %.al node_modules
	$(AL_COMPILER) $< $@

clean:
	rm -rf viridium $(AL_OUTPUT_FILES)
