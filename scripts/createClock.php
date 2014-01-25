<?php
	
	session_start();

	list($user, $pass, $extra) = explode(",", file_get_contents('/home/flow-clock/conf/db_conf'));

	//check if username exists
	$dbconnection = mysql_connect("localhost", (string)$user, (string)$pass);
	mysql_select_db("flow-clock", $dbconnection);

	$sql = "INSERT INTO clocks
			(name)
			VALUES
			('" . $_POST["clockName"] . "')";

	mysql_query($sql);


	$sql = "SELECT clock_id FROM clocks WHERE name='" . $_POST["clockName"] . "' ORDER BY clock_id DESC limit 1";

	$result = mysql_query($sql);

	while($currentrow = mysql_fetch_array($result)){
		$clockID = $currentrow["clock_id"];
	}


	$sql = "INSERT INTO user_clocks 
			(user_id, clock_id, is_owner) 
			VALUES
			(" . $_POST["userID"] . ", " . $clockID . ", 1)";

	mysql_query($sql);


	for ($i = 0; $i < count($_POST["taskNames"]); $i++){
		$sql = "INSERT INTO clock_task 
			(name, clock_id, seconds) 
			VALUES 
			('" . $_POST["taskNames"][i] . "', " . $clockID . ", " . $_POST["taskLengths"][i] . ")";

		mysql_query($sql);
	}

	echo "success";

?>