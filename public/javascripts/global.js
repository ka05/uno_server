// Userlist data array for filling in info box


// DOM Ready =============================================================
$(document).ready(function() {

  function getInternetExplorerVersion() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat(RegExp.$1);
    }
    return rv;
  }

  // check if browser version is ie8
  function checkVersion() {
    var ver = getInternetExplorerVersion(),
        isIe8 = false;
    if (ver > -1) {
      isIe8 = (ver <= 8.0);
    }
    return isIe8;
  }

  ko.applyBindings(userInfo, document.getElementById('userInfoCont'));

  $(".button-collapse").sideNav();

  // check browser version
  if(checkVersion()){
    // browser is ie8
    userInfo.bodyTmpl("bad-browser");
  }else{
    // browser is modern - continue to load program
    userInfo.handleFlowLogic();
  }

});

var socket = io();
var mainSocket = io.connect('http://localhost:3000/login');
var gameSocket = io.connect('http://localhost:3000/game');


function User(_data){
  this.id = _data._id;
  this.email = _data.email;
  this.username = _data.username;
}

function ChatMsg(_data){
  this.sender = _data.sender;
  this.message = _data.message;
  this.senderColor = userInfo.getSenderColor(_data.sender);
}

function Challenge(_data){
  this.id = _data.id;
  this.challengeId = _data.challengeId;
  this.userChallenged = _data.userChallenged;
  this.timestamp = _data.timestamp;
  this.challenger = _data.challenger;
  this.status = _data.status;
  this.challengeClass = userInfo.getChallengeClass(_data.status);
}

function Card(_data){
  this.cardName = _data.cardName; // name of card (ex: Red 2)
  this.svgName = _data.svgName; // name of svg to be used
  this.count = _data.count; // number of duplicated cards in deck
}

// refer to this later for better closure techniques:
// http://www.kenneth-truyers.net/2013/04/27/javascript-namespaces-and-modules/

