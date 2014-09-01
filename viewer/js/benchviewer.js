function BenchmarkViewer(ctor)
{
    this.groups = new Map();
    this.data = {};
    this.latestTimestamp = "";

    this.mainPageID = "--main";
    this.subPages = new Map();

    this.BenchmarkViewer = function ()
    {
        AddPages.call(this);
        this.ParseData();
    }

    this.ParseData = function ()
    {
        for (var i = 0; i < this.data.length; ++i)
        {
            var current = this.data[i];

            var timestamp = current.timestamp;

            if (i == 0)
            {
                this.latestTimestamp = timestamp;
            }

            for (var j = 0; j < current.groups.length; ++j)
            {
                var group = current.groups[j];
                if (this.groups.Has(group) !== true)
                {
                    this.groups.Set(group,
                        new Group({
                            "name": group
                        }));
                }
            }

            ParseMicroBenchmarks.call(this, current.micros, timestamp);
        }

        this.groups.Foreach((function (group)
        {
            group.micros.InitBenchmarks();
        }))
    }

    this.Render = function ()
    {
        RenderMenu.call(this);
        RenderPages.call(this);
    }

    var RenderPages = function ()
    {
        var main = $("<div>");
        main.addClass("tab-content");

        this.groups.Foreach(function (group)
        {
            var name = group.name;
            var id = group.id;

            RenderPage.call(this, group, name, id, main);
        });
        $("#main").append(main);
    }

    var RenderMenu = function ()
    {
        var pageUl = $("<ul>");
        pageUl.addClass("nav nav-sidebar");

        this.groups.Foreach(function (group)
        {
            var name = group.name;
            var id = group.id;

            RenderMenuGroup.call(this, group, name, id, pageUl);
        });
        $("#page-navigation").append(pageUl);
    }

    var ParseMicroBenchmarks = function (microBenchmarks, timestamp)
    {
        var failed = [];
        var completed = [];

        if (microBenchmarks.failed)
        {

            for (var i = 0; i < microBenchmarks.failed.length; ++i)
            {
                var benchmark = microBenchmarks.failed[i];
                var groupName = benchmark.group;
                var name = benchmark.name;

                var micro = new MicroBenchmark({
                    "group": groupName,
                    "name": name,
                    "completed": false,
                    "timestamp": timestamp
                });

                var group = this.groups.Get(groupName);
                group.micros.AddBenchmark(micro, name);
            }
        }

        if (microBenchmarks.completed)
        {
            for (var i = 0; i < microBenchmarks.completed.length; ++i)
            {
                var benchmark = microBenchmarks.completed[i];

                var groupName = benchmark.group;
                var name = benchmark.name;

                var micro = new MicroBenchmark({
                    "group": groupName,
                    "name": name,
                    "completed": true,
                    "timestamp": timestamp,

                    "operations": benchmark.operations,
                    "samples": benchmark.samples,

                    "raw": new Data({
                        "raw": benchmark.raw,
                        "samples": benchmark.samples
                    }),
                    "baseline": new Data({
                        "raw": benchmark.baseline,
                        "samples": benchmark.samples
                    })
                });

                var group = this.groups.Get(groupName);
                group.micros.AddBenchmark(micro, name);
            }
        }
    }

    var AddPages = function ()
    {
        var type = Benchmarks.Type.Page;
        var title = "Overview";

        this.subPages.Set(title, new OverviewSubPage({
            "id": Util.ComposeBenchIDFromPage(this.mainPageID, type, title),
            "name": title
        }));

        this.groups.Set("Main", new Group({
            "name": "Main",
            "id": this.mainPageID,
            "subPages": this.subPages
        }));
    }

    var RenderMenuGroup = function (group, name, id, ul)
    {
        var group = new MenuGroup({
            "group": group,
            "element": ul,
            "name": name,
            "id": id
        });
        group.Render();
    }

    var RenderPage = function (group, name, id, ul)
    {
        var page = new Page({
            "group": group,
            "element": ul,
            "name": name,
            "id": id
        });
        page.Render();
    }

    __ConstructObject(this, ctor);
}

