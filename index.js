const fs = require('fs');
const path = require('path');
const { parseMarkdown } = require('./helpers.js');
const { directories } = require('./config.js');

const getAllFiles = (directory = '') => {
	return fs
		.readdirSync(path.join(directories.content, directory))
		.filter(
			file =>
				file !== 'index.md' && file.endsWith('.md') && file !== '404.md'
		)
		.map(file =>
			parseMarkdown(path.join(directories.content, directory, file))
		);
};

module.exports = { getAllFiles };
