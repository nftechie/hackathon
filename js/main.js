$(document).ready(function() {

    var numTasks = 1;

    //initialize some php stuff
    $.ajax({
        type: 'GET',
        url: 'scripts/initialize.php',
        dataType: 'json',
        success: function(msg){
            if (msg.userID != "-1"){
                $("#loginButton").parent().attr("hidden", "hidden");
                $("#registerButton").parent().attr("hidden", "hidden");
                $("#logoutButton").parent().removeAttr("hidden");
            } 

            $(document.body).append("<div hidden id='hiddenUserID'>" + msg.userID + "</div>");
        } 
    });

    //target first input when modal is opened
    $(document.body).on('shown', ".reveal-modal", function(){
        $("#loginFirstInputField").focus();
        $("#registerFirstInputField").focus();
    });

    //simulate login with enter key
    $(document.body).on("keypress", "#loginFirstInputField", function(e) {
        if(e.which == 13) {
            $("#loginConfirm").click();
        }
    });
    $(document.body).on("keypress", "#loginModal #password", function(e) {
        if(e.which == 13) {
            $("#loginConfirm").click();
        }
    });

    //simulate register with enter key
    $(document.body).on("keypress", "#registerFirstInputField", function(e) {
        if(e.which == 13) {
            $("#registerConfirm").click();
        }
    });
    $(document.body).on("keypress", "#registerModal #password", function(e) {
        if(e.which == 13) {
            $("#registerConfirm").click();
        }
    });
    $(document.body).on("keypress", "#registerModal #verifyPassword", function(e) {
        if(e.which == 13) {
            $("#registerConfirm").click();
        }
    });
    $(document.body).on("keypress" ,"#registerModal #email", function(e) {
        if(e.which == 13) {
            $("#registerConfirm").click();
        }
    });

    //login
    $(document.body).on("click", "#loginConfirm", function(){
        if (($("#loginFirstInputField").val() != "") && ($("#loginModal #password").val() != "")){
            $.ajax({
                type: 'POST',
                url: 'scripts/loginRequest.php',
                data: { username : $("#loginFirstInputField").val(), password : $("#loginModal #password").val() },
                success: function(msg){
                    if (msg.status == "success"){
                        var cookie_str = "jsauth=" + msg.auth_token + "; expires=Mon, 1 Jan 2035 00:00:01 UTC; path=/";
                        document.cookie = cookie_str;
                        location.reload();
                    } else if (msg.status == "badInput") {
                        $("#loginError").html("<em>Wrong username or password</em>");
                        $("#loginError").fadeIn("slow");
                    } else {
                        $("#loginError").html("<em>Something went wrong, try again</em>");
                        $("#loginError").fadeIn("slow");
                    }
                } 
            });
        } else {
            $("#loginError").html("<em>Please enter a username and password</em>");
            $("#loginError").fadeIn("slow");
        }
    });

    //register
    $(document.body).on("click", "#registerConfirm", function(){
        if (($("#registerFirstInputField").val() != "") && ($("#registerModal #password").val() != "")
        && ($("#registerModal #verifyPassword").val() != "") && ($("#registerModal #email").val() != "")){
            if ($("#registerModal #password").val().length >= 5){
                if ($("#registerModal #password").val() == $("#registerModal #verifyPassword").val()){
                    var emailRegExp = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/igm;;
                    if ($("#registerModal #email").val().search(emailRegExp) != -1){
                        $.ajax({
                            type: 'POST',
                            url: 'scripts/registerRequest.php',
                            data: { username : $("#registerFirstInputField").val(), password : $("#registerModal #password").val(),
                                verifyPassword : $("#registerModal #verifyPassword").val(), email : $("#registerModal #email").val() },
                            success: function(msg){
                                if (msg.status == "success"){
                                    //location.reload();
                                    window.location.replace("?newUser=true");
                                } else if (msg.status == "usernameTaken") {
                                    $("#registerError").html("<em>Username is already taken</em>");
                                    $("#registerError").fadeIn("slow");
                                } else {
                                    $("#registerError").html("<em>Something went wrong, try again</em>");
                                    $("#registerError").fadeIn("slow");
                                }
                            } 
                        });
                    } else {
                        $("#registerError").html("<em>Please enter a valid email</em>");
                        $("#registerError").fadeIn("slow");
                    }
                } else {
                    $("#registerError").html("<em>Passwords don't match</em>");
                    $("#registerError").fadeIn("slow");
                }
            } else {
                $("#registerError").html("<em>Password must be at least 5 characters</em>");
                $("#registerError").fadeIn("slow");
            }
        } else {
            $("#registerError").html("<em>Please fill out the entire form</em>");
            $("#registerError").fadeIn("slow");
        }
    });

    //logout
    $(document.body).on("click", "#logoutButton", function(){
        $.ajax({
            type: 'POST',
            url: 'scripts/logout.php',
            data: { user : $(".hiddenUserID").attr("id") },
            success: function (msg) {
                console.log("Successful log out.");
                location.reload();
            }
        });
    });

    //create clock
    $(document.body).on("click", "#createClockConfirm", function(){
        var clockName = $("#clockName").val();

        var taskLengths = [];

        //dummy task length
        taskLengths.push(0);

        for (var i = 0; i < $(".taskLengths").length; i++){
            taskLengths.push($(".taskLengths")[i].value);
        }

        var taskNames = [];

        //dummy task name
        taskNames.push("dummyTask");
        for (var i = 0; i < $(".taskNames").length; i++){
            taskNames.push($(".taskNames")[i].value);
        }


        if (($("#clockName").val() != "") && ($("#task1Name").val() != "") && ($("#task1Length").val() != "")){
            $.ajax({
                type: 'POST',
                url: 'scripts/createClock.php',
                data: { userID : $("#hiddenUserID").html(), clockName : $("#clockName").val(), taskNames : taskNames, taskLengths : taskLengths},
                success: function(msg){
                    console.log(msg);
                    if (msg == "success"){
                        $("#createClockModal .close-reveal-modal").click();
                        $("#cName").html(clockName);
                        $("#clockInfo").removeAttr("hidden");
                        createClock(clockName, taskNames, taskLengths);
                    } 
                } 
            });
        } else {
            $("#createClockError").html("<em>Please enter a clock name, task name, and task length</em>");
            $("#createClockError").fadeIn("slow");
        }
    });

    //add task
    $(document.body).on("click", "#newTaskButton", function(){
        numTasks++;
        var html = "<br>Task " + numTasks + " <input id='taskName" + numTasks + "' class='taskNames' type='text' name='task' placeholder='Name'><input id='taskLength" + numTasks + "' class='taskLengths' type='text' name='task' placeholder='Time (seconds)'>";
        $("#createClockError").before(html);
    });


    $(document.body).on("mouseenter", "#flowClockContainer path", function(){
        $("#cTask").html($(this).attr("id"));
    });

    $(document.body).on("mouseleave", "#flowClockContainer g", function(){
        $("#cTask").html("");
    });

    $(document.body).on("mouseenter", "#dummyFlowClockContainer path", function(){
        $("#cTask").html($(this).attr("id"));
    });

    $(document.body).on("mouseleave", "#dummyFlowClockContainer g", function(){
        $("#cTask").html("");
    });

    //test clock
    $(document.body).on("click", "#testClockButton", function(){
        $("#flowClockContainer").empty();
        window.clearInterval(clockInterval);
        $("#cName").html("Test clock");
        $("#clockInfo").removeAttr("hidden");
        createClock("Test clock", ["dummyTask", "brush teeth", "shower", "put clothes on", "eat breakfast"], ["0", "120", "70", "50", "50"]);
    });

});