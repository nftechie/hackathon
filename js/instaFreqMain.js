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

	    var found = false;

    	for (var i = 0; i < mainDataArray.length; i++){
	        		// var tmpObj = new Object();
	        		// tmpObj.filter = mainDataArray[i].filter;
	        		// filtersArray.push(tmpObj);
	        		found = false;
	        		for (var j = 0; j < filtersData.length; j++){

	        			if (mainDataArray[i].filter == filtersData[j].filter){
	        				filtersData[j].count++;

	        				for(var ii =0; ii < mainDataArray[i].tags.length;ii++){
	        					var tagFound = false;
		        				for(var k =0; k < filtersData[j].hashTags.length;k++){
		        					if(mainDataArray[i].tags[ii] == filtersData[j].hashTags[k]){
		        						filtersData[j].hashTags[k].count++;

		        						imgObj = new Object();
			        					imgObj.images = mainDataArray[i].images;
			        					imgObj.likes = mainDataArray[i].likes;
	        					
										filtersData[j].hashTags[k].imgs.push(imgObj);		        						

		        						tagFound=true;
		        						break;
		        					}
		        				}
		        				if(!tagFound){
									var hashObj = new Object();
			        				hashObj.tag = mainDataArray[i].tags[ii];
			        				hashObj.count = 1;
	        						hashObj.imgs = new Array();
	        						imgObj = new Object();
		        					imgObj.images = mainDataArray[i].images;
		        					imgObj.likes = mainDataArray[i].likes;
		        					
		        					hashObj.imgs.push(imgObj);
			        				//hashObj.imgs.push(mainDataArray[i].images);
			        				filtersData[j].hashTags.push(hashObj); 
				        		}
	        				}

	        				found = true;
	        				break;
	        			}
	        		}

	        		if (!found){
	        			var tmpObj = new Object();
	        			if (mainDataArray[i].filter != null){
	        				tmpObj.filter = mainDataArray[i].filter;
	        				tmpObj.count = 1;
	        				tmpObj.hashTags = new Array();

	        				for(var j = 0; j < mainDataArray[i].tags.length;j++){
								var hashObj = new Object();
	        					hashObj.tag = mainDataArray[i].tags[j];
	        					hashObj.count = 1;
	        					hashObj.imgs = new Array();

	        					imgObj = new Object();
	        					imgObj.images = mainDataArray[i].images;
	        					imgObj.likes = mainDataArray[i].likes;

	        					hashObj.imgs.push(imgObj);
	        				
	        					tmpObj.hashTags.push(hashObj);
	        				}


	        				filtersData.push(tmpObj);
	        			}	
	        		}
	    }


	        	for (var i = 0; i < filtersArray.length; i++){

	        		
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

    function createBarGraph(){

var margin = {top: 30, right: 120, bottom: 0, left: 120},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scale.linear()
    .range([0, width]);

var barHeight = 20;

var color = d3.scale.ordinal()
    .range(["steelblue", "#ccc"]);

var duration = 750,
    delay = 25;

var partition = d3.layout.partition()
    .value(function(d) { return d.size; });

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("top");

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", up);

svg.append("g")
    .attr("class", "x axis");

svg.append("g")
    .attr("class", "y axis")
  .append("line")
    .attr("y1", "100%");

// d3.json("readme.json", function(error, root) {
//   partition.nodes(root);
//   x.domain([0, root.value]).nice();
//   down(root, 0);
// });
console.log("filtersData");
console.log(filtersData);
var barChartData = "";
var test = "test";

barChartData = "{ 'name': '" + test + "', 'children': [";

        for (var i = 0; i < filtersData.length; i++){
          if (i == filtersData.length - 1){
            barChartData = barChartData + "{'name': '" + filtersData[i].filter + "', 'size': " + filtersData[i].count + "}]}";
			// barChartData = barChartData + "{'name': '" + filtersData[i].filter + "', 'children': [" + filtersData[i].count + "}]}";
			
			// for(var j = 0; j < hashTagData.length;j++){
   //        		if (i == hashTagData.length - 1){
   //        			if()
   //        			barChartData = barChartData +
   //        		}else{
   //        			barChartData = barChartData +
   //        		}
			// }

			// barChartData = filtersData[i].count + "}]}";

          } else {
            barChartData = barChartData + "{'name': '" + filtersData[i].filter + "', 'size': " + filtersData[i].count + "},";
          } 
        }
        console.log(barChartData);
        var root = eval("(" + barChartData + ")");
        console.log(root);
	  partition.nodes(root);
	  x.domain([0, root.value]).nice();
	  down(root, 0);


function down(d, i) {
  if (!d.children || this.__transition__) return;
  var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Entering nodes immediately obscure the clicked-on bar, so hide it.
  exit.selectAll("rect").filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Enter the new bars for the clicked-on data.
  // Per above, entering bars are immediately visible.
  var enter = bar(d)
      .attr("transform", stack(i))
      .style("opacity", 1);

  // Have the text fade-in, even though the bars are visible.
  // Color the bars as parents; they will fade to children if appropriate.
  enter.select("text").style("fill-opacity", 1e-6);
  enter.select("rect").style("fill", color(true));

  // Update the x-scale domain.
  x.domain([0, d3.max(d.children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to their new position.
  var enterTransition = enter.transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; });

  // Transition entering text.
  enterTransition.select("text")
      .style("fill-opacity", 1);

  // Transition entering rects to the new x-scale.
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", function(d) { return color(!!d.children); });

  // Transition exiting bars to fade out.
  var exitTransition = exit.transition()
      .duration(duration)
      .style("opacity", 1e-6)
      .remove();

  // Transition exiting bars to the new x-scale.
  exitTransition.selectAll("rect")
      .attr("width", function(d) { return x(d.value); });

  // Rebind the current node to the background.
  svg.select(".background")
      .datum(d)
    .transition()
      .duration(end);

  d.index = i;
}

function up(d) {
  if (!d.parent || this.__transition__) return;
  var end = duration + d.children.length * delay;

  // Mark any currently-displayed bars as exiting.
  var exit = svg.selectAll(".enter")
      .attr("class", "exit");

  // Enter the new bars for the clicked-on data's parent.
  var enter = bar(d.parent)
      .attr("transform", function(d, i) { return "translate(0," + barHeight * i * 1.2 + ")"; })
      .style("opacity", 1e-6);

  // Color the bars as appropriate.
  // Exiting nodes will obscure the parent bar, so hide it.
  enter.select("rect")
      .style("fill", function(d) { return color(!!d.children); })
    .filter(function(p) { return p === d; })
      .style("fill-opacity", 1e-6);

  // Update the x-scale domain.
  x.domain([0, d3.max(d.parent.children, function(d) { return d.value; })]).nice();

  // Update the x-axis.
  svg.selectAll(".x.axis").transition()
      .duration(duration)
      .call(xAxis);

  // Transition entering bars to fade in over the full duration.
  var enterTransition = enter.transition()
      .duration(end)
      .style("opacity", 1);

  // Transition entering rects to the new x-scale.
  // When the entering parent rect is done, make it visible!
  enterTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .each("end", function(p) { if (p === d) d3.select(this).style("fill-opacity", null); });

  // Transition exiting bars to the parent's position.
  var exitTransition = exit.selectAll("g").transition()
      .duration(duration)
      .delay(function(d, i) { return i * delay; })
      .attr("transform", stack(d.index));

  // Transition exiting text to fade out.
  exitTransition.select("text")
      .style("fill-opacity", 1e-6);

  // Transition exiting rects to the new scale and fade to parent color.
  exitTransition.select("rect")
      .attr("width", function(d) { return x(d.value); })
      .style("fill", color(true));

  // Remove exiting nodes when the last child has finished transitioning.
  exit.transition()
      .duration(end)
      .remove();

  // Rebind the current parent to the background.
  svg.select(".background")
      .datum(d.parent)
    .transition()
      .duration(end);
}

// Creates a set of bars for the given data node, at the specified index.
function bar(d) {
  var bar = svg.insert("g", ".y.axis")
      .attr("class", "enter")
      .attr("transform", "translate(0,5)")
    .selectAll("g")
      .data(d.children)
    .enter().append("g")
      .style("cursor", function(d) { return !d.children ? null : "pointer"; })
      .on("click", down);

  bar.append("text")
      .attr("x", -6)
      .attr("y", barHeight / 2)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(function(d) { return d.name; });

  bar.append("rect")
      .attr("width", function(d) { return x(d.value); })
      .attr("height", barHeight);

  return bar;
}

// A stateful closure for stacking bars horizontally.
function stack(i) {
  var x0 = 0;
  return function(d) {
    var tx = "translate(" + x0 + "," + barHeight * i * 1.2 + ")";
    x0 += x(d.value);
    return tx;
  };
}

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