var userInfo = {
    userList : ko.observableArray(),
    activeUsers : ko.observableArray(),
    receivedChallenges : ko.observableArray(),
    sentChallenges : ko.observableArray(),
    chatMsgs : ko.observableArray(),
    postToken : ko.observable(),
    preToken : ko.observable(),
    challengeModalOpen : ko.observable(false),
    hasPhoneNum : ko.observable(false),
    userLoggedIn : ko.observable(false),
    pageHeading : ko.observable(""),
    errorMsg : ko.observable(""),
    challengeModalHeaderMsg : ko.observable(""),
    challengeModalTitle : ko.observable(),
    bodyTmpl : ko.observable("blank-tmpl"),
    loginBodyTmpl : ko.observable("blank-tmpl"),
    challengeFooterTmpl : ko.observable("blank-tmpl"),
    currUser : ko.observable(
      new User({
        "email":"",
        "username":""
      })
    ),
    getSenderColor : function(_sender){
      if(_sender == userInfo.currUser().username){
        return "me-txt";
      }else{
        return "sender-txt";
      }
    },
    getChallengeClass : function(_status){
      console.log(_status);
      switch(_status){
        case "cancelled":
          return "cancelled-item";
          break;
        case "accepted":
          return "accepted-item";
          break;
        case "declined":
          return "declined-item";
          break;
        case "pending":
          return "pending-item";
          break;
      }
    },
    getActiveUsers : function(){

      mainSocket.emit('getOnlineUsers', { uid:userInfo.currUser().id }, function(res){
        if(res.msg == 'success'){
          userInfo.activeUsers.removeAll();
          $.each(res.data, function () {
            userInfo.activeUsers.push(this);
          });
        }
      });

    },
    getChallenges : function(){

      mainSocket.emit('getChallenges', { id:userInfo.currUser().id }, function(res){
        if(res.msg == 'success'){
          console.log("rec challenges: " +JSON.stringify(res.data));
          userInfo.receivedChallenges.removeAll();
          $.each(res.data, function () {
            userInfo.receivedChallenges.push(new Challenge(this));
          });
        }
      });

      mainSocket.emit('getSentChallenges', { id:userInfo.currUser().id }, function(res){
        if(res.msg == 'success'){
          console.log("sent challenges: " +res.data);
          userInfo.sentChallenges.removeAll();
          $.each(res.data, function () {
            userInfo.sentChallenges.push(new Challenge(this));
          });
        }
      });

    },
    getChatMsgs:function(){
      $.ajax({
        type: 'POST',
        url: '/chat/chatmsgs',
        dataType: 'JSON'
      }).done(function( data ) {
        if(data){
          if(data.length != userInfo.chatMsgs().length){
            userInfo.chatMsgs.removeAll();
            $.each(data, function(){
              userInfo.chatMsgs.push(new ChatMsg(this));
            });
            // scroll chat down
            $('#chat-cont').scrollTop(document.getElementById("chat-cont").scrollHeight);
          }

        }
      });
    },
    //getUser : function(item, e){
    //  $.getJSON( '/users/userlist/' + e.target.parentNode.getAttribute("data-id"),
    //    function (data) {
    //      userInfo.currUser(new User(data));
    //      // only need to get username
    //    }
    //  );
    //},
    addUser: function(_actions){
      var email = $('#signup-body-form input#inputUserEmail').val(),
          username = $('#signup-body-form input#inputUsername').val(),
          password = $('#signup-body-form input#inputUserPassword').val();

      validateSignUp({
        success: function () {

          // Use AJAX to post the object to our adduser service
          $.ajax({
            type: 'POST',
            data: {
              'email': email,
              'username': username,
              'password': password
            },
            url: '/users/adduser',
            dataType: 'JSON'
          }).done(function( response ) {
            // Check for successful response
            if (response.msg === 'success') {

              // Clear the form inputs
              $('#signup-body-form fieldset input').val('');
              _actions.success();
            }
            else {
              // If something goes wrong, alert the error message that our service returned
              _actions.error(response.msg);
            }
          });
        },
        errors:function(){
          _actions.error();
        }
      });

    },

    removeUser : function(item, e){
      $.ajax({
        type: 'DELETE',
        url: '/users/deleteuser/' + e.target.parentNode.getAttribute("data-id")
      }).done(function( res ) {

        // Check for a successful (blank) response
        if (res.msg === '') {
          // get all users again refresh essentially
          userInfo.getUsers();
        }
        else {
          alert('Error: ' + res.msg);
        }

      });
    },
    sendChat : function(data, event, _roomId){
      var msg = $('#chat-msg').val(),
          roomId = "";

      // if send button was clicked or "return/enter" key pressed
      if(!_roomId){
        roomId = event.target.getAttribute("data-roomid");
      }else{
        roomId = _roomId;
      }

      if(msg != ""){
        socket.emit('chatMsg', {"senderId":userInfo.currUser().id, "message":msg, "roomId":roomId}, function(data){
         if(data.msg == "success"){
           $('#chat-msg').val(""); // reset field
         } else{
           alert("error sending messge"); // want to change this to a toast type message later
         }
        });


      }
    },
    handleFlowLogic : function(){
      userInfo.checkUserLoggedIn({
        success: function () {
          userInfo.changeMainView("lobby");
          userInfo.userLoggedIn(true);
        },
        error: function () {
          userInfo.changeMainView("main");
        }
      });
    },
    checkUserLoggedIn : function(_actions){
      // check local storage for token
      // send to checkToken and validate login
      if(window.localStorage.getItem("loggedInToken")){
        var token = window.localStorage.getItem("loggedInToken");

        mainSocket.emit('validateToken', {token:token}, function(data){
          // set currUser to result user
          if(data.valid == true){
            userInfo.currUser(data.user);
            window.localStorage.setItem("loggedInToken", data.user.token);
            _actions.success();
          }else{
            _actions.error();
          }
        });

      }else{
        _actions.error();
      }
    },
    changeMainView : function(_tmplName, _tabEle){
      // Notes : change this function to be re-usable and called from init of page ( onload )
      // call that function in onload passing in "login" so app starts with login
      // figure out how to do routes as different pages.


      if(_tabEle){
        userInfo.setActiveTab(_tabEle);
      }

      var tmplName = (_tmplName) ? _tmplName : _tabEle.getAttribute("data-view-name"),
          subTmplName = (_tabEle) ? _tabEle.getAttribute("data-subview-name") : "",
          subTmplTitle = (_tabEle) ? _tabEle.getAttribute("data-subview-title") : "";

      // show main view based on "data-view-name" attribute
      userInfo.bodyTmpl(tmplName);

      switch(tmplName){
        case "login":
        case "signup":
          userInfo.loginBodyTmpl(subTmplName);
          userInfo.pageHeading(subTmplTitle);
          $("#loginPass").keyup(function (e) {
            if (e.keyCode == 13) {
              // Enter Keypress
              userInfo.login();
            }
          });
          $("#inputUserVerifyPassword").keyup(function (e) {
            if (e.keyCode == 13) {
              // Enter Keypress
              userInfo.signUp();
            }
          });
          break;
        case "profile":
          $('ul.tabs').tabs();
          //$('#img-cont').html("");
          $('#img-cont').css("background-image", "url('media/profile.png')");
          // do progress bar around user img
          var startColor = '#6FD57F';
          var endColor = '#FC5B3F';

          if(!circle){
            var circle = new ProgressBar.Circle('#img-cont', {
              color: '#FCB03C',
              strokeWidth: 3,
              trailWidth: 0,
              duration: 30000,
              text: {
                value: '0'
              },
              step: function(state, circle) {
                circle.setText((circle.value() * 30).toFixed(0));
                circle.path.setAttribute('stroke', state.color);
              }
            });
          }

          circle.animate(1, {
            from: {color: startColor},
            to: {color: endColor}
          });
          break;
        case "lobby":
          setInterval(function(){ if( !(userInfo.challengeModalOpen()) ){ userInfo.getActiveUsers() } }, 1500 );
          setInterval(function(){ userInfo.getChallenges() }, 1500 );
          setInterval(function(){ userInfo.getChatMsgs() }, 1500 );
          $("#chat-msg").keyup(function (e) {
            if (e.keyCode == 13) {
              // Enter Keypress
              userInfo.sendChat(null, null, "1");
            }
          });
          break;
        case "game":
          // validate user can enter game first
          game.init();
          break;
      }
    },
    handleNavigation : function(data, event){
      var ele = userInfo.handleChildrenClick(event.target);
      userInfo.changeMainView(null, ele);
    },
    handleChildrenClick : function(_ele){
      var retEle = "";
      if(_ele.nodeName == "BUTTON"){
        retEle = _ele;
      }
      else{
        $(".button-collapse").sideNav("hide");
        if(_ele.nodeName != "LI"){
          retEle = _ele.parentNode;
        }else{
          retEle = _ele;
        }
      }
      return retEle;
    },
    editAccount : function(){
      // show modal allowing to change
      userInfo.bodyTmpl("edit-profile");
      // UID
      // Email
      // Phone num
      // Upload a photo - or use mycourses photo??
    },

    setActiveTab : function(_ele){
      $('#nav-mobile').find('li').each(function(){
        $(this).removeClass("active");
      });
      $('#mobile-nav').find('li').each(function(){
        $(this).removeClass("active");
      });
      _ele.className = "active";
    },
    login : function (item, e, _credentials) {

      if( (_credentials) || (userInfo.loginBodyTmpl() == "login-body") ){
        if(!_credentials){
          _credentials = null;
        }
        // validate login credentials
        userInfo.validateLogin({
          success:function(user){
            console.log(user);
            console.log("loggedIn");
            userInfo.changeMainView("lobby");
            userInfo.userLoggedIn(true);
            userInfo.currUser(user);
            window.localStorage.setItem("loggedInToken", user.token);
          },
          error:function(){
            $('#login-body-form').find('input').addClass("invalid");
            $('#login-error-msg').slideDown();
            userInfo.errorMsg("Incorrect combination!");
          }
        }, _credentials );

      }else{
        // show different form
        userInfo.loginBodyTmpl("login-body");
        userInfo.pageHeading("Login");
      }

    },
    logout:function(){
      window.localStorage.removeItem("loggedInToken");
      userInfo.changeMainView("main");
    },
    signUp : function(){
      if(userInfo.loginBodyTmpl() != "signup-body"){
        // show different form
        userInfo.loginBodyTmpl("signup-body");
        userInfo.pageHeading("Sign Up");
      }else{
        userInfo.addUser({
          success:function(){
            userInfo.login(
              null,
              null,
              {
                username:$('#inputUsername').val(),
                password:$('#inputUserPassword').val()
              }
            );
            // validate login
          },
          error:function(err){
            console.log("error signing up");
            $('#signup-body-form').find('input').addClass("invalid");
            $('#signup-error-msg').slideDown();
            userInfo.errorMsg(err);
          }
        });

      }
    },
    validateLogin: function(_actions, _credentials){
      var errorCount = 0,
          $loginForm =  $('#login-body-form');

      $loginForm.find('input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
      });

      // Check and make sure errorCount's still at zero
      if(errorCount === 0 || ( _credentials )) {
        var credentials = {
          'username': $loginForm.find('input#loginUsername').val(),
          'password': $loginForm.find('input#loginPass').val()
        };
        if(_credentials){
          credentials = _credentials;
        }

        mainSocket.emit('validateLogin', credentials, function(data){
          console.log(data);
          (data.valid == true) ? _actions.success(data.user) : _actions.error();
        });

      }else {
        // If errorCount is more than 0, error out
        alert('Please fill in all fields');
      }
    },
    testToken : function(){
      // generate token
      getToken();

      // compare token
    },
    promptChallengeResponse:function(data, event){
      var $challengeRespModal = $('#challengeRespModal'),
          challengeId = event.target.getAttribute("data-id"),
          challengerName = event.target.getAttribute("data-challenger");

      // only show modal if status is sent
      // if status is declined remove?
      userInfo.challengeFooterTmpl('challenge-resp-footer-tmpl');
      userInfo.challengeModalHeaderMsg("Accept or Decline Challenge from: " + challengerName);
      $challengeRespModal.openModal();

      $('#btn-accept-challenge').on("click", function(){
        // accepted challenge
        userInfo.handleChallenge(challengeId, 1);
      });
      $('#btn-decline-challenge').on("click", function(){
        // declined challenge
        userInfo.handleChallenge(challengeId, 2);
      });

    },
    promptCancelChallenge:function(data, event){
      var $challengeRespModal = $('#challengeRespModal'),
        challengeId = event.target.getAttribute("data-id"),
        userChallengedName = event.target.getAttribute("data-userchallenged");

      // only show modal if status is sent
      // if status is declined remove?
      userInfo.challengeFooterTmpl('challenge-cancel-footer-tmpl');
      userInfo.challengeModalHeaderMsg('Cancel your challenge to: ' + userChallengedName);
      $challengeRespModal.openModal();

      $('#btn-cancel-challenge').on("click", function(){
        // declined challenge
        userInfo.handleChallenge(challengeId, 0);
      });

    },
    showSendChallengeModal:function(data, event){
      var $challengeModal = $('#challengeUserModal'),
          $challengeBtn = $('#btn-challenge');
      $challengeModal.openModal();
      userInfo.challengeModalOpen(true);
      $challengeModal.find('p').on('click', function(){
        var $clickedPTag = $(this);
        if($challengeBtn.hasClass('disabled')){
          $challengeBtn.removeClass('disabled').on('click', function(){
            if( !($challengeBtn.hasClass('disabled')) ){
              userInfo.sendChallenge( $clickedPTag.find('input').attr("id"), userInfo.currUser().id, {
                success:function(){
                  console.log("challenge sent");
                },
                error:function(){
                  console.log("error sending challenge");
                }
              });
              $('#challengeUserModal').closeModal();
              userInfo.challengeModalOpen(false);
            }
          });

        }
      });

      $challengeModal.find('a.modal-close').on('click', function(){
        userInfo.challengeModalOpen(false);
      });

    },
    sendChallenge:function(_userChallengedId, _userChallengingId, _actions){
      console.log(arguments);
      $.ajax({
        type: 'POST',
        data: {
          'challengerId': _userChallengingId,
          'userChallengedId': _userChallengedId
        },
        url: '/lobby/sendchallenge',
        dataType: 'JSON'
      }).done(function (response) {
        //console.log(response);
        (response.msg == 'success') ? _actions.success() : _actions.error();
      });
    },
    handleChallenge:function(_challengeId, _choice){
      $.ajax({
        type: 'POST',
        data: {
          'challengeId': _challengeId,
          'userId':userInfo.currUser().id,
          'choice':_choice
        },
        url: '/lobby/handlechallenge',
        dataType: 'JSON'
      }).done(function (res) {
        console.log(res);
        if(res.msg == "success"){
          // based on response update challenges view ?
          $('#challengeRespModal').closeModal();
        }
      });
    }
};

