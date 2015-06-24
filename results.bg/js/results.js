//Live results 
var path = 'http://code.boxfishbg.info/liveparser/files/'; //basepath for result files
var assetspath = 'http://code.boxfishbg.info/assets/'; //basepath for assets
var stage = 1;  //initial current stage value
var champ = 'all'; //initial championship
var group = ''; //initial class/group
var time = ''; //event time
var H = 0;
var i = 0;
var s = 0;
var utc=-120;
var loadcount=0;
var eventdata = new Array(); // Event data
var evententries = new Array(); // Event entries
var itinerary = new Array(); // Itinerary
var itinerarystages = new Array(); // Itinerary
var championships = new Array(); // Available championships in the event
var classes = new Array(); // Available classes in the event
var champnames = {all:"всички", rally:"рали", rallysprint:"купа Твърдица", erc:"ERC", rally2wd:"рали 2WD"};
//var champnames = {all:"всички", rally:"рали", rallysprint:"рали-спринт", erc:"ERC", rally2wd:"рали 2WD"};

$(document).ready(function(){
	initialLoad();
	
	//main navigation
	$('.contentselector').on('click', function(){
		var selector = '.data[data-content="'+$(this).attr('data-content')+'"]';
		$('.navbar-collapse').collapse('hide');
		$("div.data").hide(300);
		$(selector).show(300);
	});
	
	window.setInterval('refreshResults()', 60000);	
	window.setInterval('loadFlashnews()', 60000);	
	window.setInterval('loadRetired()', 60000);
	window.setInterval('loadPenalties()', 60000);
	
});

//Load the event
function loadEvent()
{	
	var url = path + 'event.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
			//event information
			var startday = json.event.start.substr(8, 2);
			var startmonth= json.event.start.substr(5, 2);
			var endday = json.event.end.substr(8, 2);
			var endmonth= json.event.end.substr(5, 2);
			var year = json.event.start.substr(0, 4)
			if (json.event.start==json.event.end) {var dates = startday + '/' + startmonth + ' ' + year;}
			else { dates = startday + '/' + startmonth + ' - ' + endday + '/' + endmonth + ' ' + year;}
			var year = json.event.start.substr(0, 4)
			var eventinfo='<h1>' + json.event.name + '</h1><div class="event-dates"><span class="glyphicon glyphicon-calendar" aria-hidden="true"></span> ' + dates + '</div>';			  
			$('#event-info').html(eventinfo);
			eventdata = json.event;
			console.log('event loaded');
			
			//insert event logo
			var logo = '<img alt="logo" src="' + assetspath + 'uploads/events/' + eventdata.logo + '" />';
			$('#logo').html(logo);
			
			
			//event itinerary
			itinerary = json.event.stagelist.stage;
			var active='';
			var stages='<span>СЕ: </span>';
			for(var i=0; i < itinerary.length; i++) {
				if (itinerary[i].type=='stage') {	
					stages = stages + '<button type="button" class="single_stage stageselector" id="stage' + itinerary[i].number +'">' + itinerary[i].number + '</button>';
					itinerarystages[itinerary[i].number] = itinerary[i];
				}
				else {
					stages = stages + '<span class="single_stage service"><span class="glyphicon glyphicon-wrench"></span></span>';
				}
			}  
					
			$('#stage-select').html(stages);
			console.log('stages loaded');
			
			//render the HTML for the itinerary section and append it to the container
			//renderItinerary();
			
			//onclick functions
			$('.stageselector').on('click', function(){
				var stageno=this.id;
				stageno=stageno.replace("stage","");
				filterResutls(stageno, champ, group);
				$('.stageselector').removeClass("active");
				$(this).addClass("active");
			});
			
			/*$('.stageselector').on('tap', function(){
			 console.log('tap:'+this.id);
			 filterResutls(this.id, champ, group)
			});*/
			
			//event championships
			championships = json.event.champlist.champs;
			var champs='<span>Шампионат: </span>';
			var active = '';
			for(var i=0; i < championships.length; i++) {
				if (championships[i].champ=='all') {active = ' active';}
				champs = champs + '<button type="button" class="single_champ champselector' + active + '" id="champ_'+ championships[i].champ +'">' + champnames[championships[i].champ] + '</button>';
				active = '';
			}  
			$('#champ-select').html(champs);
			console.log('championships loaded');
			
			//onclick functions
			$('.champselector').on('click', function(){
				var selectedchamp=this.id;
				selectedchamp=selectedchamp.replace("champ_","");
				filterResutls(stage, selectedchamp, "");
				$('.champselector').removeClass("active");
				$(this).addClass("active");
			});
			
			
			//event classes
			classlist = json.event.classlist.classes;
			var classes='<span>Клас: </span>';
			for(var i=0; i < classlist.length; i++) {
					if (classlist[i].eventclass=='all') {
					classes = classes + '<button type="button" class="single_class classselector active" id="class_'+ classlist[i].eventclass +'">Всички</button>';
					}
					else {
					classes = classes + '<button type="button" class="single_class classselector' + active + '" id="class_'+ classlist[i].eventclass +'">' + classlist[i].eventclass + '</button>';
					}
			} 
			$('#class-select').html(classes);
			console.log('classes loaded');
			
			//onclick functions
			$('.classselector').on('click', function(){
				var selectedclass=this.id;
				selectedclass=selectedclass.replace("class_","");
					if (selectedclass=='all') 
						{
							filterResutls(stage, "all", "");
							$('.champselector').removeClass("active");
							$('#champ_all').addClass("active");
						}
					else {filterResutls(stage, "class", selectedclass);}
				$('.classselector').removeClass("active");
				$(this).addClass("active");
			});
			
			//show filters
			$('#filters').removeClass("hidden");
			
			//calculate current stage
			currentStage();
			
			//render itinerary
			renderItinerary();
			
			//get inital results for the current live stage (or last stage if event is finished)
			getresults(stage, champ, group);
			
			//load entries
			getentries();
			
			//load Flashnews
			loadFlashnews();
			
		},
		error: function() {
			//header, stage selectors, stage info, itinerary errors - set placeholder so it looks nice if errors occur!!! 
			$('#error').html('<div class="bs-callout bs-callout-danger"><p>Възникна грешка при зареждане на резултатите. Моля, опитайте да презаредите страницата.</p><button type="button" class="btn btn-danger" onClick="window.location.reload();">Презареди  <span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button></div>');
			console.log('error loading event');
		}
	});				
}

