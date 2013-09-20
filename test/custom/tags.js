var {simpleTag} = require('reinhardt/library');

exports.noParams = simpleTag(function noParams() {
	debugger;
	return "noParams - Expected result";
})

exports.oneParam = simpleTag(function oneParam(arg) {
	return "oneParam - Expected result " + arg;
});

exports.noParamsWithContext = simpleTag(function noParamsWithContext(context) {
	return "noParamsWithContext - Expected result (context value: " + context.value + ")";
}, true);

exports.paramsAndContext = simpleTag(function paramsAndContext(context, arg) {
	return "paramsAndContext - Expected result (context value: " + context.value + "): " + arg;
}, true);

exports.simpleTwoParams = simpleTag(function simpleTwoParams(one, two) {
	return "simpleTwoParams - Expected result: " + one + ', ' + two;
});