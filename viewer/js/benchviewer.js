function AddGroup( benchmarks, group )
{
	if ( typeof benchmarks.groups[ group ] === "undefined" )
	{
		benchmarks.groupNames.push( group );
		
		benchmarks.groups[ group ] = {};
		benchmarks.groups[ group ].micro = {};
		benchmarks.groups[ group ].variant = {};
		benchmarks.groups[ group ].advanced = {};
	}
}

function AddMicroBenchmark( benchmarks, group, name, benchmark, completed, mode, date )
{
	if ( typeof benchmarks.groups[ group ].micro[ name ] === "undefined" )
	{
		benchmarks.groups[ group ].micro[ name ] = [];
	}
	
	var micros = benchmarks.groups[ group ].micro[ name ];
	var index = micros.length;
	micros.push({
			"benchmark" : benchmark,
			"completed" : completed,
			"mode" : mode,
			"date" : date,
			"index" : index,
			"serie" : IndexToSeries( index )
			});
}

function ParseMicroBenchmarks( benchmarks, microBenchmarks, date, mode )
{
	for ( var i = 0; i < microBenchmarks.failed.length; ++i )
	{
		var benchmark = microBenchmarks.failed[i];
		AddMicroBenchmark( benchmarks, benchmark.group, benchmark.name, null, false, mode, date );
	}
	
	for ( var i = 0; i < microBenchmarks.completed.length; ++i )
	{
		var benchmark = microBenchmarks.completed[i];
		
		var micro = {}
		micro.group = benchmark.group;
		micro.name = benchmark.name;
		micro.corrected = {
				"average" : benchmark.corrected.average,
				"standardDeviation" : benchmark.corrected.standardDeviation,
				"variance" : benchmark.corrected.variance,
				"low" : benchmark.corrected.low,
				"high" : benchmark.corrected.high,
				"values" : benchmark.corrected.values
				};
		micro.raw = {
				"average" : benchmark.raw.average,
				"standardDeviation" : benchmark.raw.standardDeviation,
				"variance" : benchmark.raw.variance,
				"low" : benchmark.raw.low,
				"high" : benchmark.raw.high,
				"values" : benchmark.raw.values
				};
		micro.baseline = {
			"average" : benchmark.baseline.average,
				"standardDeviation" : benchmark.baseline.standardDeviation,
				"variance" : benchmark.baseline.variance,
				"low" : benchmark.baseline.low,
				"high" : benchmark.baseline.high,
				"values" : benchmark.baseline.values
			}
			
		AddMicroBenchmark( benchmarks, benchmark.group, benchmark.name, micro, true, mode, date );
	}
}
	
function RenderPages( benchmarks )
{	
	for (var i = 0, size = benchmarks.groupNames.length; i < size; ++i )
	{
		var group = benchmarks.groupNames[i];
		
		var groupDiv = $( "<div>" );
		groupDiv.attr( "id", group );
		
		var groupHeader = $( "<h1>" );
		groupHeader.html( group );
		
		groupDiv.append( groupHeader );
	
		RenderMicroBenchmarks( benchmarks, groupDiv, group );
		
		$( "#content" ).append( groupDiv );
	}
	
	$( ".contentTabs" ).each(function(i) {
		$(this).tabs({
			activate: $( this ).data("activatePlotEvent")
			});
		});
		
	$( "#tabs" ).tabs({
			activate: (function( event, ui ){
				RerenderAllPlots();
				})
			});
}

