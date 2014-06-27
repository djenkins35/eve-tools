<?php


require_once 'vendor/autoload.php';
require_once 'XMLSerializer.php';
require_once 'Login.php';
require_once 'db.inc.php';


use Pheal\Pheal;
use Pheal\Core\Config;
Config::getInstance()->cache = new \Pheal\Cache\FileStorage('/tmp/phealcache/');
Config::getInstance()->access = new \Pheal\Access\StaticCheck();


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


// get stored characters and API keys from db

$char_array = array();
$userid = $login->get_userID();
$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name"];
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

try
{
	$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
	$rows = $dbh->query("SELECT Characters.*, APIKeyInfo.vcode from Characters
							LEFT JOIN APIKeyInfo ON Characters.keyID = APIKeyInfo.keyid
							WHERE Characters.userid = $userid");
	
	foreach ($rows as $row)
	{
		$char_array[] = array(
			'characterID' => $row['characterID'],
			'keyID' => $row['keyID'],
			'characterName' => $row['characterName'],
			'vcode' => $row['vcode']
		);
	}
	
	$dbh = null;
}
catch (PDOException $e)
{
	$out["error"] = $e->getMessage();
	show_output($out);
	exit();
}


// pull data from api

for ($i = 0; $i < count($char_array); $i++)
{
	try
	{
		$pheal = new Pheal($char_array[$i]['keyID'], $char_array[$i]['vcode'], 'char');
		$opts = array("characterID" => $char_array[$i]['characterID']);
		$out[$i] = $pheal->SkillQueue($opts)->toArray();
		$out[$i]['characterName'] = $char_array[$i]['characterName'];
		$out[$i]['characterID'] = $char_array[$i]['characterID'];
	}
	catch (\Pheal\Exceptions\PhealException $e)
	{
		$out["error"] = sprintf("an exception was caught! Type: %s Message: %s",
				get_class($e),
				$e->getMessage()
			);
	}
}


// map skill typeID to skill name and description from eve DB

$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name_data"];
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

foreach ($out as &$node)
{
	foreach ($node['result']['skillqueue'] as &$skill)
	{
		try
		{
			$typeid = $skill['typeID'];
			$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
			$row = $dbh->query("SELECT * from invTypes WHERE typeID = $typeid")->fetch();
			
			$skill['typeName'] = $row['typeName'];
			$skill['description'] = $row['description'];
			$dbh = null;
		}
		catch (PDOException $e)
		{
			$out["error"] = $e->getMessage();
			show_output($out);
			exit();
		}
	}
}


show_output($out);

?>