function MenuGroup(ctor)
{
    this.group = {};
    this.element = {};
    this.name = "";
    this.id = "#";

    this.li = {};
    this.link = {};
    this.title = {};

    this.subpagesContainer = {};
    this.subpagesUl = {};

    this.totalCount = 0;
    this.successCount = 0;

    this.Render = function ()
    {
        this.li = $("<li>");

        AddPageLink.call(this);

        RenderMenuSubpages.call(this);

        AddCountBadge.call(this);

        this.element.append(this.li);
    }

    var AddPageLink = function ()
    {
        AddLink.call(this);

        AddTitle.call(this);

        this.li.append(this.link);
    }

    var RenderMenuSubpages = function ()
    {
        this.subpagesContainer = $("<div>");
        this.subpagesContainer.addClass("nav-sub-container");

        this.subpagesUl = $("<ul>");
        this.subpagesUl.addClass("nav nav-sub");
        this.subpagesUl.attr("role", "tablist");

        var obj = this;

        this.group.subPages.Foreach((function (page, name)
        {
            var type = Benchmarks.Type.Page;
            var subpage = new MenuSubpage({
                "id": Util.ComposeBenchIDFromPage(obj.id, type, name),
                "element": obj.subpagesUl,
                "type": type,
                "pageName": obj.name,
                "name": name
            });
            subpage.Render();
        }));

        this.totalCount += this.group.micros.all.length;
        this.successCount += this.group.micros.completed.length;

        this.group.micros.all.forEach((function (benchHistory, index, array)
        {
            var lastCompleted = benchHistory.recent;
            var name = lastCompleted.name;
            var type = Benchmarks.Type.Micro;
            var subpage = new MicroMenuSubpage({
                "id": Util.ComposeBenchIDFromPage(obj.id, type, name),
                "completed": lastCompleted.completed,
                "element": obj.subpagesUl,
                "type": type,
                "pageName": obj.name,
                "name": name
            });
            subpage.Render();
        }));

        this.subpagesContainer.append(this.subpagesUl);

        this.li.append(this.subpagesContainer);
    }

    var AddLink = function ()
    {
        this.link = $("<a>");
        this.link.addClass("left benchGroup");
        this.link.attr("title", this.name);
        this.link.attr("href", "#" + this.id);
    }

    var AddTitle = function ()
    {
        this.title = $("<div>");
        this.title.addClass("sub-page-title");
        this.title.html(this.name);

        this.link.html(this.title);
    }

    var AddCountBadge = function ()
    {
        if (this.totalCount > 0)
        {
            var countBadge = $("<span>");
            countBadge.addClass("badge pull-right");
            countBadge.html(this.successCount + " / " + this.totalCount);

            this.link.append(countBadge);
        }
    }

    function MenuSubpage(ctor)
    {
        this.element = {};
        this.type = "";
        this.pageName = "";
        this.name = "";
        this.id = "#";

        this.li = {};
        this.link = {};
        this.title = {};
        this.labels = {};

        this.Render = function ()
        {
            this.li = $("<li>");

            this.AddSubPageLink();

            this.AddLabels();

            this.element.append(this.li);
        }

        this.AddSubPageLink = function ()
        {
            this.AddLink();

            this.AddTitle();

            this.li.append(this.link);
        }

        this.AddLink = function ()
        {
            this.link = $("<a>");
            this.link.attr("title", this.name);
            this.link.attr("href", "#" + this.id);
        }

        this.AddTitle = function ()
        {
            this.title = $("<div>");
            this.title.addClass("sub-page-title");
            this.title.html(this.name);

            this.link.html(this.title);
        }

        this.AddLabels = function ()
        {
            this.labels = $("<div>");
            this.labels.addClass("pull-right label-holder");
            this.link.append(this.labels);
        }

        __ConstructObject(this, ctor);
    }

    function MicroMenuSubpage(ctor)
    {
        MenuSubpage.apply(this);

        this.completed = false;

        this.Render = function ()
        {
            this.li = $("<li>");

            this.AddSubPageLink();

            this.AddLabels();

            this.labels.append(Label.Status(this.completed));

            this.labels.append(Label.Benchmark(this.type));

            this.element.append(this.li);
        }

        __ConstructObject(this, ctor);
    }

    __ConstructObject(this, ctor);
}

