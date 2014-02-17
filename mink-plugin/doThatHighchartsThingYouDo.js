function doThatHighchartsThingYouDo(){

    Highcharts.data({
        csv: document.getElementById('tsv').innerHTML,
        itemDelimiter: '\t',
        parsed: function (columns) {
			
			var years = {},
				yearsData = [],
				months = {},
				drilldownSeries = [];
			
            // Give + 1 for each instance
            columns[1] = $.map(columns[1], function (value) {
                return 1;
            });

            $.each(columns[0], function (i, yearmonth) {
                var year,
                    month;

                if (i > 0) {
                    var ymAry = yearmonth.split(' ');
					year = ymAry[0];
					month = ymAry[1];
					console.log("year = Y"+year+"Y    month = X"+month+"X");
					
                    // Create the main data
                    if (!years[year]) {
                        years[year] = columns[1][i];
                    } else {
                        years[year] += columns[1][i];
                    }

                    // Create the version data
                    if (month !== null) {
                        if (!months[year]) {
                            months[year] = [];
                        }
                        months[year].push([month, columns[1][i]]);
                    }
                }
                
            });

            $.each(years, function (name, y) {
                yearsData.push({ 
                    name: name, 
                    y: y,
                    drilldown: months[name] ? name : null
                });
            });
            $.each(months, function (key, value) {
            	//console.log("KEY: "+key+"   value: "+value);
            	//var
                drilldownSeries.push({
                    name: key,
                    id: key,
                    data: value
                });
            });

            // Create the chart
            $('#container').highcharts({
                chart: {
                    type: 'column'
                },
                title: {
                    text: 'Mementos for XXXXURI-M HEREXXXXXXX'
                },
                subtitle: {
                    text: 'Click the columns to view mementos by month within the year. '
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'Number of Mementos',
                    },
                    allowDecimals: false
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        dataLabels: {
                            enabled: true
                        }
                    }
                },

                tooltip: {
                    pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y} memento(s)</b><br/>'
                }, 

                series: [{
                    name: 'Years',
                    colorByPoint: true,
                    data: yearsData
                }],
                drilldown: {
                    series: drilldownSeries
                }
            })

        }
    });
}
    
