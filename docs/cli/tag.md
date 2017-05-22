## Synopsis
```
diamond tag ls <package>
diamond tag set <package> <tag> <version>
diamond tag rm <package> <tag>
```

## Description
  Set, remove, or list tags on a package.


## What are tags?

  Tags (also known as dist-tags and distribution tags) are a way of labeling versions of your package. Users can install your package with this label instead of a version number.

  For example, if you have a beta version of your package you could use tags and allow the user to install like so.
```
diamond install package@latest
diamond install package@beta
```

## Commands
### `diamond tag ls <package>`

  Lists a package's tags and their corresponding versions.

```
diamond tag ls caramel
```

```
latest: 1.6.0
```

### `diamond tag set <package> <tag> <version>`

  Sets a tag to a specific version.

```
diamond tag set caramel test 1.6.0
```

```
diamond tag ls caramel
```

```
latest: 1.6.0
test: 1.6.0
```

### `diamond tag rm <package> <tag>`

  Removes a tag.

  <div class="notification is-warning">
    The <code>latest</code> tag cannot be removed.
  </div>

```
diamond tag rm caramel test
```

```
diamond tag ls caramel
```

```
latest: 1.6.0
```