function Page(ctor)
{
    this.group = {};
    this.element = {};
    this.name = "";
    this.id = "#";

    this.container = {};

    this.Page = function ()
    {
        this.container = $("<div>");
        this.container.addClass("tab-pane panel panel-default page");
        this.container.attr("id", this.id);

        var header = $("<h1>");
        header.addClass("page-header");
        header.html(this.name);

        this.container.append(header);
    }

    this.Render = function ()
    {
        var obj = this;
        this.group.subPages.Foreach((function (page, name)
        {
            page.RenderTo(obj.container);
        }));

        this.group.micros.all.forEach((function (microHistory)
        {
            var type = Benchmarks.Type.Micro;
            var name = microHistory.recent.name;
            var page = new MicroSubPage({
                "id": Util.ComposeBenchIDFromPage(obj.id, type, name),
                "type": type,
                "micros": microHistory,
                "name": name
            });
            page.RenderTo(obj.container);
        }));

        this.element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function SubPage(ctor)
{
    this.type = "";
    this.name = "";
    this.id = "#";

    this.container = {};

    this.SubPage = function ()
    {
        this.container = $("<div>");
        this.container.addClass("sub-page");
        this.container.attr("id", this.id);

        var header = $("<h2>");
        header.addClass("sub-header");
        header.append(Label.Benchmark(this.type));
        header.append("\t" + this.name);

        this.container.append(header);

        this.container.append(this.AddContent(this.container));
    }

    this.RenderTo = function (element)
    {
        element.append(this.container);
    }

    this.AddContent = function (container)
    {
        return;
    }

    __ConstructObject(this, ctor);
}

function MicroSubPage(ctor)
{
    SubPage.apply(this);

    this.micros = {};

    this.hasCompleted = false;

    this.analysis = $("<div>");
    this.overview = $("<div>");
    this.corrected = $("<div>");
    this.raw = $("<div>");
    this.baseline = $("<div>");

    this.MicroSubPage = function ()
    {
        this.SubPage();

        this.hasCompleted = this.micros.completed.length > 0;

        AddSeries.call(this);
        AddData.call(this);

        AddCorrected.call(this);
        AddRaw.call(this);
        AddBaseline.call(this);
    }

    this.AddContent = function (container)
    {
        var tab = new Tab({
            "IDprefix": this.id
        });
        tab.AddTab("Analysis", this.analysis);
        tab.AddTab("Overview", this.overview);
        tab.AddTab("Corrected", this.corrected);
        tab.AddTab("Raw", this.raw);
        tab.AddTab("Baseline", this.baseline);
        tab.RenderTo(container);
    }

    var AddSeries = function ()
    {
        this.overview.append("<p><h3>Series</h3>To make the results more readable, we categorise each benchmark with a letter.</p>");

        var table = new Table();

        table.SetTitle("Series");
        table.SetHeader(["Series", "Date", "Status"]);

        for (var i = 0, end = this.micros.all.length; i < end; ++i)
        {
            var micro = this.micros.all[i];

            table.AddRow([micro.GetSerie(), micro.timestamp, Label.Status(micro.completed)]);
        }

        table.RenderTo(this.overview);
    }

    var AddData = function ()
    {
        this.overview.append("<p><h3>Data</h3></p>");

        var table = new Table();

        table.SetTitle("Data");
        table.SetHeader(["Series", "Inliers", "Outliers"]);

        if (this.hasCompleted)
        {
            for (var i = 0, end = this.micros.completed.length; i < end; ++i)
            {
                var micro = this.micros.completed[i];

                var inlierHtml = Util.FixArray(micro.corrected.inliers).join(", ");
                var wellInlier = $("<div>");
                wellInlier.addClass("well well-sm");
                wellInlier.html(inlierHtml === "" ? "-" : inlierHtml);


                var outlierHtml = Util.FixArray(micro.corrected.outliers).join(", ");
                var wellOutlier = $("<div>");
                wellOutlier.addClass("well well-sm");
                wellOutlier.html(outlierHtml === "" ? "-" : outlierHtml);

                table.AddRow([micro.GetSerie(), wellInlier, wellOutlier]);
            }
        }
        else
        {
            table.AddRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
        }

        table.RenderTo(this.overview);
    }

    var AddCorrected = function ()
    {
        if (this.hasCompleted)
        {
            RenderCorrectedGraphs.call(this, this.corrected);
        }

        var table = new Table();

        table.SetTitle("Corrected Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (data)
        {
            return data.corrected;
        }));

        table.RenderTo(this.corrected);

    }
    var AddRaw = function ()
    {
        if (this.hasCompleted)
        {
            var div = $("<div>");
            div.addClass("graph");

            var graph = new MicroBoxplot({
                "dataHistory": this.micros,
                "dataFunction": (function (data)
                {
                    return data.raw;
                })
            });
            graph.RenderTo(div);
            this.raw.append(div);
        }

        var table = new Table();

        table.SetTitle("Raw Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (data)
        {
            return data.raw;
        }));

        table.RenderTo(this.raw);
    }

    var AddBaseline = function ()
    {
        if (this.hasCompleted)
        {
            var div = $("<div>");
            div.addClass("graph");

            var graph = new MicroBoxplot({
                "dataHistory": this.micros,
                "dataFunction": (function (data)
                {
                    return data.baseline;
                })
            });
            graph.RenderTo(div);
            this.baseline.append(div);
        }

        var table = new Table();

        table.SetTitle("Baseline Measurements");
        table.SetHeader(["Series", "Average", "Median", "Standard Deviation", "Low", "High"]);

        ComposeRows.call(this, table, (function (data)
        {
            return data.baseline;
        }));

        table.RenderTo(this.baseline);
    }

    var ComposeRows = function (table, dataFunc)
    {
        if (this.hasCompleted)
        {
            for (var i = 0, end = this.micros.completed.length; i < end; ++i)
            {
                var bench = this.micros.completed[i];

                var data = dataFunc(bench);
                var avg = data.sampleAverage.toFixed(Config.Precision);
                var med = data.median.toFixed(Config.Precision);
                var sd = data.sampleStandardDeviation.toFixed(Config.Precision);
                var low = data.sampleLow.toFixed(Config.Precision);
                var high = data.sampleHigh.toFixed(Config.Precision);
                table.AddRow([bench.GetSerie(), avg, med, sd, low, high]);
            }
        }
        else
        {
            table.AddRowspan("<h4 class=\"center\">Bollocks, no information to show.</h4>");
        }
    }

    var RenderCorrectedGraphs = function (element, dataFunc)
    {
        var tabs = new Tab({
            "IDprefix": this.id + "--Corrected--Graphs",
            "vertical": true
        });
        tabs.container.addClass("graph-pane");

        if (this.hasCompleted)
        {
            RenderCorrectedBoxplot.call(this, tabs, this.micros);
            RenderCorrectedHistogram.call(this, tabs, this.micros);
            RenderSamplePlot.call(this, tabs, this.micros);
        }

        tabs.RenderTo(element);
    }

    var RenderCorrectedBoxplot = function (tabs, dataHist)
    {
        var div = $("<div>");
        div.addClass("graph");

        var graph = new MicroBoxplot({
            "dataHistory": dataHist,
            "dataFunction": (function (data)
            {
                return data.corrected;
            })
        });
        graph.RenderTo(div);
        tabs.AddTab("Boxplot", div);
    }

    var RenderCorrectedHistogram = function (tabs, dataHist)
    {
        var div = $("<div>");
        div.addClass("graph");

        var recent = dataHist.recent;
        if (recent.completed)
        {
            var graph = new DataHistogram({
                "data": recent.corrected
            });
            graph.RenderTo(div);
        }
        else
        {
            div.append("<h4>The most recent benchmark failed!</h4>");
        }

        tabs.AddTab("Histogram", div);
    }

    var RenderSamplePlot = function (tabs, dataHist)
    {
        var div = $("<div>");
        div.addClass("graph");

        var recent = dataHist.recent;

        if (recent.completed)
        {

            var graph = new MicroSamplePlot({
                "raw": recent.raw.raw,
                "baseline": recent.baseline.raw
            });

            graph.RenderTo(div);
        }
        else
        {
            div.append("<h4>The most recent benchmark failed!</h4>");
        }

        tabs.AddTab("Samples", div);
    }

    __ConstructObject(this, ctor);
}

