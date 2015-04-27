//Live results 
var path = 'http://code.boxfishbg.info/liveparser/files/'; //basepath for result files
var stage = 1;  //initial current stage value
var champ = ''; //current championship
var group = ''; //current class/group
var time = ''; //current time
var event = new Array(); // Event data
var itinerary = new Array(); // Itinerary
var championships = new Array(); // Available championships in the event
var classes = new Array(); // Available classes in the event


$(document).ready(function(){
	
	loadEvent();
get_entries=setTimeout(	"getentries()", 2000);
get_stages=setTimeout("getstages()", 2000); 
get_champs=setTimeout("getchamps()", 2000);
get_classes=setTimeout("getclasses()", 2000);
get_time=setTimeout("getTime()", 2000);
get_curstage=setTimeout("currentStage()", 2000);
//	getchamps();
//	getclasses();
//	getTime();
//	currentStage();
	//window.setInterval("getentries()", 6000);

});

//Load the event
function loadEvent()
{
	var url = path + 'live_event.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
			var eventinfo='<h1>'+ json.name +'</h1>';			  
			$('#event-info').html(eventinfo);
			event = json;
		},
		error: function() {
		   console.log('error loading event');
		}
	});				
}


//Get stages
function getstages()
{
	var url = path + event.id + '/stages.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
			var stages='';
			for(var i=0; i < json.stage.length; i++) {
				stages = stages + '<a class="single_stage"><span class="'+ json.stage[i].type +'">' + json.stage[i].number + '</span></a>';
			}
			  
			$('#stage-select').html(stages);
			itinerary = json.stage;
		},
		error: function() {
		   console.log('error loading stages');
		}
	});				
}

function getchamps()
{
	var url = path + event.id + '/champs.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
			var champs='';
			for(var i=0; i < json.champs.length; i++) {
				champs = champs + '<a class="single_champ"><span class="'+ json.champs[i].champ +'">' + json.champs[i].champ + '</span></a>';
			}
			  
			$('#champ-select').html(champs);
			championships = json.champs;
		},
		error: function() {
		   console.log('error loading championships');
		}
	});				
}

function getclasses()
{
	var url = path + event.id + '/classes.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
			var classes='';
			for(var i=0; i < json.classes.length; i++) {
				classes = classes + '<a class="single_class"><span class="'+ json.classes[i].eventclass +'">' + json.classes[i].eventclass + '</span></a>';
			}
			  
			$('#class-select').html(classes);
			classes = json.classes;
		},
		error: function() {
		   console.log('error loaing classes');
		}
	});				
}

//Load stage times
function getresults(stage, champ, group)
{

}

//Get current event time
function getTime()
{
	$.jsonp({
		url: path + "time.php", 
		callback: "callback",
		success: function(json) {
			time=json.time;
		},
		error: function() {
		   console.log('error loading time');
		}
	});
}

//Define which is the current live stage so we can load the info and results for it
function currentStage()
{
	for (var i=0; i < itinerary.length; i++) {
		if (itinerary[i].type=='stage') {
			if (time>=itinerary[i].start) {
				stage=itinerary[i].number;
			}
		}
	}
}

//Get entries - just a test function...
function getentries()
{
	var url = path + event.id + '/entries_remote.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
		   var entries='';
			  $.each(json.entry, function(key, val){
				entries = entries + '<div><span class="number">' + val.number + '</span><span class="driver">' + val.driver + '</span><span class="driver">' + val.codriver + '</span></div>';
			  })
			$('#entries').html(entries);
		},
		error: function() {
		   console.log('error loading entries');
		}
	});				
}