var game = {
  shuffledDeck:[],
  // create the deck
  createDeck:function(_deckObj){
    var newDeck = [];
    $.each(_deckObj, function(index, value){
      for(var i = 0; i < parseInt(value.count); i++ ){
        newDeck.push({
          "cardName":value.cardName,
          "svgName":value.svgName
        });
      }
    });
    return newDeck;
  },

  // shuffle the deck
  shuffle:function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  },

  // draw a card
  draw:function(_numCards){
    var cards = [];

    for(var i = 0; i < _numCards; i++){
      cards.push( game.shuffledDeck.pop() );
    }

    return cards;
  },

  displayDraw:function(_card){
    var cardCont = $('<div>').attr('data-cardname', _card.cardName).attr("class", "card-cont"),
      cardEle = $('#' + _card.svgName).clone();

    cardCont.append(cardEle);

    $('#player-hand').append(cardCont);
    game.addCardEvent(_card.svgName, function(){ game.validateMove(this) });
  },

  addCardEvent:function(_cardId, _action){
    var a = document.getElementById(_cardId);

    a.addEventListener("load",function() {
      var card = a.contentDocument.getElementsByTagName("g");
      card[0].addEventListener("click", function(){ _action() },false);
    }, false);
  },

  drawMultiple:function(_numCards){
    var cards = game.draw(_numCards);

    $.each(cards, function(index, value){
      game.displayDraw(value);
    });
  },

  draw2:function(){
    game.drawMultiple(2);
  },

  draw4:function(){
    game.drawMultiple(4);
  },

  dealSingleCard:function(){
    game.drawMultiple(1);
  },

  dealHand:function(){
    game.drawMultiple(7);
  },

  validateMove:function(_card){
    console.log("validateMove" + _card);

    // 1st - ensure it is their turn

    // 2nd - ensure the card they clicked can be played

    // card types
    // if card is wild ( regular "wild" or "wild +4" ) show modal to select color
    // if card is reverse - change the order of players turns ( make previous player the active/next player )
  },

  reverse:function(){

  },

  // wildcard
  displayWildcardChoices:function(){
    // show modal to select color
  },


  // GAME LOGIC




  // PLAYERS SECTION

  populatePlayer:function(_imgPath, _handCount){
    $("#player-sect").append('<div class="player-wrap">' +
      '<img src="' + _imgPath + '" alt="">' +
      '<div class="hand-count">' + _handCount + '</div>' +
      '</div>');
  },


  // TEMPORARY INIT
  init:function(){
    game.populatePlayer("media/users/mcfly.jpg", 7);
    game.populatePlayer("media/users/mcfly.jpg", 4);
    game.populatePlayer("media/users/mcfly.jpg", 6);


    game.shuffledDeck = game.shuffle( game.createDeck(uno.deck));

    game.dealHand();

    game.addCardEvent("deck", function(){ game.dealSingleCard() })
  }



  // DB STORAGE INFO

  /*
   * Need to store the following:
   *
   * // for each game
   * Game:{
   *  gameId:_game_id,
   *  currentPlayer:_id_of_player,
   *  deck:{
   *    .. deck object here
   *  },
   *  activeColor:_active_color, // red, blue, yellow, green
   *  activeCardValue:_card_value, // this will be 1-9, skip, reverse, draw 2
   * }
   *
   */

};

