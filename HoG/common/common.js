function arr(v) { return Array.prototype.slice.call(v); }
function appendTo(a) { return function(b) { return a.appendChild(b); }; }
function el(tag, contents) { var el = document.createElement(tag); if(contents) contents.map(appendTo(el)); return el; }
function txt() { return document.createTextNode(arr(arguments).join()); }
function div() { return el("div", arr(arguments)); }
function span() { return el("span", arr(arguments)); }
function label() { return el("label", arr(arguments)); }
function tr() { return el("TR", arr(arguments)); }
function td() { return el("TD", arr(arguments)); }
function th() { return el("TH", arr(arguments)); }

var access_token = "f97b613759ba67da6f9036d391a7f6158f4f23ec";
var login = "hogbattlecalc";
var api_key = "R_ba190662a1ba482b9ee7acfd2bd1ed4b";
var groupd_guid = "Personal";

$.ajaxSetup({
    async: false
});

function get_short_url(long_url, callback)
{
   var url = 'https://api-ssl.bitly.com/v3/shorten?access_token=' + access_token + '&longUrl=' + encodeURIComponent(long_url);

	$.getJSON(
		url,
		{},
		function(response)
		{
			if(callback)
				callback(response.data.hash);
				console.log(response)
		}
	);
}

function get_long_url(short_url, callback)
{
   var url = 'https://api-ssl.bitly.com/v3/expand?access_token=' + access_token + '&hash=' + encodeURIComponent(short_url);

	$.getJSON(
		url,
		{},
		function(response)
		{
			if(callback)
				callback(response.data.expand[0].long_url);
				console.log(response)
		}
	);
}

function serialize(obj) {
	return Object.keys(obj).map(function(k) {
		var v;
		if(typeof obj[k] === "object") {
			var section = obj[k];
			v = Object.keys(obj[k]).map(function(k) {
				return k+":"+section[k];
			}).join(",");
		} else {
			v = obj[k];
		}
		return k+"="+v;
	}).join("&").split(" ").join("%");
}
function deserialize(str) {
	if(!str) return null;
	var data = str.split("%").join(" ").split("&").map(function(str) {
		var parts = str.split("=", 2);
		if(parts[1] && parts[1].indexOf(":") != -1) {
			parts[1] = parts[1].split(",").map(function(str) {
				return str.split(":", 2);
			}).reduce(function(obj, add) {
				obj[add[0]] = add[1];
				return obj;
			}, {})
		}
		return parts;
	}).reduce(function(obj, add) {
		obj[add[0]] = add[1];
		return obj;
	}, {});
	return data;
}
function beautyObj(obj) {
	var a = [];
	for(var k in obj) {
		var v = obj[k];
		a.push(k + ": " + (typeof v === "number" ? beauty(v) : v));
	}
	return a.join("\n");
}

