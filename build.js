const path = require('path');
const fs = require('fs');
const {
	getBundledCSS,
	getBundledJS,
	parseAllFiles,
	buildPage,
} = require('./helpers.js');
const { directories: dirs } = require('./config.js');

const removeOldFiles = async (directory = '') => {
	try {
		await fs.promises.access(path.join(dirs.content, directory));
	} catch {
		await fs.promises.rm(path.join(dirs.dist, directory), {
			recursive: true,
		});
		return;
	}

	const content = await fs.promises.readdir(
		path.join(dirs.content, directory)
	);
	const dist = await fs.promises.readdir(path.join(dirs.dist, directory));

	for (const item of dist) {
		const distPath = path.join(dirs.dist, directory, item);
		if (
			item.endsWith('.html') &&
			!content.includes(item.replace('.html', '.md'))
		) {
			await fs.promises.unlink(distPath);
		} else if (!['.css', '.js', '.html'].some(ext => item.endsWith(ext))) {
			await removeOldFiles(path.join(directory, item));
		}
	}
};

const buildAssets = async () => {
	await fs.promises.writeFile(
		path.join(dirs.dist, 'styles.css'),
		getBundledCSS()
	);
	await fs.promises.writeFile(
		path.join(dirs.dist, 'scripts.js'),
		getBundledJS()
	);
};

const build = async () => {
	await fs.promises.mkdir(dirs.dist, { recursive: true });
	const pages = parseAllFiles();

	for (const slug in pages) {
		const page = pages[slug];
		buildPage(page);
	}

	await Promise.all([removeOldFiles(), buildAssets()]);

	return pages;
};

module.exports = build;
