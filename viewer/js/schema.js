
var Schema = schema({
    "groups": Array.of(SchemaGroup),
    "?config": SchemaConfig
});

var SchemaConfig = schema({
    "microMaxHistory": Number.min(1)
});

var SchemaGroup = schema({
    "name": String,
    "micros": Array.of(SchemaMicro)
});

var SchemaMicro = schema({
    "name": String,
    "current": [SchemaMicroResultCompleted, SchemaMicroResultFailed, SchemaMicroResultCompletedMemory],
    "history": Array.of([SchemaMicroResultCompleted, SchemaMicroResultFailed, SchemaMicroResultCompletedMemory])
});

var SchemaMicroResultCompleted = schema({
    "timeSamples": [SchemaMicroDataPartial, SchemaMicroDataPartialEmpty],
    "timeBaseline": [SchemaMicroDataPartial, SchemaMicroDataPartialEmpty],
    "?timeCorrected": [SchemaMicroDataComplete, SchemaMicroDataCompleteAnalysed, SchemaMicroDataCompleteAnalysedNoInliers],
    "operationCount": Number.min(0),
    "sampleCount": Number.min(0),
    "timestamp": String,
    "?memoryProfile": false,
    "completed": true
});

var SchemaMicroResultCompletedMemory = schema({
    "timeSamples": [SchemaMicroDataPartial, SchemaMicroDataPartialEmpty],
    "timeBaseline": [SchemaMicroDataPartial, SchemaMicroDataPartialEmpty],
    "?timeCorrected": [SchemaMicroDataComplete, SchemaMicroDataCompleteAnalysed, SchemaMicroDataCompleteAnalysedNoInliers],
    "memorySamples": [SchemaMicroDataPartial, SchemaMicroDataPartialEmpty],
    "?memoryLeaks": Array.of(SchemaMemoryLeak),
    "operationCount": Number.min(0),
    "sampleCount": Number.min(0),
    "timestamp": String,
    "memoryProfile": true,
    "completed": true
});

var SchemaMemoryLeak = schema({
    "file": String,
    "line": Number.min(0),
    "size": Number.min(0)
});

var SchemaMicroResultFailed = schema({
    "timestamp": String,
    "completed": false
});

var SchemaMicroDataComplete = schema({
    "?sampleStats": SchemaMicroStat,
    "samples": Array.of(2, Number)
});

var SchemaMicroDataSmall = schema({
    "samples": Array.of(0, 1, Number)
});

var SchemaMicroDataCompleteAnalysed = schema({
    "sampleStats": SchemaMicroStat,
    "samples": Array.of(2, Number.MAX_VALUE, Number),
    "median": Number,
    "Q1": Number,
    "Q3": Number,
    "inlierStats": SchemaMicroStat,
    "inliers": Array.of(Number),
    "outliers": Array.of(Number)
});

var SchemaMicroDataCompleteAnalysedNoInliers = schema({
    "sampleStats": SchemaMicroStat,
    "samples": Array.of(2, Number.MAX_VALUE, Number),
    "median": Number,
    "Q1": Number,
    "Q3": Number,
    "inliers": Array.of(0, Number),
    "outliers": Array.of(Number)
});

var SchemaMicroDataPartial = schema({
    "sampleStats": SchemaMicroStat,
    "samples": Array.of(2, Number.MAX_VALUE, Number)
});

var SchemaMicroDataPartialEmpty = schema({
    "samples": Array.of(0, 1, Number)
});

var SchemaMicroStat = schema({
    "average": Number,
    "standardDeviation": Number,
    "low": Number,
    "high": Number
});