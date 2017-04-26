# package.json

**All fields are in addition to the fields described [by npm](https://docs.npmjs.com/files/package.json)**

## diamond
Where almost all diamond-related fields are under.

### diamond.main
The main field is a module ID that is the primary entry point to your program. That is, if your package is named foo, and a user installs it, and then does `@import "~foo"`, then your main file will be imported.

This should be a module ID relative to the root of your package folder.

### diamond.dependencies
Dependencies are specified in a simple object that maps a package name to a version range. The version range is a string which has one or more space-separated descriptors.

See [semver](https://docs.npmjs.com/misc/semver) for more details about specifying version ranges.

For example, these are all valid:
```json
{
  "dependencies" : {
    "foo": "1.0.0 - 2.9999.9999",
    "bar": ">=1.0.2 <2.1.2",
    "baz": ">1.0.2 <=2.3.4",
    "boo": "2.0.1",
    "qux": "<1.0.0 || >=2.3.1 <2.4.5 || >=2.5.2 <3.0.0",
    "til": "~1.2",
    "elf": "~1.2.3",
    "two": "2.x",
    "thr": "3.3.x",
    "lat": "latest"
  }
}
```

#### GitHub URLs
You can refer to GitHub urls as just `"foo": "user/foo-project"`. A commit-ish suffix can be included. For example:
```json
{
  "name": "foo",
  "version": "0.0.0",
  "diamond": {
    "dependencies": {
      "caramel": "kurisubrooks/caramel#v2",
    }
  }
}
```

### diamond.postProcessor
A path to a file relative to the root of your package folder. The **`module.exports`** of this file should be a single function that takes in one argument, the compiled CSS and either returns a Promise or a String containing the processed CSS.

### diamond.sass
All fields related to Sass only.

#### diamond.sass.importer
A path to a file relative to the root of your package folder. The **`module.exports`** of this file should be a valid importer function (see [importer](https://github.com/sass/node-sass#importer--v200---experimental))

#### diamond.sass.functions
Either an Object with function names for keys and paths to files as values (see [functions](https://github.com/sass/node-sass#functions--v300---experimental)) or a path to a file containing the above.