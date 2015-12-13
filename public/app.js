/**
 * Created by claytonherendeen on 10/12/15.
 */

// Configure the loading modules
requirejs.config({
  baseUrl: 'js',
  paths: {
    jquery: 'lib/jquery.min',
    knockout: 'lib/knockout',
    validate: 'lib/validate',
    materialize: 'lib/materialize.min',
    socketio: 'lib/socket.io',
    hammerjs: 'lib/hammerjs',
    "jquery-hammerjs": 'lib/jquery.hammer',
    velocity: 'lib/velocity',

    // main modules
    coreData:"coreData",
    util:"util",
    chat:"chat"
  },
  shim:{
    //'socketio': {
    //  exports: 'io'
    //},
    'materialize':{
      deps: ['jquery', 'hammerjs', 'jquery-hammerjs', 'velocity']
    }
  }
});

/*
 * Main Module: uno
 *
 * Contains primarily functions and observables that initialize the site
 */

define('uno', ['jquery', 'knockout', 'coreData', 'util', 'chat', 'game', 'lobby', 'hammerjs', 'velocity', 'validate', 'materialize'], function ( $, ko, coreData, util, chat, game, lobby, hammer, velocity, validate) {
  var self = uno = {};

  // necessary to get materialize working with require.js ( stupid! - took way too damn long to figure this out )
  window.Hammer = hammer;
  window.Vel = velocity;


  /* NOTES

    refer to this later for better closure techniques:
    http://www.kenneth-truyers.net/2013/04/27/javascript-namespaces-and-modules/


    structure / org / architechture tips
    http://modernweb.com/2013/09/30/building-multiplayer-games-with-node-js-and-socket-io/
    http://psitsmike.com/2011/10/node-js-and-socket-io-multiroom-chat-tutorial/


    SocketIO examples
    http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io

   */

  // essentially an init func -> that tells it where to navigate to on refresh or load
  self.handleFlowLogic = function(){
    util.checkUserLoggedIn({
      success: function () {
        util.userLoggedIn(true);

        // then check if in game - passing in gameId ( from LS )
        if(window.localStorage.getItem("gameId")){
          changeMainView("game");
          // may not be able to do this - ASK DAN!!!!!!!!!!!!!!!!!!
        }else{
          //they arent in a game so send them to the lobby
          changeMainView("lobby");
        }
      },
      error: function () {
        changeMainView("main");
      }
    });
  };



  // main modules
  self.util = util;
  self.chat = chat;
  self.game = game;
  self.lobby = lobby;
  self.coreData = coreData;

  return self;
});


define(['uno', 'jquery', 'knockout'], function (uno, $, ko) {

  window._uno = uno; // bind bmx to window object
  ko.applyBindings(uno, document.body); // apply ko bindings


  // fix sideNav thing later - issue with shimming in materializejs
  $(".button-collapse").sideNav();

  // check browser version
  if(uno.util.checkVersion()){
    // browser is ie8
    util.bodyTmpl("bad-browser");
  }else{
    // browser is modern - continue to load program
    uno.handleFlowLogic();
  }



});
