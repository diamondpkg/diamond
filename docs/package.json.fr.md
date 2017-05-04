# package.json

**Chaque champs sont en plus des champs décrits [par npm](https://docs.npmjs.com/files/package.json)**

## diamond
Où presque tout les champs reliés à diamond se situent.

### diamond.main
Le champ principal est un ID module servant comme point d'entré principal pour votre program. Par example, si votre packet se nomme foo, et un utilisateur l'installe et utilise par la suite `@import "~foo"`, alors votre fichier principal sera importé.

Ceci devrait être un ID module relatif au répertoire racine de votre packet.

### diamond.dependencies
Les dépendences sont spécifiées dans un objet simple qui lie un nom de packet à une gamme de versions. La gamme de versions est chaîne de charctères qui à un ou plus d'espace blanc comme séparateur.

Voir [semver](https://docs.npmjs.com/misc/semver) pour plus d'information pour spécifier la gamme de versions.

Par exemple, les suivants sont tous des exemples valides:
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
Il est possible de faire référence aux URLs Github simplement par `"foo": "user/foo-project"`. Un suffix peut aussi être ajouté. Par exemple:
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
Un chemin d'accès vers un fichier relatif à la racine du dossier du packet. Le **`module.exports`** de ce fichier ne devrait être qu'une seule fonction qui prend: un argument, le CSS compilé, et renvoi une promesse ou un chaîne de charactères contenant le CSS traité.

### diamond.sass
Tout les champs relié à Sass uniquement.

#### diamond.sass.importer
Un chemin d'accès vers un fichier relatif à la racine du dossier du packet. Le **`module.exports`** de ce fichier devrait être une fonction importer valide (voire [importer](https://github.com/sass/node-sass#importer--v200---experimental))

#### diamond.sass.functions
Ou un objet avec des nom de fonctions comme clefs et chemins d'accès comme valeures (voire [functions](https://github.com/sass/node-sass#functions--v300---experimental)), ou un chemin d'accès à un fichier content l'indiqué au-dessus.
