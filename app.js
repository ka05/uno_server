var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var fs = require('fs');

// data objects
var coreData = require('./custom_modules/coreData/coreData.js');

// Database
var mongo = require('mongoskin');

// NOTE:
// mongo issuse
// http://stackoverflow.com/questions/28651028/cannot-find-module-build-release-bson-code-module-not-found-js-bson

// var db = mongo.db("mongodb://localhost:27017/uno", {native_parser:true});
var db = mongo.db("mongodb://cjh3387:$Kink03oz@ds033135.mlab.com:33135/uno", {native_parser:true});

var routes = require('./routes/index');
var users = require('./routes/users')(db);
var game = require('./routes/game')(db);
var lobby = require('./routes/lobby')(db);
var chat = require('./routes/chat')(db);

// used for image uploads
var app = express();

var port = process.env.PORT || 3001;
var server = app.listen(port);
var io = require('socket.io').listen(server);
console.log("listening on PORT: "+port);

var loginIO = io
  .of('/login')
  .on("connection", function(socket){
    var loggedIn = false,
        socketId = socket.id;

    console.log('user connected - ID: ' + socketId);

    socket.on('uploadProfileImg', function(data, fn){
      var imgData = (typeof data === "string") ? JSON.parse(data) : data;
      var imageBufferData = new Buffer(imgData.image.encodedImage, 'base64'); // Ta-da

      var dirname = __dirname + "/public/media/users/";
      var newPath = dirname + imgData.image.originalFilename;

      var userProfileImageData = {
        'userId':imgData.userId,
        'imagePath':"/media/users/" + imgData.image.originalFilename
      };

      // finds user and updates image in db
      users.updateUserProfileImage(userProfileImageData, {
        success:function(){
          fs.writeFile(newPath, imageBufferData, 'base64', function (err) {
            console.log("writeFile: " + err);
            if(err){
              var res = {msg:"error"};
              socket.emit("uploadProfileImg", res);
              if(fn != null) fn(res);
            }else {
              var res = {msg:"success"};
              socket.emit("uploadProfileImg", res);
              if(fn != null) fn(res);
            }
          });
        },
        error:function(){
          var res = {msg:"error"};
          socket.emit("uploadProfileImg", res);
          if(fn != null) fn(res);
        }
      });
    });

    //endregion

    // loop through and create all these

    socket.on('disconnect', function () {
      console.log('user disconnected - ID: ' + socketId);
      users.setUserOffline(socketId);
      socket.broadcast.emit("notifyNeedsToUpdateOnlineUsers", {msg:'true'}); // tell other users needs update
    });

    socket.on('logout', function () {
      console.log('user logged out - ID: ' + socketId);
      users.setUserOffline(socketId);
      socket.broadcast.emit("notifyNeedsToUpdateOnlineUsers", {msg:'true'}); // tell other users needs update
    });

    socket.on('validateLogin', function(data, fn){
      console.log('validateLogin called in login section' + data);
      data = (typeof data === "string") ? JSON.parse(data) : data;
      data.socketId = socketId;
      users.validateLogin(data, {
        success:function(user){
          loggedIn = true;
          var res = {valid:true, user:new coreData.User(user)};
          socket.emit("validateLogin", res);
          socket.broadcast.emit("notifyNeedsToUpdateOnlineUsers", {msg:'true'}); // tell other users needs update
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {valid:false};
          socket.emit("validateLogin", res);
          if(fn != null) fn(res);
        }
      })
    });

    socket.on('validateToken', function(data, fn){
      data.socketId = socketId; // needed for setUserOnline(_userId, _socketId)
      users.validateToken(data, {
        success:function(user){
          var res = {valid:true, user:new coreData.User(user)};
          socket.emit("validateToken", res);
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {valid:false};
          socket.emit("validateToken", res);
          if(fn != null) fn(res);
        }
      })
    });

    socket.on('addUser', function(data, fn){
      data.socketId = socketId;
      users.addUser(data, {
        success:function(user){
          loggedIn = true;
          var res = {msg:"success", user:new coreData.User(user)};
          socket.emit("addUser", res);
          if(fn != null) fn(res);
        },
        error:function(msg){
          var res = (msg) ? {msg:msg} : {msg:"error"};
          socket.emit("addUser", res);
          if(fn != null) fn(res);
        }
      })
    });


    socket.on('getOnlineUsers', function(data, fn){

      users.getOnlineUsers(data, {
        success:function(res){
          var res = {msg:"success", data:res};
          socket.emit("getOnlineUsers", res);
          if(fn != null) fn(res);
        },
        error:function(msg){
          var res = (msg) ? {msg:msg} : {msg:"error"};
          socket.emit("getOnlineUsers", res);
          if(fn != null) fn(res);
        }
      });

    });

    socket.on('chatMsg', function (data, fn) {
      chat.sendChat(data, {
        success:function(){
          var res = {msg:"success"};
          socket.emit("chatMsg", res);

          chat.getChat(data, {
            success:function(resData){
              var res = {msg:'success', data:resData};
              socket.emit("getChat", res);
              socket.broadcast.emit("getChat", res);
            },
            error:function(){
              var res = {msg:'error'};
              socket.emit("getChat", res);
              socket.broadcast.emit("getChat", res);
            }
          });

          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:"error"};
          socket.emit("chatMsg", res);
          if(fn != null) fn(res);
        }
      });
    });

    socket.on('getChat', function (data, fn) {
      chat.getChat(data, {
        success:function(data){
          var res = {msg:'success', data:data};
          socket.emit("getChat",res);
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("getChat",res);
          if(fn != null) fn(res);
        }
      });
    });


    socket.on('sendChallenge',function(data, fn){

      lobby.sendChallenge(data, {
        success:function(res){
          var res = {msg:'success', data:res};
          socket.emit("sendChallenge", res);
          if(fn != null) fn(res);
          // TODO: for send challenge and handle challenge send back all results via a get challenge emit
          data = (typeof data === 'string' ) ? JSON.parse(data) : data;
          var getChallengesData = {
            "id":data.challengerId
          };

          //handleBroadcastChallenges(getChallengesData, "r");
          socket.emit("notifyNeedsToUpdateChallenges", {msg:'true'}); // tell self needs update
          socket.broadcast.emit("notifyNeedsToUpdateChallenges", {msg:'true'}); // tell other users needs update
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("sendChallenge", res);
          if(fn != null) fn(res);
        }
      });

    });

    function handleBroadcastChallenges(getChallengesData, type){
      if(type == "r"){
        lobby.getChallenges(getChallengesData, {
          success:function(res){
            socket.emit("getChallenges", {msg:'success', data:res});
            socket.broadcast.emit("getChallenges", {msg:'success', data:res});
          },
          error:function(){
            socket.emit("getChallenges", {msg:'error'});
            socket.broadcast.emit("getChallenges", {msg:'error'});
          }
        });
      }else if(type == "s"){
        lobby.getSentChallenges(getChallengesData, {
          success:function(res){
            socket.emit("getSentChallenges", {msg:'success', data:res});
            socket.broadcast.emit("getSentChallenges", {msg:'success', data:res});
          },
          error:function(){
            socket.emit("getSentChallenges", {msg:'error'});
            socket.broadcast.emit("getSentChallenges", {msg:'error'});
          }
        });
      }
    }

    socket.on('handleChallenge',function(data, fn){

      lobby.handleChallenge(data, {
        success:function(resData){
          var res = {msg:'success', data:resData};
          data = (typeof data === 'string' ) ? JSON.parse(data) : data;
          var getChallengesData = {
            "id":data.userId
          };
          //handleBroadcastChallenges(getChallengesData, "r");
          // TODO: ideally need to inform the users that they need to update
          // cant push to them without knowing their userId's
          socket.broadcast.emit("notifyNeedsToUpdateChallenges", {msg:'true'}); // tell other users needs update
          socket.emit("notifyNeedsToUpdateChallenges", {msg:'true'}); // tell self needs update
          socket.emit("handleChallenge", res);
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("handleChallenge", res);
          if(fn != null) fn(res);
        }
      });

    });

    socket.on('getChallenge',function(data, fn){

      lobby.getChallenge(data, {
        success:function(resData){
          var res = {msg:'success', data:resData};
          socket.emit("getChallenge", res );
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("getChallenge", res );
          if(fn != null) fn(res);
        }
      });

    });

    socket.on('getChallenges',function(data, fn){

      lobby.getChallenges(data, {
        success:function(resData){
          var res = {msg:'success', data:resData};
          socket.emit("getChallenges", res );
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("getChallenges", res );
          if(fn != null) fn(res);
        }
      });

    });


    socket.on('getSentChallenges',function(data, fn){

      lobby.getSentChallenges(data, {
        success:function(resData){
          var res = {msg:'success', data:resData};
          socket.emit("getSentChallenges", res);
          if(fn != null) fn(res);
        },
        error:function(){
          var res = {msg:'error'};
          socket.emit("getSentChallenges", res);
          if(fn != null) fn(res);
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
            var res = {msg:"success", data:game};
            socket.emit(funcName, res);

            if(funcName == "validateMove" || funcName == "drawCard" || funcName == "sayUno" || funcName == "challengeUno" || funcName == "quitGame"){
              socket.broadcast.emit("notifyNeedsToUpdateGame", {msg:'true'});
            }

            if(fn != null) fn(res);
          },
          error:function(msg){
            var res = (msg) ? {msg:msg} : {msg:"error"};
            socket.emit(funcName, res);
            if(fn != null) fn(res);
          }
        });
      }
    }

    for(var i = 0, j = emitArr.length; i<j; i++){
      socket.on( emitArr[i], makeSocketOn(emitArr[i]) );
    }

  });