function RenderMenu( benchmarks )
{		
	for (var i = 0, size = benchmarks.groupNames.length; i < size; ++i )
	{
		var group = benchmarks.groupNames[i];
		
		var nameUl = $( "<ul>" );
		var nameCount = 0;
		var succeedCount = 0;
		
		var microBenchmarks = GetMicroBenchmarks( benchmarks, group );
		for ( var name in microBenchmarks )
		{	
			if ( microBenchmarks.hasOwnProperty( name ) )
			{
				var micros = microBenchmarks[ name ];
				
				var nameLi = $( "<li>" );
				
				var nameDiv = $( "<div>" )
				nameDiv.addClass( "benchmarkName" );
				
				var indicator = $( "<span>" );
				indicator.html( "&mu;" );
				indicator.addClass( "benchmarkInd" );
				indicator.attr( "title", "Micro benchmark" );
				
				nameDiv.append( indicator );
				
				var nameLink = $( "<a>" );
				nameLink.html( name );
				nameLink.addClass( "nameLink" );
				nameLink.attr( "title", name );
				nameLink.click( {id : "#" + group + name }, (function( event ){
						$(document).scrollTop( $( event.data.id ).offset().top - 50 ); 
					}));
				
				nameDiv.append( nameLink );

				var hasCurrent = micros[0].date == benchmarks.currentDate;
				if ( !hasCurrent )
				{
					var hasCurrentCircle = $( "<span>" );
					hasCurrentCircle.addClass( "circle black" );
					hasCurrentCircle.attr( "title", "No recent benchmark" );
					nameDiv.append( hasCurrentCircle );
				}
				else
				{
					var hasCompleted = micros[0].completed;
					
					if ( hasCompleted )
					{
						++succeedCount;
					}
					
					var colour = "green";
					var tooltip = "Benchmark completed";
					if ( !hasCompleted )
					{
						colour = "red";
						tooltip = "Benchmark failed";
					}
					
					var hasCompletedCircle = $( "<span>" );
					hasCompletedCircle.addClass( "circle " + colour );
					hasCompletedCircle.attr( "title", tooltip );
					nameDiv.append( hasCompletedCircle );
				}
				
				nameLi.append( nameDiv );
				
				nameUl.append( nameLi );
				
				++nameCount;
			}
		}
		
		var li = $( "<li>" );
		
		var link = $( "<a>" );
		link.attr( "href", "#" + group );
		
		var groupContainer = $( "<div>" );
		groupContainer.addClass( "groupContainer" );
		
		var a = $( "<a>" );
		a.html( group );
		a.addClass( "left benchGroup" );
		a.attr( "title", group );
		groupContainer.append( a );
		
		var benchCount = $( "<span>" );
		benchCount.html( succeedCount + "/"  + nameCount );
		benchCount.addClass( "right benchCount" );
		
		groupContainer.append( benchCount );
		
		link.append( groupContainer);
		
		if ( nameCount > 0)
		{
			link.append( nameUl );
		}
		
		li.append( link );
		
		$( '#sideMenu>ul' ).append( li );
	}
	
	$("#sideMenu .nameLink, #sideMenu .groupContainer p").dotdotdot({
		wrap : 'letter'
	});
}

function RenderTabbedInformation( id, headers, content )
{
	var contentTabs = $( "<div>" );
	contentTabs.addClass( "contentTabs" );
	
	var tabUl = $( "<ul>" );
	
	for ( var i = 0; i < headers.length; ++i )
	{
		tabUl.append( "<li><a href='#" + id + headers[i] + "'>" + headers[i] + "</li>" );
	}
	contentTabs.append( tabUl );
	
	for ( var i = 0; i < headers.length; ++i )
	{
		var tabContent = content[i];
		
		var div = $( "<div>" );
		div.attr( "id", id + headers[i] );
		
		if( Array.isArray( tabContent ) )
		{
			for ( var j = 0, contentSize = tabContent.length; j < contentSize; ++j )
			{
				div.append( tabContent[j] );
			}
		}
		else
		{
			div.append( tabContent );
		}
		
		contentTabs.append( div );
	}
	
	return contentTabs;
}

var plots = {};

function AddPlot( plots, group )
{
	if ( typeof plots[ group ] === "undefined" )
	{
		plots[ group ] = [];
	}
}


