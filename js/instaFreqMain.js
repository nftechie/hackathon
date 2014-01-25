$(document).ready(function(){

	var storedData = new Array();
	var storedLocations = new Array();
	var currLatestTime = 0;
	var initialRequest = true;
	// var currNewPosts = 0;
	var newData = false;
	var queries = new Array();

	var plottingData = new Array();

	var filtersArray = new Array();
	var filtersData = new Array();
	var mainDataArray = new Array();
	var nextData;

    //check if plot needs to be redrawn
	function checkResize(){
	    var w = jQuery("#instaFreqContainer").width();
	    var h = jQuery("#instaFreqContainer").height();
	    if (w != plotContainerWidth || h != plotContainerHeight) {
	        plotContainerWidth = w;
	        plotContainerHeight = h;

	        plotData();
	    }
	}

	function getNewImageData(queriesArray, nextData){

		var feed = new Instafeed({
	        get: 'user',
	        userId: 18305590,
	        accessToken: '18305590.467ede5.0c93edd3ea2d46d98458c96b4e6687cb',
	        limit: '60',
	        mock: 'true',
	        success: function(d){

	        	console.log(d);
				for(var i=0; i<d.data.length;i++){
	        		mainDataArray.push(d.data[i]);
				}
	        	
	        	nextData = d.pagination.next_url;

	        	console.log(nextData);

	        	if (nextData == null){
	        		startParsingData();
	        		//createPieChart();
	        	} else {
	        		getMoreData(d.pagination.next_url);
	        	}

	        }
	    });

		feed.run();

		setInterval(function(){
			//plotData();
		}, 200);
	}

	$(window).resize(function(){
		if (plotActive){
			checkResize();
		}
	});

	var plotContainerWidth = $("#instaFreqContainer").width();
    var plotContainerHeight = $("#instaFreqContainer").height();

    var plotActive = false;

    function getMoreData(nextData){
    	console.log(nextData);
    	$.ajax({
			url: nextData,
			dataType: "jsonp",
			success: function(d){
				console.log(d);
				for(var i=0; i<d.data.length;i++){
	        		mainDataArray.push(d.data[i]);
				}

				if (d.pagination.next_url == null){
	        		startParsingData();

	        		//createPieChart();
				} else {
					getMoreData(d.pagination.next_url);
				}
				
			}
		});
    }

    function startParsingData(){
    		createPieChart();
    }
	        		
    function createPieChart(){
		console.log(mainDataArray);
    	for (var i = 0; i < mainDataArray.length; i++){
	        		filtersArray.push(mainDataArray[i].filter);
	        	}

	        	var found = false;

	        	for (var i = 0; i < filtersArray.length; i++){

	        		found = false;
	        		for (var j = 0; j < filtersData.length; j++){

	        			if (filtersArray[i] == filtersData[j].filter){
	        				filtersData[j].count++;
	        				found = true;
	        				break;
	        			}
	        		}

	        		if (!found){
	        			var tmpObj = new Object();
	        			if (filtersArray[i] != null){
	        				tmpObj.filter = filtersArray[i];
	        				tmpObj.count = 1;
	        				filtersData.push(tmpObj);
	        			}	
	        		}
	        	}



    	var width = 960,
	    height = 500,
	    radius = Math.min(width, height) / 2;

		var color = d3.scale.ordinal()
		    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

		var arc = d3.svg.arc()
		    .outerRadius(radius - 10)
		    .innerRadius(0);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d.count; });

		var svg = d3.select("#middleContainer").append("svg")
		    .attr("width", width)
		    .attr("height", height)
		  .append("g")
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

		 data = filtersData;

		  data.forEach(function(d) {
		    d.count = +d.count;
		  });

		  console.log(data);

		  var g = svg.selectAll(".arc")
		      .data(pie(data))
		    .enter().append("g")
		      .attr("class", "arc");

		  g.append("path")
		      .attr("d", arc)
		      .style("fill", function(d) { return color(d.data.filter); });

		  g.append("text")
		      .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		      .attr("dy", ".35em")
		      .style("text-anchor", "middle")
		      .text(function(d) { return d.data.filter; });
    }

    //this function plots data received from twitter api
    function plotData(){
    	$("#middleContainer").empty();

		var plotWidth = parseInt($("#instaFreqWrapper #middleContainer").css("width"));
		var plotHeight = parseInt($("#instaFreqWrapper #middleContainer").css("height"));

		var margin = {top: 20, right: 80, bottom: 30, left: 50},
	    width = plotWidth - margin.right - margin.left - 20,
	    height = plotHeight - margin.top - margin.bottom - 20;

	    plottingData.push([new Date(), storedData.length]);
	    storedData.length = 0;

		var x = d3.time.scale()
		    .range([0, width]);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var color = d3.scale.category10();

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");

		var line = d3.svg.line()
		    .interpolate("basis")
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.frequency); });

		var svg = d3.select("#middleContainer").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		  

		var data = plottingData.map(function(d) {
		      return {
		         date: d[0],
		         frequency: d[1]
		      };
		      
		  });
		        


		  x.domain(d3.extent(data, function(d) { return d.date; }));
		  y.domain(d3.extent(data, function(d) { return d.frequency; }));

				  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);

		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)
		    .append("text")
		      .attr("transform", "rotate(-90)")
		      .attr("y", 6)
		      .attr("dy", ".71em")
		      .style("text-anchor", "end")
		      .text("Frequency");

		  svg.append("path")
		      .datum(data)
		      .attr("class", "line")
		      .attr("d", line);
	
	}

	$("#instaFreqWrapper #submitButton").click(function(){

		plotActive = true;
		queries.length = 0;

		for (var i = 0; i < $(".queryInput").length; i++){
			queries.push($(".queryInput:eq(" + i + ")")[0].value);
		}

		getNewImageData(queries);

	});

});