//Load stage times
function getresults(stage, champ, group)
{
	var stagenumber=stage;
	if (stage < 10) {
		stage = '0' + stage;
	}
	
	//Get stage results
	var urlstage = path + eventdata.id + '/stage_' + stage + '_' + champ + '_' + group + '.json?callback=?';
	
	$.jsonp({
		url: urlstage,
		callback: "callback",
		success: function(json) {
		   var stageresults='<h3>Резултати от СЕ'+stage+'</h3><div class="table-responsive"><table class="table table-striped results"><thead><tr><th class="center">Поз.</th><th class="center">№</th><th>Пилот<br />Навигатор</th><th>Автомобил<br />Клас</th><th class="center">Време СЕ<br />[ср. скор.]</th><th class="center">първи<br />пред.</th></tr></thead><tbody>';
			
			if ($.isEmptyObject(json)) {
				stageresults='<h3>Резултати от СЕ'+stage+'</h3><div>Все още няма данни за етапа.</div>';
				$('#stageresults').html(stageresults);
				console.log('results loaded from url:' + urlstage);
			}
			
			else {
			  if (json.result.length) {
				$.each(json.result, function(key, val){
					stageresults = stageresults + '<tr><td class="center">' + val.position + '</td><td class="center">' + val.number + '<br /><img src="images/' + val.drivernat + '.gif" alt="flag" /></td><td class="crew">' + val.driver + '<br />' + val.codriver + '</td><td>' + val.car + '<br />' + val.class + '</td><td class="center">' + val.stagetime + '<br />[' + val.speed + ']</td><td class="center">' + val.difffirst + '<br />' + val.diffprev + '</td></tr>';
				})
			  }
			  
			  else {
				stageresults = stageresults + '<tr><td class="center">' + json.result.position + '</td><td class="center">' + json.result.number + '<br /><img src="images/' + json.result.drivernat + '.gif" alt="flag" /></td><td class="crew">' + json.result.driver + '<br />' + json.result.codriver + '</td><td>' + json.result.car + '<br />' + json.result.class + '</td><td class="center">' + json.result.stagetime + '<br />[' + json.result.speed + ']</td><td></td></tr>';
			  }
			  stageresults = stageresults + '</tbody></table></div>';
			  
			  $('#stageresults').html(stageresults);
			  result=json;
			  $('#result_error').html('');			  
			  console.log('results loaded from url:' + urlstage);
			}
		},
		error: function() {
		   if(loadcount==0) {
			   $('#stageresults').html('<h3>Резултати от СЕ'+stage+'</h3><div class="bs-callout bs-callout-danger">Възникна грешка при зареждане на резултатите. Моля опитайте да презаредите страницата.</div>');
		   }
		   
		   if(loadcount>0) {
			   $('#result_error').html('<div class="bs-callout bs-callout-danger"><p>Възникна грешка при обновяване на резултатите. След 60 секунди ще бъде направен повторен опит за зареждане на данните.</p></div>');
		   }
		   
		   console.log('error loading results from url:' + urlstage);
		}
	});	
	
	//Get after stage results
	var urlstageafter = path + eventdata.id + '/stage_after_' + stage + '_' + champ + '_' + group + '.json?callback=?';
	
	$.jsonp({
		url: urlstageafter,
		callback: "callback",
		success: function(json) {
		   var stageresults='<h3>Резултати след СЕ'+stage+'</h3><div class="table-responsive"><table class="table table-striped results"><thead><tr><th class="center">Поз.</th><th class="center">№</th><th>Пилот<br />Навигатор</th><th>Автомобил<br />Клас</th><th class="center">Време СЕ<br />[наказания]</th><th class="center">Общо време</th><th class="center">първи<br />пред.</th></tr></thead><tbody>';
			  
			  if ($.isEmptyObject(json)) {
				stageresults='<h3>Резултати след СЕ'+stage+'</h3><div>Все още няма данни за етапа.</div>';
				$('#stageafter').html(stageresults);
				console.log('results after loaded from url:' + urlstageafter);
			  }
			  
			  else {
				  if (json.result.length) {
					$.each(json.result, function(key, val){
						stageresults = stageresults + '<tr><td class="center">' + val.position + '</td><td class="center">' + val.number + '<br /><img src="images/' + val.drivernat + '.gif" alt="flag" /></td><td class="crew">' + val.driver + '<br />' + val.codriver + '</td><td>' + val.car + '<br />' + val.class + '</td><td class="center">' + val.stagetime + '<br />[' + val.penalties + ']</td><td class="center">' + val.totaltime + '</td><td class="center">' + val.difffirst + '<br />' + val.diffprev + '</td></tr>';
					})
				  }
				  
				  else {
					stageresults = stageresults + '<tr><td class="center">' + json.result.position + '</td><td class="center">' + json.result.number + '<br /><img src="images/' + json.result.drivernat + '.gif" alt="flag" /></td><td class="crew">' + json.result.driver + '<br />' + json.result.codriver + '</td><td>' + json.result.car + '<br />' + json.result.class + '</td><td class="center">' + json.result.stagetime + '<br />[' + json.result.penalties + ']</td><td class="center">' + json.result.totaltime + '</td><td></td></tr>';
				  }
				  stageresults = stageresults + '</tbody></table></div>';
				  $('#stageafter').html(stageresults);
				  resultafter=json;
				  $('#result_error').html('');				  
				  console.log('results after loaded from url:' + urlstageafter);
			  }
		},
		error: function() {
			if(loadcount==0) {
			   $('#stageafter').html('<h3>Резултати след СЕ'+stage+'</h3><div class="bs-callout bs-callout-danger">Възникна грешка при зареждане на резултатите. Моля опитайте да презаредите страницата.</div>');
		   }
		   
		   if(loadcount>0) {
			   $('#result_error').html('<div class="bs-callout bs-callout-danger"><p>Възникна грешка при обновяване на резултатите. След 60 секунди ще бъде направен повторен опит за зареждане на данните.</p></div>');
		   }
		   console.log('error loading results after from url:' + urlstageafter);
		}
	});	
	
	//Get stage DNF information
	var urlstagednf = path + eventdata.id + '/stage_dnf_' + stage + '_' + champ + '_' + group + '.json?callback=?';
	
	$.jsonp({
		url: urlstagednf,
		callback: "callback",
		success: function(json) {
		   var stageresults='<h3>Не финиширали СЕ'+stage+'</h3><div class="table-responsive"><table class="table table-striped results"><thead><tr><th>№</th><th>Пилот</th><th>Навигатор</th><th>Отбор</th><th>Автомобил</th></tr></thead><tbody>';
			
			if ($.isEmptyObject(json)) {
				stageresults='';
				$('#stagednf').html(stageresults);
				console.log('results dnf loaded from url:' + urlstagednf);
			}

			else {
				if (json.result.length) {
					$.each(json.result, function(key, val){
						stageresults = stageresults + '<tr><td class="number">' + val.number + '</td><td class="driver">' + val.driver + ' [' + val.drivernat + ']</td><td class="codriver">' + val.codriver + ' [' + val.codrivernat + ']</td><td>' + val.entrant + '</td><td>' + val.car + '</td></tr>';
					})
				  }
				  
				  else {
					stageresults = stageresults + '<tr><td class="number">' + json.result.number + '</td><td class="driver">' + json.result.driver + ' [' + json.result.drivernat + ']</td><td class="codriver">' + json.result.codriver + ' [' + json.result.codrivernat + ']</td><td>' + json.result.entrant + '</td><td>' + json.result.car + '</td></tr>';
				  }
				  stageresults = stageresults + '</tbody></table></div><div class="small-text">*В тази таблица са поместени екипажите които са стартирали в отсечката но все още не са финиширали. </div>';
				  $('#stagednf').html(stageresults);
				  resultdnf=json; 
				console.log('results dnf loaded from url:' + urlstagednf);
			}
		},
		error: function() {
		   console.log('error loading results dnf from url:' + urlstagednf);
		}
	});	
	
	if (champ=='class') {champ='all';} //reset value to normal
	
	updateStage(stagenumber);
}

