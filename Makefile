.PHONY: start create-db bootstrap test watch;

start:
	node index.js

bootstrap:
	npm install

create-db:
	node /db/create.js

test:
	jest

watch:
	nodemon index.js