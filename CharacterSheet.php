<?php


require_once 'vendor/autoload.php';
require_once 'XMLSerializer.php';
require_once 'Login.php';
require_once 'db.inc.php';


$keyID = 2560091;
$vCode = "7bkda35rtoogEwQmbyS2r5MTE5dgbRX4Nsu3fsfzx8KmkacDakoyLFVapu2zb4de";
$characterID = 1950376085;


use Pheal\Pheal;
use Pheal\Core\Config;
Config::getInstance()->cache = new \Pheal\Cache\FileStorage('/tmp/phealcache/');
Config::getInstance()->access = new \Pheal\Access\StaticCheck();


$pheal = new Pheal($keyID, $vCode, "char");
$out = array();

try {
	
	$method = 'CharacterSheet';
	$response = $pheal->$method(array("characterID" => $characterID));
	$out = $response->toArray();
}
catch (\Pheal\Exceptions\PhealException $e)
{
	$out["error"] = sprintf("an exception was caught! Type: %s Message: %s",
			get_class($e),
			$e->getMessage()
		);
}


/*
$db_user = 'root';
$db_pass = 'test';
$db_name = 'evesdd_rubicon10';

$dsn = 'mysql:host=localhost;dbname=' . $db_name;
$options = array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8');


try 
{
	$dbh = new PDO($dsn, $db_user, $db_pass, $options);
	$row = $dbh->query("SELECT * from invTypes WHERE typeID = $response->trainingTypeID")->fetch();
	$dbh = null;
	
} catch (PDOException $e)
{
	echo $e->getMessage();
}

//*/



//$out["result"]["typeName"] = $row["typeName"];
//$out["result"]["description"] = $row["description"];

//*
header('Last-Modified: ' . gmdate("D,d M YH:i:s") . " GMT");
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');
header('Content-Type: text/xml; charset=utf-8');
//*/

echo XMLSerializer::generateValidXmlFromArray($out);



/*
echo "<pre>";
var_dump($out);
echo "</pre>";
//*/
//echo "<p>" . $row["typeName"] . "</p>";
//echo "<p>" . $row["description"] . "</p>";

?>
