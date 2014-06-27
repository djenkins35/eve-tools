<?php

$now = DateTime::createFromFormat('Y-m-d H:i:s', gmdate('Y-m-d H:i:s'));


echo "<pre>\n";
echo $now->getTimestamp() . "\n";
echo print_r($now);
echo "</pre>";

?>