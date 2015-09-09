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

  describe('players', function() {
    /*before(function(done) {
    });*/
    it('should respond with error to GET with no player', function(done) {
        superagent
          .get('http://localhost:' + port + '/players/')
          .end(function(err, res) {
            expect(res.status).to.equal(404);
            done();
        });
    });

    it('should respond to invalid player ID', function(done) {
        superagent
          .get('http://localhost:' + port + '/players/123')
          .end(function(err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });

    it('should provide the correct JSON for an invalid player ID', function(done) {
        superagent
          .get('http://localhost:' + port + '/players/123')
          .end(function(err, res) {
            expect(res.body).to.not.equal(null);
            expect(res.body).to.have.property('success', false);
            expect(res.body).to.have.property('reason');
            expect(res.body.reason).to.not.equal("");
            done();
        });
    });

    it('should respond to valid player ID', function(done) {
        /* Note: this test will fail if I ever make my steam ID private */
        superagent
          .get('http://localhost:' + port + '/players/46412387')
          .end(function(err, res) {
            expect(res.status).to.equal(200);
            done();
        });
    });

    it('should provide the correct JSON for a valid player ID', function(done) {
        superagent
          .get('http://localhost:' + port + '/players/46412387')
          .end(function(err, res) {
            expect(res.body).to.not.equal(null);
            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('players');
            expect(res.body.players).to.be.an('array');
            expect(res.body.players.length).to.be.above(0);
            res.body.players.forEach(function(player) {
              expect(player).to.have.property('id');
              expect(player).to.have.property('name');
              expect(player).to.have.property('avatar');
            });
            done();
        });
    });
  });

  after(function() {
    shutdown();
  });
});
            
