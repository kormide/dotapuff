var boot = require('../app').boot,
  shutdown = require('../app').shutdown,
  port = require('../app').port;

var superagent = require('superagent');
var expect = require('expect.js');

describe('server', function() {
  before(function(done) {
    boot(function() {
      done();
    });
  });

  describe('homepage', function() {
    it('should respond to GET', function(done) {

      superagent
        .get('http://localhost:' + port)
        .end(function(err, res) {
          expect(res.status).to.equal(200);
          done();
      });
    });
  });

  after(function() {
    shutdown();
  });
});
            
