#!/usr/bin/env node
const build = require('./build.js');
const startServer = require('./server.js');

const args = process.argv.slice(2);

if (args.includes('--build')) {
	const buildStart = Date.now();
	build()
		.then(() => {
			const buildEnd = Date.now();
			const buildTime = buildEnd - buildStart;
			console.log('\u001b[32m', `Build completed in ${buildTime}ms.`);
		})
		.catch(error => {
			console.error('Error during build:', error);
		});
}

if (args.includes('--serve')) {
	startServer();
}
