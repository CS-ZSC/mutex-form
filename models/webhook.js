const gad = require('node-auto-deploy');
const spawn = require('child_process').spawn;

var webhook = function(app) {
  app.post('/webhook', function(req, res) {
    console.log('Received Github webhook');
    if (true) { /* TODO: add secret verification */
      var payload = JSON.parse(req.body.payload);
      if (payload.ref) { /* Push */
        var branch = payload.ref.slice(11);
        console.log('Github: Push event to branch ' + branch)
        if (branch == 'master' || branch == 'testing') {
          console.log('GAD: Updating branch ' + branch)
          var repo = {
            origin: 'origin',
            branch: branch
          };
          gad.deploy(repo);
          var pull = spawn("/bin/bash", ["/root/update.sh", repo.branch]);
          pull.stdout.on("data", (data) => console.log(`${data}`));
        	pull.stderr.on("data", (data) => console.log(`${data}`));
        	pull.on('close', (code) => {
        		console.log(`Child process exited with code ${code}`);
        	});
        }
      }
    } else {
      console.log('Github Webhook: Error: Wrong secret');
    }
    res.send('OK');
  });
};

module.exports = webhook;
