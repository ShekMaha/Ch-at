var express = require('express');
var router = express.Router();
var cobaltAPI = require('cobalt-node-wrapper');

// Create new client
var cobalt = new cobaltAPI({
  API_KEY: 'PzRk9k5Hc9Kl85fz4nxIod7lXWCzlHEi'
});

/* GET home page. */
router.get('/', function(req, res) {
  cobalt.get('/courses', {limit: 10}, function(err, req, resp){
        res.send(resp);
    });
});

var getCourses = function(){
    var my_response;
    cobalt.get('/courses', {limit: 10}, function(err, req, res){
        console.log(res);
    });
};

module.exports = {
    router: router,
    getCourses: getCourses
};
