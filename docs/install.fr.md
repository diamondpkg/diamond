# diamond-install

## Synopsis
```
diamond install (sans arguments, dans le répertoire du packet)
diamond install <nom>
diamond install <nom>@<tag>
diamond install <nom>@<version>
diamond install <nom>@<gamme de versions>
diamond install <propriétaire>/<répertoire>[#<ref>]
diamond install gitlab:<propriétaire>/<répertoire>[#<ref>]

alias: diamond i
options communes: [--no-save] [--no-cache]
```

## Déscription
Cette commande installe un packet, et tout les packets dont il dépend.

Un **packet** est définit par:

* a) un dossier contenant un programme décrit par un fichier package.json
* b) un **`<nom>@<version>`** qui est publié dans le registre npm (voire [npm-registry](https://docs.npmjs.com/misc/registry)) avec (a)
* c) un **`<nom>@<tag>`** (voire [npm-dist-tag](https://docs.npmjs.com/cli/dist-tag)) qui pointe à (b)
* d) un **`<nom>`** qui satisfait un tag "latest" correctement (c)
* e) un **`<propriétaire>/<répertoire>[<#ref>]`** qui se résout pour (a)
* f) un **`gitlab:<propriétaire>/<répertoire>[<#ref>]`** qui se résout pour (a)

## Commandes
* **`diamond install`** (dans le répertoire du packet, sans arguments)

  Installe les dépendences dans le dossier diamond local.

  Par défaut, **`diamond install`** installera tout les modules inscrit comme dépendences dan le fichier package.json.



* **`diamond install <nom>`**

  Fait une instalation **`<nom>@<tag>`**, où **`<tag>`** représente **`latest`**.

  Exemple:
  ```
      diamond install bootstrap
  ```


* **`diamond install <nom>@<tag>`**

  Installe la version du packet référencé par le tag spécifié. Si le tag nèexiste pas dans le registre pour le packet, l'installation échouera.

  Exemple:
  ```
      diamond install bootstrap@latest
  ```



* **`diamond install <name>@<version>`**

  Installe la version spécifié du packet. Ceci échouera si la version n'a pas été publié dans le registre.

  Exemple:
  ```
      diamond install bootstrap@3.3.7
  ```



* **`diamond install <name>@<version range>`**

  Installe une version du packet correspondant à la gamme de versions données. Ceci suivra les mêmes règles pour résoudre les dépendances tel que décrit dans package.json.

  À noter que la majorité des gammes de versions doivent être mises en guillemet afin que le shell traite la gamme comme un seul argument.

  Exemple:
  ```
      diamond install bootstrap@">=3.0.0 <4.0.0"
  ```



* **`diamond install <githubname>/<githubrepo>[#<ref>]`**

* **`diamond install gh:<githubname>/<githubrepo>[#<ref>]`**

* **`diamond install github:<githubname>/<githubrepo>[#<ref>]`**

  Installe le packet trouvé à **`https://github.com/githubname/githubrepo`** en téléchargeant l'archive.

  Si une option **`ref`** n'est pas spécifiée, alors **`master`** sera utilisé.

  Exemples:
  ```
      diamond install mygithubuser/myproject
      diamond install mygithubuser/myproject#master
      diamond install mygithubuser/myproject#beffcd31cd20f41125ca2ff03d42e902c3935e18
      diamond install mygithubuser/myproject#1.0.0
      diamond install gh:mygithubuser/myproject
      diamond install github:mygithubuser/myproject
  ```



* **`diamond install gl:<gitlabname>/<gitlabrepo>[#<ref>]`**
* **`diamond install gitlab:<gitlabname>/<gitlabrepo>[#<ref>]`**

  Installe le packet trouvé à **`https://gitlab.com/gitlabname/gitlabrepo`** en téléchargeant l'archive.

  Si une option **`ref`** n'est pas spécifiée, alors **`master`** sera utilisé.

  Exemples:
  ```
      diamond install gl:mygithubuser/myproject
      diamond install gitlab:mygithubuser/myproject
      diamond install gitlab:mygithubuser/myproject#master
      diamond install gitlab:mygithubuser/myproject#beffcd31cd20f41125ca2ff03d42e902c3935e18
      diamond install gitlab:mygithubuser/myproject#1.0.0
  ```

Il est possible d'installer plusieurs packets à la fois.

Exemple
```
    diamond i bootstrap kurisubrooks/caramel
```

## Args
* **`--no-save`**

  Si utilisé, le packet ne sera pas sauvegardé dans votre fichier **`package.json`**.



* **`--no-cache`**

  Si utilisé, le packet ne sera pas pris de la mémoire cache, et la mémoire cache sera mise à jour après l'installation.
