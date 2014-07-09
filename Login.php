<?php


// http://pear.php.net/package/Auth
require_once 'Auth.php';
require_once 'Log.php';
require_once 'Log/observer.php';
require_once 'XMLSerializer.php';
require_once 'db.inc.php';


// wrapper for PEAR Auth + add appliction session data
//	relevant POST vars: reg_user, reg_pass, login_user, login_pass

class Login
{
	private $db_user;
	private $db_pass;
	private $db_host;
	private $db_name;
	private $auth;
	private $auth_msg = '';
	
	
	public function __construct($db_user, $db_pass, $db_host, $db_name)
	{
		$this->db_user = $db_user;
		$this->db_pass = $db_pass;
		$this->db_host = $db_host;
		$this->db_name = $db_name;
		
		
		$options = array(
			'dsn' => 'mysql://'.$db_user.':'.$db_pass.'@'.$db_host.'/'.$db_name,
			'enableLogging' => true,
			'postUsername' => 'login_user',
			'postPassword' => 'login_pass',
			'db_fields' => array('userID'),
		);
		
		$this->auth = new Auth('DB', $options, null);
		$this->auth->setShowLogin(false);
		$this->auth->start();
		$showOutput = false;
		
		// register
		
		if (isset($_POST["reg_user"]) && isset($_POST["reg_pass"])
			&& (!empty($_POST["reg_user"]) && !empty($_POST["reg_pass"])))
		{
			$showOutput = true;
			$this->add_user($_POST["reg_user"], $_POST["reg_pass"]);
		}

		// login
		
		if (!$this->auth->checkAuth() && @$_POST['login_pass'])
		{
			$showOutput = true;
			$this->auth_msg = 'login unsuccesful';
		}
		else if ($this->auth->checkAuth() && @$_POST['login_pass'])	// don't send message on initial session
		{
			$showOutput = true;
			$this->auth_msg = "login successful";
			$this->populateCustomData(@$_SESSION['_authsession']['username']);
		}
		
		if ($this->auth->checkAuth() && (@$_GET["action"] == "logout"))
		{
			$showOutput = true;
			$this->logout();
		}
		
		// checkAuth
		
		if (@$_GET["action"] == "checkAuth")
		{
			$showOutput = true;
		}
		
		// add api key
		
		$api_keyID = @$_POST["api_key_id"];
		$api_key_vcode = @$_POST["api_key_vcode"];
		
		if ($this->auth->checkAuth() && !empty($api_keyID))
		{
			$showOutput = true;
			$this->add_api_key($api_keyID, $api_key_vcode);
		}
		
		
		if ($showOutput) $this->show_output();
	}
	
	public function checkAuth()
	{
		return $this->auth->checkAuth();
	}
	
	public function get_userID()
	{
		return @$_SESSION['_authsession']['data']['userID'];
	}
	
	public function show_output()
	{
		$output = array(
			"authenticated" => (@$_SESSION['_authsession']['registered']) ? 'true' : 'false',
			"userName" => @$_SESSION['_authsession']['username'],
			"authMsg" => $this->auth_msg,
		);
		
		header('Last-Modified: ' . gmdate("D,d M YH:i:s") . " GMT");
		header('Cache-Control: no-cache, must-revalidate');
		header('Pragma: no-cache');
		header('Content-Type: text/xml; charset=utf-8');

		echo XMLSerializer::generateValidXmlFromArray($output);
	}
	
	private function add_user($user, $pass)
	{
		$auth_err = $this->auth->addUser($user, $pass);
			
		if ($auth_err === true)
			$this->auth_msg = 'User added';
		else
			$this->auth_msg = $auth_err->message;
	}
	
	private function logout()
	{
		$this->auth->logout();
		if (isset($_SESSION['userdata'])) $_SESSION['userdata'] = null;
		$this->auth_msg = "logged out";
	}
	
	private function populateCustomData($username)
	{
		@$_SESSION['userdata'] = array(
			'userID' => @$_SESSION['_authsession']['data']['userID'],
			'characterIDs' => array(),
			'characterNames' => array(),
		);
	}
	
	private function add_api_key($api_keyID, $api_key_vcode)
	{
		// validate input
		$keyID = mysql_real_escape_string($api_keyID);
		$vcode = mysql_real_escape_string($api_key_vcode);
		
		if (strlen($keyID) != 7)
		{
			$this->auth_msg = "api_keyID invalid";
			return;
		}
		if (strlen($vcode) != 64)
		{
			$this->auth_msg = "api_key_vcode invalid";
			return;
		}
		
		
		$dsn = 'mysql:host='.$this->db_host.';dbname='.$this->db_name;
		$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
			PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);
		
		try
		{
			$dbh = new PDO($dsn, $this->db_user, $this->db_pass, $options);
			
			// check for duplicate before insert
			
			$count = $dbh->query("SELECT count(*) FROM `APIKeyInfo`
				WHERE `keyid` = '$keyID'")->fetchColumn();
			
			if ($count > 0)
			{
				$this->auth_msg = "api_keyID key exists";
				return;
			}
			
			// insert
			
			$userID = @$_SESSION['_authsession']['data']['userID'];
			$count = $dbh->exec("INSERT INTO APIKeyInfo(keyid, vcode, userID)
				VALUES('$keyID', '$vcode', $userID)");
			$this->auth_msg = ($count > 0) ? "added key $keyID" : "key not added";
			$dbh = null;
		}
		catch (PDOException $e)
		{
			$this->auth_msg = $e->getMessage();
			return;
		} 
	}
};


$login = new Login($db['db_user'], $db['db_pass'], $db['db_host'], $db['db_name']);


?>
<?php
/*
<form id="add_api_form" action="" method="post" class="hidden">
	<h4>Add new API key<h4>
	<span>KeyID:</span>
	<input type="text" name="api_key_id" value="2783343"/><br />
	<span>vcode</span>
	<input type="text" name="api_key_vcode" value="aqvpW6gwteBl8faEECjd95aNT5Yk3VbFQpkDzQMaCqmdCELqy8k9res4DEysB6xX" /><br />
	<input id="api_key_submit" type="submit" />
</form>

<form id="login_form" action="" method="post">
	<h4>Login</h4>
	<span>User:</span>
	<input type="text" name="login_user" /><br />
	<span>Pass:</span>
	<input type="text" name="login_pass" /><br />
	<input id="login_submit" type="submit" />
</form>

<p>2783343</p>
<p>aqvpW6gwteBl8faEECjd95aNT5Yk3VbFQpkDzQMaCqmdCELqy8k9res4DEysB6xX</p>
//*/?>
