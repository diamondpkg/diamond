## Synopsis
```
diamond author ls <package>
diamond author add <package> <user>
diamond author rm <package> <user>
```

## Description
  Add, remove, or list authors of a package.


## Commands
### `diamond author ls <package>`

  Lists a package's authors.

```
diamond author ls caramel
```

```
hackzzila <admin@hackzzila.com>
```

### `diamond author add <package> <user>`

  Adds a package author.

```
diamond author add caramel kurisubrooks
```

```
diamond author ls caramel
```

```
hackzzila <admin@hackzzila.com>
kurisubrooks <kurisubrooks@gmail.com>
```

### `diamond author rm <package> <user>`

  Removes an author.


```
diamond author rm kurisubrooks
```

```
diamond author ls caramel
```

```
hackzzila <admin@hackzzila.com>
```