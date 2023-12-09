# Bindels

Bindels is a lightweight framework for static site generation with markdown.

## Creating components

Components are created inside the `markup`. The top level files are the
templates and thus your entrypoints for creating pages. This is an template
example:

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

As seen the example, this is no magic. It's just plain JS using commonJS! The
comment before the html string adds syntax highlighting when used in combination
with the
[es6-string-html][https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html]
vscode extension. The arguments are the frontmatter that's added to the markdown
content.

Inside the `markup` directory is a `blocks` directory reserved for creating
blocks. These blocks can be added to your markdown.

## Writing content

Content is written inside of the `content` directory. The frontmatter will be
used as arguments for your template. It is important to also define a template.
This will look something like this.

```
---
description: Front-end developer who likes to share some stuff sometimes title:
Fabio Bindels template: Home
---
```

To add assets like images or favicons, create an `assets` directory inside the
`content` directory.

Adding blocks to markdown is easy. It looks something like this:

```html
<!-- include text-zoom-grid -->
```

## Writing CSS

CSS can be written inside the `styles` directory. This CSS automatically get's
bundled and outputted to the `dist` directory.

## Writing JS

JS can be written vanilla inside the `scripts` directory. This code get's
bundled and outputted to the `scripts` directory.
