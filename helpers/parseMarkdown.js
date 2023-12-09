const fs = require('fs');
const path = require('path');
const marked = require('marked');
const { directories: dirs, elements } = require('../config.js');
const clearRequireCache = require('./clearRequireCache.js');

const parseMarkdown = filePath => {
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
};

module.exports = parseMarkdown;
