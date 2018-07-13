.PHONY: start create-db bootstrap test watch;
BIN= ./node_modules/.bin

start:
	node index.js

bootstrap:
	npm install

create-db:
	node /db/create.js

test:
	standard
	jest

watch:
	$(BIN)/nodemon index.js