diamond is a package manager for Sass, Less, Stylus, and CSS. It allows you to quickly install and import packages from other developers, such as frameworks like Sierra.

## Installation

### npm
To install diamond through npm, run the following command.
```
npm i -g diamondpkg
```

### yarn
diamond can also be installed through yarn.
```
yarn global add diamondpkg
```

## Usage
Once you have installed diamond, you are good to go.

### Starting a new project
```
diamond init
```

### Installing a package
```
diamond install <name>
diamond install <name>@<tag>
diamond install <name>@<version>
```

### Installing all dependencies
```
diamond install
```

### Importing a package
In Sass and Less, you can import like so.
```sass
@import '~package';
```

In Stylus, you have to use the `import` function provided by Unify.
```styl
@import import('~package');
```

### Using with CSS
To use with CSS, simply link the generated `diamond/autoload.css` file.

### Compiling a file
```
diamond compile --output out.css in.sass
```