// use namespaces : turn this into a dispatch
/*
io.on('connection', function(socket){
  var socketId = socket.id;
  var clientIp = socket.request.connection.remoteAddress;
  console.log('user connected - ID: ' + socketId);

  checkNotify(socket); // handles checking for notifications of challenges being deleted

  socket.on('disconnect', function () {
    console.log('user disconnected - ID: ' + socketId);
    users.setUserOffline(socketId);
  });

  socket.on('validateLogin', function(data, fn){
    console.log("validate login called");
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
      error:function(msg){
        (msg) ? fn({msg:msg}) : fn({msg:"error"});
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
*/

var needsToNotifyForChallenges = false;

function checkNotify(socket){
  setInterval(function(){

    if(needsToNotifyForChallenges){
      socket.broadcast.emit("notifyNeedsToUpdateChallenges", {msg:'true'}); // tell other users needs update
      needsToNotifyForChallenges = false;
    }

  }, 10 * 1000); // 10 seconds
}

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
      console.log("Bad/Old challenges successfully removed");
      // TODO:: figure out how to notify / broadcast from here
      needsToNotifyForChallenges = true;
    },
    error:function(){
      console.log("Error removing bad/old challenges")
    }
  });

  // delete chat older than 1 hour
  // Not going to do this anymore
  /*
  chat.removeOldChat({
    success:function(){
      console.log("Completed games successfully removed");
    },
    error:function(){
      console.log("Error removing completed games")
    }
  });
  */

}, the_interval);


// view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Make our db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

app.use('/', routes);


//require('./routes/imageUpload.js')(app);

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
