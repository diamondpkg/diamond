const os = require('os');
const url = require('url');
const opn = require('opn');
const log = require('npmlog');
const path = require('path');
const http = require('http');
const fs = require('fs-extra');
const superagent = require('superagent');
const userAgent = require('../misc/userAgent');
const querystring = require('querystring');
const mustache = require('mustache');
const analytics = require('../functions/analytics');

analytics.init('install');

http.createServer((req, res) => {
  const u = url.parse(req.url);
  const query = querystring.parse(u.query);
  if (u.pathname === '/') {
    res.writeHead(302, 'Redirect', { location: 'https://github.com/login/oauth/authorize?client_id=756bdbe9672e9c6bd2cc' });
    res.end();
  } else if (u.pathname === '/authorize/github') {
    if (query.error) {
      res.writeHead(400, 'Error');
      return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: query.error }), () => {
        process.exit(0);
      });
    }

    if (!query.code) {
      res.writeHead(400, 'Error');
      return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: 'No code.' }), () => {
        process.exit(0);
      });
    }

    superagent.get(`https://diamondpkg-oauth.herokuapp.com/authenticate/${query.code}`)
      .set(userAgent.superagent)
      .then((r) => {
        if (r.body.error) {
          res.writeHead(400, 'Error');
          return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: r.body.error }), () => {
            process.exit(0);
          });
        }

        if (!r.body.token) {
          res.writeHead(400, 'Error');
          return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: 'Authorization Error.' }), () => {
            process.exit(0);
          });
        }

        fs.ensureFile(path.join(os.homedir(), '.diamond/auth.json'), (error) => {
          if (error) {
            res.writeHead(400, 'Error');
            return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: error.message }), () => {
              process.exit(0);
            });
          }

          fs.readFile(path.join(os.homedir(), '.diamond/auth.json'), (err, contents) => {
            if (err) {
              res.writeHead(400, 'Error');
              return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: err.message }), () => {
                process.exit(0);
              });
            }

            let auth;
            try {
              auth = JSON.parse(contents);
            } catch (_) {
              auth = {};
            }

            auth.github = r.body.token;

            fs.writeFile(path.join(os.homedir(), '.diamond/auth.json'), JSON.stringify(auth), (e) => {
              if (e) {
                res.writeHead(400, 'Error');
                return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/error.html')).toString(), { error: err.message }), () => {
                  process.exit(0);
                });
              }

              res.writeHead(200, 'OK');
              return res.end(mustache.render(fs.readFileSync(path.join(__dirname, '../views/success.html')).toString()), () => {
                process.exit(0);
              });
            });

            return undefined;
          });

          return undefined;
        });

        return undefined;
      })
      .catch(() => {
        res.render(path.join(__dirname, '../views/error.html'), { error: 'Authorization Error.' }, (_, html) => {
          res.send(html);
          process.exit(0);
        });
      });

    return undefined;
  }

  return undefined;
}).listen(3031, () => {
  log.info('please open', 'http://localhost:3031');
  opn('http://localhost:3031');
});
