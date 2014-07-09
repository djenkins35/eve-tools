

var LOAD_GIF_URL = 'images/Floating rays.gif';
var LOGIN_URL = "Login.php";
var ASSETS_URL = 'Assets.php';
var CHAR_BLURBS_URL = "CharacterBlurbs.php";
var CHAR_SUBMIT_URL = "SubmitCharacters.php";
var CHAR_SELECT_URL = "Characters.php";
var CHAR_IMG_URL = "http://image.eveonline.com/Character/";
var isAuthUser = false;
var userName = '';


// jQuery extension to get array of classes on an element
//	http://stackoverflow.com/a/11232541
;!(function ($) {
    $.fn.classes = function (callback) {
        var classes = [];
        $.each(this, function (i, v) {
            var splitClassName = v.className.split(/\s+/);
            for (var j in splitClassName) {
                var className = splitClassName[j];
                if (-1 === classes.indexOf(className)) {
                    classes.push(className);
                }
            }
        });
        if ('function' === typeof callback) {
            for (var i in classes) {
                callback(classes[i]);
            }
        }
        return classes;
    };
})(jQuery);

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
		$("#option_panel").removeClass('hidden');
	}
	else
	{
		$("#logged_in_dia").addClass("hidden");
		$("#login_links").removeClass("hidden");
		$("#option_panel").addClass('hidden');
	}


	$("#char_blurbs").addClass('hidden');
	$("#asset_div").addClass('hidden');
	$("#add_api_form").addClass('hidden');
	$("#reg_form_div").addClass('hidden');
	$("#login_form_div").addClass('hidden');
	$("#XHR_messagelog").addClass('hidden');
	$("#char_select_div").addClass('hidden');
}

