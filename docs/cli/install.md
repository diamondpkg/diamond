## Synopsis
```
diamond install (with no args, in package dir)
diamond install <name>
diamond install <name>@<tag>
diamond install <name>@<version>
diamond install <name>@<version range>
diamond install npm:<package>
diamond install <owner>/<repo>[#<ref>]
diamond install gitlab:<owner>/<repo>[#<ref>]

alias: diamond i
common options: [--no-save] [--no-cache]
```

## Description
This command installs a package, and any packages that it depends on.

A **package** is:

* a) a folder containing a program described by a diamond.json or package.json file
* b) a [package](https://docs.npmjs.com/how-npm-works/packages) on the [npm registry](https://docs.npmjs.com/misc/registry)
* c) a **`<name>@<version>`** that is published on the diamond registry with (a)
* d) a **`<name>@<tag>`** that points to (c)
* e) a **`<name>`** that has a "latest" tag satisfying (d)
* f) a **`<owner>/<repo>[<#ref>]`** that resolves to (a)
* g) a **`gitlab:<owner>/<repo>[<#ref>]`** that resolves to (a)

## Commands
### **`diamond install`** (in package directory, no arguments)

  Install the dependencies in the local diamond folder.

  By default, **`diamond install`** will install all modules listed as dependencies in diamond.json.



### **`diamond install <name>`**

  Do a **`<name>@<tag>`** install, where **`<tag>`** is **`latest`**.

  #### Example:
  ```
diamond install sierra
  ```


### **`diamond install <name>@<tag>`**

  Install the version of the package that is referenced by the specified tag. If the tag does not exist in the registry data for that package, then this will fail.

  #### Example:
  ```
diamond install sierra@latest
  ```



### **`diamond install <name>@<version>`**

  Install the specified version of the package. This will fail if the version has not been published to the registry.

  #### Example:
  ```
diamond install sierra@2.0.0
  ```



### **`diamond install <name>@<version range>`**

  Install a version of the package matching the specified version range. This will follow the same rules for resolving dependencies described in diamond.json.

  Note that most version ranges must be put in quotes so that your shell will treat it as a single argument.

  #### Example:
  ```
diamond install sierra@">=2.0.0 <3.0.0"
  ```



### **`diamond install npm:<package>`**
  
  Install a package from the [npm registry](https://docs.npmjs.com/misc/registry).

  #### Example:
```
diamond install npm:bootstrap
```


### **`diamond install <githubname>/<githubrepo>[#<ref>]`**

### **`diamond install gh:<githubname>/<githubrepo>[#<ref>]`**

### **`diamond install github:<githubname>/<githubrepo>[#<ref>]`**

  Install the package at **`https://github.com/githubname/githubrepo`** by downloading the archive.

  If you don't specify a **`ref`** then **`master`** will be used.

  #### Examples:
  ```
diamond install mygithubuser/myproject
diamond install mygithubuser/myproject#master
diamond install mygithubuser/myproject#beffcd31cd20f41125ca2ff03d42e902c3935e18
diamond install mygithubuser/myproject#1.0.0
diamond install gh:mygithubuser/myproject
diamond install github:mygithubuser/myproject
  ```



### **`diamond install gl:<gitlabname>/<gitlabrepo>[#<ref>]`**
### **`diamond install gitlab:<gitlabname>/<gitlabrepo>[#<ref>]`**

  Install the package at **`https://gitlab.com/gitlabname/gitlabrepo`** by downloading the archive.

  If you don't specify a **`ref`** then **`master`** will be used.

  #### Examples:
  ```
diamond install gl:mygitlabuser/myproject
diamond install gitlab:mygitlabuser/myproject
diamond install gitlab:mygitlabuser/myproject#master
diamond install gitlab:mygitlabuser/myproject#beffcd31cd20f41125ca2ff03d42e902c3935e18
diamond install gitlab:mygitlabuser/myproject#1.0.0
  ```

You may install multiple packages at once.

#### Example:
```
diamond i sierra kurisubrooks/caramel
```

## Args
### **`--no-save`**

  If specified, the package won't be saved to your **`diamond.json`**.



### **`--no-cache`**

  If specified, the package will not be pulled from the cache, and the cache will be updated after installation.