function OverviewSubPage(ctor)
{
    SubPage.apply(this);

    this.OverviewSubPage = function ()
    {
        this.name = "Overview";
        this.SubPage();
    }

    this.AddContent = function (container)
    {
        return "\
        <p>\
        These pages will describe your benchmarks results benchmarks.\
        We also try to help with automatically analysing the results,\
        which will make your life easier.\
        </p>\
        <p>\
        <h3>Explanation</h3> \
        You will notice the symbols on the left of the benchmark name in the\
        left side menu. These symbols indicate what kind of benchmark this particular case is.\
        <p>\
        <div class=\"panel panel-default\">\
            <div class=\"panel-heading\">Benchmark Types</div>\
            <table class=\"table table-striped\">\
		    <tbody>\
			    <tr>\
				    <th>\
					    Symbol\
				    </th>\
				    <th>\
					    Meaning\
				    </th>\
			    </tr>\
			    <tr>\
				    <td>\
					    <span class=\"label label-default\">&mu;</span>\
				    </td>\
				    <td>\
					    Micro benchmark\
				    </td>\
			    </tr>\
			    <tr>\
				    <td>\
				    <span class=\"label label-default\">V</span>\
				    </td>\
				    <td>\
					    Variant benchmark\
				    </td>\
			    </tr>\
			    <tr>\
				    <td>\
				    <span class=\"label label-default\">A</span>\
				    </td>\
				    <td>\
					    Advanced benchmark\
				    </td>\
			    </tr>\
		    </tbody>\
	        </table>\
        </div>\
        </p>";
    }

    __ConstructObject(this, ctor);
}

