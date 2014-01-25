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
	var picVsVidData = new Array();
	var hashTagData = new Array();
   	var longestHashTag = "";
    var longestHashTagLength = 0;
	var mainDataArray = new Array();
	var totalNumLikes = 0;
	var totalNumComments = 0;
	var nextData;

	var userID, accessToken;

	accessToken = document.URL.split("access_token=")[1];

	if (accessToken == null){
		window.location.replace("https://instagram.com/oauth/authorize/?client_id=23ab74f41107450babe10864acf7c0cb&redirect_uri=http://localhost:8000/index.html&response_type=token");
	} else {
		$.ajax({
			url: "https://api.instagram.com/v1/users/self/?access_token=" + accessToken,
			dataType: "jsonp",
			success: function(d){
				userID = d.data.id;
			}
		});
	}

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

		console.log(accessToken);

		var feed = new Instafeed({
	        get: 'user',
	        userId: parseInt(userID),
	        accessToken: accessToken,
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
    	console.log(mainDataArray);

    	whoLikesMyPhotos();	
    	createPieChart();
		hashTagAnalyzer();
		photosVsVideos();
		createBarGraph();
		
	generateTimingInfo();

		populateHTML();
    }

    function whoLikesMyPhotos(){
    	var likeCounter = 0;
    	var commentCounter = 0;
    	var friendsWhoLikeMyPhotos = new Array();
    	var friendsWhoCommentOnMyPhotos = new Array();
    	var tmpObj = new Object();
    	var foundLike = false;
    	var foundComment = false;

    	for (var i = 0; i < mainDataArray.length; i++){
    		likeCounter = likeCounter + mainDataArray[i].likes.count;

    		for (var j = 0; j < mainDataArray[i].likes.data.length; j++){
    			foundLike = false;

    			for (var k = 0; k < friendsWhoLikeMyPhotos.length; k++){
    				if (friendsWhoLikeMyPhotos[k].friend == mainDataArray[i].likes.data[j].username){
    					friendsWhoLikeMyPhotos[k].count++;
    					foundLike = true;
    					break;
    				}
    			}

    			if (!foundLike && mainDataArray[i].likes.data.length > 0){
    				tmpObj = new Object();
    				tmpObj.friend = mainDataArray[i].likes.data[j].username;
    				tmpObj.count = 0;
    				friendsWhoLikeMyPhotos.push(tmpObj);
    			}
    		}
    	}

    	for (var i = 0; i < mainDataArray.length; i++){
    		commentCounter = commentCounter + mainDataArray[i].comments.count;

    		for (var j = 0; j < mainDataArray[i].comments.data.length; j++){
    			foundComment = false;

		    	for (var k = 0; k < friendsWhoCommentOnMyPhotos.length; k++){
		    				if (friendsWhoCommentOnMyPhotos[k].friend == mainDataArray[i].comments.data[j].from.username){
		    					friendsWhoCommentOnMyPhotos[k].count++;
		    					foundComment = true;
		    					break;
		    				}
		    			}

		    	if (!foundComment && mainDataArray[i].comments.data.length > 0){
		    				tmpObj = new Object();
		    				tmpObj.friend = mainDataArray[i].comments.data[j].from.username;
		    				tmpObj.count = 0;
		    				friendsWhoCommentOnMyPhotos.push(tmpObj);
    			}
    		}
    	}

    	console.log("You have " + likeCounter + " total likes and " + commentCounter + " total comments!");
    	console.log("Your average like per photo is " + likeCounter / mainDataArray.length + " likes!");
    	console.log("Your average comment per photo is " + commentCounter / mainDataArray.length + " comments!");
    	console.log(friendsWhoLikeMyPhotos.length + " total people have liked your photos!");
    	console.log(friendsWhoCommentOnMyPhotos.length + " total people have commented your photos!");	

    	totalNumLikes = likeCounter;
    	totalNumComments = commentCounter;
    }

    function hashTagAnalyzer(){
    	var hashTagArray = new Array();

    	for (var i = 0; i < mainDataArray.length; i++){
    			for(var j = 0; j < mainDataArray[i].tags.length; j++){
	        		hashTagArray.push(mainDataArray[i].tags[j]);

	        		if(mainDataArray[i].tags[j].length > longestHashTagLength){
	        			longestHashTag = mainDataArray[i].tags[j];
	        			longestHashTagLength = mainDataArray[i].tags[j].length;
	        		}

    			}
	    }

    	var found = false;

    	for (var i = 0; i < hashTagArray.length; i++){

    		found = false;
    		for (var j = 0; j < hashTagData.length; j++){

    			if (hashTagArray[i] == hashTagData[j].tag){
    				hashTagData[j].count++;
    				found = true;
    				break;
    			}
    		}

    		if (!found){
    			var tmpObj = new Object();
    			if (hashTagArray[i] != null){
    				tmpObj.tag = hashTagArray[i];
    				tmpObj.count = 1;
    				hashTagData.push(tmpObj);
    			}	
    		}
    	}
    	console.log(longestHashTag);
    	console.log(longestHashTagLength);
    	console.log(hashTagData);

    	console.log("Your average number of hash tags per photo is " + hashTagData.length / mainDataArray.length + " hash tags!");
    }

    function photosVsVideos(){
    	picVsVidArray = new Array();
    	videoCount = 0;
    	imgCount = 0;
    	for (var i = 0; i < mainDataArray.length; i++){
	        picVsVidArray.push(mainDataArray[i].type);
	    }

    	var found = false;

    	for (var i = 0; i < picVsVidArray.length; i++){

    		found = false;
    		for (var j = 0; j < picVsVidData.length; j++){

    			if (picVsVidArray[i] == picVsVidData[j].type){
    				picVsVidData[j].count++;
    				found = true;
    				break;
    			}
    		}

    		if (!found){
    			var tmpObj = new Object();
    			if (picVsVidArray[i] != null){
    				tmpObj.type = picVsVidArray[i];
    				tmpObj.count = 1;
    				picVsVidData.push(tmpObj);
    			}	
    		}
    	}
    	console.log(picVsVidData);
    }

    function createPieChart(){
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



    	var width = 560,
	    height = 400,
	    radius = Math.min(width, height) / 2;

		var color = d3.scale.ordinal()
		    .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

		var arc = d3.svg.arc()
		    .outerRadius(radius - 10)
		    .innerRadius(0);

		var pie = d3.layout.pie()
		    .sort(null)
		    .value(function(d) { return d.count; });

		var svg = d3.select("#mainContainer").append("svg")
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
    
    function generateTimingInfo(){
	console.log(mainDataArray);
    }

    function createBarGraph(){
    	var margin = {top: 20, right: 20, bottom: 30, left: 40},
		    width = 960 - margin.left - margin.right,
		    height = 500 - margin.top - margin.bottom;

		var x = d3.scale.ordinal()
		    .rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .ticks(10, "%");

		var svg = d3.select("#mainContainer").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			data = hashTagData; 

		  x.domain(data.map(function(d) { return d.tag; }));
		  y.domain([0, d3.max(data, function(d) { return d.count; })]);

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

		  svg.selectAll(".bar")
		      .data(data)
		    .enter().append("rect")
		      .attr("class", "bar")
		      .attr("x", function(d) { return x(d.tag); })
		      .attr("width", x.rangeBand())
		      .attr("y", function(d) { return y(d.count); })
		      .attr("height", function(d) { return height - y(d.count); });

    }

    function populateHTML(){
    	$("#totalLikes").html(totalNumLikes);
    	$("#totalComments").html(totalNumComments);
    }

	$("#instaFreqWrapper #submitButton").click(function(){

		plotActive = true;
		queries.length = 0;

		for (var i = 0; i < $(".queryInput").length; i++){
			queries.push($(".queryInput:eq(" + i + ")")[0].value);
		}

		getNewImageData(queries);

	});

	$("body").keypress(function(e){
		if (e.keyCode == 13) {
	        getNewImageData();
		}
    });

});