function RenderAllPlots()
{
	for( var group in plots )
	{
		if ( plots.hasOwnProperty( group ) )
		{
			var pagePlots = plots[ group ];
			for ( var i = 0, size = pagePlots.length; i < size; ++i )
			{
				pagePlots[i].render();
			}
		}
	}
}

function RerenderAllPlots( group )
{
	for( var group in plots )
	{
		if ( plots.hasOwnProperty( group ) )
		{
			var pagePlots = plots[ group ];
			for ( var i = 0, size = pagePlots.length; i < size; ++i )
			{
				var chart = pagePlots[i];
				if ( typeof chart.__ReResized === "undefined" )
				{
					chart.resizeTo( 650, 450 );
					chart.__ReResized = true;
				}
			}
		}
	}
}

function RenderMicroBenchmarkBoxplot( micros, type, title )
{
	var categories = [];
	
	var datasets = [];
	
	var data = [];
	for ( var i = 0, size = micros.length; i < size; ++i )
	{
		var micro = micros[i];
		categories.push( { "label" : micro.serie } );
		if ( micro.completed )
		{
			data.push( { "value" : micro.benchmark[ type ].values.join(",") } );
		}
		else
		{
			data.push( { "value" : "" } );
		}
	}
	
	datasets.push({
			"seriesname": type,
			"upperboxcolor": GetColourFromHSV( 210, 0.7, 0.9 ),
			"lowerboxcolor": GetColourFromHSV( 210, 0.4, 0.9 ),
			"data": data
			});
	
	var chartDiv = $( "<div>" );
	chartDiv.addClass( "chartContainer" );
	
	var chart = new FusionCharts({
		type: "boxandwhisker2d",
		renderAt: chartDiv.get( 0 ),
		width: "650px",
		height: "450px",
		dataFormat: "json",
		dataSource: {
		"chart": {
			"caption": title,
			
			"xAxisName" : "Series",
			"yAxisName" : "Time (ms)",
			
			"animation" : "0",
			"showAlternateHGridColor": "1",
			"canvasBorderAlpha": "50",
			"showvalues": "1",
			"showShadow": "1",
			"adjustDiv" : "1",
			"numdivlines": "3",
			"showborder": "1",
			
			"bgAlpha": "0",
			"showBorder" : "1",
			"borderAlpha": "10",
			
			"showAllOutliers" : "1",
			"showSD" : "1",
			
			"meaniconcolor": "F66B27",
			"meaniconsides": "16",
			"meaniconradius": "3",
			"showMean" : "1",
			
			"valueFontColor" : "000000",
			"valueFontBold" : "1",
			
			"drawMeanConnector" : "1",
			"drawSDConnector" : "1",
			
			"legendBorderAlpha": "10",
			"legendShadow": "0",
			"legendPosition": "right",
			"exportEnabled": "1"
		},
		"categories": [
			{
				"category": categories
			}
		],
		"dataset": datasets
		}
	});
	
	return { "chart" : chart, "div" : chartDiv};
}

