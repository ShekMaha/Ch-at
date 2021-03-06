var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var firebase = require("firebase");
var expressValidator = require('express-validator');


var routes = require('./routes/index');
var users = require('./routes/users');
var chat = require('./routes/chat');
var courses = require('./routes/course');
var profile = require('./routes/profile');
var registration = require('./routes/registration');
var db_funcs = require('./routes/database-routes');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator({
    customValidators: {

        isStuNum: function(value) {
            return value.search("([0-9]{9})|([0-9]{10})") !== -1;
        },
        isWord: function(value) {
            return value.search(".+") !== -1;
        }

    }
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', chat);
app.use('/users', users);
app.use('/chat', chat);
app.use('/profile', profile);
app.use('/course', courses);
app.use('/registration', registration);
app.get('/get_messages', db_funcs.findByCourseName);
app.post('/add_messages', db_funcs.addMessage);
//app.get('/get_instructor', db_funcs.findInstructor);
app.get('/get_student', db_funcs.findStudent);

app.post('/update_student', db_funcs.updateStudent);
app.post('/remove_student', db_funcs.deleteStudent);
app.post('/register', db_funcs.registerUser);
app.post('/validateUser', db_funcs.validateUser);

app.get('/courses/getcourses', courses);

// Chat room stuff
var numUsers = 0;

/*
 *
 * Socket is essentially a user
 *
 */
io.sockets.on('connection', function (socket) {

  var addedUser = false;
  let userRoom = '';

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    newMessage(socket, data, userRoom);
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    addUser(socket, username, addedUser, userRoom);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    disconnect(socket, addedUser, userRoom);
  });

  socket.on('join-room', function(room){
    socket.join(room);
    userRoom = room;
  });

  socket.on('leave-room', function(room){
    socket.leave(room);
    userRoom = room;
  });

});

function newMessage(socket, data, room){

    // we tell the client to execute 'new message'
    socket.broadcast.to(room).emit('new message', {
      username: socket.username,
      message: data
    });

    console.log("Username: " + socket.username);

}

function addUser(socket, username, user, room){

    if (user) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;

}

function disconnect(socket, user, room){
    if (user) {
      --numUsers;
    }

}

var port = process.env.PORT || 3000;


http.listen(port, function(){
    console.log('listening on *:' + port);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