function Group(ctor)
{
    this.name = "";
    this.id = "";

    this.subPages = new Map();

    this.micros = new BenchmarkGroup();
    this.variants = new BenchmarkGroup();
    this.advanced = new BenchmarkGroup();

    this.Group = function ()
    {
        if (this.id == "")
        {
            this.id = Util.ComposePageID(this.name);
        }
    }

    __ConstructObject(this, ctor);
}

function BenchmarkHistory(ctor)
{
    this.all = [];
    this.completed = [];
    this.failed = [];

    this.recent = {};

    this.setIndex = false;
    this.setCompletedFailed = false;

    this.BenchmarkHistory = function ()
    {
        this.all.sort(BenchmarkSort);

        if (this.setIndex)
        {
            this.all.forEach((function (element, index)
            {
                element.index = index;
            }))
        }

        if (this.setCompletedFailed)
        {
            var obj = this;
            this.all.forEach((function (bench, index, array)
            {
                if (bench.completed)
                {
                    obj.completed.push(bench);
                }
                else
                {
                    obj.failed.push(bench);
                }
            }));
        }

        this.recent = this.all[this.all.length - 1];
    }

    this.GetCategories = function ()
    {
        var categories = [];

        this.all.forEach((function (element)
        {
            categories.push(element.GetSerie());
        }))

        return categories;
    }

    this.GetCompletedCategories = function ()
    {
        var categories = [];

        this.completed.forEach((function (element)
        {
            categories.push(element.GetSerie());
        }))

        return categories;
    }

    var BenchmarkSort = function (a, b)
    {
        if (a.timestamp < b.timestamp)
            return 1;
        if (a.timestamp > b.timestamp)
            return -1;
        // a must be equal to b
        return 0;
    }

    __ConstructObject(this, ctor);
}

function BenchmarkGroup(ctor)
{
    this.all = [];
    this.completed = [];
    this.failed = [];

    this.buffer = new Map();

    this.BenchmarkGroup = function ()
    {
    }

    this.AddBenchmark = function (bench, name)
    {
        if (this.buffer.Has(name) === false)
        {
            this.buffer.Set(name, []);
        }

        this.buffer.Apply(name, (function (benchHistory)
        {
            benchHistory.push(bench);
        }));
    }

    this.InitBenchmarks = function ()
    {
        var obj = this;
        this.buffer.Foreach(function (benchHistory, name)
        {
            obj.all.push(new BenchmarkHistory({
                "setCompletedFailed": true,
                "all": benchHistory,
                "setIndex": true
            }));
        });


        this.all.forEach((function (benchHistory, index, array)
        {
            if (benchHistory.recent.completed)
            {
                obj.completed.push(benchHistory);
            }
            else
            {
                obj.failed.push(benchHistory);
            }
        }));
    }

    __ConstructObject(this, ctor);
}

function Benchmark(ctor)
{
    this.name = "";
    this.group = "";
    this.completed = false;

    this.operations = 0;
    this.samples = 0;

    this.timestamp = "";
    this.index = 0;

    this.GetSerie = function ()
    {
        return IndexToSeries.call(this, this.index);
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.None;
    }

    var IndexToSeries = function (n)
    {
        var s = "";
        while (n >= 0)
        {
            s = String.fromCharCode(n % 26 + 'A'.charCodeAt()) + s;
            n = Math.floor(n / 26) - 1;
        }
        return s;
    }

    __ConstructObject(this, ctor);
}

