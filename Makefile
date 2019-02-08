.PHONY: start create-db bootstrap test watch start-worker;
BIN= ./node_modules/.bin

start:
	NODE_ENV=production node index.js

bootstrap:
	npm install

create-db:
	node /db/create.js

test:
	standard
	jest

watch:
	NODE_ENV=development $(BIN)/nodemon index.js

start-worker:
	ROLE=worker node index.js
