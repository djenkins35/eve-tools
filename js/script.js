

var LOAD_GIF_URL = 'images/Floating rays.gif';
var ASSETS_URL = 'Assets.php';
var isAuthUser = false;
var userName = '';


function dump(obj)
{
	var out = '';
	
	for (var i in obj)
	{
		if ($.isPlainObject(obj[i]) || $.isArray(obj[i]))
		{
			dump(obj[i]);
		}
		else
		{
			out += i + ": " + obj[i] + "\n";
		}
	}

	console.log(out);
}

function millisToTime(ms)
{
    x = ms / 1000;
    seconds = Math.round(x % 60);
    x /= 60;
    minutes = Math.floor(x % 60);
    x /= 60;
    hours = Math.floor(x % 24);
    x /= 24;
    days = Math.floor(x);

    return days + "d " + hours + "h " + minutes + "m ";
}

function logMessage(msg)
{
	var log = $("#XHR_messagelog");
	
	if (msg)
	{
		log.text(msg);
		log.removeClass('hidden');
	}
	else
		log.addClass('hidden');
}

// code to run if the request fails; the raw request and
// status codes are passed to the function
function XHRError(xhr, status, errorThrown)
{
	alert( "Sorry, there was a problem!" );
	console.log( "Error: " + errorThrown );
	console.log( "Status: " + status );
	console.dir( xhr );
}

function hideForms()
{
	$("#reg_form_div").addClass("hidden");
	$("#login_form_div").addClass("hidden");
}

// return display elements to a default state
function resetApp()
{
	// show/hide login links
	
	if (isAuthUser)
	{
		$("#logged_in_dia").removeClass("hidden");
		$("#login_links").addClass("hidden");
		$("#userName_display").text(userName);
	}
	else
	{
		$("#logged_in_dia").addClass("hidden");
		$("#login_links").removeClass("hidden");
	}
	
	if (isAuthUser)
	{
		$("#option_panel").removeClass('hidden');
	}
	else
	{
		$("#option_panel").addClass('hidden');
	}
	
	
	$("#char_blurbs").empty();
	$("#char_blurbs").addClass('hidden');
}
	
function loginXHR(formdata, method = "POST", callback = null)
{
	$.ajax({
	
		url: "Login.php",
		type: method,
		dataType: "xml",
		data: formdata,
		error: XHRError,
		
		success: function(xml)
		{
			isAuthUser = ($(xml).find('authenticated').text() == 'true') ? true : false;
			userName = $(xml).find('userName').text();
			logMessage($(xml).find('authMsg').text());
			
			resetApp();
			
			if (callback != null)
				callback();
		},
	});
}

function addAPIKeyXHR(formdata)
{
	$.ajax({
	
		url: "Login.php",
		type: "POST",
		dataType: "xml",
		data: formdata,
		error: XHRError,
		
		success: function(xml)
		{
			logMessage($(xml).find('authMsg').text());
		},
	});
}

function loadCharactersXHR(callback = null)
{
	console.log("loading characters data");
	
	$.ajax({
		
		url: "Characters.php",
		type: "GET",
		dataType: "xml",
		error: XHRError,
		
		success: function(xml)
		{
			console.log("Characters.php success");
			
			if (callback != null)
				callback(xml);
		}
	});
}

function charSelectCallback(xml)
{
	// remove any existing rows, ex) clicking 'select characters' twice
	$("#char_select_div tr").slice(1).remove();
	
	$(xml).find("nodes > node").each(function(){
	
		var keyid = $(this).find("keyid").text();
		
		$(this).find("characters > node").each(function(){
			
			$out = "<tr><td>" + $(this).find("name").text()
				+ "</td><td>" + $(this).find("characterID").text()
				+ "</td><td>" + keyid
				+ "</td><td><input type=\"checkbox\" name='char_selected' "
					// store data on the input element
					+ "data-characterName=\"" + $(this).find("name").text() + "\" "
					+ "data-characterID=\"" + $(this).find("characterID").text() + "\" "
					+ "data-keyid=\"" + keyid + "\" "
				+ "></td></tr>";
			
			$("#char_select_div > form > table").append($out);
		});
	});
}

function charAssetCallback(xml)
{
	$("#asset_div").find(".loading_gif").remove();
	$menu = $("#char_select_dropdown");
	
	$(xml).find("nodes > node").each(function(){
		
		var keyid = $(this).find("keyid").text();
		
		$(this).find("characters > node").each(function(){
		
			$out = "<option data-keyid=\"" + keyid + "\" "
				+ "data-characterid=\"" +  $(this).find("characterID").text() + "\" "
				+ ">" + $(this).find("name").text() + "</option>";
			
			$menu.append($out);
		});
	});
	
	$menu.removeClass('hidden');
}

function loadAssetsXHR(data)
{
	console.log(dump(data));
	
	if (!data.characterid)
		return;
	
	
	$.ajax({
	
		url: ASSETS_URL,
		type: "GET",
		dataType: "xml",
		data: data,
		error: XHRError,
		
		success: function(xml)
		{
			$("#asset_div").find(".loading_gif").remove();
			
			if ($(xml).find('error').text())
			{
				logMessage($(xml).find('error').text());
				return;
			}
			
			$table = $("#asset_table");
			
			$(xml).find('assets > node').each(function(){
			
				$out = "<tr><td>" + $(this).children('itemName').text() + "</td>"
					+ "<td>" + $(this).children('locationName').text() + "</td>" 
					+ "<td>" + $(this).children('quantity').text() + "</td></tr>";
				
				$table.append($out);
			});
		},
	});
}

