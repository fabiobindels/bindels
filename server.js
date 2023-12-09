const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { directories: dirs } = require('./config.js');
const build = require('./build.js');
const {
	parseMarkdown,
	buildPage,
	getBundledCSS,
	getBundledJS,
	clearRequireCache,
} = require('./helpers.js');

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
		req.url === '/' ? 'index.html' : req.url.split('?')[0]
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

	// Watch for content changes
	fs.watch(dirs.content, { recursive: true }, async (eventType, filename) => {
		if (!filename) {
			return;
		}

		const contentPath = path.join(dirs.content, filename);
		let distPath = path.join(dirs.dist, filename);

		if (!fs.existsSync(contentPath)) {
			distPath = distPath.replace('.md', '.html');

			if (fs.existsSync(distPath)) {
				await fs.promises.rm(distPath);
			}
			notifyClients('reload');
			return;
		}

		if (!filename.endsWith('.md')) {
			fs.copyFile(contentPath, distPath, err => {
				if (err) {
					console.error('Error copying file:', err);
				}
			});

			notifyClients('reload');
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
		if (!html) {
			return;
		}

		const bodyContent = html.match(/<body>([\s\S]*)<\/body>/)[1];
		notifyClients('hmr', bodyContent);
	});

	fs.watch(dirs.markup, { recursive: true }, async (eventType, filename) => {
		if (!filename) {
			return;
		}

		clearRequireCache(path.join(dirs.markup, filename));
		const isBlock = filename.split('/')[0] === 'blocks';

		if (isBlock) {
			mdCache = await build();
			notifyClients('reload');
			return;
		}

		const pagesToUpdate = Object.values(mdCache).filter(page => {
			return page.template.toLowerCase() === filename.replace('.js', '');
		});

		for (const page of pagesToUpdate) {
			buildPage(page);
		}

		notifyClients('reload');
	});

	fs.watch(dirs.styles, { recursive: true }, async (eventType, filename) => {
		if (!filename) {
			return;
		}

		fs.writeFileSync(path.join(dirs.dist, 'styles.css'), getBundledCSS());
		notifyClients('styles');
	});

	fs.watch(dirs.scripts, { recursive: true }, async (eventType, filename) => {
		if (!filename) {
			return;
		}

		fs.writeFileSync(path.join(dirs.dist, 'scripts.js'), getBundledJS());
		notifyClients('reload');
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
