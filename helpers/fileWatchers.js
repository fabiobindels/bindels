const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const build = require('../build');
const { directories } = require('../config');
const clearRequireCache = require('./clearRequireCache');

const watchFiles = async wss => {
	let debounceTimer;
	const notifyClients = (delay = 100) => {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			wss.clients.forEach(client => {
				if (client.readyState === WebSocket.OPEN) {
					client.send(JSON.stringify({ type: 'reload' }));
				}
			});
		}, delay);
	};

	fs.watch(
		process.cwd(),
		{ recursive: true },
		async (eventType, filename) => {
			try {
				if (
					filename.startsWith('dist') ||
					filename.startsWith('.git')
				) {
					return;
				}

				const fullPath = path.resolve(process.cwd(), filename);
				if (fs.existsSync(fullPath)) {
					if (filename.startsWith('markup')) {
						const markupFiles = fs.readdirSync(directories.markup);

						for (const file of markupFiles) {
							if (path.extname(file) !== '.js') continue;
							clearRequireCache(
								path.join(directories.markup, file)
							);
						}

						clearRequireCache(fullPath);
					}

					await build();
					console.log(`File ${filename} changed.`);
					notifyClients();
				}
			} catch (error) {
				console.error(
					`Error processing file change for ${filename}:`,
					error
				);
			}
		}
	);

	notifyClients();
};

module.exports = watchFiles;
