/**
 * Histogram extension for highcharts Javascript graph library
 * https://github.com/ulo/highcharts-histogram
 * 
 * (c) 2014 Ulrich Omasits
 */

(function (H) {
    H.wrap(H.Chart.prototype, 'init', function (proceed, userOptions, callback) {
        if (userOptions.chart.type.toLowerCase() !== 'histogram')
            return proceed.apply(this, [userOptions, callback]);
        
        // code before the original init function
        var data = userOptions.series[0].data;
        var n = data.length;
        var binCountSturges = Math.ceil( Math.log(n) / Math.LN2 + 1 );; // optimal # bins, Sturges' formula
        min = Number.MAX_VALUE;
        max = Number.MIN_VALUE;
        for (var i=0; i<n; i++) {
            min = Math.min(min, data[i]);
            max = Math.max(max, data[i]);
        }
        var binWidthSturges = (max - min) / binCountSturges; // ideal bin width
        var binWidth = normalizeTickInterval(binWidthSturges, null, getMagnitude(binWidthSturges)); // normalized bin width
        var bins = Highcharts.Axis.prototype.getLinearTickPositions(binWidth, min, max);
        var binCount = bins.length-1; // actual number of bins
        var binLow = bins[0];
        var binHigh = bins[binCount];
        
        var binData = new Array(binCount);
        for (var bin=0; bin<binCount; bin++) { 
            binData[bin] = 0; 
        }
        
        var a = binCount / (binHigh - binLow);
        var b = binLow * binCount / (binHigh - binLow);
        for (var i=0; i<n; i++) {
            var bin = Math.min(Math.floor( a * data[i] - b ), binCount-1);
            binData[bin]++;
        }
        
        var options = H.merge(
            { // default settings
                yAxis: { title: { text: 'count' } },
                plotOptions: { column: { pointPadding: 0, groupPadding: 0, borderWidth: 1, pointInterval: binWidth, pointStart: binLow+binWidth/2, stacking: 'normal' } },
                tooltip: { formatter: function() {
                    var upperBoundSymbol = (this.point.histBin === this.series.data.length-1) ? '≤' : '<';
                    return this.point.histFrom+'≤x'+upperBoundSymbol+this.point.histTo+'<br/>n=<b>'+this.y+'</b>';
                }}
            },
            userOptions, // user settings
            { // fixed settings
                chart: { type: 'column' },
                xAxis: {startOnTick: true, endOnTick: true},
                series: [{ data: binData }]
            }
        );
        
        // call the internal graph.init function
        proceed.apply(this, [options, callback]);
        
        // code after the original init function
        this.series[0].data.forEach( function(d, i) {
            d.histBin = i;
            d.histFrom = Number((d.x - binWidth/2).toFixed(12));
            d.histTo = Number((d.x + binWidth/2).toFixed(12));
        });
    });
    
    /*********************************************************
    * helper functions copied from Highcharts source code
    */
    var UNDEFINED, math = Math, mathFloor = math.floor;

    /**
     * Get the magnitude of a number
     */
    function getMagnitude(num) {
        return math.pow(10, mathFloor(math.log(num) / math.LN10));
    };

    /**
     * Return the first value that is defined. Like MooTools' $.pick.
     */
    function pick() {
        var args = arguments,
            i,
            arg,
            length = args.length;
        for (i = 0; i < length; i++) {
            arg = args[i];
            if (arg !== UNDEFINED && arg !== null) {
                return arg;
            }
        }
    };

    /**
     * Take an interval and normalize it to multiples of 1, 2, 2.5 and 5
     * @param {Number} interval
     * @param {Array} multiples
     * @param {Number} magnitude
     * @param {Object} options
     */
    function normalizeTickInterval(interval, multiples, magnitude, options) {
        var normalized, i;

        // round to a tenfold of 1, 2, 2.5 or 5
        magnitude = pick(magnitude, 1);
        normalized = interval / magnitude;

        // multiples for a linear scale
        if (!multiples) {
            multiples = [1, 2, 2.5, 5, 10];

            // the allowDecimals option
            if (options && options.allowDecimals === false) {
                if (magnitude === 1) {
                    multiples = [1, 2, 5, 10];
                } else if (magnitude <= 0.1) {
                    multiples = [1 / magnitude];
                }
            }
        }

        // normalize the interval to the nearest multiple
        for (i = 0; i < multiples.length; i++) {
            interval = multiples[i];
            if (normalized <= (multiples[i] + (multiples[i + 1] || multiples[i])) / 2) {
                break;
            }
        }

        // multiply back to the correct magnitude
        interval *= magnitude;

        return interval;
    };
}(Highcharts));
