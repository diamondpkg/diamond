# diamond-compile

## Synopsis
```
diamond compile <input>
diamond compile --output <output> <input>

alias: diamond c
common options: [-o|--output] [--output-style]
```

## Description
This command compiles a file with full diamond support (importers, functions, etc.).

## Commands
* **`diamond compile <input>`** 

  Compile the input file and print the resulting CSS to `stdout`.

  Example:
  ```
      diamond compile in.sass
  ```


* **`diamond compile --output <output> <input>`**

  Compile the input file and put the resulting CSS in the output file.

  Example:
  ```
      diamond compile --output out.css in.sass
  ```



## Args
* **`-o | --output`**

  The file to save the output CSS to.



* **`--output-style`**

  <div class="notification is-warning">
    This argument is <b>Sass only</b>.
  </div>
  The output style for the file, can be one of: `nested, expanded, compact, compressed`.