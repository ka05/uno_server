var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

// data objects
var coreData = require('./custom_modules/coreData/coreData.js');

// Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/uno", {native_parser:true});

var routes = require('./routes/index');
var users = require('./routes/users')(db);
var game = require('./routes/game')(db);
var lobby = require('./routes/lobby')(db);
var chat = require('./routes/chat')(db);

var app = express();

server = app.listen(3000);
var io = require('socket.io').listen(server);

var loginIO = io
  .of('/login')
  .on("connection", function(socket){
    var loggedIn = false,
        socketId = socket.id;

    // loop through and create all these

    socket.on('validateLogin', function(data, fn){
      data.socketId = socketId;
      users.validateLogin(data, {
        success:function(user){
          loggedIn = true;
          fn({valid:true, user:new coreData.User(user)});
        },
        error:function(){
          fn({valid:false});
        }
      })
    });

    socket.on('validateToken', function(data, fn){
      data.socketId = socketId; // needed for setUserOnline(_userId, _socketId)
      users.validateToken(data, {
        success:function(user){
          fn({valid:true, user:new coreData.User(user)});
        },
        error:function(){
          fn({valid:false});
        }
      })
    });

    socket.on('addUser', function(data, fn){
      data.socketId = socketId;
      users.addUser(data, {
        success:function(user){
          loggedIn = true;
          fn({msg:"success", user:new coreData.User(user)});
        },
        error:function(msg){
          (msg) ? fn({msg:msg}) : fn({msg:"error"});
        }
      })
    });


    socket.on('getOnlineUsers', function(data, fn){

      users.getOnlineUsers(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });

    });

    socket.on('chatMsg', function (data, fn) {
      chat.sendChat(data, {
        success:function(){
          fn({msg:'success'});
        },
        error:function(){
          fn({msg:'error'});
        }
      });
    });

    socket.on('getChat', function (data, fn) {
      chat.getChat(data, {
        success:function(data){
          fn({msg:'success', data:data});
        },
        error:function(){
          fn({msg:'error'});
        }
      });
    });


    socket.on('sendChallenge',function(data, fn){

      lobby.sendChallenge(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });

    });

    socket.on('handleChallenge',function(data, fn){

      lobby.handleChallenge(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });

    });

    socket.on('getChallenge',function(data, fn){

      lobby.getChallenge(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });

    });

    socket.on('getChallenges',function(data, fn){

      lobby.getChallenges(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });

    });


    socket.on('getSentChallenges',function(data, fn){

      lobby.getSentChallenges(data, {
        success:function(res){
          fn({msg:'success', data:res});
        },
        error:function(){
          fn({msg:'error'});
        }
      });
    });
  });


var gameIO = io
  .of('/game')
  .on("connection", function(socket){
    var loggedIn = false,
        emitArr = [
          'createGame',
          'getGameByChallengeId',
          'getGameByGameId',
          'drawCard',
          'quitGame',
          'checkPlayersInGameRoom',
          'setPlayerInGame',
          'validateMove',
          'sayUno',
          'challengeUno'
        ];

    function makeSocketOn(funcName) {
      return function(data, fn) {
        game[funcName](data, {
          funcName:funcName,
          success:function(game){
            fn({msg:"success", data:game});
          },
          error:function(msg){
            (msg) ? fn({msg:msg}) : fn({msg:"error"});
          }
        });
      }
    }

    for(var i = 0, j = emitArr.length; i<j; i++){
      socket.on( emitArr[i], makeSocketOn(emitArr[i]) );
    }

  });

// use namespaces : turn this into a dispatch
io.on('connection', function(socket){
  var socketId = socket.id;
  var clientIp = socket.request.connection.remoteAddress;

  socket.on('validate login', function(data){

  });

  socket.on('disconnect', function () {
    console.log('user disconnected - ID: ' + socketId);
    users.setUserOffline(socketId);

    /*
    // if in game
      // set game to inactive
      // notify players

    // no matter what - set user.online = false

     */
  });
});


// remove old junk every 5 mins
var minutes = 5, the_interval = minutes * 60 * 1000;
setInterval(function() {
  console.log("Its been 5 mins -> delete old stuff");

  // delete completed games
  game.removeCompletedGames({
    success:function(){
      console.log("Completed games successfully removed");
    },
    error:function(){
      console.log("Error removing completed games")
    }
  });

  // delete incomplete challenges
  lobby.removeBadChallenges({
    success:function(){
      console.log("Completed games successfully removed");
    },
    error:function(){
      console.log("Error removing completed games")
    }
  });

  // delete chat older than 1 hour
  chat.removeOldChat({
    success:function(){
      console.log("Completed games successfully removed");
    },
    error:function(){
      console.log("Error removing completed games")
    }
  });

}, the_interval);


// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);
// would include other routes if using routing instead of sockets

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


/**
 * GIT COMMNANDS TO RUN WHEN COMMITING
 *
 * git st
 * git add *
 * git ci -m "commit msg"
 * git push origin HEAD:express-new
 *
 *
 * How to alias:
 *
 *  git config --global alias.co checkout
  */
