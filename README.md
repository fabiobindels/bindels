# Bindels

Bindels is a streamlined and efficient framework designed for generating static
sites using Markdown. Its simplicity and use of familiar JavaScript make it an
ideal choice for developers looking to build fast, markdown-driven websites
without a bunch of dependencies.

## Creating components

In Bindels, components are crafted within the `markup` directory. The root files
in this directory serve as templates and entry points for your web pages. Here’s
an example template to illustrate the process:

```js
const articleList = require('./components/article-list.js');

function home({ title, subtitle, description }) {
	let html = /* html */ `
		<main>
			<h1>This is a title</h1>
			${articleList()}
		</main>
	`;

	return layout({ children: html, title, description });
}

module.exports = home;
```

This approach emphasizes simplicity, using plain JavaScript with CommonJS
modules. The special comment before the HTML string enables syntax highlighting
in Visual Studio Code with the
[es6-string-html](https://marketplace.visualstudio.com/items?itemName=Tobermory.es6-string-html)
extension. The function parameters are derived from the Markdown frontmatter.

Dedicated blocks within the markup directory are reserved for creating elements
that can be integrated directly into your Markdown content.

## Writing content

Place your content inside the `content`` directory. Frontmatter attributes are
passed as arguments to your templates. Remember to specify the template in the
frontmatter, like this:

```yaml
---
description: Front-end developer who likes to share some stuff sometimes
template: Home
---
```

To incorporate assets such as images or favicons, use the `assets` directory
within `content`.

Including blocks in your Markdown is straightforward:

```html
<!-- include block-name-here -->
```

## CSS & JavaScript Management

### CSS Integration

-   **Location**: Store your CSS files in the styles directory.
-   **Bundling**: The framework automatically compiles and bundles these files,
    directing the output to the `dist` directory.
-   **Hot Module Replacement (HMR)**: Enjoy real-time updates during
    development, as the framework implements HMR for CSS on the development
    server.

### JavaScript Handling

-   **Writing Code**: Place your vanilla JavaScript code in the scripts
    directory.
-   **Processing**: The framework bundles this code and outputs it to the `dist`
    directory, ensuring it's optimized and ready for deployment on your site.

## Configuration Setup

### Creating Configuration File

-   **File Creation**: In the root directory of your project, create a file
    named bindels.config.js.
-   **Purpose**: This file is your central place to customize various aspects of
    your project.
    -   **Element Rendering**: Define custom rendering options for default HTML
        elements, such as the <code> element.
    -   **Directory Management**: Specify custom directory paths as per your
        project structure and requirements.

By configuring bindels.config.js, you gain greater control over the rendering
behaviors and directory organization, tailoring the project to your specific
needs.
