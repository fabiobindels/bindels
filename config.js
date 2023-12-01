const path = require('path');

// bindels.config.js in bindels package
const defaultConfig = {
	paths: {
		markup: './markup',
		content: './content',
		styles: './styles',
		scripts: './scripts',
		dist: './dist',
	},
	elements: {},
	templates: {},
};

let userConfig = {};
try {
	// Assuming the user config file is named 'bindels.config.js' and is located in the root of the user's project
	userConfig = require(path.join(process.cwd(), 'bindels.config.js'));
} catch (error) {
	console.warn(
		'Warning: No user configuration file (bindels.config.js) found. Using default configuration.'
	);
}

const config = { ...defaultConfig, ...userConfig };
const { paths, templates, elements } = config;

const directories = {
	markup: path.join(process.cwd(), paths.markup),
	content: path.join(process.cwd(), paths.content),
	styles: path.join(process.cwd(), paths.styles),
	scripts: path.join(process.cwd(), paths.scripts),
	dist: path.join(process.cwd(), paths.dist),
};

module.exports = { config, directories, elements, templates };
