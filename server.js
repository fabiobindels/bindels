const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { directories: dirs } = require('./config.js');
const build = require('./build.js');
const { parseMarkdown, buildPage } = require('./helpers.js');

const wss = new WebSocket.Server({ noServer: true });

function notifyClients(type, content) {
	wss.clients.forEach(client => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(JSON.stringify({ type, content }));
		}
	});
}

const server = http.createServer((req, res) => {
	let filePath = path.join(
		dirs.dist,
		req.url === '/' ? 'index.html' : req.url
	);

	const ext = path.extname(filePath);
	let contentType = 'text/html';

	switch (ext) {
		case '.css':
			contentType = 'text/css';
			break;
		case '.js':
			contentType = 'text/javascript';
			break;
		case '.html':
			contentType = 'text/html';
			break;
		default:
			filePath += '.html';
	}

	fs.promises
		.readFile(filePath, 'utf-8')
		.then(content => {
			res.writeHead(200, { 'Content-Type': contentType });
			res.end(content, 'utf-8');
		})
		.catch(() => {
			fs.promises
				.readFile(path.join(dirs.dist, '404.html'), 'utf-8')
				.then(content => {
					res.writeHead(404, { 'Content-Type': 'text/html' });
					res.end(content, 'utf-8');
				})
				.catch(err => {
					console.error('Error reading 404.html:', err);
				});
		});
});

function startServer() {
	let mdCache = [];

	server.on('upgrade', (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, ws => {
			wss.emit('connection', ws, request);
		});
	});

	const workingDir = process.cwd();
	// Watch for content changes
	fs.watch(dirs.content, { recursive: true }, async (eventType, filename) => {
		if (!filename) {
			return;
		}

		const page = parseMarkdown(path.join(dirs.content, filename));

		page.destination = path.join(
			dirs.dist,
			filename.replace('.md', '.html')
		);

		mdCache[page.slug] = page;

		const html = buildPage(page);
		// Get content from the body tag
		const bodyContent = html.match(/<body>([\s\S]*)<\/body>/)[1];
		notifyClients('hmr', bodyContent);
	});

	fs.watch(workingDir, { recursive: true }, async (eventType, filename) => {
		if (filename) {
			// Check if the change is not in the dirs.dist directory
			const fullPath = path.resolve(workingDir, filename);
			if (
				!fullPath.startsWith(dirs.dist) &&
				!fullPath.startsWith(dirs.content)
			) {
				console.log(`Change detected: ${filename}`);
				try {
					await build(); // Ensure build function is awaited
					notifyClients();
				} catch (error) {
					console.error('Error during build:', error);
				}
			}
		}
	});

	server.listen(3000, async () => {
		try {
			mdCache = await build(); // Initial build (returns parsed markdown files)
			console.log(
				'\u001b[32m',
				'Server listening on http://localhost:3000'
			);
		} catch (error) {
			console.error('Error during initial build:', error);
		}
	});
}

module.exports = startServer;
