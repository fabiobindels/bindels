const fs = require('fs');
const path = require('path');

/**
 * Parses require statements from a file's content.
 * @param {string} fileContent - The content of the file.
 * @returns {string[]} An array of required module paths.
 */
const parseRequireStatements = fileContent => {
	const requireRegex = /require\(['"](.+?)['"]\)/g;
	let requires = [];
	let match;

	while ((match = requireRegex.exec(fileContent))) {
		requires.push(match[1]);
	}

	return requires;
};

/**
 * Processes a file, resolving its dependencies and updating the dependency map.
 * @param {string} fullPath - The full path of the file.
 * @param {string} directory - The directory of the file.
 * @param {Object} dependencyMap - The map of file dependencies.
 */
const processFile = (fullPath, directory, dependencyMap) => {
	if (!fs.existsSync(fullPath)) return;

	const content = fs.readFileSync(fullPath, 'utf8');
	const dependencies = parseRequireStatements(content);

	const resolvedDependencies = dependencies.map(dep => {
		const resolvedPath = path.resolve(directory, dep);
		return path.extname(resolvedPath) ? resolvedPath : `${resolvedPath}.js`;
	});

	dependencyMap[fullPath] = resolvedDependencies;

	resolvedDependencies.forEach(dep => {
		if (path.extname(dep) === '.js' && !dependencyMap[dep]) {
			processFile(dep, path.dirname(dep), dependencyMap);
		}
	});
};

/**
 * Finds all modules that depend, directly or indirectly, on a specified file.
 * @param {string} filePath - The path of the file.
 * @param {Object} dependencyMap - The map of file dependencies.
 * @returns {string[]} An array of paths of dependent modules.
 */
const findDependentModules = (filePath, dependencyMap) => {
	let parents = new Set();

	const find = currentPath => {
		for (const [file, dependencies] of Object.entries(dependencyMap)) {
			if (dependencies.includes(currentPath)) {
				parents.add(file);
				find(file);
			}
		}
	};

	find(filePath);
	return Array.from(parents);
};

/**
 * Builds a dependency map for all JavaScript files within a directory.
 * @param {string} directory - The directory to process.
 * @returns {Object} A map of file dependencies.
 */
const buildDependencyMap = directory => {
	const items = fs.readdirSync(directory);
	const dependencyMap = {};

	items.forEach(item => {
		const fullPath = path.join(directory, item);
		if (path.extname(item) === '.js') {
			processFile(fullPath, directory, dependencyMap);
		}
	});

	return dependencyMap;
};

module.exports = { buildDependencyMap, findDependentModules, processFile };