function MicroBenchmark(ctor)
{
    Benchmark.apply(this);

    this.raw = new Data();
    this.baseline = new Data();
    this.corrected = new Data();

    this.MicroBenchmark = function ()
    {
        if (this.completed === true)
        {
            this.corrected = new Data({
                "raw": jStat(this.raw.values).subtract(this.baseline.average)[0],
                "samples": this.samples
            });
        }
    }

    this.GetType = function ()
    {
        return Benchmarks.Type.Micro;
    }

    __ConstructObject(this, ctor);
}


function Data(ctor)
{
    this.average = 0.0;
    this.standardDeviation = 0.0;
    this.variance = 0.0;
    this.low = 0.0;
    this.high = 0.0;

    this.samples = 0;

    this.sampleAverage = 0.0;
    this.sampleStandardDeviation = 0.0;
    this.sampleVariance = 0.0;
    this.sampleLow = 0.0;
    this.sampleHigh = 0.0;
    this.sampleLow = 0.0;
    this.sampleHigh = 0.0;

    this.median = 0.0;
    this.Q1 = 0.0;
    this.Q3 = 0.0;

    this.raw = [];
    this.values = [];
    this.inliers = [];
    this.outliers = [];

    this.Data = function ()
    {
        this.values = this.raw;
        this.values.sort(function (a, b) { return a - b; });
        this.Calculate();
    }

    this.Calculate = function ()
    {
        if (this.values.length > 0)
        {
            var length = this.values.length;
            var half = Math.floor(length / 2);
            var quart = Math.floor(half / 2);
            this.median = CalculateQ.call(this, this.values, half);
            this.Q1 = CalculateQ.call(this, this.values, half - quart);
            this.Q3 = CalculateQ.call(this, this.values, half + quart);

            this.sampleAverage = jStat.mean(this.values);
            this.sampleStandardDeviation = jStat.stdev(this.values);
            this.sampleVariance = jStat.variance(this.values);
            this.sampleLow = this.values[0];
            this.sampleHigh = this.values[length - 1];

            FilterData.call(this);
        }
    }

    var FilterData = function ()
    {
        var IQR = this.Q3 - this.Q1;
        var lower = this.Q1 - 1.5 * IQR;
        var upper = this.Q3 + 1.5 * IQR;
        for (var i = 0, end = this.values.length; i < end; ++i)
        {
            var value = this.values[i];
            if (lower < value && value < upper)
            {
                this.inliers.unshift(value);
            }
            else
            {
                this.outliers.unshift(value);
            }
        }

        var length = this.inliers.length;
        if (length > 0)
        {
            this.average = jStat.mean(this.inliers);
            this.standardDeviation = jStat.stdev(this.inliers);
            this.variance = jStat.variance(this.inliers);
            this.low = this.inliers[length - 1];
            this.high = this.inliers[0]
        }
    }

    var CalculateQ = function (array, place)
    {
        var length = array.length;
        if (length % 2 !== 0)
        {
            return array[place];
        }
        else
        {
            return (array[place - 1] + array[place]) * 0.5;
        }
    }

    __ConstructObject(this, ctor);
}

