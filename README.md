# diamond
A package manager for CSS, SASS, LESS, and Stylus

## Installation
diamond can be installed with [npm](https://npmjs.org)
```
npm i -g diamondpkg
```
or if you want to install the development version
```
npm i -g Hackzzila/diamond
```

## Cli
To install a package, use the `install` command.
```
diamond install [packages...]
```
If no packages are provided, diamond will install the packages in your `diamond.yml` file.  

### Package Format
Packages are hosted on github, and their names look like this
* `Hackzzila/diamond`
* `Hackzzila/diamond@1.0.0`
* `Hackzzila/diamond@master`
* `Hackzzila/diamond@c8578ac59b69ad8caabb4540df27c9c1cd542964`

If no branch, tag, or commit is provided, the latest commit from `master` is used.

## diamond.yml/diamond.json
A typical diamond.yml file will look like this:
```yaml
main: import.sass
type: stylesheet
dependencies:
  - somePerson/someRepo
```
or in JSON
```json
{
  "main": "import.sass",
  "type": "stylesheet",
  "dependencies": [
    "somePerson/someRepo"
  ]
}
```

### main
This is the main file that will be imported and converted if the package is a stylesheet (see `type` below).

### type
This is the package type. Default: `stylesheet`

#### stylesheet
This is a package which has styles that can be compiled to CSS. The package may have a few preprocessor specific
addons but is mostly able to be compiled to CSS. If this is selected, the package will be compiled to CSS on
install.

#### module
Almost none of this can be compiled to CSS and should be used by the preprocessor it was made in only.

### dependencies
A array of dependencies for the package, in the format listed above.