<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">


<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">

<head>
	<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
	<link rel="stylesheet" type="text/css" href="style.css" />
	<script src="js/jquery-2.1.1.min.js"></script>
	<script src="js/script.js"></script>
</head>

<body>

	<div id="header">
		
		<ul id="option_panel" class="hidden">
			<li><a href="#" id="home_link">home</a></li>
			<li><a href="#" id="add_API">add API key</a></li>
			<li><a href="#" id="char_select">select characters</a></li>
			<li><a href="#" id="">skill queues</a></li>
			<li><a href="#" id="show_asset_div">asset list</a></li>
		</ul>
		
		<div id="logged_in_dia" class="hidden">
			<span>Logged in as <span id="userName_display"></span>. </span>
			<a id="logout_link" href="#">Logout</a>
		</div>
		
		<ul id="login_links" class="hidden">
			<li><a href="#" id="register_link">Register</a></li>
			<li><a href="#" id="login_link">Login</a></li>
		</ul>
	</div>
	
	<div id="reg_form_div" class="hidden">
		<form id="reg_form" action="" method="post">
			<span>Register New Account</span><br />
			<span>User Name </span><input name="reg_user" type="text" />
			<span>Password </span><input name="reg_pass" type="password" />
			<input id="registration_submit" type="submit" />
		</form>
	</div>
	
	<div id="login_form_div" class="hidden">
		<form id="login_form" action="" method="post">
			<h4>Login</h4>
			<span>User:</span>
			<input type="text" name="login_user" /><br />
			<span>Pass:</span>
			<input type="text" name="login_pass" /><br />
			<input id="login_submit" type="submit" />
		</form>
	</div>
	
	<p id="XHR_messagelog" class="hidden"></p>
	
	<div id="main_content">
		
		<form id="add_api_form" action="" method="post" class="hidden">
			<h4>Add new API key</h4>
			<span>KeyID:</span>
			<input type="text" name="api_key_id" /><br />
			<span>vcode</span>
			<input type="text" name="api_key_vcode" /><br />
			<input id="api_key_submit" type="submit" />
		</form>
		
		<div id="char_blurbs" class="hidden"></div>
		
		<div id="char_select_div" class="hidden">
			<h5>char_select_div</h5>
			
			<form action="" method="post">
				<table>
					<tr>
						<th>Character Name</th>
						<th>Character ID</th>
						<th>keyID</th>
						<th>Selected</th>
					</tr>
				</table>
				
				<input id="char_select_submit" type="submit">
			</form>
		</div>
		
		<div id="asset_div" class="hidden">
			<select id="char_select_dropdown" class="hidden">
				<option value=""></option>
			</select>
			
			<h3>Asset List</h3>
			
			<table id="asset_table">
				<tr>
					<th>Item Name</th>
					<th>Quantity</th>
					<th>Value</th>
				</tr>
			</table>
		</div>
	</div>
	
	<div id="todo">
		<h4>Todo</h4>
		<ul>
			<li>skill queue</li>
			<li>asset list</li>
			<li>fitting tool</li>
			<li>fix login class</li>
		</ul>
	</div>
	
	<div id="debug">
		<h3>Debug</h3>
<?php
		/*
		@session_start();
		echo '<span>$_SESSION</span><br />';
		echo "<textarea cols=80 rows=15>";
		var_dump($_SESSION);
		echo "</textarea><br />";
		//*/
?>
	</div>
</body>
</html>
