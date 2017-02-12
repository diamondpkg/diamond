const opn = require('opn');
const log = require('npmlog');
const express = require('express');
const superagent = require('superagent');

const app = express();

app.set('view engine', 'mustache')
log.heading = 'dia';

app.get('/', (req, res) => {
  res.redirect('https://github.com/login/oauth/authorize?client_id=756bdbe9672e9c6bd2cc');
});

app.get('/authorize', (req, res) => {
  if (!)
});

app.listen(3031, () => {
  log.info('please open', 'http://localhost:3031')
  opn('http://localhost:3031');
});
