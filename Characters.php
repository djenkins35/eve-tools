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


// get stored API keys from db

$api_keys = array();
$dsn = 'mysql:host='.$db["db_host"].';dbname='.$db["db_name"];
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8',
	PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);

try
{
	$dbh = new PDO($dsn, $db["db_user"], $db["db_pass"], $options);
	$userid = $login->get_userID();
	$rows = $dbh->query("SELECT * from APIKeyInfo WHERE userID = $userid");
	
	foreach ($rows as $row)
	{	
		$api_keys[] = array(
			'keyid' => $row['keyid'],
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


// create a new Pheal session for each key saved
$i = 0;
foreach ($api_keys as $key)
{
	try
	{
		$pheal = new Pheal($key['keyid'], $key['vcode'], 'account');
		$out[$i] = $pheal->Characters()->toArray();
		// need to map to each keyid since we're using more than 1
		$out[$i]['keyid'] = $key['keyid'];
		$i++;
	}
	catch (\Pheal\Exceptions\PhealException $e)
	{
		$out["error"] = sprintf("an exception was caught! Type: %s Message: %s",
				get_class($e),
				$e->getMessage()
			);
	}
}

show_output($out);

?>

