const router = require('express').Router();
const database = require('../models/database');

var app = global.app;
var suspended = true;
var workshops_suspended = true;
var hostURL = process.env.HOST_URL;

router.get('/', function(req, res) {
  if (suspended) {
    res.render('suspended');
  } else {
    res.render('mutex');
  }
});

router.get('/confirm/:id', function(req, res) {
  var id = req.params.id;
  if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
    database.confirm(req.params.id, function(err, db) {
      if (err == 'Already confirmed') {
        res.render('failure', {msg: 'Already confirmed'});
      } else if (err) {
        var ts = +new Date();
        console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
        res.render('error', {error: 'ERR::LOG_' + ts});
      } else {
        res.render('success', {msg: 'Successfully confirmed registration for MUTEX event'});
      }
      if (db) db.close();
    })
  } else {
    res.render('error', {error: 'ERR::INVALID_ID'});
  }
});

router.get('/workshop', function(req, res) {
  if (workshops_suspended) {
    res.render('suspended');
  } else {
    var id = req.query.id;
    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      database.getDoc(id, function(err, db, doc) {
        if (err) {
          var ts = +new Date();
          console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
          res.render('error', {error: 'ERR::LOG_' + ts});
        } else {
          if (doc.accepted == true) {
            res.render('workshop');
          } else {
            res.render('failure', {msg: 'ERR::NOT_ACCEPTED'});
          }
        }
        if (db) db.close();
      })
    } else {
      res.render('failure', {msg: 'ERR::INVALID_ID'});
    }
  }
});

router.post('/workshop', function(req, res) {
  res.status(404);
  var id = req.query.id;
  var workshop = req.body.workshop;
  if (id && id.match(/^[0-9a-fA-F]{24}$/) && workshop && workshop.match(/5/)) {
    database.getDoc(id, function(err, db, doc) {
      if (err) {
        var ts = +new Date();
        console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
        res.render('error', {error: 'ERR::LOG_' + ts});
      } else {
        if (doc.accepted == true) {
          database.updateDoc(id, 'workshop', workshop, function(err, db) {
            if (err) {
              res.render('error', {error: 'ERR::DB'});
            } else {
              res.render('success', {msg: 'Successfully selected workshop, await your inviation with confirmation if you may attend the workshop'});
            }
          });
        } else {
          res.render('failure', {msg: 'ERR::NOT_ACCEPTED'});
        }
      }
      if (db) db.close();
    });
  } else {
    res.render('failure', {msg: 'ERR::INVALID_REQ'});
  }
});

router.get('/unconfirmed', function(req, res) {
  database.getList(function(err, db, docs) {
    list = docs.filter(x => x.confirmed != true);
    res.render('table', {
      list: list,
    });
  });
});

router.get('/reconfirm', function(req, res) {
  var mail = req.query.mail;
  if (mail) {
    database.reconfirm(req.query.mail, function(err, db, doc) {
      if (err == 'Already confirmed') {
        res.render('failure', {msg: 'Already confirmed'});
      } else if (err) {
        var ts = +new Date();
        console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
        res.render('error', {error: 'ERR::LOG_' + ts});
      } else {
        app.mailer.send('confirm', {
          to: doc.email,
          subject: 'Mutex event registration confirmation',
          fullname: doc.fullname,
          link: hostURL + 'confirm/' + doc._id,
        }, function(err) {
          if (err) {
            var ts = +new Date();
            console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
            res.render('error', {error: 'ERR::LOG_' + ts});
          } else {
            res.render('success', {msg: 'A confirmation email has been sent to <a>' + doc.email + '</a>'});
          }
        });
      }
      if (db) db.close();
    });
  }
});

router.post('/', function(req, res) {
  var timestamp = +new Date();
  req.body.timestamp = timestamp;
  /* Validate required fields */
  if (req.body.fullname && req.body.email && req.body.level && req.body.workshops) {
    if (!req.body.question) { /* Bypassed level question */
      req.body.programmer = 1;
    }
    if (req.query && req.query.promo == "ieee") {
      req.body.ieee = true;
    }
    database.warehouse.insertDoc({headers: req.headers, body: req.body}, function(err, db) {
      console.log(err);
      if (db) db.close();
    });
    database.insertForm(req.body, function(err, db, id) {
      if (err == 'Already registered') {
        res.render('failure', {msg: 'Looks like <a>' + req.body.email + '</a> is already registered!'});
      } else if (err) {
        var ts = +new Date();
        console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
        res.render('error', {error: 'ERR::LOG_' + ts});
      } else {
        app.mailer.send('confirm', {
          to: req.body.email,
          subject: 'Mutex event registration confirmation',
          fullname: req.body.fullname,
          link: hostURL + 'confirm/' + id,
        }, function(err) {
          if (err) {
            var ts = +new Date();
            console.log('== ERROR LOG [' + ts + '] ==\n' + err + '\n== END ERROR LOG ==');
            res.render('error', {error: 'ERR::LOG_' + ts});
          } else {
            res.render('success', {msg: 'Successfully Registered. <br>A confirmation email has been sent to <a>' + req.body.email + '</a>'});
          }
        });
      }
      if (db) db.close();
    });
  } else {
    res.render('error', {error: 'ERR::INVALID_REQ'});
  }
});

module.exports = router;
