document.addEventListener("DOMContentLoaded", function() {
	'use strict';
	
	var saveData = {
		ships: {},
		cannons: {},
		bonuses: {},
		options: {},
		enemies: {},
		battlepoints: 0,
	};
		
	var resourceProduction = [];
	var totalResearch = 0;
		
	function createSelectionList() {
		if(document.getElementById("categoryselect"))
			return;
		var selectionList = document.getElementById("selectionList");
		
		selectionList.appendChild(createCategorySelection());
	}
	function createCategorySelection() {
		var categoryChooser = el("select");
		categoryChooser.setAttribute("id", "categoryselect");
		
		var selectOption = el("option");
		selectOption.value = -1;
		selectOption.innerText = "Select a category";
		var overviewOption = el("option");
		overviewOption.value = "overview";
		overviewOption.innerText = "Resource Overview";
		var tpOption = el("option");
		tpOption.value = "tp";
		tpOption.innerText = "TP Checker";
		var queueOption = el("option");
		queueOption.value = "queue";
		queueOption.innerText = "Queue Checker";
		var battlecalcOption = el("option");
		battlecalcOption.value = "battlecalc";
		battlecalcOption.innerText = "Export to Battlecalc";
		
		categoryChooser.appendChild(selectOption);
		categoryChooser.appendChild(overviewOption);
		categoryChooser.appendChild(tpOption);
		categoryChooser.appendChild(queueOption);
		categoryChooser.appendChild(battlecalcOption);
		
		categoryChooser.onchange = function() {
			var selectionList = document.getElementById("selectionList");
			var val = categoryChooser.value;
			deleteChildElements(document.getElementById("result"));
			if(val == -1) {
			} else if(val == "overview") {
				selectionList.appendChild(createOverviewSelection());
			} else if(val == "tp") {
				tpCheck();
			} else if(val == "queue") {
				var hidePlanetsCheckbox = el("input");
				hidePlanetsCheckbox.setAttribute("id", "hidePlanetsCheckbox");
				hidePlanetsCheckbox.type = "Checkbox";
				hidePlanetsCheckbox.onchange = function() {
					deleteChildElements(document.getElementById("result"));
					queueCheck();
				}
				var checkboxSpan = span(hidePlanetsCheckbox, label(txt("Hide planets without queues")));
				checkboxSpan.setAttribute("id", "checkboxSpan");
				selectionList.appendChild(checkboxSpan);
				queueCheck();
			} else if(val == "battlecalc") {
				exportToBattlecalc();
			}
			var galaxySelect = document.getElementById("galaxyselect");
			if(val != "overview" && galaxySelect)
				galaxySelect.parentNode.removeChild(galaxySelect);
			var checkboxSpan = document.getElementById("checkboxSpan");
			if(val != "queue" && checkboxSpan)
				checkboxSpan.parentNode.removeChild(checkboxSpan);
		}
		
		return categoryChooser;
	}
	function createOverviewSelection() {
		var galaxyChooser = el("select");
		galaxyChooser.setAttribute("id", "galaxyselect");
		var galaxyOption = el("option");
		galaxyOption.value = -1;
		galaxyOption.innerText = "Select a galaxy";
		var totalOption = el("option");
		totalOption.value = "all";
		totalOption.innerText = "All Galaxies";
		galaxyChooser.appendChild(galaxyOption);
		galaxyChooser.appendChild(totalOption);
		var addedMaps = [];
		for(var planetIndex=0; planetIndex < planets.length; planetIndex++) {
			var map = planets[planetIndex].map;
			if(!addedMaps.includes(map)) {
				var mapOption = el("option");
				mapOption.value = map;
				mapOption.innerText = nebulas[map].name;
				galaxyChooser.appendChild(mapOption);
				
				addedMaps.push(map);
			}
		}
		
		galaxyChooser.onchange = function() {
			deleteChildElements(document.getElementById("result"));
//			createOverviewConfig();
			if(galaxyChooser.value != -1) {
				overview();
			}
		}
		
		return galaxyChooser;
	}
	
	function canBuildOnPlanet(planet, building) {
		var galaxyChooser = document.getElementById("galaxyselect");
		return building.showRes() && building.environment.includes(planet.type) && (galaxyChooser.value == "all" || nebulas[galaxyChooser.value].planets.includes(planet.id));
	}
	  
    function calcBuildingResourcesCost(planetIndex, buildingIndex, amount) {
   		const resourceConsumptionMultiplier = document.getElementById("numResourceConsumptionMultiplier").value;
		var cost = 0;
//		var totalCost = planets[planetIndex].structure[buildingIndex].totalCost(amount);
		var totalCost = optTotalCost(planets[planetIndex], buildings[buildingIndex], amount);
//		if (totalCost != opt_totalCost) {
//			console.log("total cost: " + totalCost + "opt total cost: " + opt_totalCost);
//		}
		for (var i = 0; i < resNum; i++) {
			var curResCost = totalCost[i];
			if (0 < curResCost) {
				cost += curResCost / resourceProduction[i];
			}
			if (0 > buildings[buildingIndex].rawProduction(planets[planetIndex])[i]) {
				cost -= (buildings[buildingIndex].rawProduction(planets[planetIndex])[i] * resourceConsumptionMultiplier / resourceProduction[i]);
			}
		}       	   
        return cost;
    }
	
	function getEnergyReqs(planetIndex, energy) {
		// energy is a negative num - consumption
        var energyBuildings = [];

        for(var buildingIndex=0; buildingIndex<buildings.length; buildingIndex++) {            
            if (0 >= buildings[buildingIndex].energy || !canBuildOnPlanet(planets[planetIndex], buildings[buildingIndex])) {
                continue;
            }
            var curBuildingEnergyProd = buildings[buildingIndex].energy
			if ("solar" == buildings[buildingIndex].type2) {
				curBuildingEnergyProd /= (planets[planetIndex].info.orbit * planets[planetIndex].info.orbit);
			}
			var numBuildingsRequired = Math.ceil(-energy/curBuildingEnergyProd);
            var cost = calcBuildingResourcesCost(planetIndex, buildingIndex, numBuildingsRequired);
            var curBuilding = {buildingIndex: buildingIndex, numBuildings: numBuildingsRequired, cost: cost};
            energyBuildings.push(curBuilding);
        }        
        energyBuildings.sort(function(a, b){return a.cost - b.cost;});    
        return energyBuildings[0];
	}
	
	function calcBuildingCostVal(planetIndex, buildingIndex, production, amount) {
		var energyRequirements = [];
        var cost = {};
        cost.value = calcBuildingResourcesCost(planetIndex, buildingIndex, amount);		
		if (0 > buildings[buildingIndex].energy) {
			energyRequirements = getEnergyReqs(planetIndex, buildings[buildingIndex].energy * amount);
			if (0 > planets[planetIndex].energyProduction() + planets[planetIndex].energyConsumption() + buildings[buildingIndex].energy * amount) {
//				console.log("Energy breach: " + planets[planetIndex].name + ": " + buildings[buildingIndex].displayName + " - " + cost);
				cost.energyReqs = energyRequirements;				
			}
			cost.value += energyRequirements.cost;
		}
		cost.value /= production;
		console.log(planets[planetIndex].name + ": " + buildings[buildingIndex].displayName + " - " + cost.value);		
		return cost;
	}
	
	function calculateResourceProducers(resourceIndex) {
		var producersArr = [];		
		var resource = resources[resourceIndex];	
		const minImprovePct = document.getElementById("numMinImprovePct").value;
		        
        game.planets.forEach(function(planetIndex) {
            for(var buildingIndex=0; buildingIndex<buildings.length; buildingIndex++) {
				if (canBuildOnPlanet(planets[planetIndex], buildings[buildingIndex]) && 0<buildings[buildingIndex].rawProduction(planets[planetIndex])[resourceIndex] 
				) {					
					var numBuildingsRequired = Math.ceil(resourceProduction[resourceIndex]/((100/minImprovePct) * buildings[buildingIndex].rawProduction(planets[planetIndex])[resourceIndex]));					
					if (numBuildingsRequired == 0) {
						continue;
					}
					var currentBuilding = {planetIndex:planetIndex, buildingIndex:buildingIndex, cost:calcBuildingCostVal(planetIndex, buildingIndex, buildings[buildingIndex].rawProduction(planets[planetIndex])[resourceIndex], numBuildingsRequired), numBuildings:numBuildingsRequired};					
					producersArr.push(currentBuilding);
				}
            }
        });
//        console.log(resourceIndex + ": " + producersArr);
		if (0 == producersArr.length) {
			return;
		}
		producersArr.sort(function(a, b){return a.cost.value - b.cost.value;});    
		var improveLabel = div();
		var improveCell = document.getElementById("improveCell" + resource.name);
		console.log(resource.name + " " + improveCell);
		console.log(producersArr);
		deleteChildElements(improveCell);		
		for (var i=0; i<5; i++) {            
			if (i >= producersArr.length) {
				break;
			}
			var numBuildings = producersArr[i].numBuildings;
			var orgNumBuildings = numBuildings;
            while (i+1<producersArr.length && calcBuildingCostVal(producersArr[i].planetIndex, producersArr[i].buildingIndex, buildings[producersArr[i].buildingIndex].rawProduction(planets[producersArr[i].planetIndex])[resourceIndex], numBuildings + 1).value < (producersArr[i+1].cost.value*1.2)) {
                numBuildings++;
				console.log(planets[producersArr[i].planetIndex].name + ": " + buildings[producersArr[i].buildingIndex].displayName + " - " + calcBuildingCostVal(producersArr[i].planetIndex, producersArr[i].buildingIndex, buildings[producersArr[i].buildingIndex].rawProduction(planets[producersArr[i].planetIndex])[resourceIndex], numBuildings + 1).value + ", " + planets[producersArr[i+1].planetIndex].name + ": " + buildings[producersArr[i+1].buildingIndex].displayName + " - " + producersArr[i+1].cost.value*1.001);
            }
            var multipleBuildingsStr = "";
            if (1 < numBuildings) {
                multipleBuildingsStr = "(" + numBuildings + ")";
            }            
			improveLabel=div(label(txt(planets[producersArr[i].planetIndex].name + ": " + buildings[producersArr[i].buildingIndex].displayName + multipleBuildingsStr)));
//            if (improveCell != null) {
            improveCell.appendChild(improveLabel);    
            if (producersArr[i].cost.energyReqs != null) {
                var energyLabel = div(label(txt(buildings[producersArr[i].cost.energyReqs.buildingIndex].displayName + "(" + producersArr[i].cost.energyReqs.numBuildings + ")")));
                improveCell.appendChild(energyLabel);
            }
//                console.log(buildings[producersArr[0].buildingIndex].displayName + "(" + producersArr[0].buildingIndex + ")");		
		}
	}
	
	function calculateAllResources() {
		for(var resourceIndex=0;resourceIndex<resNum;resourceIndex++) {
			calculateResourceProducers(resourceIndex);
		}		
	}
	
	function calculateReasearchBuildings() {
		var labsArr = [];
/*		var totalResearch = 0;
		game.planets.forEach(function (planetIndex) {
			console.log(planetIndex);
			totalResearch += planets[planetIndex].globalProd.researchPoint;
		});
		*/
		var galaxyChooser = document.getElementById("galaxyselect");
		const minImprovePct = document.getElementById("numMinImprovePct").value;
		
		for(var h=0;h<buildings.length;h++) {
			for(var l=0;l<game.planets.length;l++) {
				if(galaxyChooser.value == "all" || nebulas[galaxyChooser.value].planets.includes(game.planets[l])){
					totalResearch += buildings[h].production(planets[game.planets[l]]).researchPoint;
				}			
			}
		}
	
		console.log("total reserach: " + totalResearch);		
		game.planets.forEach(function (planetIndex) {
			var planet = planets[planetIndex];
			buildings.forEach(function (building) {
				if (canBuildOnPlanet(planet, building) && 0 < building.rawProduction(planet).researchPoint) {
					var numBuildingsRequired = Math.ceil(totalResearch/((100/minImprovePct) * building.rawProduction(planet).researchPoint));
					labsArr.push({planet:planet, building:building, cost:calcBuildingCostVal(planet.id, building.id, building.rawProduction(planet).researchPoint, numBuildingsRequired), numBuildings:numBuildingsRequired});
				}
			});
		});
		if (0 == labsArr) {
			return;
		}
		
		labsArr.sort(function(a, b){ return a.cost.value - b.cost.value;});
		var labsDiv = document.getElementById("labsDiv");
		deleteChildElements(labsDiv);
		for (var i=0; i<5; i++) {            
			if (i >= labsArr.length) {
				break;
			}
			var numBuildings = labsArr[i].numBuildings;
            while (i+1<labsArr.length && calcBuildingCostVal(labsArr[i].planet.id, labsArr[i].building.id, labsArr[i].building.rawProduction(labsArr[i].planet).researchPoint, numBuildings + 1).value < labsArr[i+1].cost.value) {
                numBuildings++;
            }
            var multipleBuildingsStr = "";
            if (1 < numBuildings) {
                multipleBuildingsStr = "(" + numBuildings + ")";
            }            
			var labsLabel=div(label(txt(labsArr[i].planet.name + ": " + labsArr[i].building.displayName + multipleBuildingsStr)));
//            if (improveCell != null) {
            labsDiv.appendChild(labsLabel);    
            if (labsArr[i].cost.energyReqs != null) {
                var energyLabel = div(label(txt(buildings[labsArr[i].cost.energyReqs.buildingIndex].displayName + "(" + labsArr[i].cost.energyReqs.numBuildings + ")")));
                labsDiv.appendChild(energyLabel);
            }
//                console.log(buildings[producersArr[0].buildingIndex].displayName + "(" + producersArr[0].buildingIndex + ")");		
		}
	}		
	
	function getResourceTotalProduction(galaxy, resourceIndex) {
		var totalResources = 0;
		
		for(var l=0;l<game.planets.length;l++) {
			if(galaxy.value == "all" || nebulas[galaxy.value].planets.includes(game.planets[l])) {
				totalResources += planets[game.planets[l]].resources[resourceIndex];
			}
		}
		return totalResources;
	}
	
	function overview() {
	
		var cellWidth = 200;
		var tableWidth = 0;
		
		var overviewConfigDiv = document.createElement("DIV");
		overviewConfigDiv.innerHTML='Resoure usage multiplier: <input type="range" min="0" max="1000000" value="10000" class="slider" id="sliderResourceConsumptionMultiplier">';		
		overviewConfigDiv.innerHTML+=('<input type="number" min="0" max="1000000" value="10000" id="numResourceConsumptionMultiplier"><br>');
		overviewConfigDiv.innerHTML+='Minimum improvement %: <input type="range" min="0" max="100" value="5" class="slider" id="sliderMinImprovePct">';		
		overviewConfigDiv.innerHTML+=('<input type="number" min="0" max="100" value="5" id="numMinImprovePct"><br>');			
		document.getElementById("result").appendChild(overviewConfigDiv);
		document.getElementById("sliderResourceConsumptionMultiplier").addEventListener("change", function () {
			numResourceConsumptionMultiplier.value = sliderResourceConsumptionMultiplier.value;
			calculateAllResources();
		}	);
		document.getElementById("sliderResourceConsumptionMultiplier").addEventListener("input", function () {
			numResourceConsumptionMultiplier.value = sliderResourceConsumptionMultiplier.value;
	}	);	
		document.getElementById("numResourceConsumptionMultiplier").addEventListener("change", 	function () {
		if ((eval(numResourceConsumptionMultiplier.value) >= eval(numResourceConsumptionMultiplier.min)) && (eval(numResourceConsumptionMultiplier.value) <= eval(numResourceConsumptionMultiplier.max))) {
			sliderResourceConsumptionMultiplier.value = numResourceConsumptionMultiplier.value;
			calculateAllResources();
		}
	});	

			document.getElementById("sliderMinImprovePct").addEventListener("change", function () {
			numMinImprovePct.value = sliderMinImprovePct.value;
		calculateAllResources();
		}	);
		document.getElementById("sliderMinImprovePct").addEventListener("input", function () {
			numMinImprovePct.value = sliderMinImprovePct.value;
	}	);	
		document.getElementById("numMinImprovePct").addEventListener("change", 	function () {
		if ((eval(numMinImprovePct.value) >= eval(numMinImprovePct.min)) && (eval(numMinImprovePct.value) <= eval(numMinImprovePct.max))) {
			sliderMinImprovePct.value = numMinImprovePct.value;
			calculateAllResources();
		}
	});		
		
		var overviewTable = document.createElement("TABLE");
		overviewTable.setAttribute("id", "overviewTable");
		document.getElementById("result").appendChild(overviewTable);
		
		var headRow = tr();
		headRow.setAttribute("id", "headRow");
		document.getElementById("overviewTable").appendChild(headRow);

		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Resource"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow").appendChild(headerCell);
		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Amount"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow").appendChild(headerCell);
		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Production"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow").appendChild(headerCell);
		
		var headerCell = th();
		headerCell.setAttribute("width", 2*cellWidth);
		tableWidth += 2*cellWidth;
		var headerTextNode = label(txt("Improve"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow").appendChild(headerCell);		
		
		var galaxyChooser = document.getElementById("galaxyselect");
		resourceProduction = new Array(resNum);
		for (var i = 0; i < resNum; i++) {
			resourceProduction[i] = 0;			
		}
		
		for(var resourceIndex=0;resourceIndex<resNum;resourceIndex++) {
			
			if(!resources[resourceIndex].show(game))
				continue;
			
			var resource = resources[resourceIndex];
		
			var resourceRow = tr();
			resourceRow.setAttribute("id", "resourceRow" + resource.name);
			document.getElementById("overviewTable").appendChild(resourceRow);
			
			var resourceRowFirstCell = td();
			var resourceLabel = label(txt(resource.name.capitalize()));
			resourceRowFirstCell.appendChild(resourceLabel);
			document.getElementById("resourceRow" + resource.name).appendChild(resourceRowFirstCell);
			
			var totalResources = getResourceTotalProduction(galaxyChooser, resourceIndex);
			
			var resourceRowFirstCell = td();
			var resourceLabel = div(label(txt(totalResources)));
			var resourceLabelBeauty = div(label(txt("(" + beauty(totalResources) + ")")));
			resourceRowFirstCell.appendChild(resourceLabel);
			resourceRowFirstCell.appendChild(resourceLabelBeauty);
			document.getElementById("resourceRow" + resource.name).appendChild(resourceRowFirstCell);
			
			var b = resource.id
			for(var e=52,g=Array(buildings.length),h=0;h<buildings.length;h++)
				g[h]=0;
			for(var l=0;l<game.planets.length;l++)
				if(galaxyChooser.value == "all" || nebulas[galaxyChooser.value].planets.includes(game.planets[l]))
					for(h=0;h<buildings.length;h++)
						0!=buildings[h].resourcesProd[b]&&(g[h]+=planets[game.planets[l]].structure[h].number);
			var m=0;
			for(h=0;h<buildings.length;h++)
				if(0<g[h]){
					e+=20;
					for(l=0;l<game.planets.length;l++)
						if(galaxyChooser.value == "all" || nebulas[galaxyChooser.value].planets.includes(game.planets[l])){
							m+=buildings[h].production(planets[game.planets[l]])[b];
						}
				}
			
			resourceProduction[resourceIndex] = m;
			var resourceRowFirstCell = td();
			var resourceLabel = div(label(txt((Math.floor(m*100)/100) + "/s")));
			var resourceLabelBeauty = div(label(txt("(" + beauty(Math.floor(m*100)/100) + "/s" + ")")));
			resourceRowFirstCell.appendChild(resourceLabel);
			resourceRowFirstCell.appendChild(resourceLabelBeauty);
			document.getElementById("resourceRow" + resource.name).appendChild(resourceRowFirstCell);
            var improveCell = td();
            improveCell.setAttribute("id", "improveCell" + resource.name);
            document.getElementById("resourceRow" + resource.name).appendChild(improveCell);
			var labsDiv = div();
			labsDiv.setAttribute("id", "labsDiv");
			document.getElementById("result").appendChild(labsDiv);
		}
        
   		calculateAllResources();
		calculateReasearchBuildings();
	
		overviewTable.setAttribute("width", tableWidth);
	
	}
	function tpCheck() {
		document.getElementById("result").innerHTML = "Total TP: " + beauty(Math.floor(game.totalTPspent()))
		+ "<br>TP: " + beauty(Math.floor(game.techPoints))
		+ "<br>TP after Time Travel: " + beauty(Math.floor(game.totalTPspent()+2*game.influence()*Math.log(1+game.totalRPspent()/(200*bi))/Math.log(5)))
		+ "<br>Influence: " + beauty(game.influence()) 
		+ "<br>Market coints: " + beauty(game.money) ;
	}
	function exportToBattlecalc() {
		saveData.bonuses["influence"] = game.influence();
		for (var index = 0; index < civis[0].planets.length; index++) {
			var planetId = civis[0].planets[index];
			if(planets[planetId].structure[buildingsName.cannon].number > 0)
				saveData.cannons[planetId] = planets[planetId].structure[buildingsName.cannon].number;
		};
		researches.map(function(research) {
			if(!research.requirement()) return;
			saveData.bonuses[research.id] = research.level;
		});
		artifacts.map(function(artifact) {
			if(artifact.possessed)
				saveData.bonuses[artifact.id] = 1;
			else
				saveData.bonuses[artifact.id] = 0;
		});
		characters.map(function(character) {
			if(character.unlocked) saveData.bonuses[character.id] = 1;
		});
		var chosenGovern = 0;
		for (var government in governmentList) {
			if(government == game.chosenGovern) saveData.bonuses[name] = chosenGovern;
			chosenGovern++;
		}
		var calcData = {
			ships: saveData.ships,
			cannons: saveData.cannons,
			bonuses: saveData.bonuses,
			options: saveData.options,
			enemySelected: 0,
			enemies: saveData.enemies,
		};
		//var url = "file:///C:/Users/Benny/Documents/GitHub/HeartOfGalaxy/HoG/Battlecalc.html#nobitly#" + serialize(calcData);
		var url = "https://godlloyd.github.io/HeartOfGalaxy/HoG/Battlecalc.html#nobitly#" + serialize(calcData);
		var exportButton = document.createElement("a");
		exportButton.innerText = "Calculate Attack";
		exportButton.href = url;
		exportButton.target = "battlecalc";
		exportButton.innerText = "Export to Battlecalc";
		document.getElementById("result").appendChild(exportButton);
	}
	function queueCheck() {
	
		var cellWidth = 200;
		var tableWidth = 0;
		
		var queueTable = document.createElement("TABLE");
		queueTable.setAttribute("id", "queueTable");
		document.getElementById("result").appendChild(queueTable);
				
		var headRow = queueTable.insertRow();
		headRow.setAttribute("id", "headRow");
		document.getElementById("queueTable").appendChild(headRow);
		
		var queuesRow = queueTable.insertRow();
		queuesRow.setAttribute("id", "queuesRow");
		document.getElementById("queueTable").appendChild(queuesRow);
		
		var queuesRow = queueTable.insertRow();
		queuesRow.setAttribute("id", "resourceRow");
		document.getElementById("queueTable").appendChild(resourceRow);
		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Building/Planet"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow").appendChild(headerCell);
		
		game.planets.map(function(planetIndex) {
			var planet = planets[planetIndex];
			if(document.getElementById("hidePlanetsCheckbox").checked) {
				for(var queueIndex in planet.queue) {
					var headerCell = th();
					headerCell.setAttribute("width", cellWidth);
					tableWidth += cellWidth;
					var headerTextNode = label(txt(planets[planetIndex].name));
					headerCell.appendChild(headerTextNode);
					document.getElementById("headRow").appendChild(headerCell);
					break;
				}
			} else {
				var headerCell = th();
				headerCell.setAttribute("width", cellWidth);
				tableWidth += cellWidth;
				var headerTextNode = label(txt(planets[planetIndex].name));
				headerCell.appendChild(headerTextNode);
				document.getElementById("headRow").appendChild(headerCell);
			}
		});
				
		var headerCell = td();
		var headerTextNode = label(txt("Queues"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("queuesRow").appendChild(headerCell);		

		
		game.planets.map(function(planetIndex) {
			var planet = planets[planetIndex];
			if(document.getElementById("hidePlanetsCheckbox").checked) {
				for(var queueIndex in planet.queue) {
					var queueCell = td();
					for(var queueIndex in planet.queue) {
						var queueTextNode = div(label(txt(buildings[planet.queue[queueIndex].b].displayName + ": " + planet.queue[queueIndex].n)));
						queueCell.appendChild(queueTextNode);
					}
					document.getElementById("queuesRow").appendChild(queueCell);					
					break;
				}
			} else {
				var queueCell = td();
				for(var queueIndex in planet.queue) {
					var queueTextNode = div(label(txt(buildings[planet.queue[queueIndex].b].displayName + ": " + planet.queue[queueIndex].n)));
					queueCell.appendChild(queueTextNode);
				}
				document.getElementById("queuesRow").appendChild(queueCell);
			}
		});

		var headerCell = td();
		var headerTextNode = label(txt("Resources"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("resourceRow").appendChild(headerCell);
		
		var totals = Array(48).fill(0);

		game.planets.map(function(planetIndex) {
			var planet = planets[planetIndex];
			if(document.getElementById("hidePlanetsCheckbox").checked) {
				for(var queueIndex in planet.queue) {
					var resourceCell = td();
					var resourceInQueue = planet.totalResourcesInQueue();
					resourceInQueue.forEach( function (value, i){
						if (value != 0){
							totals[i] += value;
							var resourceTextNode = div(label(txt(resources[i].name.charAt(0).toUpperCase() + resources[i].name.slice(1) + ": " + value)));
							resourceCell.appendChild(resourceTextNode);
						}
					});
					document.getElementById("resourceRow").appendChild(resourceCell);					
					break;
				}
			} else {
					var resourceCell = td();
					var resourceInQueue = planet.totalResourcesInQueue();
					resourceInQueue.forEach( function (value, i){							
						if (value != 0){
							totals[i] += value;
							var resourceTextNode = div(label(txt(resources[i].name.charAt(0).toUpperCase() + resources[i].name.slice(1) + ": " + value)));
							resourceCell.appendChild(resourceTextNode);
						}
					});
					document.getElementById("resourceRow").appendChild(resourceCell);	
			}			
		});
		queueResourceTotals(totals);	
		queueTable.setAttribute("width", tableWidth);
	}
	
	function queueResourceTotals(totals)
	{
		var spacer = document.createElement("div");
		spacer.style = "clear";
		document.getElementById("result").appendChild(spacer);
		
		var cellWidth = 200;
		var tableWidth = 0;
		
		var resourceTable = document.createElement("TABLE");
		resourceTable.setAttribute("id", "resourceTable");
		document.getElementById("result").appendChild(resourceTable);
		
		var headRow2 = resourceTable.insertRow();
		headRow2.setAttribute("id", "headRow2");
		document.getElementById("resourceTable").appendChild(headRow2);
		
		var resNumRow = resourceTable.insertRow();
		resNumRow.setAttribute("id", "resNumRow");
		document.getElementById("resourceTable").appendChild(resNumRow);
		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Queue Resource Total"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow2").appendChild(headerCell);
		
		var headerCell = th();
		headerCell.setAttribute("width", cellWidth);
		tableWidth += cellWidth;
		var headerTextNode = label(txt("Empire Resource Total"));
		headerCell.appendChild(headerTextNode);
		document.getElementById("headRow2").appendChild(headerCell);
		
		var queueResCell = td();	
		
		totals.forEach( function (value, i){
			if (value != 0){
				var resourceTextNode = div(label(txt(resources[i].name.charAt(0).toUpperCase() + resources[i].name.slice(1) + ": " + value)));
				queueResCell.appendChild(resourceTextNode);
			}
		});
		document.getElementById("resNumRow").appendChild(queueResCell);
		
		var totalResCell = td();
		for(var resourceIndex=0;resourceIndex<resNum;resourceIndex++) {
			if (totals[resourceIndex] > 0){
			var totalResources = 0;			
			for(var l=0;l<game.planets.length;l++)
					totalResources += planets[game.planets[l]].resources[resourceIndex];
			var resourceLabel = div(label(txt(resources[resourceIndex].name.charAt(0).toUpperCase() + resources[resourceIndex].name.slice(1) + ": " + totalResources)));
			if (totalResources < totals[resourceIndex])
				resourceLabel.style = "color:red";
			if (totalResources != 0)
				totalResCell.appendChild(resourceLabel);
			}
		}
		document.getElementById("resNumRow").appendChild(totalResCell);
		resourceTable.setAttribute("width", tableWidth);		
	}

	function optTotalCost (planet, building, amount ) {
		for (var e = Array(resNum), g = 0; g < e.length; g++) e[g] = 0;
        if (null != planet.civis)
            for (g = 0; g < resNum; g++) {      
				var a = building.resourcesCost[g];
				var r = building.resourcesMult[g];
				e[g] = Math.floor(a*(Math.pow(r, planet.structure[building.id].number) - Math.pow(r, amount + planet.structure[building.id].number)) / (1 - r));				
            }		
			
//		console.log("totalCost: " + e);
		return e;
	}
	
	var isSaveImported = false;
	
	document.getElementById("impsave").onclick = function(){
		var errorMessageDiv = document.getElementById("importError");
		isSaveImported = importSave(errorMessageDiv);
		createSelectionList();
	};
	
});