function submitCharacters()
{
	var out = [];
	
	$("#char_select_div input[type='checkbox']").each(function(){
		
		if ($(this).is(':checked'))
		{
			out.push($(this).data());
		}
	});
	
	$.ajax({
		
		url: "SubmitCharacters.php",
		type: "POST",
		data: {'characters': out},
		error: XHRError,
		
		success: function(xml)
		{
			console.log("SubmitCharacters.php success");
			logMessage($(xml).find('error').text());
			logMessage($(xml).find('message').text());
		}
	});
}

function loadCharBlurbs()
{
	console.log("loading character blurbs");
	
	var loading_gif = $("<p class=\"loading_gif\"><img src=\"" + LOAD_GIF_URL + "\" /></p>");
	$("#char_blurbs").append(loading_gif);
	$("#char_blurbs").removeClass('hidden');
	
	
	$.ajax({
		
		url: "CharacterBlurbs.php",
		type: "GET",
		dataType: "xml",
		error: XHRError,
		
		success: function(xml)
		{
			console.log(this.url + " success");
			$("#char_blurbs").empty();
			
			$(xml).find("nodes > node").each(function(){
			
				var charName = $(this).find("characterName").text();
				var charID = $(this).find("characterID").text();
				var endTime = '';
				
				$out = "<div class=\"blurb\">";
				$out += "<p>" + charName + "</p>";
				$out += "<img src=\"http://image.eveonline.com/Character/" + charID
					+ "_128.jpg\" />";
				
				$(this).find("skillqueue > node").each(function() {
				
					endTime = $(this).find("endTime").text();
				});
				
				
				// apply system TZ offset to get the correct queue length
				var offsetMS = (new Date()).getTimezoneOffset() * 60 * 1000;
				var startMS = Date.now();
				var endMS = Date.parse(endTime.replace(/\s/, 'T'));	// format date string for JS
				var queueTime = millisToTime(endMS - startMS - offsetMS);
				
				$out += "<p>Queue Time: " + queueTime + "</p>";
				$out += "<p>" + $(this).find("typeName").text() + " " + $(this).find("level").text();
				$out += "</div>";
				
				// hack to hide non-active queues. check if endTime isn't set in the xml
				if (endTime != "")
					$("#char_blurbs").append($out);
			});
		}
	});
}

$(document).ready(function()
{
	loginXHR("action=checkAuth", "GET", function(){
	
		if (isAuthUser)
		{
			// load the defaults
			loadCharBlurbs();
			
			
			// TBR
			/*
			$("#asset_div").removeClass("hidden");
			var loading_gif = $("<p class=\"loading_gif\"><img src=\"" + LOAD_GIF_URL + "\" /></p>");
			$("#asset_div").append(loading_gif);
			
			var tempData = {
				keyid: 2783343,
				characterid: 1422087371,
				name: 'DoodleBu',
			}
			
			loadAssetsXHR(tempData);
			*/
			////////
		}
	});
	
	
	// event/button listeners
	
	$("#register_link").click(function(e)
	{
		e.preventDefault();
		console.log("register clicked");
		$("#login_form_div").addClass("hidden");
		$("#reg_form_div").toggleClass("hidden");
	});
	
	$("#login_link").click(function(e)
	{
		e.preventDefault();
		console.log("login clicked");
		$("#reg_form_div").addClass("hidden");
		$("#login_form_div").toggleClass("hidden");
	});
	
	$("#registration_submit").click(function(e)
	{
		e.preventDefault();
		console.log("registration submit clicked");
		var formdata = $("#reg_form").serialize();
		console.log(formdata);
		loginXHR(formdata);
		hideForms();
	});
	
	$("#login_submit").click(function(e)
	{
		e.preventDefault();
		console.log("login submit clicked");
		var formdata = $("#login_form").serialize();
		console.log(formdata);
		hideForms();
		loginXHR(formdata, 'POST', loadCharBlurbs);
	});
	
	$("#logout_link").click(function(e)
	{
		e.preventDefault();
		console.log("logout clicked");
		var formdata = "action=logout";
		loginXHR(formdata, "GET");
	});
	
	$("#add_API").click(function(e)
	{
		e.preventDefault();
		
		if (isAuthUser)
			$("#add_api_form").toggleClass("hidden");
	});
	
	$("#api_key_submit").click(function(e)
	{
		e.preventDefault();
		console.log("api_key_submit clicked");
		var formdata = $("#add_api_form").serialize();
		console.log(formdata);
		loginXHR(formdata);
	});
	
	$("#char_select").click(function(e)
	{
		e.preventDefault();
		$("#char_select_div").toggleClass("hidden");
		
		if (!$("#char_select_div").hasClass("hidden"))
			loadCharactersXHR(charSelectCallback);
	});
	
	$("#char_select_submit").click(function(e)
	{
		e.preventDefault();
		$("#char_select_div").addClass("hidden");
		submitCharacters();
	});
	
	$("#show_asset_div").click(function(e)
	{
		e.preventDefault();
		resetApp();
		$("#asset_div").toggleClass("hidden");
		
		if (!$("#asset_div").hasClass("hidden"))
		{
			var loading_gif = $("<p class=\"loading_gif\"><img src=\"" + LOAD_GIF_URL + "\" /></p>");
			$("#asset_div").append(loading_gif);
			loadCharactersXHR(charAssetCallback);
		}
	});
	
	 $("#char_select_dropdown").change(function(e)
	 {
		$option = $(this).find(":selected");
		$data = {
			keyid: $option.data('keyid'),
			characterid: $option.data('characterid'),
			name: $option.text(),
		};
		
		// remove any existing rows
		$("#asset_div tr").slice(1).remove();
		
		var loading_gif = $("<p class=\"loading_gif\"><img src=\"" + LOAD_GIF_URL + "\" /></p>");
		$("#asset_div").append(loading_gif);
		loadAssetsXHR($data);
	 });
});


