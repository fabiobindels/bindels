const fs = require('fs');
const path = require('path');
const { directories } = require('./config.js');
const parseMarkdown = require('./helpers/parseMarkdown.js');

const getAllFiles = (directory = '') => {
	const contentPath = path.join(directories.content, directory);

	return fs
		.readdirSync(contentPath, { withFileTypes: true }) // Get directory entries as fs.Dirent objects
		.filter(
			dirent =>
				dirent.isFile() &&
				dirent.name !== 'index.md' &&
				dirent.name.endsWith('.md') &&
				dirent.name !== '404.md'
		)
		.map(dirent => parseMarkdown(path.join(contentPath, dirent.name)));
};

module.exports = { getAllFiles };
