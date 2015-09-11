var boot = require('../../../app').boot,
    shutdown = require('../../../app').shutdown,
    port = require('../../../app').port;

var superagent = require('superagent');
var expect = require('expect.js');

describe('server', function() {
    before(function(done) {
        boot(function() {
            done();
        });
    });

    describe('/api/v1/players/peers/', function() {

        it('should respond with error to GET with no player', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/peers/')
            .end(function(err, res) {
                expect(res.status).to.equal(404);
                done();
            });
        });

        it('should respond to invalid player ID', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/peers/123')
            .end(function(err, res) {
                expect(res.status).to.equal(200);
                done();
            });
        });

        it('should provide the correct JSON for an invalid player ID', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/peers/123')
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
            .get('http://localhost:' + port + '/api/v1/players/peers/46412387')
            .end(function(err, res) {
                expect(res.status).to.equal(200);
                done();
            });
        });

        it('should provide the correct JSON for a valid player ID', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/peers/46412387')
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

    describe('/api/v1/players/stats/', function() {

        it('should respond with error to GET with no player', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/stats/')
            .end(function(err, res) {
                expect(res.status).to.equal(404);
                done();
            });
        });

        it('should respond to invalid player ID', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/stats/123')
            .end(function(err, res) {
                expect(res.status).to.equal(200);
                done();
            });
        });

        it('should provide the correct JSON for an invalid player ID', function(done) {
            superagent
            .get('http://localhost:' + port + '/api/v1/players/stats/123')
            .end(function(err, res) {
                expect(res.body).to.not.equal(null);
                expect(res.body).to.have.property('success', false);
                expect(res.body).to.have.property('reason');
                expect(res.body.reason).to.not.equal("");
                done();
            });
        });

        it('should respond and prove the correct JSON for a valid player ID', function(done) {
            this.timeout(40000);
            /* Note: this test will fail if I ever make my steam ID private */
            superagent
            .get('http://localhost:' + port + '/api/v1/players/stats/46412387')
            .end(function(err, res) {
                expect(res.status).to.equal(200);

                expect(res.body).to.not.equal(null);
                expect(res.body).to.have.property('outcomes');
                expect(res.body.outcomes.length).to.be.above(0);
                expect(res.body.outcomes[0]).to.have.property('match');
                expect(res.body.outcomes[0]).to.have.property('gpm');
                expect(res.body.outcomes[0]).to.have.property('xpm');
                expect(res.body.outcomes[0]).to.have.property('win');
                expect(res.body.outcomes[0]).to.have.property('kda');
                expect(res.body.outcomes[0]).to.have.property('lasthits');
                expect(res.body.outcomes[0]).to.have.property('denies');

                // Check that the matches are sorted from oldest to newest
                for (var i = 0; i < res.body.outcomes.length - 1; i++) {
                    expect(res.body.outcomes[i].match).to.be.below(res.body.outcomes[i+1].match);
                }

                done();
            });
        });
    });

  after(function() {
    shutdown();
  });
});
            
