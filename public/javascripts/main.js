$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();
  var instructor = false;
  var tagfilter = 'none';

  var socket = io();

  let room = '';


  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
      //check if user is an instructor
      $.get('/get_instructor', { username: username }, function(resp_data){
		console.log(resp_data);
		if (resp_data.length > 0){
			instructor = true;
		}
		console.log("is instructor: "+instructor);
		if (instructor){
	   		createTagFilter();
       		}	
	});
    }
  }

  //creates a filter for tags (only instructors can see this)
  function createTagFilter () {
	let tags = ['none','no tag', 'question', 'suggestion'];
        console.log("Instructor is true drop down entered");
    	let parenttag = $('#tag-drop');
	parenttag.append($('<h5>').text("Filter by Tag"));
	let tmp = $('<select>');
	tmp.attr('id', 'tagfil');
	for (let i = 0; i < tags.length; i++){
		let tmpopt = $('<option>').text(tags[i]);
		tmpopt.attr('id', 'tagdrop'+i);
		tmp.append(tmpopt);
	}
	parenttag.append(tmp);
	$('#tagfil').change(function () {
		console.log('drop change');
		tagfilter = this.value.replace(/\s/, '');
		console.log('tag filter: '+tagfilter);
		clearMessages();
		var message = "Welcome to " + room + "\'s Chat!";
		log(message, {
		  prepend: true
		});
		$.get('/get_messages', { course: room, tag: tagfilter }, function(resp_data){
		  for(let x = 0; x < resp_data.length; x++){
		    addChatMessage({
		      username: resp_data[x]["username"],
		      message: resp_data[x]["content"],
		      tag: resp_data[x]["tag"]
		    });
		  }

		});
	});
  }

  // Sends a chat message
  function sendMessage () {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    var tag = document.getElementById("tag-select").value;
    console.log(tag);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message,
	tag: tag
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);

      /*
       *  Save the new message to the database
       */
      var messages = {};
      messages['username'] = username;
      messages['content'] = message;
      messages['course'] = room;
      messages['tag'] = tag; 

      $.post('/add_messages', messages, function(resp){
        console.log(resp);
      });

    }
  }

  // Log a message
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  //Clear all the messages
  function clearMessages(){
    $('.messages')[0].innerHTML = '';
  }

  // Adds the visual chat message to the message list
  function addChatMessage (data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);
    if (data.tag != "notag" && data.tag != "0" && instructor){
        var $tagDiv = $('<span class="tagBody">')
          .text("  " + data.tag)
          .css('color', 'aqua');
    }
    else{
	var $tagDiv = $('<span class="tagBody">')
    }
    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv, $tagDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement (el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }

  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor (username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {

        //This is called when the username is setup
        setUsername();

      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    connected = true;
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', function (data) {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {   
    log(data.username + ' joined');
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', function (data) {
    log(data.username + ' left');
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', function (data) {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', function (data) {
    removeChatTyping(data);
  });

  /*
   *
   *  Set the onclick handlers for all the students classes.
   *  Used to broadcast to a specific socket
   *
   */
  function addHandlers(){
    
    let children = $('#class-list')[0].children;

    for(let x = 0; x < children.length; x++){

      $('#' + children[x].id).on('click', function(){
        socket.emit('leave-room', room);
        room = children[x].innerText;
        socket.emit('join-room', room);
        clearMessages();
        var message = "Welcome to " + room + "\'s Chat!";
        log(message, {
          prepend: true
        });
        $.get('/get_messages', { course: room, tag: tagfilter }, function(resp_data){
          for(let x = 0; x < resp_data.length; x++){
            addChatMessage({
              username: resp_data[x]["username"],
              message: resp_data[x]["content"],
	      tag: resp_data[x]["tag"]
            });
          }

        });

      });

    }

  }

  addHandlers();




});
