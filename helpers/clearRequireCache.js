const clearRequireCache = modulePath => {
	try {
		const resolvedPath = require.resolve(modulePath);
		delete require.cache[resolvedPath];
	} catch (error) {
		console.error(`Error clearing module cache for ${modulePath}:`, error);
	}
};

module.exports = clearRequireCache;
