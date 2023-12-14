const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const build = require('../build');
const { directories: dirs } = require('../config');
const clearRequireCache = require('./clearRequireCache');
const { getBundledCSS, getBundledJS } = require('./bundlers');
const { buildDependencyMap, findDependentModules } = require('./dependencyMap');

const watchFiles = async wss => {
	let debounceTimer;
	let watchTimer;

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
		if (watchTimer) return;

		// When renaming a file, two events are fired: one for the old name and one for the new name.
		// We only want to handle one of them. because it causes an error
		watchTimer = setTimeout(() => {
			watchTimer = null;
		}, 50);

		if (!(filename.endsWith('.md') || filename.endsWith('.js'))) return;
		try {
			if (filename.endsWith('.js')) {
				const fullPath = path.resolve(dirs.markup, filename);
				const dependentModules = findDependentModules(
					fullPath,
					dependencyMap
				);

				clearRequireCache(fullPath);
				dependentModules.forEach(module => {
					clearRequireCache(module);
				});
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
	fs.watch(dirs.markup, { recursive: true }, async (eventType, filename) => {
		if (watchTimer) return;

		// When renaming a file, two events are fired: one for the old name and one for the new name.
		// We only want to handle one of them. because it causes an error
		watchTimer = setTimeout(() => {
			watchTimer = null;
		}, 50);

		if (!filename.endsWith('.js')) return;
		try {
			const fullPath = path.resolve(dirs.markup, filename);
			const dependencyMap = buildDependencyMap(dirs.markup);
			const dependentModules = findDependentModules(
				fullPath,
				dependencyMap
			);

			clearRequireCache(fullPath);
			dependentModules.forEach(module => {
				clearRequireCache(module);
			});

			await build();
			console.log(`File ${filename} changed.`);
			notifyClients();
		} catch (error) {
			console.error(
				`Error processing file change for ${filename}:`,
				error
			);
		}
	});

	// Watch for changes in the content directory
	fs.watch(dirs.content, { recursive: true }, async (eventType, filename) => {
		if (!filename.endsWith('.md')) return;

		try {
			await build();
			console.log(`File ${filename} changed.`);
			notifyClients();
		} catch (error) {
			console.error(
				`Error processing file change for ${filename}:`,
				error
			);
		}
	});

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
