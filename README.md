# Bindels

Bindels is a streamlined and efficient framework designed for generating static
sites using Markdown. Its simplicity and use of familiar JavaScript make it an
ideal choice for developers looking to build fast, markdown-driven websites.

## Creating components

In Bindels, components are crafted within the `markup`` directory. The root
files in this directory serve as templates and entry points for your web pages.
Here’s an example template to illustrate the process:

```js
const headingGroup = require('./components/heading-group.js');
const articleList = require('./components/article-list.js');

function home({ title, subtitle, description }) {
	const articles = getAllFiles('');

	let html = /* html */ `
		<div style="padding: 5vw;">
			<div style="max-width: var(--max-width); margin-inline: auto;">
				${headingGroup({ title, subtitle })}
				${articleList(articles)}
			</div>
		</div>
	`;

	return layout({ children: html, title, description });
}

module.exports = home;
```

This approach emphasizes simplicity, using plain JavaScript with CommonJS
modules. The special comment before the HTML string enables syntax highlighting
in Visual Studio Code with the
[es6-string-html][https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html]
extension. The function parameters are derived from the Markdown frontmatter.

Dedicated blocks within the markup directory are reserved for creating elements
that can be integrated directly into your Markdown content.

## Writing content

Place your content inside the `content`` directory. Frontmatter attributes are
passed as arguments to your templates. Remember to specify the template in the
frontmatter, like this:

```yaml
---
description: Front-end developer who likes to share some stuff sometimes title:
Fabio Bindels template: Home
---
```

To incorporate assets such as images or favicons, use the `assets` directory
within `content`.

Including blocks in your Markdown is straightforward:

```html
<!-- include text-zoom-grid -->
```

## CSS & JavaScript

CSS files should be placed in the styles directory. The framework automatically
bundles these files and outputs them to the dist directory.

For JavaScript, write your code in vanilla JS within the scripts directory. This
code is bundled and outputted to the scripts directory, ready for use in your
site.

## Configuration

In the root directory add a file named `bindels.config.js`. In this file you can
define how some default elements are rendered, like the `<code>` element. You
can also define custom directories.
