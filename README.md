<div align="center">
  <br />
  <p>
    <a href="https://diamond.js.org/" target="_blank">
      <img src="https://diamond.js.org/assets/img/DiamondLogo.svg" width="546" alt="diamond" />
    </a>
  </p>
  <br />
  <p>Logo by <a href="https://github.com/Programmix">@Programmix</a></p>
  <p>
    <a href="https://travis-ci.org/diamondpkg/diamond"><img src="https://travis-ci.org/diamondpkg/diamond.svg?branch=master" alt="Build status" /></a>
    <a href="https://greenkeeper.io/"><img src="https://badges.greenkeeper.io/diamondpkg/diamond.svg" alt="Greenkeeper" /></a>
  </p>
  <p>
    <a href="https://nodei.co/npm/diamondpkg/"><img src="https://nodei.co/npm/diamondpkg.png?compact=true"></a>
  </p>
</div>

## Introduction
diamond is a package manager for Sass and Less. diamond allows you to mix and match (most of the time) Sass and
Less packages. You can also ship custom functions to be run after compiling, or even Less plugins and Sass importers
and functions.

## Badge
[![diamond](https://diamond.js.org/badge.svg)](https://diamond.js.org)
Feel free to include this badge in your project.

### Markdown
```markdown
[![diamond](https://diamond.js.org/badge.svg)](https://diamond.js.org)
```

### Image URLs
```
https://diamond.js.org/badge.svg
https://diamond.js.org/badge.png
```

## Installation
Using npm:
```bash
npm i -g diamondpkg
```

Or install the latest version from GitHub:
```bash
npm i -g diamondpkg/diamond
```

## Quick Start
Lets say you want to use Bootstrap in your next project.

### Installing
You can find Bootstrap under the package name `bootstrap@next` (`@next` means the next tag on npm, which is in sass, not less)
You install with the `install` command
```bash
diamond install bootstrap@next
```
If the last log you see says `dia info ok`, then the install succeeded. If not you should troubleshoot your errors.

This generates a `diamond` folder in the following format.
```
diamond
|-- .internal
|   `-- packages.lock
|-- .staging
|-- packages
|   `-- bootstrap
|       `-- bootstrap files
|-- index.js
```
<p class="danger">Do not edit any files in this folder.</p>
The `diamond/.internal` folder is for files used by diamond.
The `diamond/.staging` folder is a temporary location for files durning install.
The `diamond/packages` folder is where all of your packages go.
The `diamond/index.js` file is the JS file that handles all of your importing (See [compiling](#compiling))

### Importing
diamond uses a custom import format when importing packages.

Examples:
* `@import "[bootstrap]";` will import the main file from Bootstrap, or throw an error if the package does not have a main file.
* `@import "[bootstrap/file.scss]"` will import `file.scss` from the package Bootstrap.

We want to import Bootstrap's main file, so we will use `[bootstrap]`
```scss
@import "[boostrap]";

#foo {
  bar: baz;
}
```

### Compiling
#### Sass
Once we have written our sass, we are ready for compiling.

If you try
```bash
node-sass myfile.scss
```
it will give you errors about not being able to find the file `[boostrap]`.
This is because you aren't using diamond's custom importer.

It is recommended to use the compile command to compile your Sass instead of node-sass.
While this is not required, some packages like `concise.css` use functionality only found
in the compile command.

```bash
diamond compile -o output.css input.scss
```

To compile with node-sass, use the `--importer` flag
```bash
node-sass --importer diamond -o output.css input.scss
```
where `diamond` is the generated `diamond` folder on install.

#### Less
To compile with Less, either use the compile command, or lessc. (They both have the same features)

##### Compile Command
```bash
diamond compile -o output.css input.less
```

##### lessc
```bash
lessc --diamond input.less output.css
```
This uses `less-plugin-diamond` as a plugin, which is installed when you install diamond.