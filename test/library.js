var assert = require("assert");
var {Template} = require('../lib/template');
var {TemplateSyntaxError} = require('../lib/errors');

exports.testCustom = function() {
	var c = {value: 42};

	var t = new Template('{% loadtag ./library/tags %}{% no_params %}');
	assert.equal(t.render(c), 'no_params - Expected result');

   t = new Template('{% loadtag ./library/tags %}{% one_param 37 %}')
   assert.equal(t.render(c), 'one_param - Expected result: 37')


   t = new Template('{% loadtag ./library/tags %}{% explicit_no_context 37 %}')
   assert.equal(t.render(c), 'explicit_no_context - Expected result: 37')


   t = new Template('{% loadtag ./library/tags %}{% no_params_with_context %}')
   assert.equal(t.render(c), 'no_params_with_context - Expected result: (context value: 42)')

   t = new Template('{% loadtag ./library/tags %}{% params_and_context 37 %}')
   assert.equal(t.render(c), 'params_and_context - Expected result: (context value: 42): 37')


   t = new Template('{% loadtag ./library/tags %}{% simple_two_params 37 42 %}')
   assert.equal(t.render(c), 'simple_two_params - Expected result: 37, 42')

   // same as above with keyword arguments
   t = new Template('{% loadtag ./library/tags %}{% simple_two_params one=37 two=42 %}')
   assert.equal(t.render(c), 'simple_two_params - Expected result: 37, 42')

   // order of keyword arguments is not important
   t = new Template('{% loadtag ./library/tags %}{% simple_two_params two=42 one=37 %}')
   assert.equal(t.render(c), 'simple_two_params - Expected result: 37, 42')

   // unknown keyword argument
   assert.throws(function() {
      new Template('{% loadtag ./library/tags %}{% simple_two_params 99 two="hello" three="foo" %}');
   })

   // keyword arguments after positional args are not allowed
   assert.throws(function() {
      new Template('{% loadtag ./library/tags %}{% simple_two_params four="five" two="hello" three="foo" %}');
   })


   // multiple values for the same keyword argument
   assert.throws(function() {
      new Template('{% loadtag ./library/tags %}{% simple_two_params three="test" two="hello" three="foo" %}');
   })

   // too many positional arguments
   assert.throws(function() {
      new Template('{% loadtag ./library/tags %}{% simple_two_params 37 42 56 %}');
   });

}

if (require.main == module.id) {
    require('system').exit(require('test').run(exports, arguments[1]));
}
