<?php
	session_start();
	header('Content-type: application/json');

	if(empty($_SESSION["login"])){
		if ($_POST['username'] && $_POST['password']){
		    $userName = $_POST['username'];
		    $userPass = $_POST['password'];

		    $validUser = false;
		    $validPass = false;
		
			list($user, $pass, $extra) = explode(",", file_get_contents('/home/flow-clock/conf/db_conf'));

			//check if username exists
			$dbconnection = mysql_connect("localhost", (string)$user, (string)$pass);
			mysql_select_db("flow-clock", $dbconnection);
			
			$getUserPass = "SELECT * FROM users WHERE user_name='" . $userName . "'";
			$passResult = mysql_query($getUserPass);

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
				
		
			while ($currentrow = mysql_fetch_array($passResult)){
				if (validate_password($userPass, $currentrow["password"] . ":" . $currentrow["salt"])){
					$_SESSION["login"] = "YES";
					$_SESSION["userID"] = $currentrow["user_id"];
					$_SESSION["name"] = $currentrow["first_name"] . " " . $currentrow["last_name"];
					$_SESSION["username"] = $currentrow['user_name'];
					$_SESSION["email"] = $currentrow["email"];
					
					//update user auth token
					$updateAuth = "UPDATE users SET auth_token='" . $random_string . "' WHERE user_id=" . $_SESSION["userID"];
					mysql_query($updateAuth);
					
					$_SESSION["auth"] = $random_string;
					
					//set cookies
                    //setcookie('phpauth', $random_string, time()+60*60*24*365*1000, '/', 'www.jinseigo.com');
					//setcookie('username', $_SESSION["username"], time()+60*60*24*365, '/', 'www.mgsgo.com'); //lasts a year
					//setcookie('password', $currentrow["password"], time()+60*60*24*365, '/', 'www.mgsgo.com'); //lasts a year

					$validUser = true;
					$validPass = true;
				}	
			}

			if ($validUser && $validPass){
				$response['status'] = "success";
                $response['auth_token'] = $random_string;
				echo json_encode($response);
			} else {
				$response['status'] = "badInput";
				echo json_encode($response);
			}
		} else {	
			$response['status'] = "failed";
			echo json_encode($response);
		}
	} else {
		$response['status'] = "failed";
		echo json_encode($response);
	}
?>
