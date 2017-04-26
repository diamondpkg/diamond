# package.json

**Todos os campos são em adição àqueles especificados [pelo npm](https://docs.npmjs.com/files/package.json)**

## diamond
Onde quase todos os campos relacionados ao diamond estão.

### diamond.main
O campo `main` é um ID de módulo que é o ponto de entrada primário para seu programa. Isso é, se seu pacote tiver o nome de `foo`, e um usuário o instala, e então usa `@import "~foo"`, então seu arquivo `main` será importado.

Isto deve ser um ID de módulo relativo à raiz da pasta do seu pacote.

### diamond.dependencies
Dependências são especificadas em um objeto simples que mapeia um nome de pacote para uma variação de versões. A variação de versões é um `string` que tem um ou mais descritores separados por espaço.

Veja [semver](https://docs.npmjs.com/misc/semver) para mais detalhes sobre especificar variações de versões.

Por exemplo, todos esses são válidos:
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

#### URLs do GitHub
Você pode se referir a URLs do GitHub com apenas `"foo": "usuário/projeto-foo"`. Um sufixo meio *"commit"* pode ser incluído. Por exemplo:
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
Um `path` para um arquivo relativo à raiz da pasta do seu pacote. O **`module.exports`** desse arquivo deve ser uma única função que usa um argumento, o CSS compilado e retorna ou um `Promise` ou um `String` contendo o CSS processado.

### diamond.sass
Todos os campos relacionados ao Sass.

#### diamond.sass.importer
Um `path` para um arquivo relativo à raiz da pasta do seu pacote. O **`module.exports`** desse arquivo desse ser uma função importadora válida (ver [importer](https://github.com/sass/node-sass#importer--v200---experimental)).

#### diamond.sass.functions
Ou um Objeto com nomes de funções para as `keys` e `path`s para arquivos como `values` (ver [functions](https://github.com/sass/node-sass#functions--v300---experimental)) ou um `path` para um arquivo contendo o acima.