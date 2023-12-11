const fs = require('fs');
const path = require('path');
const { directories: dirs } = require('../config.js');

const getAllJsFiles = dir => {
	let files = fs.readdirSync(dir);
	let jsFiles = [];

	files.forEach(file => {
		let filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			jsFiles = jsFiles.concat(getAllJsFiles(filePath));
		} else if (file.endsWith('.js')) {
			jsFiles.push(filePath);
		}
	});

	return jsFiles;
};

const getAllCssFiles = dir => {
	let files = fs.readdirSync(dir);
	let cssFiles = [];

	files.forEach(file => {
		let filePath = path.join(dir, file);
		if (fs.statSync(filePath).isDirectory()) {
			cssFiles = cssFiles.concat(getAllCssFiles(filePath));
		} else if (file.endsWith('.css')) {
			cssFiles.push(filePath);
		}
	});

	return cssFiles;
};

const getBundledCSS = () => {
	let cssContent = '';
	const cssFiles = getAllCssFiles(dirs.styles);
	cssFiles.forEach(filePath => {
		let fileContent = fs.readFileSync(filePath, 'utf-8');
		cssContent += fileContent;
	});

	return cssContent;
};

const getBundledJS = () => {
	let jsContent = '';
	const initFilePath = path.join(dirs.scripts, 'init.js');

	if (!fs.existsSync(initFilePath)) {
		console.error(
			'Error: init.js file does not exist in the scripts directory.'
		);
		return '';
	}

	const jsFiles = getAllJsFiles(dirs.scripts);

	jsFiles.forEach(filePath => {
		if (filePath !== initFilePath) {
			let fileContent = fs.readFileSync(filePath, 'utf-8');
			jsContent += fileContent;
		}
	});

	let initFileContent = fs.readFileSync(initFilePath, 'utf-8');
	jsContent += initFileContent;
	if (process.env.NODE_ENV === 'development') {
		jsContent += `
			const socket = new WebSocket('ws://localhost:3000');
			socket.addEventListener('message', (event) => {
				const data = JSON.parse(event.data);

				if (data.type === 'reload') {
					window.location.reload();
				} else if (data.type === 'styles') {
					const link = document.querySelector('link[rel="stylesheet"]');
					link.href = link.href.split('?')[0] + '?' + Date.now();
				}
			});
		`;
	}

	return jsContent;
};

module.exports = {
	getBundledCSS,
	getBundledJS,
};