function importSave(errorMessageDiv) {
	var isImportSuccesful = false;
	var d=document.getElementById("saveimport").value;
	d=d.split("@")[0];
	var g;
	(g="hg"==d.substring(0,2)?decodeURIComponent(LZString.decompressFromUTF16(LZString.decompressFromBase64(d.substring(2)))):LZString.decompressFromUTF16(LZString.decompressFromBase64(d)))||(g="hg"==d.substring(0,2)?decodeURIComponent(LZString.decompressFromUTF16(atob(d.substring(2)))):LZString.decompressFromUTF16(atob(d)));
	if(g)
		try {
			var h=g.split("@DIVIDER@");
			console.log(h[2]);
			if(3<=h.length) {
				for(d=0;d<game.researches.length;d++) {
					for(var l=game.researches[d].level,n=0;n<l;n++) {
						game.researches[d].unbonus();
						game.researches[d].level--;
					}
				}
				governmentList[game.chosenGovern].unbonus();
				firstTime=!1;
				var m=JSON.parse(h[1]),u=JSON.parse(h[0]),v=JSON.parse(h[2]);
				console.log("iMPORT");
				clearTimeout(idleTimeout);
				idleBon=staticBon;
				for(d=0;d<m.length;d++) {
					civisLoader(civis[d],m[d],civis[d].name);
				}
				governmentList[game.chosenGovern].bonus();
				fleetSchedule.count=v.count;
				n=0;
				for(var w in v.fleets) n++;
				fleetSchedule.load(v.schedule,v.fleets,n);
				v.m&&market.load(v.m);
				v.st&&settingsLoader(v.st);
				v.qur&&(qurisTournament.points=0,v.qur.points&&(qurisTournament.points=v.qur.points||0),qurisTournament.lose=0,v.qur.lose&&(qurisTournament.lose=v.qur.lose||0));
				if(v.art) {
					for(var y in v.art) {
						artifacts[artifactsName[y]].collect();
					}
				}
				if(v.qst) {
					for(var x in v.qst) {
						quests[questNames[x]].done=!0;
					}
				}
				if(v.plc) {
					for(x in v.plc) {
						places[placesNames[x]].done=!0;
					}
				}
				if(v.tuts) {
					for(x in v.tuts) {
						tutorialsNames[x]&&(tutorials[tutorialsNames[x]].done=!0);
					}
				}
				for(var d=0;d<characters.length;d++) {
					var e=characters[d];
					"quris2"==e.id&&quests[questNames.quris_7].done&&(e.unlocked=!0);
					"wahrian"==e.id&&quests[questNames.seal_7].done&&(e.unlocked=!0);
					"protohalean"==e.id&&quests[questNames.juini_5].done&&(e.unlocked=!0)
				}
				game=civis[gameSettings.civis];
				for(d=0;d<u.length;d++) {
					u[d]&&planetLoader(planets[d],u[d]);
				}
				qurisTournament.fleet=null;
				generateQurisTournamentFleet();
				var A=parseInt(Math.floor(game.days/365));
				game;
				characters;
				isImportSuccesful = true;
			} else errorMessageDiv.innerHTML="Import Save: <font color=\"red\">Corrupted data</font>";
			
			/*old import
			var h=g.split("@DIVIDER@");
			console.log(h[2]);
			if(3<=h.length){
				for(d=0;d<game.researches.length;d++)
					for(var l=game.researches[d].level,m=0;	m<l;m++)
						game.researches[d].unbonus(),
						game.researches[d].level--;
				firstTime=!1;
				var w=JSON.parse(h[1]),n=JSON.parse(h[0]),t=JSON.parse(h[2]);
				console.log("iMPORT");
				clearTimeout(idleTimeout);
				idleBon=1;
				for(d=0;d<w.length;d++)
					civisLoader(civis[d],w[d],civis[d].name);
				fleetSchedule.count=t.count;
				m=0;
				for(var v in t.fleets)
					m++;
				console.log(m);
				console.log(t.fleets);
				fleetSchedule.load(t.schedule,t.fleets,m);
				t.m&&market.load(t.m);
				t.st&&settingsLoader(t.st);
				t.qur&&(t.qur.points&&(qurisTournament.points=t.qur.points||0),t.qur.lose&&(qurisTournament.lose=t.qur.lose||0));
				if(t.art)
					for(var y in t.art)
						artifacts[artifactsName[y]].collect();
				if(t.qst)
					for(var x in t.qst)
						quests[questNames[x]].done=!0;
				if(t.plc)
					for(x in t.plc)
						places[placesNames[x]].done=!0;
				if(t.tuts)
					for(x in t.tuts)
						tutorials[tutorialsNames[x]].done=!0;
				game=civis[gameSettings.civis];
				for(d=0;d<n.length;d++)
					n[d]&&planetLoader(planets[d],n[d]);
				game.searchPlanet(planetsName.virgo)||(planets[planetsName.virgo].setCivis(8),civis[8].capital=planetsName.virgo);
				game.searchPlanet(planetsName.nassaus)||
					(planets[planetsName.nassaus].setCivis(7),civis[7].capital=planetsName.nassaus);
				isImportSuccesful = true;
			}
			else errorMessageDiv.innerHTML="Import Save: <font color=\"red\">Corrupted data</font>";*/
		} catch(qa) {
			console.log(qa.message),errorMessageDiv.innerHTML="Import Save: <font color=\"red\">Error</font>";
		}
	else errorMessageDiv.innerHTML="Import Save: <font color=\"red\">Invalid data</font>";
	
	return isImportSuccesful;
};

function deleteChildElements(parentElement) {
	console.log(parentElement)
	while(parentElement.lastChild)
		parentElement.removeChild(parentElement.lastChild);
}