function loginXHR(formdata, method, callback/*,method="POST",/*callback=null*/)
{
	$.ajax({

		url: LOGIN_URL,
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

		url: LOGIN_URL,
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

function loadCharactersXHR(callback)
{
	$.ajax({

		url: CHAR_SELECT_URL,
		type: "GET",
		dataType: "xml",
		error: XHRError,

		success: function(xml)
		{
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


// assets

// helper for the asset list loop
function getLocation(locID, arr)
{
	for (var i = 0; i < arr.length; i++)
	{
		if (arr[i].locationID == locID)
			return arr[i];
	}

	return false;
}

// re-map the xml data to js objects by their locationID/locationName
function createAssetFromXML(xml)
{
	var aLocations = [];

	$(xml).find('assets > node').each(function(){

		var locationID = $(this).children('locationID').text();
		var locationName =  $(this).children('locationName').text();
		var locationObj = getLocation(locationID, aLocations);

		if (!locationObj)
		{
			locationObj = {
				locationID: locationID,
				locationName: locationName,
				assets: [],
			}

			aLocations.push(locationObj);
		}

		var asset = {
			locationID: locationID,
			locationName: locationName,
			itemID: $(this).children('itemID').text(),
			assetName: $(this).children('itemName').text(),
			quantity: $(this).children('quantity').text(),
			typeID: $(this).children('typeID').text(),
		}

		// check if node is a container
		if (($(this).children('contents').length > 0))
		{
			asset['contents'] = [];

			$(this).find('contents > node').each(function(){

				var subItem = {
					assetName: $(this).children('itemName').text(),
					quantity: $(this).children('quantity').text(),
					typeID: $(this).children('typeID').text(),
					flag: $(this).children('flag').text(),
				}

				asset['contents'].push(subItem);
			});
		}

		locationObj.assets.push(asset);
	});

	return aLocations;
}

function sortAssetArray(arr)
{
	arr.sort(function(a,b){

		if (a.locationName > b.locationName)
			return 1;
		if (a.locationName < b.locationName)
			return -1;

		return 0;
	});

	// sort items with contents first, otherwise use the item name as the default sorting
	for (var i = 0; i < arr.length; i++)
	{
		arr[i].assets.sort(function(a,b){

			if (a.hasOwnProperty('contents') && !b.hasOwnProperty('contents'))
				return -1;
			if (!a.hasOwnProperty('contents') && b.hasOwnProperty('contents'))
				return 1;
			if (a.assetName > b.assetName)
				return 1;
			if (a.assetName < b.assetName)
				return -1;

			return 0;
		});

		// sort contents alphabetacally by default

		for (var i2 = 0; i2 < arr[i].assets.length; i2++)
		{
			var asset = arr[i].assets[i2];

			if (asset.hasOwnProperty('contents'))
			{
				asset.contents.sort(function(a,b){

					if (a.assetName > b.assetName)
						return 1;
					if (a.assetName < b.assetName)
						return -1;

					return 0;
				});
			}
		}
	}

	return arr;
}

// create output DOM tree
// add click function to location and asset containers to enable a tree control in the table
// use locationIDs and assetIDs stored as data properties on the tr DOM objects to sort for jQuery
//	toggle() method
function createAssetDOM(aLocations)
{
	var $table = $("#asset_table");

	// first loop is the locations
	for (var i = 0; i < aLocations.length; i++)
	{
		var locID = aLocations[i].locationID;
		var $tr = $('<tr class="location_container" '
			+ 'data-locationid="' + locID + '" '
			+ 'data-state="closed">'	// collapse all logical children when closed
			+ '<td colspan="3">'
			+ aLocations[i].locationName + '</td></tr>'
		);

		$tr.click(function(e){

			var parentLocID = $(this).data('locationid');
			var state = $(this).data('state');

			$table.find('tr').each(function(){

				if (($(this).data('locationid') == parentLocID)
					&& !$(this).hasClass('location_container'))
				{
					if (state == 'open')
						$(this).hide();
					else
						$(this).show();
				}
			});
			
			if (state == 'open')
				$(this).data('state', 'closed');
			else
				$(this).data('state', 'open');
		});

		$table.append($tr);

		// second loop is the items
		for (var i2 = 0; i2 < aLocations[i].assets.length; i2++)
		{
			var asset = aLocations[i].assets[i2];
			var containerClass = (asset.hasOwnProperty('contents')) ?
				'asset_container ' : 'asset_item ';

			var $tr2 = $('<tr class="' + containerClass + '" data-locationID="' + locID + '">'
				+ '<td>' + asset.assetName + '</td>'
				+ '<td>' + asset.quantity + '</td><td></td></tr>');

			$tr2.hide();
			$table.append($tr2);

			if (asset.hasOwnProperty('contents'))
			{
				var containerID = asset.itemID;
				$tr2.data('containerid', containerID);

				$tr2.click(function(e){

					var parentID = $(this).data('containerid');

					$table.find('tr').each(function(){

						var containerid = $(this).data('containerid');
						if (containerid && !$(this).hasClass('asset_container')
							&& (containerid == parentID))
						{
							$(this).toggle();
						}
					});
				});

				// third loop is item contents
				for (var i3 = 0; i3 < asset.contents.length; i3++)
				{
					var subItem = asset.contents[i3];
					var $tr3 = $('<tr class="sub_item" data-locationid="' + locID
						+ '" data-containerid="' + containerID + '">'
						+ '<td>' + subItem.assetName + '</td>'
						+ '<td>' + subItem.quantity + '</td>'
						+ '<td></td></tr>');
					$tr3.hide();
					$table.append($tr3);
				}
			}
		}
	}
}

function loadAssetsXHR(data)
{
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

			createAssetDOM(sortAssetArray(createAssetFromXML(xml)));
		},
	});
}


////

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

		url: CHAR_SUBMIT_URL,
		type: "POST",
		data: {'characters': out},
		error: XHRError,

		success: function(xml)
		{
			logMessage($(xml).find('error').text());
			logMessage($(xml).find('message').text());
		}
	});
}

function loadCharBlurbs()
{
	$("#char_blurbs").empty();
	var loading_gif = $("<p class=\"loading_gif\"><img src=\"" + LOAD_GIF_URL + "\" /></p>");
	$("#char_blurbs").append(loading_gif);
	$("#char_blurbs").removeClass('hidden');


	$.ajax({

		url: CHAR_BLURBS_URL,
		type: "GET",
		dataType: "xml",
		error: XHRError,

		success: function(xml)
		{
			$("#char_blurbs").empty();

			$(xml).find("nodes > node").each(function(){

				var charName = $(this).find("characterName").text();
				var charID = $(this).find("characterID").text();
				var endTime = '';

				$out = "<div class=\"blurb\">";
				$out += "<p>" + charName + "</p>";
				$out += "<img src=\"" + CHAR_IMG_URL + charID + "_128.jpg\" />";

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


// init

$(document).ready(function()
{
	loginXHR("action=checkAuth", "GET", function(){

		if (isAuthUser)
		{
			// load the defaults
			loadCharBlurbs();
		}
	});


	// event/button listeners

	$("#register_link").click(function(e)
	{
		e.preventDefault();
		$("#login_form_div").addClass("hidden");
		$("#reg_form_div").toggleClass("hidden");
	});

	$("#login_link").click(function(e)
	{
		e.preventDefault();
		$("#reg_form_div").addClass("hidden");
		$("#login_form_div").toggleClass("hidden");
	});

	$("#registration_submit").click(function(e)
	{
		e.preventDefault();
		var formdata = $("#reg_form").serialize();
		loginXHR(formdata, null, null);
		hideForms();
	});

	$("#login_submit").click(function(e)
	{
		e.preventDefault();
		var formdata = $("#login_form").serialize();
		hideForms();
		loginXHR(formdata, 'POST', loadCharBlurbs);
	});

	$("#logout_link").click(function(e)
	{
		e.preventDefault();
		var formdata = "action=logout";
		loginXHR(formdata, "GET", null);
	});

	$("#home_link").click(function(e)
	{
		e.preventDefault();

		resetApp();

		if (isAuthUser)
			loadCharBlurbs();
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
		var formdata = $("#add_api_form").serialize();
		loginXHR(formdata, null, null);
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
			// remove existing chars
			$("#char_select_dropdown > option").slice(1).remove();

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


