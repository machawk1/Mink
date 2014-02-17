function renderChart() {
 var svg = dimple.newSvg("#datepickerContainer", 590, 400);
	var data = d3.csv.parse(d3.select('#csvdata').text());

        var myChart = new dimple.chart(svg, data);
        myChart.setBounds(60, 30, 505, 305)
        var x = myChart.addCategoryAxis("x", "Month");
        x.addOrderRule("Date");
        myChart.addMeasureAxis("y", "Unit Sales");
        myChart.addSeries("Channel", dimple.plot.bubble);
        myChart.addLegend(180, 10, 360, 20, "right");
        myChart.draw();
}