//Ship stats stuff
function dmgred(armor) {
	return 1 - 1 / (1 + Math.log(1 + armor / 1E4) / Math.log(2));
}
function speedred(def, atk, weight) {
	var a = def / atk * 4.6 / Math.log(weight) - 2;
	var b = 2 * a / (1 + Math.abs(2 * a));
	return .5 * (1.1 - .9 * b);
}
function fleetBonus(fleet) {
	var bonus = {
		power: 1,
		armor: 1,
		hp: 1,
		speed: 1,
		shield: 1,
	};
	var exp = fleet.exp;
	if(isNaN(exp)) exp = 0;
	else if(exp>MAX_FLEET_EXPERIENCE) exp = MAX_FLEET_EXPERIENCE;
	var expBonus = 1 + exp / 2000;
	bonus.power *= expBonus
	bonus.armor *= expBonus
	bonus.hp *= expBonus
	bonus.shield *= expBonus
	
	return bonus;
}
function fleetStats(fleet, enemy) {
	var power = 0,
		armor = 0,
		hp = 0,
		threat = 0,
		toughness = 0,
		piercepower = 0,
		speedpower = 0,
		speedtough = 0,
		rawpower = 0,
		rawtough = 0;
	var bonus = fleetBonus(fleet);
	fleet.ships.map(function(n, k) {
		if(n == 0) return;
		var ship = ships[k];
		power += n * ship.power * bonus.power;
		piercepower += power * (ship.piercing || 0) / 100,
		armor += n * ship.armor * bonus.armor;
		hp += n * ship.hp * bonus.hp;
		var shiptough = ship.hp * bonus.hp / (1 - dmgred(ship.armor * bonus.armor));
		var piercingbonus = Math.min(1 + 10 * (ship.piercing || 0) / 100, 10);
		threat += (n+1) * ship.power * bonus.power;
		toughness += n * shiptough;
		speedpower += (n+1) * ship.power * piercingbonus * bonus.power * speedred(1, ship.speed * bonus.speed, 100000);
		speedtough += n * shiptough / speedred(ship.speed * bonus.speed, 1, ship.combatWeight);
	});
	return {
		Power: power,
		"Piercing Power": piercepower,
		Armor: armor,
		HP: hp,
		Toughness: toughness,
		Value: Math.sqrt(speedpower * speedtough),
	};
}
function addSeperatorsToInput(input) {
	var number = input.value;
	if(!number || number.toString().includes(","))
		return;
	var numberString = BigInteger(number).toString();
	var splitArray = numberString.split("");
	var counter = 1;
	var seperatedString = "";
	for(var index = splitArray.length - 1; index >= 0; index--) {
		seperatedString = splitArray[index] + seperatedString;
		if(counter == 3 && index > 0) {
			seperatedString = "," + seperatedString;
			counter = 1;
		} else {
			counter++;
		}
	}
	input.value = seperatedString;
}
function getNumberFromSeperatedString(seperatedString) {
	if(!seperatedString.includes(","))
		return seperatedString;
	var splitArray = seperatedString.split(",");
	var numberString = "";
	for(var index = 0; index < splitArray.length; index++) {
		numberString += splitArray[index];
	}
	var number = BigInteger.toJSValue(numberString);
	return number;
}
function parseSeperatedInput(input) {
	if(!input.value || !input.value.includes(","))
		return;
	var seperatedString = input.value;
	var caretPosition = input.selectionStart;
	var splitArray = seperatedString.split(",");
	var numberString = "";
	for(var index = 0; index < splitArray.length; index++) {
		numberString += splitArray[index];
		if(input.selectionStart > numberString.length + index)
			caretPosition--;
	}
	var number = BigInteger.toJSValue(numberString);
	input.value = number;
	input.selectionStart = caretPosition;
	input.selectionEnd = caretPosition;
}

function addSpoiler(spoilerValue, content) {
	var input = el("input");
	input.type = "button";
	input.value = "Show " + spoilerValue;
	content.style = "display: none";
	input.onclick = function() {
		if(input.value == "Show " + spoilerValue) {
			content.style = "display: grid";
			input.value = "Hide " + spoilerValue;
		}
		else {
			content.style = "display: none";
			input.value = "Show " + spoilerValue;
		}
	};
	return input;
}

function addLabeledSpoiler(spoilerLabel, content) {
	var label = span(txt(spoilerLabel));
	return div(label, addSpoiler(spoilerLabel, content));
}

function aprilFoolize() {
	ships[72].name = "Doom Snail";
}