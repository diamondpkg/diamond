var less = require('less');

less.render('.class { width: (1 + 1) }', function (e, output) {
  console.log(output.css);
});