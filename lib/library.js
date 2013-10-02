var {tokenKwargs} = require("./token");
var {TemplateSyntaxError} = require('./errors');
var {Node} = require('./nodes');
var arrays = require('ringo/utils/arrays');

var extend = function(subClass, superClass) {
   if (subClass === undefined) {
      throw new Error('unknown subClass');
   }
   if (superClass === undefined) {
      throw new Error('unknown superClass');
   }
   // new Function() is evil
   var f = new Function();
   f.prototype = superClass.prototype;

   subClass.prototype = new f();
   subClass.prototype.constructor = subClass;
   subClass.superClass = superClass.prototype;
   subClass.superConstructor = superClass;
   return;
};

/*
 * returns names of parameters for given function
 */
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParamNames(func) {
  var fnStr = func.toString().replace(STRIP_COMMENTS, '')
  var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(/([^\s,]+)/g)
  if(result === null) {
     result = []
  }
  return result
}

/**
Parses bits for template tag helpers (simple_tag, include_tag and
assignment_tag), in particular by detecting syntax errors and by
extracting positional arguments.
*/
var parseBits = function(parser, bits, params, takesContext, funcName) {
   if (takesContext) {
      if (params[0] == 'context') {
         params = params.slice(1);
      } else {
         throw new TemplateSyntaxError(funcName + ' has takesContext=true so it must have "context" has a first argument');
      }
   }
   var args = [];
   var kwargs = {};
   var unhandledParams = params.slice(0);
   bits.forEach(function(bit) {
      var kwarg = tokenKwargs([bit], parser);
      if (Object.keys(kwarg).length > 0) {
         // kwarg was succesfully extracted
         var param = Object.keys(kwarg)[0];
         var value = kwarg[param];
         if (params.indexOf(param) == -1) {
            throw new TemplateSyntaxError(funcName + " received unexpected keyword argument " + param);
         } else if (param in kwargs) {
            // already supplied
            throw new TemplateSyntaxError(funcName + ' received multiple values for keyword argument ' + param);
         } else {
            // all good, record the keyword arg
            kwargs[param] = value;
            if (unhandledParams.indexOf(param) > -1) {
               arrays.remove(unhandledParams, param);
            }
         }
      } else {
         if (Object.keys(kwargs).length > 0) {
            throw new TemplateSyntaxError(funcName + ' received some positional argument(s) after some keyword arugment(s)')
         } else {
            // Record the positional argument
            args.push(parser.compileFilter(bit));
            // Consume from the list of expected positional arguments
            if (unhandledParams.length < 1) {
               throw new TemplateSyntaxError(funcName + ' received too many positional arguments');
            }
            unhandledParams.pop();
         }
      }
   });
   if (Object.keys(unhandledParams).length > 0) {
      throw new TemplateSyntaxError(funcName + ' did not receive values for the argument(s): ' + unhandledParams.join(', '));
   }
   // JS does not have keyword args
   // so we return the positional args in the order we got
   // and sort the kwargs by the function param order
   var orderedKwargs = [];
   params.forEach(function(p) {
      if (kwargs[p] !== undefined) {
         orderedKwargs.push(kwargs[p]);
      }
   });
   return orderedKwargs.concat(args);
}

/**
  Returns a template.Node subclass.
  */
var genericTagCompiler = function(params, takesContext, nodeClass, funcName, parser, token) {
   var bits = token.splitContents().slice(1);
   var args = parseBits(parser, bits, params, takesContext, funcName);
   return new nodeClass(takesContext, args);
}

/**
 Base class for tag helper nodes such as SimpleNode, InclusionNode and
 AssignmentNode. Manages the positional arguments to be passed
 to the decorated function.
 */
var TagHelperNode = function(takesContext, args) {
   this.takesContext = takesContext;
   this.args = args;
   return this;
}
TagHelperNode.prototype.getByType = Node.prototype.getByType;
TagHelperNode.prototype.getResolvedArguments = function(context) {
   var resolvedArgs = this.args.map(function(arg) {
      return arg.resolve(context);
   });
   if (this.takesContext === true) {
      resolvedArgs.unshift(context);
   }
   return resolvedArgs;
}


exports.simpleTag = function simpleTag(fn, takesContext) {

   var decorate = function(func) {
      var SimpleNode = function() {
         SimpleNode.superConstructor.apply(this, arguments);
         return this;
      }
      extend(SimpleNode, TagHelperNode);
      SimpleNode.prototype.render = function(context) {
         var resolvedArgs = this.getResolvedArguments(context);
         return func.apply(null, resolvedArgs);
      }
      var params = getParamNames(func);
      var compileFunc = genericTagCompiler.bind(undefined, params, takesContext, SimpleNode, func.name)
      return compileFunc;
   }

   takesContext = takesContext === true ? true : false;
   if (typeof(fn) === 'function') {
     return decorate(fn);
   } else {
     throw new TemplateSyntaxError('Invalid arguments provided to simpleTag');
   }
}

exports.simpleTagWithContext = function(fn) {
   return simpleTag(fn, true);
}