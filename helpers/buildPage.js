const fs = require('fs');
const path = require('path');
const { directories: dirs } = require('../config.js');

const buildPage = page => {
	if (!page.template) {
		console.error('Error: No template specified for', page.slug);
		return;
	}

	const templateName = page.template.toLowerCase() + '.js';
	const template = require(path.join(dirs.markup, templateName));
	const html = template(page);

	fs.mkdirSync(path.dirname(page.destination), { recursive: true });
	fs.writeFileSync(page.destination, html);

	return html;
};

module.exports = buildPage;
