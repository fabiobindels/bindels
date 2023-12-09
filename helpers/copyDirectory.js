const fs = require('fs');
const path = require('path');

const copyDirectory = (src, dest) => {
	// Create the destination directory if it does not exist
	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
	}

	// Read all the files and subdirectories from source
	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		if (entry.isDirectory()) {
			// If entry is a directory, recursively copy it
			copyDirectory(srcPath, destPath);
		} else {
			// If entry is a file, copy it
			fs.copyFileSync(srcPath, destPath);
		}
	}
};

module.exports = copyDirectory;
