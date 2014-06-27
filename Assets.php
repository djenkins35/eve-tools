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
	$out["error"] = "invalid auth session";
	show_output($out);
	exit();
}

// get stored API key from db that matches input

$keyid = mysql_real_escape_string(@$_GET['keyid']);
$characterid = mysql_real_escape_string(@$_GET['characterid']);
$name = mysql_real_escape_string(@$_GET['name']);

if (empty($keyid) || empty($characterid) || empty($name))
{
	$out["error"] = "invalid input";
	show_output($out);
	exit();
}

$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name"];
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

try
{
	$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
	$userid = $login->get_userID();
	
	$row = $dbh->query("SELECT * FROM APIKeyInfo
		WHERE userID = $userid
		AND keyid = $keyid")->fetch();
	
	if (!$row["vcode"])
	{
		$out["error"] = "invalid keyid";
		show_output($out);
		exit();
	}
	
	$vcode = $row["vcode"];
	$dbh = null;
}
catch (PDOException $e)
{
	$out["error"] = $e->getMessage();
	show_output($out);
	exit();
}


// make Pheal API request

try
{
	$pheal = new Pheal($keyid, $vcode, 'char');
	$out = $pheal->AssetList(array('characterID' => $characterid))->toArray();
}
catch (\Pheal\Exceptions\PhealException $e)
{
	$out["error"] = sprintf("an exception was caught! Type: %s Message: %s",
			get_class($e),
			$e->getMessage()
		);
}


// loop through output array and add item and location names from eve dd

try
{
	$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name_data"];
	$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);
	$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
}
catch (PDOException $e)
{
	$out["error"] = $e->getMessage();
	show_output($out);
	exit();
}

foreach ($out['result']['assets'] as &$asset)
{
	try
	{
		$locationID = $asset['locationID'];
		$typeID = $asset['typeID'];
		
		$row = $dbh->query("SELECT invUniqueNames.*, invTypes.* FROM invUniqueNames
							CROSS JOIN invTypes
							WHERE invUniqueNames.itemID = $locationID
							AND invTypes.typeID = $typeID")->fetch();
		
		$asset['locationName'] = $row['itemName'];
		$asset['itemName'] = $row['typeName'];
		
		
		// loop through each container at location, limit to depth of 1
		
		if (!array_key_exists('contents', $asset))
			continue;
		
		foreach ($asset['contents'] as &$container)
		{
			$typeID = $container['typeID'];
			$row = $dbh->query("SELECT * from `invTypes` WHERE `typeID` = $typeID")->fetch();
			$container['itemName'] = $row['typeName'];
		}
	}
	catch (PDOException $e)
	{
		$out["error"] = $e->getMessage();
		show_output($out);
		exit();
	}
}


// finally, sort the output by the location name as a default sorting

usort($out['result']['assets'], function($a, $b){

	return strcmp($a['locationName'], $b['locationName']);
});


$dbh = null;

show_output($out);

?>
