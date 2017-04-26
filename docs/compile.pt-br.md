# diamond-compile

## Sinopse
```
diamond compile <entrada>
diamond compile --output <saída> <entrada>

alias: diamond c
opções comuns: [-o|--output] [--output-style]
```

## Sobre
Este comando compila um arquivo com suporte do diamond completo (importadores, funções, etc.).

## Comandos
* **`diamond compile <entrade>`** 

  Compila o arquivo dado e exibe o CSS resultante em `stdout`.

  Exemplo:
  ```
      diamond compile in.sass
  ```


* **`diamond compile --output <saída> <entrada>`**

  Compila o arquivo dado e grava o CSS resultante no arquivo de saída dado.

  Exemplo:
  ```
      diamond compile --output out.css in.sass
  ```



## Argumentos
* **`-o | --output`**

  O arquivo para gravar o CSS resultante.



* **`--output-style`**

  <div class="notification is-warning">
    Este argumento é <b>apenas para Sass</b>.
  </div>
  O estilo de saída para o arquivo, pode ser um de: `nested, expanded, compact, compressed`.