function validateSignUp(_actions){
  var constraints = {
    email: {
      // Email is required
      presence: true,
      // and must be an email (duh)
      email: true
    },
    password: {
      // Password is also required
      presence: true,
      // And must be at least 5 characters long
      length: {
        minimum: 5
      }
    },
    "confirm-password": {
      // You need to confirm your password
      presence: true,
      // and it needs to be equal to the other password
      equality: "password"
    },
    username: {
      // You need to pick a username too
      presence: true,
      // And it must be between 3 and 20 characters long
      length: {
        minimum: 3,
        maximum: 20
      },
      format: {
        // We don't allow anything that a-z and 0-9
        pattern: "[a-z0-9]+",
        // but we don't care if the username is uppercase or lowercase
        flags: "i",
        message: "can only contain a-z and 0-9"
      }
    }
  };

  var form = document.querySelector("#signup-body-form");
  // then we validate them against the constraints
  var errors = validate(validate.collectFormValues(form), constraints);
  // then we update the form to reflect the results
  showErrors(form, errors || {});
  // And if all constraints pass we let the user know
  if (!errors) {
    console.log("valid");
    _actions.success();
  }else{
    console.log("error");
    _actions.errors();
  }

}




// Updates the inputs with the validation errors
function showErrors(form, errors) {
  // We loop through all the inputs and show the errors for that input
  $(form).find("input[name], select[name]").each(function() {
    // Since the errors can be null if no errors were found we need to handle
    showErrorsForInput($(this), errors && errors[$(this).attr("name")]);
  });
}


// Shows the errors for a specific input
function showErrorsForInput(input, errors) {
  // This is the root of the input
  var formGroup = $(input).parent().parent()
  // Find where the error messages will be insert into
    , messages = formGroup.find(".error-msg");
  // First we remove any old messages and resets the classes
  resetFormGroup(formGroup);
  // If we have errors
  if (errors) {
    // we first mark the group has having errors
    formGroup.addClass("has-error");
    // then we append all the errors
    $.each(errors, function(index, error) {
      messages.html(error);
    });
  } else {
    // otherwise we simply mark it as success
    formGroup.addClass("has-success");
  }
}


function resetFormGroup(formGroup) {
  // Remove the success and error classes
  formGroup.removeClass("has-error");
  formGroup.removeClass("has-success");
  // and remove any old messages
  $(formGroup).find(".error-msg").each(function() {
    $(this).html("");
  });
}


function getToken(){
  $.getJSON( '/users/getToken', function( data ) {
    userInfo.preToken(data.token);
    console.log(userInfo.preToken());
  });
}


// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/users/userlist', function( data ) {

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshowuser" rel="' + this.username + '">' + this.username + '</a></td>';
            tableContent += '<td>' + this.email + '</td>';
            tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#userList table tbody').html(tableContent);
    });
};
