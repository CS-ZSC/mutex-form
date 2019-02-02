const mutexRouter = require('./mutex');

var routes = function(app) {
  app.use('/', mutexRouter);
};

module.exports = routes;
