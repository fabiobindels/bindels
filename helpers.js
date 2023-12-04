const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const { directories: dirs, elements } = require('./config.js');

function parseMarkdown(filePath) {
	const renderer = new marked.Renderer();

	Object.keys(elements).forEach(key => {
		switch (key) {
			case 'code':
				renderer.code = (code, infostring) => {
					const lang = (infostring || '').match(/\S*/)[0];
					const modulePath = path.join(dirs.markup, elements[key]);

					clearRequireCache(modulePath);
					const updatedModule = require(modulePath);

					return updatedModule(code, lang);
				};
				break;
			// other cases...
		}
	});

	marked.use({ renderer });

	let content = fs.readFileSync(filePath, 'utf-8');
	let slug = path.basename(filePath, path.extname(filePath)); // Get the file name without the extension

	const metadataRegex = /---\s*\n([\s\S]+?)\n---/;
	const match = metadataRegex.exec(content);

	const metadata = {};

	if (match) {
		const metaDataLines = match[1].split('\n');

		let key = '';
		let value = '';

		metaDataLines.forEach(line => {
			if (line.trim() === '') return; // Skip empty lines

			// Detect if the line starts with a key (i.e., it has a colon).
			if (/:/.test(line)) {
				// If there was a previous key, save it before starting a new one
				if (key) {
					metadata[key.trim()] = value.trim().replace(/\\n/g, ' ');
				}

				// Start a new key-value pair
				[key, ...value] = line.split(':');
				value = value.join(':');
			} else {
				// It's a multiline value, so append this line to the current value
				value += `\n${line}`;
			}
		});

		// Catch any remaining key-value pair after the loop
		if (key) {
			metadata[key.trim()] = value.trim().replace(/\\n/g, ' ');
		}

		content = content.replace(match[0], ''); // Remove the front-matter from the content
	}

	if (!metadata.title) {
		const headingRegex = /^#\s+(.+)(\r?\n|$)/m;
		const headingMatch = headingRegex.exec(content);

		if (headingMatch) {
			metadata.title = headingMatch[1].trim();
		}
	}

	content = marked.parse(content);
	content = content.replace(
		/<!--\s*include\s+([^\s]+)\s*-->/g,
		(match, componentFileName) => {
			const componentPath = path.join(
				dirs.markup,
				'blocks',
				`${componentFileName}.js`
			);
			const component = require(componentPath);

			if (typeof component !== 'function') {
				console.error(
					`Component ${componentFileName} is not a function.`
				);
			}

			return component();
		}
	);

	return {
		...metadata,
		slug,
		content,
	};
}

const getAllJsFiles = dir => {
	let files = fs.readdirSync(dir);
	let jsFiles = [];

	files.forEach(file => {
		let filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			jsFiles = jsFiles.concat(getAllJsFiles(filePath));
		} else if (file.endsWith('.js')) {
			jsFiles.push(filePath);
		}
	});

	return jsFiles;
};

const getAllCssFiles = dir => {
	let files = fs.readdirSync(dir);
	let cssFiles = [];

	files.forEach(file => {
		let filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			cssFiles = cssFiles.concat(getAllCssFiles(filePath));
		} else if (file.endsWith('.css')) {
			cssFiles.push(filePath);
		}
	});

	return cssFiles;
};

const getBundledCSS = () => {
	let cssContent = '';
	const cssFiles = getAllCssFiles(dirs.styles);
	cssFiles.forEach(filePath => {
		let fileContent = fs.readFileSync(filePath, 'utf-8');
		cssContent += fileContent;
	});

	return cssContent;
};

const getBundledJS = () => {
	let jsContent = '';
	const initFilePath = path.join(dirs.scripts, 'init.js');

	// Check if init.js exists
	if (!fs.existsSync(initFilePath)) {
		console.error(
			'Error: init.js file does not exist in the scripts directory.'
		);
		return ''; // Return an empty string or handle the error as needed
	}

	const jsFiles = getAllJsFiles(dirs.scripts);

	// First, bundle other JS files
	jsFiles.forEach(filePath => {
		if (filePath !== initFilePath) {
			// Skip init.js for now
			let fileContent = fs.readFileSync(filePath, 'utf-8');
			jsContent += fileContent;
		}
	});

	// Then, append init.js content at the end
	let initFileContent = fs.readFileSync(initFilePath, 'utf-8');
	jsContent += initFileContent;
	if (process.env.NODE_ENV === 'development') {
		jsContent += `
			const socket = new WebSocket('ws://localhost:3000');
			socket.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);

				if (data.type === 'hmr') {
					function normalizeHTML(html) {
						return html.replace(/\s+/g, ' ').trim();
					}

					const oldContent = normalizeHTML(document.body.innerHTML);
					document.body.innerHTML = data.content;
					const newContent = normalizeHTML(document.body.innerHTML);

					if (oldContent === newContent) {
						window.location.reload();
					}
				} else if (data.type === 'styles') {
					const link = document.querySelector('link[rel="stylesheet"]');
					link.href = link.href.split('?')[0] + '?' + Date.now();
				} else if (data.type === 'reload') {
					window.location.reload();
				}
			});
		`;
	}

	return jsContent;
};

const parseAllFiles = (directory = '') => {
	const contentPath = path.join(dirs.content, directory);
	const content = fs.readdirSync(contentPath);

	let files = {};

	for (const child of content) {
		const childPath = path.join(directory, child);
		if (child.endsWith('.md')) {
			const page = parseMarkdown(path.join(dirs.content, childPath));

			page.destination = path.join(
				dirs.dist,
				directory,
				page.slug + '.html'
			);

			files[page.slug] = page;
		} else {
			const childFiles = parseAllFiles(childPath);
			files = { ...files, ...childFiles };
		}
	}

	return files;
};

const buildPage = page => {
	if (!page.template) {
		console.error('Error: No template specified for', page.slug);
	}

	const templateName = page.template.toLowerCase() + '.js';
	const template = require(path.join(dirs.markup, templateName));
	const html = template(page);

	fs.mkdirSync(path.dirname(page.destination), { recursive: true });
	fs.writeFileSync(page.destination, html);

	return html;
};

function clearRequireCache(modulePath) {
	const resolvedPath = require.resolve(modulePath);
	delete require.cache[resolvedPath];
}

module.exports = {
	parseMarkdown,
	getBundledCSS,
	getBundledJS,
	parseAllFiles,
	buildPage,
	clearRequireCache,
};
