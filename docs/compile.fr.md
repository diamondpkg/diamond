# diamond-compile

## Synopsis
```
diamond compile <input>
diamond compile --output <output> <input>

alias: diamond c
common options: [-o|--output] [--output-style]
```

## Déscription
Cette commande compile un fichier avec le soutien complet de diamond (importeurs, fonctions, etc.).

## Commandes
* **`diamond compile <input>`**

  Compile le fichier donné et imprime le CSS résultant à `stdout`.

  Exemple:
  ```
      diamond compile in.sass
  ```


* **`diamond compile --output <output> <input>`**

  Compile le fichier donné et imprime le CSS résultant dans le fichier définit.

  Exemple:
  ```
      diamond compile --output out.css in.sass
  ```



## Args
* **`-o | --output`**

  Le fichier dans lequel le CSS résultant est sauvegardé.



* **`--output-style`**

  <div class="notification is-warning">
    Cet argument est <b>uniquement pour Sass</b>.
  </div>
  Le style du fichier produit peut être l'une des options suivantes:
  `nested, expanded, compact, compressed`.
