const clearRequireCache = modulePath => {
	try {
		delete require.cache[modulePath];
	} catch (error) {
		console.error(`Error clearing module cache for ${modulePath}:`, error);
	}
};

module.exports = clearRequireCache;