function RenderMicroBenchmarkAnalysisPlot( micros, rawType, baselineType, title )
{
	var categories = [];
	
	var datasets = [];
	
	var baseLineData = [];
	var totalData = [];
	for ( var i = 0, size = micros.length; i < size; ++i )
	{
		var micro = micros[i];
		categories.push( { "label" : micro.serie } );
		
		if ( micro.completed )
		{
			totalData.push({
				"value" : micro.benchmark[ rawType ].average,
				"errorvalue": micro.benchmark[ rawType ].standardDeviation,
				});
			baseLineData.push({
				"value" : micro.benchmark[ baselineType ].average,
				"errorvalue": micro.benchmark[ baselineType ].standardDeviation,
				});
		}
		else
		{
			totalData.push({
				"value" : "",
				"errorvalue": "",
				});
			baseLineData.push({
				"value" : "",
				"errorvalue": "",
				});
		}
	}
	
	datasets.push(
			{
			"seriesname": "Total",
			"data": totalData
			},
			{
			"seriesname": "Baseline",
			"data": baseLineData
			}
		);
	
	var chartDiv = $( "<div>" );
	chartDiv.addClass( "chartContainer" );
	
	var chart = new FusionCharts({
		type: "errorbar2D",
		renderAt: chartDiv.get( 0 ),
		width: "650px",
		height: "450px",
		dataFormat: "json",
		dataSource: {
		"chart": {
			"caption": title,
			
			"yAxisName" : "Time (ms)",
			
			"palettecolors" : "#"+GetColourFromHSV( 210, 0.9, 0.9 )+",#"+GetColourFromHSV( 85, 0.9, 0.9 ),
			
			"animation" : "0",
			"showAlternateHGridColor": "1",
			"useplotgradientcolor" : "0",
			"canvasBorderAlpha": "50",
			"showvalues": "1",
			"showShadow": "1",
			"adjustDiv" : "1",
			"numdivlines": "3",
			"showborder": "1",
			
			"bgAlpha": "0",
			"showBorder" : "1",
			"borderAlpha": "10",

			"halferrorbar" : "0",
			
			"errorbarcolor": "F66B27",
			
			"errorBarThickness" : "2",
			"legendBorderAlpha": "10",
			"legendShadow": "0",
			"legendPosition": "right",
			"exportEnabled": "1"
		},
		"categories": [
			{
				"category": categories
			}
		],
		"dataset": datasets
		}
	});
	
	return { "chart" : chart, "div" : chartDiv};
}

function ConnectTabToPlotEvents( tab, plots )
{
	tab.data( 
		"activatePlotEvent", 
		(function( event, ui ){
				var index = ui.newTab.index();
				var plot = plots[index];
				var chart = plot.chart;
				if ( typeof chart.ReResized === "undefined" )
				{
					chart.resizeTo( 650, 450 );
					chart.ReResized = true;
				}
			})
		);
}

function RenderSeries( name, benchmarks )
{
	var rows = [];
	for ( var i = 0, size = benchmarks.length; i < size; ++i )
	{
		var benchmark = benchmarks[i];
		rows.push( [ benchmark.serie, benchmark.date ] );
	}
	
	return RenderTable( "Series", ["Serie","Date"], rows );
}

function RenderMicroBenchmarks( benchmarks, div, group )
{
	var microBenchmarks = GetMicroBenchmarks( benchmarks, group );
	
	if ( Object.keys( microBenchmarks ).length > 0 )
	{
		var typeHeader = $( "<h2>" );
		typeHeader.html( "Micro Benchmarks" );
		div.append( typeHeader );
		
		for ( var name in microBenchmarks )
		{	
			if ( microBenchmarks.hasOwnProperty( name ) )
			{
				var micros = microBenchmarks[ name ];
				var id = group + name;
				
				var container = $( "<div>" );
				container.attr( "id", id );
				
				var header = $( "<h3>" );
				header.html( name );
				container.append( header );
				
				var table = RenderSeries( name, micros );
				
				container.append( table );
				
				var analysisPlot = RenderMicroBenchmarkAnalysisPlot( micros, "raw", "baseline", name + " Results" );
				var correctedPlot = RenderMicroBenchmarkBoxplot( micros, "corrected", name + " Results" );
				var rawPlot = RenderMicroBenchmarkBoxplot( micros, "raw", name + " Results" );
				var baselinePlot = RenderMicroBenchmarkBoxplot( micros, "baseline", name + " Results" );
				
				var tableTabs = RenderTabbedInformation( id,
					[ "Analysis", "Corrected", "Raw", "Baseline"],
					[
						[ analysisPlot.div ],
						[ correctedPlot.div, RenderMicroTable( name, micros, "corrected" ) ],
						[ rawPlot.div, RenderMicroTable( "Raw " + name, micros, "raw" ) ],
						[ baselinePlot.div, RenderMicroTable( "Baseline " + name, micros, "baseline" ) ]
					]);
					
				AddPlot( plots, group );
				
				plots[group].push(analysisPlot.chart, correctedPlot.chart, rawPlot.chart, baselinePlot.chart );
					
				ConnectTabToPlotEvents( tableTabs, [analysisPlot, correctedPlot, rawPlot, baselinePlot] );
				
				container.append( tableTabs );
				div.append( container );
			}
		}
	}
}

