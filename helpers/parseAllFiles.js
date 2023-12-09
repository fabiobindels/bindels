const fs = require('fs');
const path = require('path');
const { directories: dirs } = require('../config.js');
const copyDirectory = require('./copyDirectory.js');
const parseMarkdown = require('./parseMarkdown.js');

const parseAllFiles = (directory = '') => {
	const contentPath = path.join(dirs.content, directory);

	if (directory === 'assets') {
		const distAssetsPath = path.join(dirs.dist, 'assets');
		copyDirectory(contentPath, distAssetsPath);
		return;
	}

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
		} else if (fs.statSync(path.join(contentPath, child)).isDirectory()) {
			const childFiles = parseAllFiles(childPath);
			files = { ...files, ...childFiles };
		}
	}

	return files;
};

module.exports = parseAllFiles;
