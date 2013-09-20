var assert = require("assert");
var {Template} = require('../lib/template');


exports.testCustom = function() {
	var c = {value: 42};
	var t = new Template('{% loadtag ./custom/tags %}{% noParams %}');
	assert.equal(t.render(c), 'noParams - Expected result');
}

if (require.main == module.id) {
    require('system').exit(require('test').run(exports, arguments[1]));
}