function RenderMicroTable( name, micros, type )
{
	var rows = [];
	for ( var i = 0, size = micros.length; i < size; ++i )
	{
		var micro = micros[i];
		
		if ( micro.completed )
		{
			var benchmark = micro.benchmark[ type ];
			rows.push( [ micro.serie, benchmark.average, benchmark.standardDeviation, benchmark.low, benchmark.high, "C" ] );
		}
		else
		{
			rows.push( [ micro.serie, "-", "-", "-", "-", "F" ] );
		}
	}
	
	return RenderTable( name + " Results", ["Serie", "Average (ms)", "SD (ms)", "Low (ms)", "High (ms)", "Status"], rows );
}

function GetMicroBenchmarks( benchmarks, group )
{
	if ( benchmarks.groups.hasOwnProperty( group ) )
	{
		return benchmarks.groups[ group ].micro;
	}
	
	return null;
}

function RenderTable( name, headers, rows )
{
	var table = $( "<table>" );
	table.append( "<caption>" + name + "</caption><tbody>" );

	var htr = $( "<tr>" )
	for ( var i = 0, size = headers.length; i < size; ++i )
	{
		var th = $( "<th>" );
		th.html( headers[i] );
		htr.append( th );
	}
	
	table.append( htr );
	
	for ( var i = 0, size = rows.length; i < size; ++i )
	{
		var tr = $( "<tr>" );
		var row = rows[i];
		
		for ( var j = 0, sizeRow = row.length; j < sizeRow; ++j )
		{			
			var td = $( "<td>" );
			td.html( row[j] );
			tr.append( td );
		}
		table.append( tr );
	}
	table.append( "</tbody>" );
	
	return table;
}

function IndexToSeries( n )
{
	var s = "";
	while(n >= 0)
	{
		s = String.fromCharCode(n % 26 + 'A'.charCodeAt()) + s;
		n = Math.floor(n / 26) - 1;
	}
	return s;
}

function ZipArrays( a, b )
{
	var result = [];
	
	for ( var i = 0, size = a.length; i < size; ++i )
	{
		result[i] = [ a[i], b[i] ];
	}
	
	return result;
}

function GetColourFromHSV( hue, saturation, value )
{
	hdiv60 = hue / 60.0;
	h60smallestZ = Math.floor(hdiv60);

	hi = h60smallestZ % 6;

	//Calculate the values needed to set the red, green and blue values
	f = hdiv60 - h60smallestZ;
	p = value * (1 - saturation);
	q = value * (1 - f * saturation);
	t = value * (1 - (1 - f) * saturation);

	//Create the red, green and blue values
	r = 0, g = 0, b = 0;

	//Set the red, green and blue values
	switch (hi)
	{
	case 0:
		r = value; g = t; b = p;
		break;
	case 1:
		r = q; g = value; b = p;
		break;
	case 2:
		r = p; g = value; b = t;
		break;
	case 3:
		r = p; g = q; b = value;
		break;
	case 4:
		r = t; g = p; b = value;
		break;
	case 5:
		r = value; g = p; b = q;
		break;
	}

	//Translate red, green and blue values from [0,1] to [0,225]
	r = r * 255;
	g = g * 255;
	b = b * 255;

	return RGBToHex( r, g, b );
}

function RGBToHex( r, g, b ) 
{  
	var rgb = 0x1000000 + (b | (g << 8) | (r << 16));
	return rgb.toString(16).slice(1);
}  
	