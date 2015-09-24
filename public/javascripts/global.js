// Userlist data array for filling in info box


// DOM Ready =============================================================
$(document).ready(function() {

  ko.applyBindings(userInfo, document.getElementById('userInfoCont'));

  $(".button-collapse").sideNav();

  userInfo.handleFlowLogic();
});

function User(_data){
  this.id = _data._id;
  this.email = _data.email;
  this.username = _data.username;
  this.password = _data.password;
}

function Card(_data){
  this.cardName = _data.cardName; // name of card (ex: Red 2)
  this.svgName = _data.svgName; // name of svg to be used
  this.count = _data.count; // number of duplicated cards in deck
}

var userInfo = {
    userList : ko.observableArray(),
    bookList : ko.observableArray(),
    postToken : ko.observable(),
    preToken : ko.observable(),
    hasPhoneNum : ko.observable(false),
    userLoggedIn : ko.observable(false),
    bodyTmpl : ko.observable("blank-tmpl"),
    loginBodyTmpl : ko.observable("blank-tmpl"),
    deck : uno.deck,
    currUser : ko.observable(
      new User({
        "email":"",
        "username":""
      })
    ),
    getUsers  : function(){

      $.getJSON( '/users/userlist', function( data ) {
        userInfo.userList.removeAll();
        $.each(data, function(){
          userInfo.userList.push(new User(this));
        });
      });
    },

    getUser : function(item, e){
      $.getJSON( '/users/userlist/' + e.target.parentNode.getAttribute("data-id"),
        function (data) {
          userInfo.currUser(new User(data));
          // only need to get username
        }
      );
    },
    addUser: function(item, e){
      var userAdded = false,
          email = $('#signup-body-form input#inputUserEmail').val(),
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

              userAdded = true;
            }
            else {
              // If something goes wrong, alert the error message that our service returned
              //alert('Error: ' + response.msg);
              userAdded = false;
            }
          });
        },
        errors:function(){
          userAdded = false;
        }
      });

      return userAdded;
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
    handleFlowLogic : function(){
      if(userInfo.checkUserLoggedIn()){
        userInfo.changeMainView("lobby");
        userInfo.userLoggedIn(true);
      }else{
        userInfo.changeMainView("main");
      }
    },
    checkUserLoggedIn : function(){
      return false;
    },
    changeMainView : function(_tmplName, _tabEle){
      // Notes : change this function to be re-usable and called from init of page ( onload )
      // call that function in onload passing in "login" so app starts with login
      // figure out how to do routes as different pages.


      if(_tabEle){
        userInfo.setActiveTab(_tabEle);
      }

      var tmplName = (_tmplName) ? _tmplName : _tabEle.getAttribute("data-view-name"),
          subTmplName = (_tabEle) ? _tabEle.getAttribute("data-subview-name") : "";

      // show main view based on "data-view-name" attribute
      userInfo.bodyTmpl(tmplName);

      switch(tmplName){
        case "login":
        case "signup":
          userInfo.loginBodyTmpl(subTmplName);
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
    login : function () {
      // grab some basic validation code from another project to save time
      if(userInfo.loginBodyTmpl() != "login-body"){

        // show different form
        userInfo.loginBodyTmpl("login-body");
      }else{
        // validate login credentials
        userInfo.validateLogin({
          success:function(){
            console.log("loggedIn");
          },
          error:function(){
            console.log("Incorrect combination");
          }
        })
      }

    },
    signUp : function(){
      if(userInfo.loginBodyTmpl() != "signup-body"){
        // show different form
        userInfo.loginBodyTmpl("signup-body");
      }else{
        // ensure that user was inserted
        if(userInfo.addUser()){
          console.log("signed up");
          // log them in afterwards
          userInfo.login();
        }

      }
    },
    validateLogin: function(_actions){
      var errorCount = 0;

      $('#login-body-form input').each(function(index, val) {
        if($(this).val() === '') { errorCount++; }
      });

      // Check and make sure errorCount's still at zero
      if(errorCount === 0) {

        // Use AJAX to post the object to our adduser service
        $.ajax({
          type: 'POST',
          data: {
            'username': $('#login-body-form input#loginUsername').val(),
            'password': $('#login-body-form input#loginPass').val()
          },
          url: '/users/validateLogin',
          dataType: 'JSON'
        }).done(function (response) {
          console.log(response);
          (response.valid == true) ? _actions.success() : _actions.error();
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
    }
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