function Table(ctor)
{
    this.columns = 0;
    this.rows = 0;

    this.container = {};
    this.title = {};
    this.table = {};
    this.tableHeader = {};
    this.tableBody = {};

    this.Table = function ()
    {
        this.container = $("<div>");
        this.container.addClass("panel panel-default");

        this.title = $("<div>");
        this.title.addClass("panel-heading");

        this.table = $("<table>");
        this.table.addClass("table table-striped");
        this.table.attr("data-sortable", " ");

        this.tableBody = $("<tbody>");

        var thead = $("<thead>");
        this.tableHeader = $("<tr>");

        thead.append(this.tableHeader);

        this.table.append(thead);
        this.table.append(this.tableBody);

        this.container.append(this.title);
        this.container.append(this.table);
    }

    this.SetTitle = function (name)
    {
        this.title.html(name);
    }

    this.SetHeader = function (titles)
    {
        for (var i = 0, end = titles.length; i < end; ++i)
        {
            var th = $("<th>");
            th.html(titles[i]);
            this.tableHeader.append(th);
        }
        this.columns = titles.length;
    }

    this.AddRow = function (data)
    {
        var tr = $("<tr>");
        for (var i = 0, end = data.length; i < end; ++i)
        {
            var td = $("<td>");
            td.html(data[i]);

            tr.append(td);
        }
        this.tableBody.append(tr);

        ++this.rows;
    }

    this.AddRowspan = function (html)
    {
        var tr = $("<tr>");
        var td = $("<td>");
        td.attr("colspan", this.columns);
        td.html(html);
        tr.append(td);

        this.tableBody.append(tr);

        ++this.rows;
    }

    this.RenderTo = function (element)
    {
        element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function Tab(ctor)
{
    this.IDprefix = "";
    this.class = "tab-me";
    this.vertical = false;

    this.size = 0;

    this.container = {};
    this.ul = {};
    this.content = {};

    this.Tab = function ()
    {
        this.container = $("<div>");

        this.ul = $("<ul>");
        this.ul.addClass("nav nav-tabs");
        this.ul.attr("role", "tablist");

        this.content = $("<div>");
        this.content.addClass("tab-content");

        if (this.vertical)
        {
            this.ul.addClass("tabs-left");

            var tabDiv = $("<div>");
            tabDiv.addClass("col-xs-2");
            tabDiv.html(this.ul);

            var contentDiv = $("<div>");
            contentDiv.addClass("col-xs-10");
            contentDiv.html(this.content);

            this.container.addClass("container-fluid");

            this.container.append(tabDiv);
            this.container.append(contentDiv);
        }
        else
        {
            this.container.append(this.ul);
            this.container.append(this.content);
        }
    }

    this.AddTab = function (name, contents)
    {
        var first = this.size++ === 0;
        var li = $("<li>");
        var link = $("<a>");
        link.attr("href", "#" + this.IDprefix + "--" + name);
        link.addClass(this.class);

        link.html(name);

        li.append(link);

        this.ul.append(li);

        var pane = $("<div>");
        pane.addClass("tab-pane inner-tab-pane");

        pane.attr("id", this.IDprefix + "--" + name);
        pane.append(contents);

        if (first)
        {
            li.addClass("active");
            pane.addClass("active");
        }

        this.content.append(pane);
    }

    this.RenderTo = function (element)
    {
        element.append(this.container);
    }

    __ConstructObject(this, ctor);
}

function MicroBoxplot(ctor)
{
    this.dataFunction = (function (dataHist) { });
    this.dataHistory = {};

    this.averages = [];
    this.standardDeviations = [];
    this.outliers = [];
    this.values = [];

    this.MicroBoxplot = function ()
    {
        for (var i = 0, end = this.dataHistory.completed.length; i < end; ++i)
        {
            var bench = this.dataHistory.completed[i];
            var data = this.dataFunction(bench);

            this.values.push(Util.RoundArray([data.low, data.Q1, data.median, data.Q3, data.high]));
            this.standardDeviations.push([i, Util.Round(data.standardDeviation)]);
            this.averages.push([i, Util.Round(data.average)]);

            for (var j = 0, outlierEnd = data.outliers.length; j < outlierEnd; ++j)
            {
                var outlier = data.outliers[j];
                this.outliers.push([i, Util.Round(outlier)]);
            }
        }
    }

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "boxplot"
            },
            title: {
                text: ""
            },
            xAxis: {
                categories: this.dataHistory.GetCompletedCategories(),
                title: {
                    text: "Series"
                }
            },
            yAxis: {
                title: {
                    text: "Time (ms)"
                }
            },
            series: [{
                name: "Measurements",
                data: this.values,
                tooltip: {
                    headerFormat: '<em>Series {point.key}</em><br/>'
                }
            },
            {
                name: "Outliers",
                type: "scatter",
                data: this.outliers,
                marker: {
                    fillColor: "white",
                    lineWidth: 1,
                    lineColor: Highcharts.getOptions().colors[0]
                },
                tooltip: {
                    pointFormat: "Outlier: {point.y}"
                }
            },
            {
                name: "Standard Deviation",
                type: "scatter",
                data: this.standardDeviations,
                tooltip: {
                    pointFormat: "Standard Deviation: {point.y}"
                }
            },
            {
                name: "Average",
                type: "scatter",
                data: this.averages,
                tooltip: {
                    pointFormat: "Average: {point.y}"
                }
            }]

        });
    }

    __ConstructObject(this, ctor);
}

