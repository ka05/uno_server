/**
 * Created by claytonherendeen on 10/12/15.
 */

define('util', ['jquery', 'knockout', 'coreData', 'chat' ], function ( $, ko, coreData) {
  var self = util = {},

    // main body tmpl
    bodyTmpl = ko.observable("blank-tmpl"),

    // login
    pageHeading = ko.observable(""),
    loginBodyTmpl = ko.observable("blank-tmpl"),
    userLoggedIn = ko.observable(false),
    challengeModalOpen = ko.observable(false),
    errorMsg = ko.observable(""),
    inLobby = ko.observable(false),
    userInGame = ko.observable(false),
    preGameLobbyMsg = ko.observable(""),
    activeChallengeId = ko.observable();


  // GET stuff

  getActiveUsers = function(){

    coreData.mainSocket.emit('getOnlineUsers', { uid:coreData.currUser().id }, function(res){
      if(res.msg == 'success'){
        coreData.activeUsers.removeAll();
        $.each(res.data, function () {
          coreData.activeUsers.push(this);
        });
      }
    });

  };
  getChallenges = function(){

    coreData.mainSocket.emit('getChallenges', { id:coreData.currUser().id }, function(res){
      if(res.msg == 'success'){
        //console.log("rec challenges: " +JSON.stringify(res.data));
        coreData.receivedChallenges.removeAll();
        $.each(res.data, function () {
          coreData.receivedChallenges.push(new coreData.RecChallenge(this));
        });
      }
    });

    coreData.mainSocket.emit('getSentChallenges', { id:coreData.currUser().id }, function(res){
      if(res.msg == 'success'){
        //console.log("sent challenges: " +res.data);
        coreData.sentChallenges.removeAll();
        $.each(res.data, function () {
          coreData.sentChallenges.push(new coreData.SentChallenge(this));
        });
      }
    });

  };

  self.getChallenge = function(_challengeId, _actions){

    // call server and get challenge obj
    coreData.mainSocket.emit("getChallenge", {challengeId:_challengeId}, function(data){
      if(data.msg == "success"){
        _actions.success(data.data); // send challenge obj back as param to callback
      }else{
        _actions.error();
      }
    });

  };

  self.toggleInGameChat = function(){
    $('#inGameChatWindow').toggleClass("active");
  };

  setActiveTab = function(_ele){
    $('#nav-mobile').find('li').each(function(){
      $(this).removeClass("active");
    });
    $('#mobile-nav').find('li').each(function(){
      $(this).removeClass("active");
    });
    _ele.className = "active";
  };

  changeMainView = function(_tmplName, _tabEle){
    // Notes : change this function to be re-usable and called from init of page ( onload )
    // call that function in onload passing in "login" so app starts with login
    // figure out how to do routes as different pages.

    // set in lobby to false
    inLobby(false);

    if(_tabEle){
      setActiveTab(_tabEle);
    }

    var tmplName = (_tmplName) ? _tmplName : _tabEle.getAttribute("data-view-name"),
      subTmplName = (_tabEle) ? _tabEle.getAttribute("data-subview-name") : "",
      subTmplTitle = (_tabEle) ? _tabEle.getAttribute("data-subview-title") : "";

    // show main view based on "data-view-name" attribute
    bodyTmpl(tmplName);

    switch(tmplName){
      case "login":
      case "signup":
        loginBodyTmpl(subTmplName);
        pageHeading(subTmplTitle);
        $("#loginPass").keyup(function (e) {
          if (e.keyCode == 13) {
            // Enter Keypress
            login();
          }
        });
        $("#inputUserVerifyPassword").keyup(function (e) {
          if (e.keyCode == 13) {
            // Enter Keypress
            signUp();
          }
        });
        break;
      case "profile":

        /*
        // CIRCLE ANIMATION - WAS GOING TO USE FOR COUNTDOWN FOR PLAYER TURNS
        $('#img-cont').css("background-image", "url('media/users/user.png')");
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
        */
        break;
      case "lobby":
        //userInGame(false);
        inLobby(true);
        // stop interval if... !!!!!!!!!! --------- THIS IS A PROBLEM BECAUSE IT STOPS - FIX ME
        var getActiveUsersInterval = setInterval(function(){ if(userLoggedIn() && !(challengeModalOpen()) ){ getActiveUsers(); } }, 1500 );
        var getChallengesInterval = setInterval(function(){ if(userLoggedIn()){ getChallenges() }else{ clearInterval(getChallengesInterval); } }, 1500 );
        var getChatMsgsInterval = setInterval(function(){ if(userLoggedIn() && inLobby()){ chat.getChatMsgs("1", coreData.chatMsgs) }else{ clearInterval(getChatMsgsInterval); } }, 1000 );

        break;
      case "game":
        inLobby(false);
        //userInGame(true);
        break;
      case "logout":
        logout();
        break;
    }
  };

  self.sendChatViaEnterKey = function(item, event){
    var sendBtnId = event.target.getAttribute("data-btn-id");

    if (event.keyCode == 13) {
      // Enter Keypress
      chat.sendChat(sendBtnId);
    }

  };


  login = function (item, e, _credentials) {

    if( (_credentials) || (loginBodyTmpl() == "login-body") ){
      if(!_credentials){
        _credentials = null;
      }
      // validate login credentials
      validateLogin(_credentials, {
        success:function(user){
          //console.log("loggedIn user: " + user);
          changeMainView("lobby");
          userLoggedIn(true);
          coreData.currUser(user);
          window.localStorage.setItem("loggedInToken", user.token);
        },
        error:function(){
          console.log("error logging in");
          $('#login-body-form').find('input').addClass("invalid");
          $('#login-error-msg').slideDown();
          errorMsg("Incorrect combination!");
        }
      });

    }else{
      // show different form
      loginBodyTmpl("login-body");
      pageHeading("Login");
    }

  };

  logout = function(){
    window.localStorage.removeItem("loggedInToken");
    userLoggedIn(false);

    // if user was in game
    if(userInGame()){
      userInGame(false);
    }
    // if user was in lobby
    if(inLobby()){
      inLobby(false);
    }

    changeMainView("main");
  };

  addUser = function(_actions){
    var email = $('#signup-body-form').find('input#inputUserEmail').val(),
      username = $('#signup-body-form').find('input#inputUsername').val(),
      password = $('#signup-body-form').find('input#inputUserPassword').val();

    validateSignUp({
      success: function () {

        coreData.mainSocket.emit('addUser', {
            'email': email,
            'username': username,
            'password': password
          }, function(data){
            if(data.msg == "success"){
              // Clear the form inputs
              $('#signup-body-form fieldset input').val('');
              _actions.success();
            }else{
              Materialize.toast(data.msg, 3000);
            }
          });
      },
      errors:function(){
        _actions.error();
      }
    });

  };


  signUp = function(){
    if(loginBodyTmpl() != "signup-body"){
      // show different form
      loginBodyTmpl("signup-body");
      pageHeading("Sign Up");
    }else{
      addUser({
        success:function(){
          util.login(
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
          errorMsg(err);
        }
      });

    }
  };

  self.handleNavigation = function(data, event){
    var ele = handleChildrenClick(event.target);
    changeMainView(null, ele);
  };

  handleChildrenClick = function(_ele){
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
  };

  self.checkUserLoggedIn = function(_actions){
    // check local storage for token
    // send to checkToken and validate login
    if(window.localStorage.getItem("loggedInToken")){
      var token = window.localStorage.getItem("loggedInToken");

      coreData.mainSocket.emit('validateToken', {token:token}, function(data){
        // set currUser to result user
        if(data.valid == true){
          coreData.currUser(data.user);
          window.localStorage.setItem("loggedInToken", data.user.token);
          _actions.success();
        }else{
          _actions.error();
        }
      });

    }else{
      _actions.error();
    }
  };



  // Validation Code

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

  // Resets fields in form group
  function resetFormGroup(formGroup) {
    // Remove the success and error classes
    formGroup.removeClass("has-error");
    formGroup.removeClass("has-success");
    // and remove any old messages
    $(formGroup).find(".error-msg").each(function() {
      $(this).html("");
    });
  }

  validateLogin = function(_credentials, _actions){
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

      coreData.mainSocket.emit('validateLogin', credentials, function(data){
        (data.valid == true) ? _actions.success(data.user) : _actions.error();
      });

    }else {
      // If errorCount is more than 0, error out
      alert('Please fill in all fields');
    }
  };
  validateSignUp = function(_actions){
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
      _actions.success();
    }else{
      _actions.errors();
    }

  };

  // END Validation Code

  // browser redirection code

  getInternetExplorerVersion = function() {
    var rv = -1; // Return value assumes failure.
    if (navigator.appName == 'Microsoft Internet Explorer') {
      var ua = navigator.userAgent;
      var re = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
      if (re.exec(ua) != null)
        rv = parseFloat(RegExp.$1);
    }
    return rv;
  };

  // check if browser version is ie8
  self.checkVersion = function() {
    var ver = getInternetExplorerVersion(),
      isIe8 = false;
    if (ver > -1) {
      isIe8 = (ver <= 8.0);
    }
    return isIe8;
  };

  // END browser redirection code

  // variables bound
  self.bodyTmpl = bodyTmpl;
  self.pageHeading = pageHeading;
  self.loginBodyTmpl = loginBodyTmpl;
  self.errorMsg = errorMsg;
  self.userLoggedIn = userLoggedIn;
  self.challengeModalOpen = challengeModalOpen;
  self.inLobby = inLobby;
  self.userInGame = userInGame;
  self.preGameLobbyMsg = preGameLobbyMsg;
  self.activeChallengeId = activeChallengeId;


  // functions bound
  self.changeMainView = changeMainView;
  self.getInternetExplorerVersion = getInternetExplorerVersion;
  self.handleChildrenClick = handleChildrenClick;
  self.setActiveTab = setActiveTab;
  self.getActiveUsers = getActiveUsers;
  self.getChallenges = getChallenges;

  self.login = login;
  self.logout = logout;
  self.signUp = signUp;
  self.addUser = addUser;
  self.validateSignUp = validateSignUp;
  self.validateLogin = validateLogin;

  return self;
});