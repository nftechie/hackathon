<?php
	session_start(); 
	header('Content-type: application/json');

	if ($_POST['username'] && $_POST['password'] && $_POST['verifyPassword'] && $_POST['email']){
		$userName = $_POST['username'];
	    $userPass = $_POST['password'];
	    $userEmail = $_POST['email'];

		//assume username doesnt exist
		$usernameExists = false;

		list($user, $pass, $extra) = explode(",", file_get_contents('/home/flow-clock/conf/db_conf'));

		//check if username exists
		$dbconnection = mysql_connect("localhost", (string)$user, (string)$pass);
		mysql_select_db("flow-clock", $dbconnection);

		$checkUsername = "SELECT user_name from users";

		$usernameResults = mysql_query($checkUsername);

		while($currentrow = mysql_fetch_array($usernameResults)){
			if ($currentrow['user_name'] == $userName){
				$usernameExists = true;
				break;
			}
		}

		if ($usernameExists == false){
			/*
			 * Password hashing with PBKDF2.
			 * Author: havoc AT defuse.ca
			 * www: https://defuse.ca/php-pbkdf2.htm
			 */

			// These constants may be changed without breaking existing hashes.
			define("PBKDF2_HASH_ALGORITHM", "sha256");
			define("PBKDF2_ITERATIONS", 1000);
			define("PBKDF2_SALT_BYTE_SIZE", 24);
			define("PBKDF2_HASH_BYTE_SIZE", 24);

			define("HASH_SECTIONS", 2);
			define("HASH_ALGORITHM_INDEX", 0);
			define("HASH_ITERATION_INDEX", 1);
			define("HASH_SALT_INDEX", 1);
			define("HASH_PBKDF2_INDEX", 0);


			function create_hash($password)
			{
			    $salt = base64_encode(mcrypt_create_iv(PBKDF2_SALT_BYTE_SIZE, MCRYPT_DEV_URANDOM));
			    $hashedPassword = base64_encode(pbkdf2(
			            PBKDF2_HASH_ALGORITHM,
			            $password,
			            $salt,
			            PBKDF2_ITERATIONS,
			            PBKDF2_HASH_BYTE_SIZE,
			            true
			        ));
				
				return $hashedPassword . ":" . $salt;
			}

			function validate_password($password, $correct_hash)
			{
				$params = explode(":", $correct_hash);
				if(count($params) < HASH_SECTIONS)
					return false;
				$pbkdf2 = base64_decode($params[HASH_PBKDF2_INDEX]);
				return slow_equals(
					$pbkdf2,
					pbkdf2(
					    PBKDF2_HASH_ALGORITHM,
					    $password,
					    $params[HASH_SALT_INDEX],
					    (int)PBKDF2_ITERATIONS,
					    strlen($pbkdf2),
					    true
					)
				);
			}

			// Compares two strings $a and $b in length-constant time.
			function slow_equals($a, $b)
			{
				$diff = strlen($a) ^ strlen($b);
				for($i = 0; $i < strlen($a) && $i < strlen($b); $i++)
				{
					$diff |= ord($a[$i]) ^ ord($b[$i]);
				}
				return $diff === 0;
			}


			function pbkdf2($algorithm, $password, $salt, $count, $key_length, $raw_output = false)
			{
			    $algorithm = strtolower($algorithm);
			    if(!in_array($algorithm, hash_algos(), true))
			        die('PBKDF2 ERROR: Invalid hash algorithm.');
			    if($count <= 0 || $key_length <= 0)
			        die('PBKDF2 ERROR: Invalid parameters.');

			    $hash_length = strlen(hash($algorithm, "", true));
			    $block_count = ceil($key_length / $hash_length);

			    $output = "";
			    for($i = 1; $i <= $block_count; $i++) {
			        // $i encoded as 4 bytes, big endian.
			        $last = $salt . pack("N", $i);
			        // first iteration
			        $last = $xorsum = hash_hmac($algorithm, $last, $password, true);
			        // perform the other $count - 1 iterations
			        for ($j = 1; $j < $count; $j++) {
			            $xorsum ^= ($last = hash_hmac($algorithm, $last, $password, true));
			        }
			        $output .= $xorsum;
			    }

			    if($raw_output)
			        return substr($output, 0, $key_length);
			    else
			        return bin2hex(substr($output, 0, $key_length));
			}

			$hashAndSalt = create_hash($userPass);

			$hashAndSaltArray = explode(":", $hashAndSalt);


			//GENERATE AUTH TOKEN
			// start with an empty random string
			$random_string = "";
						
			//valid chars in random string
			$valid_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";

			// count the number of chars in the valid chars string so we know how many choices we have
			$num_valid_chars = strlen($valid_chars);

			// repeat the steps until we've created a string of the right length
			for ($i = 0; $i < 20; $i++) {
				// pick a random number from 1 up to the number of valid chars
				$random_pick = mt_rand(1, $num_valid_chars);

				// take the random character out of the string of valid chars
				// subtract 1 from $random_pick because strings are indexed starting at 0, and we started picking at 1
				$random_char = $valid_chars[$random_pick-1];

				// add the randomly-chosen char onto the end of our string so far
				$random_string .= $random_char;
			}

			$sql = "INSERT INTO users
			(first_name, last_name, user_name, password, salt, auth_token, email)
			VALUES
			(' ', ' ', '" . $userName . "', '" . $hashAndSaltArray[0] . "', '" . $hashAndSaltArray[1] . "', '" . $random_string . "', '" . $userEmail . "')";

			mysql_query($sql);

			$sql2 = "SELECT * from users";

			$results = mysql_query($sql2);

			//set user session variables
			while($currentrow = mysql_fetch_array($results)){
				if ($userName==$currentrow["user_name"] && validate_password($userPass, $currentrow["password"] . ":" . $currentrow["salt"])){
					$_SESSION["login"] = "YES";
					$_SESSION["userID"] = $currentrow["user_id"];
					$_SESSION["name"] = $currentrow["first_name"] . " " . $currentrow["last_name"];
					$_SESSION["username"] = $userName;
					$_SESSION["email"] = $currentrow["email"];
					$_SESSION["newUser"] = "YES";
					
					$_SESSION["auth"] = $random_string;
					
					//set cookies
					setcookie('username', $_SESSION["username"], time()+60*60*24*365, '/', 'www.jinseigo.com/flow-clock'); //lasts a year
					setcookie('password', $currentrow["password"], time()+60*60*24*365, '/', 'www.jinseigo.com/flow-clock'); //lasts a year

					$response['status'] = "success";
					echo json_encode($response);
				}
			}
		} else {
			$response['status'] = "usernameTaken";
			echo json_encode($response);
		}
	} else {
		$response['status'] = "failed";
		echo json_encode($response);
	}
?>