function MicroSamplePlot(ctor)
{
    this.raw = [];
    this.baseline = [];

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "column"
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
                column: {
                    stacking: "normal"
                }
            },
            series: [{
                name: "Raw",
                data: this.raw
            },
            {
                name: "Baseline",
                data: this.baseline
            }]
        });
    }

    __ConstructObject(this, ctor);
}

function DataHistogram(ctor)
{
    this.data = {};

    this.DataHistogram = function ()
    {
    }

    this.RenderTo = function (element)
    {
        element.highcharts({
            chart: {
                type: "histogram"
            },
            title: {
                text: "Recent Histogram"
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
                data: this.data.inliers
            }]

        });
    }

    var GetIndex = function (theta, low, x)
    {
        return Math.round(Math.floor((x - low) / theta));
    }

    __ConstructObject(this, ctor);
}

function Map()
{
    this.length = 0;
    this.items = {};

    this.Get = function (key)
    {
        if (this.Has(key) === true)
        {
            return this.items[key];
        }
        return null;
    }

    this.Array = function ()
    {
        var array = [];
        this.Foreach((function (element)
        {
            array.push(element);
        }));
        return array;
    }

    this.Has = function (key)
    {
        return this.items.hasOwnProperty(key);
    }

    this.Set = function (key, value)
    {
        if (this.Has(key) !== true)
        {
            ++this.length;
        }
        this.items[key] = value;
    }

    this.Apply = function (key, func)
    {
        if (this.Has(key) === true)
        {
            func(this.Get(key));
        }
    }

    this.Remove = function (key)
    {
        if (this.Has(key) === true)
        {
            --this.length;
            delete this.items[key];
        }
    }

    this.Clear = function ()
    {
        this.Foreach((function (item)
        {
            delete item;
        }));
        this.length = 0;
    }

    this.Foreach = function (func)
    {
        for (var item in this.items)
        {
            if (this.items.hasOwnProperty(item) === true)
            {
                func(this.items[item], item);
            }
        }
    }

    this.Size = function ()
    {
        return this.length;
    }
}

var Config = {

    Precision: 2

}

var Util = {

    ComposePageID: function (page)
    {
        return page;
    },

    ComposeBenchID: function (page, type, subpage)
    {
        return page + "--" + type + "--" + subpage;
    },

    ComposeBenchIDFromPage: function (pageID, type, subpage)
    {
        return pageID + "--" + type + "--" + subpage;
    },

    FixArray: function (array)
    {
        return jStat.map(array, function (x)
        {
            return Util.Fix(x);
        });
    },

    Fix: function (x)
    {
        return x.toFixed(Config.Precision);
    },

    RoundArray: function (array)
    {
        return jStat.map(array, function (x)
        {
            return Util.Round(x);
        });

    },

    Round: function (x)
    {
        var decimals = Config.Precision;
        return +(Math.round(x + "e+" + decimals) + "e-" + decimals);
    },

    FMod: function (x, mod)
    {
        return (x - Math.floor(x / mod) * mod).toPrecision(7);
    }
}

var Benchmarks = {

    Type: {
        None: "None",
        Page: "Page",
        Micro: "Micro",
    }
}

var Label = {

    Type: {
        Grey: "label label-default",
        Blue: "label label-primary",
        Green: "label label-success",
        Aqua: "label label-info",
        Orange: "label label-warning",
        Red: "label label-danger"
    },

    Create: function (type, content)
    {
        var span = $("<span>");
        span.addClass(type);
        span.html(content);
        return span;
    },

    Success: function ()
    {
        return Label.Create(Label.Type.Green, "C");
    },

    Failure: function ()
    {
        return Label.Create(Label.Type.Red, "F");
    },

    Status: function (completed)
    {
        return completed ? Label.Success() : Label.Failure();
    },

    Benchmark: function (benchType)
    {
        var content = "";
        switch (benchType)
        {
            case (Benchmarks.Type.None):
                break;
            case (Benchmarks.Type.Page):
                content = "P";
                break;
            case (Benchmarks.Type.Micro):
                content = "&mu;"
                break;
        };
        return Label.Create(Label.Type.Grey, content);
    }
}

function __ConstructObject(object, ctor)
{
    if (typeof ctor !== "undefined")
    {
        for (var prop in object)
        {
            if (object.hasOwnProperty(prop) && ctor.hasOwnProperty(prop))
            {
                object[prop] = ctor[prop];
            }
        }
    }

    var name = object.constructor.name;
    if (typeof object[name] === "function")
    {
        object[name].call(object);
    }
}