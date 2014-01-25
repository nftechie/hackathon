$(document).ready(function(){

	var storedData = new Array();
	var storedLocations = new Array();
	var currLatestTime = 0;
	var initialRequest = true;
	// var currNewPosts = 0;
	var newData = false;
	var queries = new Array();

	var plottingData = new Array();

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

	function getNewImageData(queriesArray){
		var feed = new Instafeed({
	        get: 'tagged',
	        tagName: queriesArray[0],
	        clientId: '23ab74f41107450babe10864acf7c0cb',
	        limit: 33,
	        mock: 'true',
	        success: function(d){

	        	// newData = false;
	        	for (var i = 0; i < d.data.length; i++){
	        		date = new Date(d.data[i].created_time * 1000);
	        		if (currLatestTime < d.data[i].created_time){
	        			storedData.push(d.data[i].created_time);
	        			//date = new Date(d.data[i].created_time * 1000);
	        			console.log(date);

	        			if (d.data[i].location != null){
	        				storedLocations.push(d.data[i].location);
	        			}

	        			// currNewPosts++;
	        			// newData = true;
	        		} else {
	        			break;
	        		}
	        	}
	        	// currLatestTime = new Date(d.data[0].created_time * 1000);
	        	currLatestTime = d.data[0].created_time;

	        	console.log(d);

	        	if (initialRequest){
	        		storedData.length = 0;
	        		initialRequest = false;
	        	}
	        }
	    });

		feed.run();

	    setInterval(function(){
			feed.run();
		}, 1000);

		setInterval(function(){
			plotData();
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