//apply filter and get results
function filterResutls(newstage, newchamp, newgroup)
{
	stage = newstage;
	champ = newchamp;
	group = newgroup;
	loadcount=0;
	getresults(stage, newchamp, newgroup);
}

function refreshResults() 
{
	loadcount +=1;	
	getresults(stage, champ, group);
}

//update stage info
function updateStage(stage)
{
	$('#currentchamp').html(champnames[champ]);
	
	if (group=='all' || group=="") {$('#currentclass').html("всички");}
	else {$('#currentclass').html(group);}
	
	$('#currentstage').html(stage);
	$('#currentstagename').html(itinerarystages[stage].name);
	$('#currentstagelength').html(itinerarystages[stage].length);
}

//Get current event time and proceed with event loading
function initialLoad()
{
	$.jsonp({
		url: path + "time.php", 
		callback: "callback",
		success: function(json) {
			time=json.time;
			console.log('Time successfully loaded from server');
			currentStage();
			loadEvent();
			timeDisplay();
		},
		error: function() {
			timeBackup();
			console.log('Error loading time from server. Switched to backup');
			currentStage();
			loadEvent();
			timeDisplay();
			
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
	
	$('#stage'+stage).addClass("active");
}

//Get entries, render html and append it to container
function getentries()
{
	var url = path + eventdata.id + '/entries.json?callback=?';

	$.jsonp({
		url: url,
		callback: "callback",
		success: function(json) {
		   var entries='<table class="table table-striped table-responsive"><thead><tr><th>№</th><th>Отбор</th><th>Пилот<br />Навигатор</th><th>Автомобил</th><th>Клас</th></tr></thead><tbody>';
			  $.each(json.entry, function(key, val){
				entries = entries + '<tr><td>' + val.number + '</td><td>' + val.entrant + '</td><td>' + val.driver + '<br />' + val.codriver + '</td><td>' + val.car + '</td><td>' + val.class + '</td></tr>';
				evententries[val.number]=val;
			  })
			entries = entries + '</tbody></table>';
			$('#entries').html(entries);
			
			//load Retired
			loadRetired();
			
			//load Retired
			loadPenalties();
		},
		error: function() {
		   $('#entries').html('<div class="bs-callout bs-callout-danger">Възникна грешка при зареждане на заявките. Моля опитайте да презаредите страницата.</div>');
		   $('#retired').html('<div class="bs-callout bs-callout-danger">Възникна грешка при зареждане на списъка с отпаднали екипажи. Моля опитайте да презаредите страницата.</div>');
		   $('#penalties').html('<div class="bs-callout bs-callout-danger">Възникна грешка при зареждане на наказанията. Моля опитайте да презаредите страницата.</div>');
		   console.log('error loading entries');
		}
	});

}

//render the HTML for the itinerary section and append it to the container
function renderItinerary()
{
	var itineraryhtml='<table class="table table-striped"><thead><tr><th class="center">Статус</th><th class="center">Етап</th><th>Име</th><th class="center">Дължина</th><th class="center">Начало</th></tr></thead><tbody>';
	for(var i=0; i < itinerary.length; i++) {
		if (itinerary[i].type=='stage') {	
			var stageStatus = checkStage(itinerary[i].start);
			itineraryhtml = itineraryhtml + '<tr><td class="center"><span class="' + stageStatus + '"></span></td><td class="center">СЕ' + itinerary[i].number + '</td><td>' + itinerary[i].name + '</td><td class="center">' + itinerary[i].length + ' км.</td><td class="center">' + itinerary[i].start.substr(11, 5) + '</td></tr>';

		}
		else {
			var stageStatus = checkStage(itinerary[i].start);
			itineraryhtml = itineraryhtml + '<tr><td class="center"><span class="service ' + stageStatus + '"></span></td><td></td><td>' + itinerary[i].name + '</td><td class="center">' + itinerary[i].length + ' мин.</td><td class="center">' + itinerary[i].start.substr(11, 5) + '</td></tr>';
		}
	}  
	itineraryhtml = itineraryhtml + '</tbody></table>';
	$('#itinerary').html(itineraryhtml);
}

//check if stage is already started
function checkStage(sstime) 
{
	if (time>=sstime) {return 'started';}
	else {return 'notstarted';}
}

//Load flashnews
function loadFlashnews() 
{
	var flashurl = path + eventdata.id + '/flashnews.json?callback=?';

	$.jsonp({
		url: flashurl,
		callback: "callback",
		success: function(json) {
		   var flashnews='<h3>Флаш новини</h3><div class="list-group">';
		   
		   if ($.isEmptyObject(json)) {
				flashnews=flashnews+'Няма въведени новини</div>';
				$('#flashnews').html(flashnews);
				console.log('flashnews loaded from url:' + flashurl);
			}

			else {
				if (json.flash.length) {
					$.each(json.flash, function(key, val){
						flashnews = flashnews + '<a class="list-group-item"><p class="list-group-item-heading">' + val.place + '    <span class="badge">' + val.time + '</span></p><p class="list-group-item-text">' + val.description + '</p></a>';
					})
				  }
				  
				  else {
                    flashnews = flashnews + '<a class="list-group-item"><p class="list-group-item-heading">' +json.flash.place + '    <span class="badge">' + json.flash.time + '</span></p><p class="list-group-item-text">' + json.flash.description + '</p></a>';
				  }
				  
				  flashnews = flashnews + '</div>';
				  $('#flashnews').html(flashnews);
				  flashnews=json; 
				console.log('flashnews loaded from url:' + flashurl);
			}
		   
			  
		},
		error: function() {
		   console.log('error loading flashnews');
		}
	});

}

//Load retired crews
function loadRetired() 
{
	var retiredurl = path + eventdata.id + '/retired.json?callback=?';

	$.jsonp({
		url: retiredurl,
		callback: "callback",
		success: function(json) {
		   var retired='<table class="table table-striped table-responsive"><thead><tr><th>№</th><th>Отбор</th><th>Пилот<br />Навигатор</th><th>Автомобил</th><th>Място</th><th>Причина</th></tr></thead><tbody>';
		   
		   if ($.isEmptyObject(json)) {
				retired=retired+'<tr><td colspan="6">Няма въведени данни</td></tr></tbody></table>';
				$('#retired').html(retired);
				console.log('retired loaded from url:' + retiredurl);
			}

			else {
				if (json.retire.length) {
					$.each(json.retire, function(key, val){
						retired = retired + '<tr><td>' + val.number + '</td><td>' + evententries[val.number].entrant + '</td><td>' + evententries[val.number].driver + '<br />' + evententries[val.number].codriver + '</td><td>' + evententries[val.number].car + '</td><td>' + val.location + '</td><td>' + val.reason + '</td></tr>';
					})
				  }
				  
				  else {
					retired = retired + '<tr><td>' + json.retire.number + '</td><td>' + evententries[json.retire.number].entrant + '</td><td>' + evententries[json.retire.number].driver + '<br />' + evententries[json.retire.number].codriver + '</td><td>' + evententries[json.retire.number].car + '</td><td>' + json.retire.location + '</td><td>' + json.retire.reason + '</td></tr>';
				  }
				  
				  retired = retired + '</tbody></table>';
				  $('#retired').html(retired);
				  retired=json; 
				console.log('retired loaded from url:' + retiredurl);
			}
		   
			  
		},
		error: function() {
			$('#retired').html('<div class="error">Възникна грешка при зареждане на отпадналите екипажи. Моля опитайте да презаредите страницата.</div>');
		   console.log('Error loading retired');
		}
	});

}

//Load penalties
function loadPenalties() 
{
	var penaltiesurl = path + eventdata.id + '/penalties.json?callback=?';

	$.jsonp({
		url: penaltiesurl,
		callback: "callback",
		success: function(json) {
		   var penalties='<table class="table table-striped table-responsive"><thead><tr><th>№</th><th>Пилот<br />Навигатор</th><th>Автомобил</th><th>Контрола</th><th>Причина</th><th>Наказание</th></tr></thead><tbody>';
		   
		   if ($.isEmptyObject(json)) {
				penalties=penalties+'<tr><td colspan="6">Няма въведени данни</td></tr></tbody></table>';
				$('#penalties').html(penalties);
				console.log('penalties loaded from url:' + penaltiesurl);
			}

			else {
				if (json.penalty.length) {
					$.each(json.penalty, function(key, val){
						penalties = penalties + '<tr><td>' + val.number + '</td><td>' + evententries[val.number].driver + '<br />' + evententries[val.number].codriver + '</td><td>' + evententries[val.number].car + '</td><td>' + val.location + '</td><td>' + val.reason + '</td><td>' + val.time + '</td></tr>';
					})
				  }
				  
				  else {
					penalties = penalties + '<tr><td>' + json.penalty.number + '</td><td>' + evententries[json.penalty.number].driver + '<br />' + evententries[json.penalty.number].codriver + '</td><td>' + evententries[json.penalty.number].car + '</td><td>' + json.penalty.location + '</td><td>' + json.penalty.reason + '</td><td>' + json.penalty.time + '</td></tr>';
				  }
				  
				  penalties = penalties + '</tbody></table>';
				  $('#penalties').html(penalties);
				  penalties=json; 
				console.log('penalties loaded from url:' + penaltiesurl);
			}
		   
			  
		},
		error: function() {
			$('#penalties').html('<div class="error">Възникна грешка при зареждане на наказанията. Моля опитайте да презаредите страницата.</div>');
		   console.log('Error loading penalties');
		}
	});

}

//Watch ticker
 function timeDisplay() {
	 timer=time.substr(11,8);
	 $("#watch").html(timer);
     window.setInterval("clockUpdate()", 1000);
 }
 
 function clockUpdate() {

	oldtime = timer.split(":");
	s++;
	i = 0;
	H=0;

	sec = parseInt(oldtime[2]) + s;
	while (sec >= 60)
	{
		sec -= 60;
		i++;
	}
	m = parseInt(oldtime[1]) + i;
	while (m >= 60)
	{
		m -= 60;
		H++;
	}
	hr = parseInt(oldtime[0]) + H;
	while (hr >= 24)
	{
		hr -= 24;
	}

	hr = (hr < 0 ? 24 + hr : hr);

	hr = (hr < 10 ? "0" + hr : hr);
	m = (m < 10 ? "0" + m : m);
	sec = (sec < 10 ? "0" + sec : sec);

	$("#watch").html(hr + ":" + m + ":" + sec);
}


//Time backup function - triggerd if ajax fails
function timeBackup() {
	var d = new Date();
	//H = 2;
	d = convertDateToUTC(d);
	d = d.addHours(2);
	var month = d.getMonth()+1; //1-12
		if (month < 10) {month = '0' + month;} //01 - 12
	var day = d.getDate(); //1-31
		if (day < 10) {day = '0' + day;} //01 - 31
	var hours = d.getHours(); //0-23
		if (hours < 10) {hours = '0' + hours;}
	var minutes = d.getMinutes(); //0-59
		if (minutes < 10) {minutes = '0' + minutes;}
	var seconds = d.getSeconds(); //0-59
		if (seconds < 10) {seconds = '0' + seconds;}
	time=d.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

function createDateAsUTC(date) {
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

function convertDateToUTC(date) { 
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()); 
}

Date.prototype.addHours = function(h) {    
   this.setTime(this.getTime() + (h*60*60*1000)); 
   return this;   
}