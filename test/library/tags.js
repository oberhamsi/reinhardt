var {simpleTag} = require('reinhardt/library');


exports.no_params = simpleTag(function no_params() {
	return "no_params - Expected result";
})

exports.one_param = simpleTag(function one_param(arg) {
	return "one_param - Expected result: " + arg;
});

exports.explicit_no_context = simpleTag(function explicit_no_context(arg) {
   return "explicit_no_context - Expected result: " + arg;
}, false);


exports.no_params_with_context = simpleTag(function no_params_with_context(context) {
   // @@ this is different compared to django:
   // access to context must happen with context.get('value') not just context.value
	return "no_params_with_context - Expected result: (context value: " + context.get('value') + ")";
}, true);

exports.params_and_context = simpleTag(function params_and_context(context, arg) {
	return "params_and_context - Expected result: (context value: " + context.get('value') + "): " + arg;
}, true);

exports.simple_two_params = simpleTag(function simple_two_params(one, two) {
	return "simple_two_params - Expected result: " + one + ', ' + two;
});
