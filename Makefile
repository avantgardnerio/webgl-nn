browserify:
	browserify ./app.js --standalone app -o app.bundle.js --debug 

watchify:
	watchify ./app.js --standalone app -o app.bundle.js --debug 
