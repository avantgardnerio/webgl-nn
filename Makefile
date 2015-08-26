browserify:
	browserify ./app.js --standalone app -o app.bundle.js --debug 

watchify:
	watchify ./app.js --standalone app -o app.bundle.js --debug 

debug: 
	watchify ./app.js --standalone app -o app.bundle.js --debug && static

deps:
	npm install browserify watchify node-static
