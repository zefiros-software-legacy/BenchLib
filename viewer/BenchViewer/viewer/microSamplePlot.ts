
module BenchViewer
{
    export class MicroSamplePlot
    {
        constructor(public series)
        {

        }

        renderTo(element: JQuery)
        {
            element.highcharts({
                chart: {
                    type: "line"
                },
                title: {
                    text: ""
                },
                xAxis: {
                    title: {
                        text: "Sample No."
                    }
                },
                yAxis: {
                    title: {
                        text: "Time (ms)"
                    }
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: false
                        }
                    }
                },
                series: this.series
            });
        }
    }
} 