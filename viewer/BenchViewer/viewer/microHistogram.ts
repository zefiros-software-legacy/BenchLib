
module BenchViewer.Core
{
    export class MicroHistogram
    {
        constructor(public samples)
        {
            
        }

        renderTo(element: JQuery)
        {
            element.highcharts({
                chart: {
                    type: "histogram",
                    reflow: true
                },
                title: {
                    text: "Recent Histogram"
                },
                plotOptions: {
                    column: {
                        pointPadding: 0,
                        borderWidth: 0,
                        groupPadding: 0,
                        shadow: false
                    }
                },
                legend: {
                    enabled: false
                },
                yAxis: {
                    title: {
                        text: "Frequency"
                    }
                },
                xAxis: {
                    title: {
                        text: "Time (ms)"
                    }
                },
                series: [{
                    name: "Frequency",
                    data: this.samples
                }]

            });
        }
    }
} 