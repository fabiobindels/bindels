const fs = require('fs');
const http = require('http');
const path = require('path');
const { directories: dirs, notFoundFile } = require('./config.js');
const watchContent = require('./helpers/fileWatchers.js');
const build = require('./build.js');
const { WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
	default: 'application/octet-stream',
	html: 'text/html; charset=UTF-8',
	js: 'application/javascript',
	css: 'text/css',
	png: 'image/png',
	jpg: 'image/jpg',
	gif: 'image/gif',
	ico: 'image/x-icon',
	svg: 'image/svg+xml',
};

const fileExists = async filePath => {
	try {
		await fs.promises.access(filePath);
		return true;
	} catch {
		return false;
	}
};

const getMimeType = ext => MIME_TYPES[ext] || MIME_TYPES.default;

const prepareFile = async url => {
	let filePath = path.join(dirs.dist, url.endsWith('/') ? 'index.html' : url);
	if (!path.extname(filePath) && (await fileExists(`${filePath}.html`))) {
		filePath += '.html';
	}

	const isPathTraversal = !filePath.startsWith(dirs.dist);
	const found = !isPathTraversal && (await fileExists(filePath));
	return { found, filePath };
};

const startServer = async () => {
	await build();
	const server = http
		.createServer(async (req, res) => {
			try {
				const { found, filePath } = await prepareFile(req.url);
				const streamPath = found
					? filePath
					: path.join(dirs.dist, notFoundFile || '404.html');
				const ext = path.extname(streamPath).substring(1).toLowerCase();
				const mimeType = getMimeType(ext);

				res.writeHead(found ? 200 : 404, { 'Content-Type': mimeType });
				const stream = fs.createReadStream(streamPath);
				stream.pipe(res);
				stream.on('error', err => {
					console.error('Stream error', err);
					res.writeHead(500, { 'Content-Type': 'text/plain' });
					res.end('Internal server error');
				});
			} catch (error) {
				console.error('Request handling error', error);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end('Internal server error');
			}
		})
		.listen(PORT, () => {
			console.log(
				`\x1b[32mServer running at http://localhost:${PORT}/\x1b[0m`
			);
		});

	const wss = new WebSocket.Server({ noServer: true });

	server.on('upgrade', (request, socket, head) => {
		wss.handleUpgrade(request, socket, head, ws => {
			wss.emit('connection', ws, request);
		});
	});

	await watchContent(wss);
};

module.exports = startServer;
