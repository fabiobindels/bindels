const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const build = require('../build');
const { directories: dirs } = require('../config');
const clearRequireCache = require('./clearRequireCache');
const { getBundledCSS, getBundledJS } = require('./bundlers');

const watchFiles = async wss => {
	let debounceTimer;
	const notifyClients = (type = 'reload', delay = 100) => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			wss.clients.forEach(client => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type }));
				}
			});
		}, delay);
	};

	const handleFileChange = async (eventType, filename) => {
		if (!(filename.endsWith('.md') || filename.endsWith('.js'))) return;
		try {
			if (filename.endsWith('.js')) {
				const markupFiles = fs.readdirSync(dirs.markup);

				for (const file of markupFiles) {
					if (path.extname(file) !== '.js') continue;
					clearRequireCache(path.join(dirs.markup, file));
				}

				const fullPath = path.resolve(dirs.markup, filename);
				clearRequireCache(fullPath);
			}

			await build();
			console.log(`File ${filename} changed.`);
			notifyClients();
		} catch (error) {
			console.error(
				`Error processing file change for ${filename}:`,
				error
			);
		}
	};

	// Watch for changes in the styles directory
	fs.watch(dirs.styles, { recursive: true }, async (eventType, filename) => {
		if (!filename.endsWith('.css')) return;

		await fs.promises.writeFile(
			path.join(dirs.dist, 'styles.css'),
			getBundledCSS()
		);

		console.log(`File ${filename} changed.`);
		notifyClients('styles');
	});

	// Watch for changes in the scripts directory
	fs.watch(dirs.scripts, { recursive: true }, async (eventType, filename) => {
		if (!filename.endsWith('.js')) return;

		await fs.promises.writeFile(
			path.join(dirs.dist, 'scripts.js'),
			getBundledJS()
		);

		console.log(`File ${filename} changed.`);
		notifyClients();
	});

	// Watch for changes in the markup directory
	fs.watch(dirs.markup, { recursive: true }, handleFileChange);

	// Watch for changes in the content directory
	fs.watch(dirs.content, { recursive: true }, handleFileChange);

	// Watch for changes in the config file
	fs.watch(
		path.join(process.cwd(), 'bindels.config.js'),
		async (eventType, filename) => {
			if (filename !== 'config.js') return;

			console.log('Config file changed. Restarting server...');
			process.exit();
		}
	);

	notifyClients();
};

module.exports = watchFiles;
