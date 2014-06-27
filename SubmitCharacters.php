<?php


require_once 'XMLSerializer.php';
require_once 'Login.php';
require_once 'db.inc.php';


function show_output($out)
{
	header('Last-Modified: ' . gmdate("D,d M YH:i:s") . " GMT");
	header('Cache-Control: no-cache, must-revalidate');
	header('Pragma: no-cache');
	header('Content-Type: text/xml; charset=utf-8');
	
	echo XMLSerializer::generateValidXmlFromArray($out);
}


$out = array();

if (!$login->checkAuth())
{
	$out["message"] = "invalid auth session";
	show_output($out);
	exit();
}

$char_arr = @$_POST['characters'];

if (empty($char_arr))
{
	$out["message"] = "no characters added";
	show_output($out);
	exit();
}


$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name"];
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

try
{
	$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
	$userID = $login->get_userID();
	$out["message"] = "adding characters";
	
	foreach ($char_arr as $char)
	{
		$charID = mysql_real_escape_string($char['characterid']);
		$keyID = mysql_real_escape_string($char['keyid']);
		$charName = mysql_real_escape_string($char['charactername']);
		
		// check for existing characters
		
		$count = $dbh->query("SELECT count(*) FROM `Characters`
			WHERE `characterID` = $charID AND `userID` = $userID")->fetchColumn();
		
		if ($count > 0)
		{
			$out["message"] .= "duplicate characterID cancelled";
			continue;
		}
		
		// insert
		
		$count = $dbh->exec("INSERT INTO Characters(keyID, characterID, userID, characterName)
			VALUES('$keyID', '$charID', '$userID', '$charName')");
		$out["message"] .= ($count > 0) ? " added character $charName"
			: " character not added";
	}
	
	$dbh = null;
}
catch (PDOException $e)
{
	$out["error"] = $e->getMessage();
	show_output($out);
	exit();
}


show_output($out);

?>
