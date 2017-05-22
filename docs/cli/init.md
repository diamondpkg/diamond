## Synopsis
```
diamond init
```

## Description
  Creates or updates a `diamond.json` file.


## Commands
### `diamond init`

  This walks you through creating a `diamond.json` file.

```
diamond init
```

```
prompt: name:  (diamond-site) awesome-package
prompt: version:  (1.0.0)
prompt: description:  A package by me
prompt: main file:  (index.sass)
```

  This creates the following file.

```
{
  "name": "awesome-package",
  "version": "1.0.0",
  "description": "A package by me",
  "main": "index.sass"
}
```

  If you already have a `diamond.json` file, it will use those entries as defaults.