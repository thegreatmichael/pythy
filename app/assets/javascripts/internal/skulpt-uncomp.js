// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
*
*
 */

/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 */
var goog = goog || {}; // Check to see if already defined in current scope


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (cur[part]) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};



/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

      
        throw Error(errorMessage);
        
    }
  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void}
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    visited: {}, // used when resolving dependencies to prevent us from
                 // visiting the file twice
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    }
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var l = src.length;
      if (src.substr(l - 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Writes a script tag if, and only if, that script hasn't already been added
   * to the document.  (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_() &&
        !goog.dependencies_.written[src]) {
      goog.dependencies_.written[src] = true;
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' +
                src + '"></' + 'script>');
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls writeScriptTag_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.writeScriptTag_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.writeScriptTag_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // We cannot use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (value instanceof Array ||  // Works quickly in same execution context.
          // If value is from a different execution context then
          // !(value instanceof Object), which lets us early out in the common
          // case when value is from the same context but not an array.
          // The {if (value)} check above means we don't have to worry about
          // undefined behavior of Object.prototype.toString on null/undefined.
          //
          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          (!(value instanceof Object) &&
           (Object.prototype.toString.call(
               /** @type {Object} */ (value)) == '[object Array]') ||

           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (!(value instanceof Object) &&
          (Object.prototype.toString.call(
              /** @type {Object} */ (value)) == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  // In Safari typeof nodeList returns 'function', and on Firefox
  // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
  // and RegExps.  We would like to return object for those and we can
  // detect an invalid function by making sure that the function
  // object has a call method.
  } else if (s == 'function' && typeof value.call == 'undefined') {
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In IE, DOM nodes do not extend Object so they do not have this method.
  // we need to check hasOwnProperty because the proto might have this set.
  if (obj.hasOwnProperty && obj.hasOwnProperty(goog.UID_PROPERTY_)) {
    return obj[goog.UID_PROPERTY_];
  }
  if (!obj[goog.UID_PROPERTY_]) {
    obj[goog.UID_PROPERTY_] = ++goog.uidCounter_;
  }
  return obj[goog.UID_PROPERTY_];
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 *
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.bind = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells JSCompiler that this is not
 * the name of a class, but rather it's the name of a composite type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 *
 * @deprecated Please use the {@code @typedef} annotation.
 */
goog.typedef = true;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * Without JS Compiler the arguments are simple joined with a hyphen and passed
 * through unaltered.
 *
 * With the JS Compiler the arguments are inlined, e.g:
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If a CSS renaming map is passed to the compiler it will replace symbols in
 * the classname.  If one argument is passed it will be processed, if two are
 * passed only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * Names are split on 'hyphen' and processed in parts such that the following
 * are equivalent:
 *   var base = goog.getCssName('baseclass');
 *   goog.getCssName(base, 'modifier');
 *   goog.getCSsName('baseclass-modifier');
 *
 * If any part does not appear in the renaming map a warning is logged and the
 * original, unobfuscated class name is inlined.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var cssName = className + (opt_modifier ? '-' + opt_modifier : '');
  return (goog.cssNameMapping_ && (cssName in goog.cssNameMapping_)) ?
      goog.cssNameMapping_[cssName] : cssName;
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog-menu": "a",
 *   "goog-menu-disabled": "a-b",
 *   "CSS_LOGO": "b",
 *   "hidden": "c"
 * });
 *
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog-menu') + ' ' + goog.getCssName('goog-menu', 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 */
goog.setCssNameMapping = function(mapping) {
  goog.cssNameMapping_ = mapping;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};



// Copyright 2010 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// This file has been auto-generated by GenJsDeps, please do not edit.

goog.addDependency('array/array.js', ['goog.array'], ['goog.asserts']);
goog.addDependency('asserts/asserts.js', ['goog.asserts', 'goog.asserts.AssertionError'], ['goog.debug.Error', 'goog.string']);
goog.addDependency('async/conditionaldelay.js', ['goog.async.ConditionalDelay'], ['goog.Disposable', 'goog.async.Delay']);
goog.addDependency('async/delay.js', ['goog.Delay', 'goog.async.Delay'], ['goog.Disposable', 'goog.Timer']);
goog.addDependency('async/throttle.js', ['goog.Throttle', 'goog.async.Throttle'], ['goog.Disposable', 'goog.Timer']);
goog.addDependency('base.js', ['goog'], []);
goog.addDependency('color/alpha.js', ['goog.color.alpha'], ['goog.color']);
goog.addDependency('color/color.js', ['goog.color'], ['goog.color.names', 'goog.math']);
goog.addDependency('color/names.js', ['goog.color.names'], []);
goog.addDependency('crypt/base64.js', ['goog.crypt.base64'], ['goog.crypt']);
goog.addDependency('crypt/basen.js', ['goog.crypt.baseN'], []);
goog.addDependency('crypt/crypt.js', ['goog.crypt'], []);
goog.addDependency('crypt/hash32.js', ['goog.crypt.hash32'], ['goog.crypt']);
goog.addDependency('crypt/sha1.js', ['goog.crypt.Sha1'], []);
goog.addDependency('cssom/cssom.js', ['goog.cssom', 'goog.cssom.CssRuleType'], ['goog.array', 'goog.dom']);
goog.addDependency('cssom/iframe/style.js', ['goog.cssom.iframe.style'], ['goog.cssom', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.classes', 'goog.style', 'goog.userAgent']);
goog.addDependency('datasource/datamanager.js', ['goog.ds.DataManager'], ['goog.ds.BasicNodeList', 'goog.ds.DataNode', 'goog.ds.Expr', 'goog.string', 'goog.structs', 'goog.structs.Map']);
goog.addDependency('datasource/datasource.js', ['goog.ds.BaseDataNode', 'goog.ds.BasicNodeList', 'goog.ds.DataNode', 'goog.ds.DataNodeList', 'goog.ds.EmptyNodeList', 'goog.ds.LoadState', 'goog.ds.SortedNodeList', 'goog.ds.Util', 'goog.ds.logger'], ['goog.array', 'goog.debug.Logger']);
goog.addDependency('datasource/expr.js', ['goog.ds.Expr'], ['goog.ds.BasicNodeList', 'goog.ds.EmptyNodeList', 'goog.string']);
goog.addDependency('datasource/fastdatanode.js', ['goog.ds.AbstractFastDataNode', 'goog.ds.FastDataNode', 'goog.ds.FastListNode', 'goog.ds.PrimitiveFastDataNode'], ['goog.ds.DataManager', 'goog.ds.EmptyNodeList', 'goog.string']);
goog.addDependency('datasource/jsdatasource.js', ['goog.ds.JsDataSource', 'goog.ds.JsPropertyDataSource'], ['goog.ds.BaseDataNode', 'goog.ds.BasicNodeList', 'goog.ds.DataManager', 'goog.ds.EmptyNodeList', 'goog.ds.LoadState']);
goog.addDependency('datasource/jsondatasource.js', ['goog.ds.JsonDataSource'], ['goog.Uri', 'goog.dom', 'goog.ds.DataManager', 'goog.ds.JsDataSource', 'goog.ds.LoadState', 'goog.ds.logger']);
goog.addDependency('datasource/jsxmlhttpdatasource.js', ['goog.ds.JsXmlHttpDataSource'], ['goog.Uri', 'goog.ds.DataManager', 'goog.ds.FastDataNode', 'goog.ds.LoadState', 'goog.ds.logger', 'goog.events', 'goog.net.EventType', 'goog.net.XhrIo']);
goog.addDependency('datasource/xmldatasource.js', ['goog.ds.XmlDataSource', 'goog.ds.XmlHttpDataSource'], ['goog.Uri', 'goog.dom.NodeType', 'goog.dom.xml', 'goog.ds.BasicNodeList', 'goog.ds.DataManager', 'goog.ds.LoadState', 'goog.ds.logger', 'goog.net.XhrIo', 'goog.string']);
goog.addDependency('date/date.js', ['goog.date', 'goog.date.Date', 'goog.date.DateTime', 'goog.date.Interval', 'goog.date.month', 'goog.date.weekDay'], ['goog.asserts', 'goog.string']);
goog.addDependency('date/daterange.js', ['goog.date.DateRange', 'goog.date.DateRange.Iterator', 'goog.date.DateRange.StandardDateRangeKeys'], ['goog.date.Date', 'goog.date.Interval', 'goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('date/relative.js', ['goog.date.relative'], ['goog.i18n.DateTimeFormat']);
goog.addDependency('date/utcdatetime.js', ['goog.date.UtcDateTime'], ['goog.date', 'goog.date.Date', 'goog.date.DateTime', 'goog.date.Interval']);
goog.addDependency('debug/console.js', ['goog.debug.Console'], ['goog.debug.LogManager', 'goog.debug.Logger.Level', 'goog.debug.TextFormatter']);
goog.addDependency('debug/debug.js', ['goog.debug'], ['goog.array', 'goog.string', 'goog.structs.Set']);
goog.addDependency('debug/debugwindow.js', ['goog.debug.DebugWindow'], ['goog.debug.HtmlFormatter', 'goog.debug.LogManager', 'goog.structs.CircularBuffer', 'goog.userAgent']);
goog.addDependency('debug/devcss/devcss.js', ['goog.debug.DevCss', 'goog.debug.DevCss.UserAgent'], ['goog.cssom', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.string', 'goog.userAgent']);
goog.addDependency('debug/devcss/devcssrunner.js', ['goog.debug.devCssRunner'], ['goog.debug.DevCss']);
goog.addDependency('debug/divconsole.js', ['goog.debug.DivConsole'], ['goog.debug.HtmlFormatter', 'goog.debug.LogManager', 'goog.style']);
goog.addDependency('debug/error.js', ['goog.debug.Error'], []);
goog.addDependency('debug/errorhandler.js', ['goog.debug.ErrorHandler'], ['goog.debug', 'goog.debug.Trace']);
goog.addDependency('debug/errorhandlerweakdep.js', ['goog.debug.errorHandlerWeakDep'], []);
goog.addDependency('debug/errorreporter.js', ['goog.debug.ErrorReporter', 'goog.debug.ErrorReporter.ExceptionEvent'], ['goog.debug', 'goog.debug.ErrorHandler', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.net.XhrIo', 'goog.object', 'goog.string', 'goog.uri.utils']);
goog.addDependency('debug/fancywindow.js', ['goog.debug.FancyWindow'], ['goog.debug.DebugWindow', 'goog.debug.LogManager', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.dom.DomHelper', 'goog.object', 'goog.userAgent']);
goog.addDependency('debug/formatter.js', ['goog.debug.Formatter', 'goog.debug.HtmlFormatter', 'goog.debug.TextFormatter'], ['goog.debug.RelativeTimeProvider', 'goog.string']);
goog.addDependency('debug/gcdiagnostics.js', ['goog.debug.GcDiagnostics'], ['goog.debug.Logger', 'goog.debug.Trace', 'goog.userAgent']);
goog.addDependency('debug/logbuffer.js', ['goog.debug.LogBuffer'], ['goog.asserts', 'goog.debug.LogRecord']);
goog.addDependency('debug/logger.js', ['goog.debug.LogManager', 'goog.debug.Logger', 'goog.debug.Logger.Level'], ['goog.array', 'goog.asserts', 'goog.debug', 'goog.debug.LogBuffer', 'goog.debug.LogRecord']);
goog.addDependency('debug/logrecord.js', ['goog.debug.LogRecord'], []);
goog.addDependency('debug/relativetimeprovider.js', ['goog.debug.RelativeTimeProvider'], []);
goog.addDependency('debug/tracer.js', ['goog.debug.Trace'], ['goog.array', 'goog.debug.Logger', 'goog.iter', 'goog.structs.Map', 'goog.structs.SimplePool']);
goog.addDependency('disposable/disposable.js', ['goog.Disposable', 'goog.dispose'], []);
goog.addDependency('dom/a11y.js', ['goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State'], ['goog.dom', 'goog.userAgent']);
goog.addDependency('dom/abstractmultirange.js', ['goog.dom.AbstractMultiRange'], ['goog.array', 'goog.dom', 'goog.dom.AbstractRange']);
goog.addDependency('dom/abstractrange.js', ['goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.SavedCaretRange', 'goog.dom.TagIterator', 'goog.userAgent']);
goog.addDependency('dom/annotate.js', ['goog.dom.annotate'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.string']);
goog.addDependency('dom/browserrange/abstractrange.js', ['goog.dom.browserrange.AbstractRange'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.TagName', 'goog.dom.TextRangeIterator', 'goog.iter', 'goog.string', 'goog.string.StringBuffer', 'goog.userAgent']);
goog.addDependency('dom/browserrange/browserrange.js', ['goog.dom.browserrange', 'goog.dom.browserrange.Error'], ['goog.dom', 'goog.dom.browserrange.GeckoRange', 'goog.dom.browserrange.IeRange', 'goog.dom.browserrange.OperaRange', 'goog.dom.browserrange.W3cRange', 'goog.dom.browserrange.WebKitRange', 'goog.userAgent']);
goog.addDependency('dom/browserrange/geckorange.js', ['goog.dom.browserrange.GeckoRange'], ['goog.dom.browserrange.W3cRange']);
goog.addDependency('dom/browserrange/ierange.js', ['goog.dom.browserrange.IeRange'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.dom.NodeIterator', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.TagName', 'goog.dom.browserrange.AbstractRange', 'goog.iter', 'goog.iter.StopIteration', 'goog.string']);
goog.addDependency('dom/browserrange/operarange.js', ['goog.dom.browserrange.OperaRange'], ['goog.dom.browserrange.W3cRange']);
goog.addDependency('dom/browserrange/w3crange.js', ['goog.dom.browserrange.W3cRange'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.browserrange.AbstractRange', 'goog.string']);
goog.addDependency('dom/browserrange/webkitrange.js', ['goog.dom.browserrange.WebKitRange'], ['goog.dom.RangeEndpoint', 'goog.dom.browserrange.W3cRange', 'goog.userAgent']);
goog.addDependency('dom/classes.js', ['goog.dom.classes'], ['goog.array']);
goog.addDependency('dom/controlrange.js', ['goog.dom.ControlRange', 'goog.dom.ControlRangeIterator'], ['goog.array', 'goog.dom', 'goog.dom.AbstractMultiRange', 'goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TagWalkType', 'goog.dom.TextRange', 'goog.iter.StopIteration', 'goog.userAgent']);
goog.addDependency('dom/dom.js', ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.NodeType'], ['goog.array', 'goog.dom.TagName', 'goog.dom.classes', 'goog.math.Coordinate', 'goog.math.Size', 'goog.object', 'goog.string', 'goog.userAgent']);
goog.addDependency('dom/dom_test.js', ['goog.dom.dom_test'], ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.testing.asserts', 'goog.userAgent']);
goog.addDependency('dom/fontsizemonitor.js', ['goog.dom.FontSizeMonitor', 'goog.dom.FontSizeMonitor.EventType'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.userAgent']);
goog.addDependency('dom/forms.js', ['goog.dom.forms'], ['goog.structs.Map']);
goog.addDependency('dom/iframe.js', ['goog.dom.iframe'], ['goog.dom']);
goog.addDependency('dom/iter.js', ['goog.dom.iter.AncestorIterator', 'goog.dom.iter.ChildIterator', 'goog.dom.iter.SiblingIterator'], ['goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('dom/multirange.js', ['goog.dom.MultiRange', 'goog.dom.MultiRangeIterator'], ['goog.array', 'goog.debug.Logger', 'goog.dom.AbstractMultiRange', 'goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TextRange', 'goog.iter.StopIteration']);
goog.addDependency('dom/nodeiterator.js', ['goog.dom.NodeIterator'], ['goog.dom.TagIterator']);
goog.addDependency('dom/nodeoffset.js', ['goog.dom.NodeOffset'], ['goog.Disposable', 'goog.dom.TagName']);
goog.addDependency('dom/pattern/abstractpattern.js', ['goog.dom.pattern.AbstractPattern'], ['goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/allchildren.js', ['goog.dom.pattern.AllChildren'], ['goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/callback/callback.js', ['goog.dom.pattern.callback'], ['goog.dom', 'goog.dom.TagWalkType', 'goog.iter']);
goog.addDependency('dom/pattern/callback/counter.js', ['goog.dom.pattern.callback.Counter'], []);
goog.addDependency('dom/pattern/callback/test.js', ['goog.dom.pattern.callback.Test'], ['goog.iter.StopIteration']);
goog.addDependency('dom/pattern/childmatches.js', ['goog.dom.pattern.ChildMatches'], ['goog.dom.pattern.AllChildren', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/endtag.js', ['goog.dom.pattern.EndTag'], ['goog.dom.TagWalkType', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/fulltag.js', ['goog.dom.pattern.FullTag'], ['goog.dom.pattern.MatchType', 'goog.dom.pattern.StartTag', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/matcher.js', ['goog.dom.pattern.Matcher'], ['goog.dom.TagIterator', 'goog.dom.pattern.MatchType', 'goog.iter']);
goog.addDependency('dom/pattern/nodetype.js', ['goog.dom.pattern.NodeType'], ['goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/pattern.js', ['goog.dom.pattern', 'goog.dom.pattern.MatchType'], []);
goog.addDependency('dom/pattern/repeat.js', ['goog.dom.pattern.Repeat'], ['goog.dom.NodeType', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/sequence.js', ['goog.dom.pattern.Sequence'], ['goog.dom.NodeType', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/starttag.js', ['goog.dom.pattern.StartTag'], ['goog.dom.TagWalkType', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/tag.js', ['goog.dom.pattern.Tag'], ['goog.dom.pattern', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType', 'goog.object']);
goog.addDependency('dom/pattern/text.js', ['goog.dom.pattern.Text'], ['goog.dom.NodeType', 'goog.dom.pattern', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/range.js', ['goog.dom.Range'], ['goog.dom', 'goog.dom.AbstractRange', 'goog.dom.ControlRange', 'goog.dom.MultiRange', 'goog.dom.NodeType', 'goog.dom.TextRange', 'goog.userAgent']);
goog.addDependency('dom/rangeendpoint.js', ['goog.dom.RangeEndpoint'], []);
goog.addDependency('dom/savedcaretrange.js', ['goog.dom.SavedCaretRange'], ['goog.array', 'goog.dom', 'goog.dom.SavedRange', 'goog.dom.TagName', 'goog.string']);
goog.addDependency('dom/savedrange.js', ['goog.dom.SavedRange'], ['goog.Disposable', 'goog.debug.Logger']);
goog.addDependency('dom/selection.js', ['goog.dom.selection'], ['goog.string', 'goog.userAgent']);
goog.addDependency('dom/tagiterator.js', ['goog.dom.TagIterator', 'goog.dom.TagWalkType'], ['goog.dom.NodeType', 'goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('dom/tagname.js', ['goog.dom.TagName'], []);
goog.addDependency('dom/textrange.js', ['goog.dom.TextRange'], ['goog.array', 'goog.dom', 'goog.dom.AbstractRange', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TagName', 'goog.dom.TextRangeIterator', 'goog.dom.browserrange', 'goog.string', 'goog.userAgent']);
goog.addDependency('dom/textrangeiterator.js', ['goog.dom.TextRangeIterator'], ['goog.array', 'goog.dom.NodeType', 'goog.dom.RangeIterator', 'goog.dom.TagName', 'goog.iter.StopIteration']);
goog.addDependency('dom/viewportsizemonitor.js', ['goog.dom.ViewportSizeMonitor'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.math.Size', 'goog.userAgent']);
goog.addDependency('dom/xml.js', ['goog.dom.xml'], ['goog.dom', 'goog.dom.NodeType']);
goog.addDependency('editor/browserfeature.js', ['goog.editor.BrowserFeature'], ['goog.editor.defines', 'goog.userAgent', 'goog.userAgent.product', 'goog.userAgent.product.isVersion']);
goog.addDependency('editor/clicktoeditwrapper.js', ['goog.editor.ClickToEditWrapper'], ['goog.Disposable', 'goog.asserts', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Field.EventType', 'goog.editor.node', 'goog.editor.range', 'goog.events.BrowserEvent.MouseButton', 'goog.events.EventHandler', 'goog.events.EventType']);
goog.addDependency('editor/command.js', ['goog.editor.Command'], []);
goog.addDependency('editor/defines.js', ['goog.editor.defines'], []);
goog.addDependency('editor/field.js', ['goog.editor.Field', 'goog.editor.Field.EventType'], ['goog.array', 'goog.async.Delay', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo', 'goog.editor.node', 'goog.editor.range', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.functions', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/focus.js', ['goog.editor.focus'], ['goog.dom.selection']);
goog.addDependency('editor/icontent.js', ['goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo'], ['goog.editor.BrowserFeature', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/link.js', ['goog.editor.Link'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.editor.node', 'goog.editor.range', 'goog.string.Unicode', 'goog.uri.utils']);
goog.addDependency('editor/node.js', ['goog.editor.node'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.iter.ChildIterator', 'goog.dom.iter.SiblingIterator', 'goog.iter', 'goog.object', 'goog.string', 'goog.string.Unicode']);
goog.addDependency('editor/plugin.js', ['goog.editor.Plugin'], ['goog.debug.Logger', 'goog.editor.Command', 'goog.events.EventTarget', 'goog.functions', 'goog.object', 'goog.reflect']);
goog.addDependency('editor/plugins/abstractbubbleplugin.js', ['goog.editor.plugins.AbstractBubblePlugin'], ['goog.dom', 'goog.dom.TagName', 'goog.editor.Plugin', 'goog.editor.style', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.functions', 'goog.string.Unicode', 'goog.ui.Component.EventType', 'goog.ui.editor.Bubble', 'goog.userAgent']);
goog.addDependency('editor/plugins/abstractdialogplugin.js', ['goog.editor.plugins.AbstractDialogPlugin', 'goog.editor.plugins.AbstractDialogPlugin.EventType'], ['goog.dom', 'goog.dom.Range', 'goog.editor.Field.EventType', 'goog.editor.Plugin', 'goog.editor.range', 'goog.events', 'goog.ui.editor.AbstractDialog.EventType']);
goog.addDependency('editor/plugins/abstracttabhandler.js', ['goog.editor.plugins.AbstractTabHandler'], ['goog.editor.Plugin', 'goog.events.KeyCodes']);
goog.addDependency('editor/plugins/basictextformatter.js', ['goog.editor.plugins.BasicTextFormatter', 'goog.editor.plugins.BasicTextFormatter.COMMAND'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Link', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.range', 'goog.iter', 'goog.object', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.ui.editor.messages', 'goog.userAgent']);
goog.addDependency('editor/plugins/blockquote.js', ['goog.editor.plugins.Blockquote'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.node', 'goog.functions']);
goog.addDependency('editor/plugins/emoticons.js', ['goog.editor.plugins.Emoticons'], ['goog.dom.TagName', 'goog.editor.Plugin', 'goog.functions', 'goog.ui.emoji.Emoji']);
goog.addDependency('editor/plugins/enterhandler.js', ['goog.editor.plugins.EnterHandler'], ['goog.dom', 'goog.dom.AbstractRange', 'goog.dom.NodeOffset', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.plugins.Blockquote', 'goog.editor.range', 'goog.editor.style', 'goog.events.KeyCodes', 'goog.string', 'goog.userAgent']);
goog.addDependency('editor/plugins/headerformatter.js', ['goog.editor.plugins.HeaderFormatter'], ['goog.editor.Command', 'goog.editor.Plugin', 'goog.userAgent']);
goog.addDependency('editor/plugins/linkbubble.js', ['goog.editor.plugins.LinkBubble', 'goog.editor.plugins.LinkBubble.Action'], ['goog.array', 'goog.dom', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Link', 'goog.editor.plugins.AbstractBubblePlugin', 'goog.editor.range', 'goog.string', 'goog.style', 'goog.ui.editor.messages', 'goog.window']);
goog.addDependency('editor/plugins/linkdialogplugin.js', ['goog.editor.plugins.LinkDialogPlugin'], ['goog.editor.Command', 'goog.editor.plugins.AbstractDialogPlugin', 'goog.events.EventHandler', 'goog.functions', 'goog.ui.editor.AbstractDialog.EventType', 'goog.ui.editor.LinkDialog', 'goog.ui.editor.LinkDialog.OkEvent']);
goog.addDependency('editor/plugins/listtabhandler.js', ['goog.editor.plugins.ListTabHandler'], ['goog.dom.TagName', 'goog.editor.Command', 'goog.editor.plugins.AbstractTabHandler']);
goog.addDependency('editor/plugins/loremipsum.js', ['goog.editor.plugins.LoremIpsum'], ['goog.asserts', 'goog.dom', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.node', 'goog.functions']);
goog.addDependency('editor/plugins/removeformatting.js', ['goog.editor.plugins.RemoveFormatting'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.range', 'goog.string']);
goog.addDependency('editor/plugins/spacestabhandler.js', ['goog.editor.plugins.SpacesTabHandler'], ['goog.dom', 'goog.dom.TagName', 'goog.editor.plugins.AbstractTabHandler', 'goog.editor.range']);
goog.addDependency('editor/plugins/tableeditor.js', ['goog.editor.plugins.TableEditor'], ['goog.array', 'goog.dom', 'goog.dom.TagName', 'goog.editor.Plugin', 'goog.editor.Table', 'goog.editor.node', 'goog.editor.range', 'goog.object']);
goog.addDependency('editor/plugins/tagonenterhandler.js', ['goog.editor.plugins.TagOnEnterHandler'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.Command', 'goog.editor.node', 'goog.editor.plugins.EnterHandler', 'goog.editor.range', 'goog.editor.style', 'goog.events.KeyCodes', 'goog.string', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/plugins/undoredo.js', ['goog.editor.plugins.UndoRedo'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeOffset', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Field.EventType', 'goog.editor.Plugin', 'goog.editor.plugins.UndoRedoManager', 'goog.editor.plugins.UndoRedoState', 'goog.events', 'goog.events.EventHandler']);
goog.addDependency('editor/plugins/undoredomanager.js', ['goog.editor.plugins.UndoRedoManager', 'goog.editor.plugins.UndoRedoManager.EventType'], ['goog.editor.plugins.UndoRedoState', 'goog.events.EventTarget']);
goog.addDependency('editor/plugins/undoredostate.js', ['goog.editor.plugins.UndoRedoState'], ['goog.events.EventTarget']);
goog.addDependency('editor/range.js', ['goog.editor.range', 'goog.editor.range.Point'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.RangeEndpoint', 'goog.dom.SavedCaretRange', 'goog.editor.BrowserFeature', 'goog.editor.node', 'goog.editor.style', 'goog.iter']);
goog.addDependency('editor/seamlessfield.js', ['goog.editor.SeamlessField'], ['goog.cssom.iframe.style', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Field', 'goog.editor.Field.EventType', 'goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo', 'goog.editor.node', 'goog.events', 'goog.events.EventType', 'goog.style']);
goog.addDependency('editor/seamlessfield_test.js', ['goog.editor.seamlessfield_test'], ['goog.dom', 'goog.editor.BrowserFeature', 'goog.editor.SeamlessField', 'goog.events', 'goog.style', 'goog.testing.MockClock', 'goog.testing.MockRange', 'goog.testing.jsunit']);
goog.addDependency('editor/style.js', ['goog.editor.style'], ['goog.dom', 'goog.dom.NodeType', 'goog.editor.BrowserFeature', 'goog.events.EventType', 'goog.object', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/table.js', ['goog.editor.Table', 'goog.editor.TableCell', 'goog.editor.TableRow'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.string.Unicode', 'goog.style']);
goog.addDependency('events/actioneventwrapper.js', ['goog.events.actionEventWrapper'], ['goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.EventWrapper', 'goog.events.KeyCodes']);
goog.addDependency('events/actionhandler.js', ['goog.events.ActionEvent', 'goog.events.ActionHandler', 'goog.events.ActionHandler.EventType', 'goog.events.BeforeActionEvent'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/browserevent.js', ['goog.events.BrowserEvent', 'goog.events.BrowserEvent.MouseButton'], ['goog.events.Event', 'goog.userAgent']);
goog.addDependency('events/event.js', ['goog.events.Event'], ['goog.Disposable']);
goog.addDependency('events/eventhandler.js', ['goog.events.EventHandler'], ['goog.Disposable', 'goog.events', 'goog.events.EventWrapper', 'goog.object', 'goog.structs.SimplePool']);
goog.addDependency('events/events.js', ['goog.events', 'goog.events.EventType'], ['goog.array', 'goog.debug.errorHandlerWeakDep', 'goog.events.BrowserEvent', 'goog.events.Event', 'goog.events.EventWrapper', 'goog.events.pools', 'goog.object', 'goog.userAgent']);
goog.addDependency('events/eventtarget.js', ['goog.events.EventTarget'], ['goog.Disposable', 'goog.events']);
goog.addDependency('events/eventwrapper.js', ['goog.events.EventWrapper'], []);
goog.addDependency('events/focushandler.js', ['goog.events.FocusHandler', 'goog.events.FocusHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.userAgent']);
goog.addDependency('events/imehandler.js', ['goog.events.ImeHandler', 'goog.events.ImeHandler.Event', 'goog.events.ImeHandler.EventType'], ['goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent', 'goog.userAgent.product']);
goog.addDependency('events/inputhandler.js', ['goog.events.InputHandler', 'goog.events.InputHandler.EventType'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/keycodes.js', ['goog.events.KeyCodes'], ['goog.userAgent']);
goog.addDependency('events/keyhandler.js', ['goog.events.KeyEvent', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/keynames.js', ['goog.events.KeyNames'], []);
goog.addDependency('events/listener.js', ['goog.events.Listener'], []);
goog.addDependency('events/mousewheelhandler.js', ['goog.events.MouseWheelEvent', 'goog.events.MouseWheelHandler', 'goog.events.MouseWheelHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.math', 'goog.userAgent']);
goog.addDependency('events/onlinehandler.js', ['goog.events.OnlineHandler', 'goog.events.OnlineHandler.EventType'], ['goog.Timer', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.userAgent']);
goog.addDependency('events/pastehandler.js', ['goog.events.PasteHandler', 'goog.events.PasteHandler.EventType', 'goog.events.PasteHandler.State'], ['goog.debug.Logger', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.KeyCodes']);
goog.addDependency('events/pools.js', ['goog.events.pools'], ['goog.events.BrowserEvent', 'goog.events.Listener', 'goog.structs.SimplePool', 'goog.userAgent.jscript']);
goog.addDependency('format/format.js', ['goog.format'], ['goog.i18n.GraphemeBreak', 'goog.string', 'goog.userAgent']);
goog.addDependency('format/htmlprettyprinter.js', ['goog.format.HtmlPrettyPrinter', 'goog.format.HtmlPrettyPrinter.Buffer'], ['goog.object', 'goog.string.StringBuffer']);
goog.addDependency('format/jsonprettyprinter.js', ['goog.format.JsonPrettyPrinter', 'goog.format.JsonPrettyPrinter.HtmlDelimiters', 'goog.format.JsonPrettyPrinter.TextDelimiters'], ['goog.json', 'goog.json.Serializer', 'goog.string', 'goog.string.StringBuffer', 'goog.string.format']);
goog.addDependency('functions/functions.js', ['goog.functions'], []);
goog.addDependency('fx/abstractdragdrop.js', ['goog.fx.AbstractDragDrop', 'goog.fx.DragDropEvent', 'goog.fx.DragDropItem'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Box', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/animation.js', ['goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.fx.Animation.State', 'goog.fx.AnimationEvent'], ['goog.Timer', 'goog.array', 'goog.events.Event', 'goog.events.EventTarget', 'goog.object']);
goog.addDependency('fx/animationqueue.js', ['goog.fx.AnimationParallelQueue', 'goog.fx.AnimationQueue', 'goog.fx.AnimationSerialQueue'], ['goog.array', 'goog.events.EventHandler', 'goog.fx.Animation', 'goog.fx.Animation.EventType']);
goog.addDependency('fx/cssspriteanimation.js', ['goog.fx.CssSpriteAnimation'], ['goog.fx.Animation']);
goog.addDependency('fx/dom.js', ['goog.fx.dom', 'goog.fx.dom.BgColorTransform', 'goog.fx.dom.ColorTransform', 'goog.fx.dom.Fade', 'goog.fx.dom.FadeIn', 'goog.fx.dom.FadeInAndShow', 'goog.fx.dom.FadeOut', 'goog.fx.dom.FadeOutAndHide', 'goog.fx.dom.PredefinedEffect', 'goog.fx.dom.Resize', 'goog.fx.dom.ResizeHeight', 'goog.fx.dom.ResizeWidth', 'goog.fx.dom.Scroll', 'goog.fx.dom.Slide', 'goog.fx.dom.SlideFrom', 'goog.fx.dom.Swipe'], ['goog.color', 'goog.events', 'goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.style']);
goog.addDependency('fx/dragdrop.js', ['goog.fx.DragDrop'], ['goog.fx.AbstractDragDrop', 'goog.fx.DragDropItem']);
goog.addDependency('fx/dragdropgroup.js', ['goog.fx.DragDropGroup'], ['goog.fx.AbstractDragDrop', 'goog.fx.DragDropItem']);
goog.addDependency('fx/dragger.js', ['goog.fx.DragEvent', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType'], ['goog.dom', 'goog.events', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.math.Rect', 'goog.userAgent']);
goog.addDependency('fx/draglistgroup.js', ['goog.fx.DragListDirection', 'goog.fx.DragListGroup', 'goog.fx.DragListGroupEvent'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.classes', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/dragscrollsupport.js', ['goog.fx.DragScrollSupport'], ['goog.Disposable', 'goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/easing.js', ['goog.fx.easing'], []);
goog.addDependency('fx/fx.js', ['goog.fx'], ['goog.asserts', 'goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.fx.Animation.State', 'goog.fx.AnimationEvent', 'goog.fx.easing']);
goog.addDependency('gears/basestore.js', ['goog.gears.BaseStore', 'goog.gears.BaseStore.SchemaType'], ['goog.Disposable']);
goog.addDependency('gears/database.js', ['goog.gears.Database', 'goog.gears.Database.EventType', 'goog.gears.Database.TransactionEvent'], ['goog.array', 'goog.debug', 'goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.json']);
goog.addDependency('gears/fakeworkerpool.js', ['goog.gears.FakeWorkerPool'], ['goog.Uri', 'goog.gears', 'goog.gears.WorkerPool', 'goog.net.XmlHttp']);
goog.addDependency('gears/gears.js', ['goog.gears'], ['goog.string']);
goog.addDependency('gears/httprequest.js', ['goog.gears.HttpRequest'], ['goog.Timer', 'goog.gears', 'goog.net.XmlHttp']);
goog.addDependency('gears/loggerclient.js', ['goog.gears.LoggerClient'], ['goog.Disposable', 'goog.debug', 'goog.debug.Logger']);
goog.addDependency('gears/loggerserver.js', ['goog.gears.LoggerServer'], ['goog.Disposable', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.gears.Worker.EventType']);
goog.addDependency('gears/logstore.js', ['goog.gears.LogStore', 'goog.gears.LogStore.Query'], ['goog.async.Delay', 'goog.debug.LogManager', 'goog.debug.LogRecord', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.gears.BaseStore', 'goog.gears.BaseStore.SchemaType', 'goog.json']);
goog.addDependency('gears/managedresourcestore.js', ['goog.gears.ManagedResourceStore', 'goog.gears.ManagedResourceStore.EventType', 'goog.gears.ManagedResourceStore.UpdateStatus', 'goog.gears.ManagedResourceStoreEvent'], ['goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.string']);
goog.addDependency('gears/multipartformdata.js', ['goog.gears.MultipartFormData'], ['goog.asserts', 'goog.gears', 'goog.string']);
goog.addDependency('gears/statustype.js', ['goog.gears.StatusType'], []);
goog.addDependency('gears/urlcapture.js', ['goog.gears.UrlCapture', 'goog.gears.UrlCapture.Event', 'goog.gears.UrlCapture.EventType'], ['goog.Uri', 'goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears']);
goog.addDependency('gears/worker.js', ['goog.gears.Worker', 'goog.gears.Worker.EventType', 'goog.gears.WorkerEvent'], ['goog.events.Event', 'goog.events.EventTarget']);
goog.addDependency('gears/workerpool.js', ['goog.gears.WorkerPool', 'goog.gears.WorkerPool.Event', 'goog.gears.WorkerPool.EventType'], ['goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.gears.Worker']);
goog.addDependency('graphics/abstractgraphics.js', ['goog.graphics.AbstractGraphics'], ['goog.graphics.Path', 'goog.math.Coordinate', 'goog.math.Size', 'goog.style', 'goog.ui.Component']);
goog.addDependency('graphics/affinetransform.js', ['goog.graphics.AffineTransform'], ['goog.math']);
goog.addDependency('graphics/canvaselement.js', ['goog.graphics.CanvasEllipseElement', 'goog.graphics.CanvasGroupElement', 'goog.graphics.CanvasImageElement', 'goog.graphics.CanvasPathElement', 'goog.graphics.CanvasRectElement', 'goog.graphics.CanvasTextElement'], ['goog.array', 'goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.Path', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/canvasgraphics.js', ['goog.graphics.CanvasGraphics'], ['goog.dom', 'goog.graphics.AbstractGraphics', 'goog.graphics.CanvasEllipseElement', 'goog.graphics.CanvasGroupElement', 'goog.graphics.CanvasImageElement', 'goog.graphics.CanvasPathElement', 'goog.graphics.CanvasRectElement', 'goog.graphics.CanvasTextElement', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.math.Size']);
goog.addDependency('graphics/element.js', ['goog.graphics.Element'], ['goog.events', 'goog.events.EventTarget', 'goog.graphics.AffineTransform', 'goog.math']);
goog.addDependency('graphics/ellipseelement.js', ['goog.graphics.EllipseElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/ext/coordinates.js', ['goog.graphics.ext.coordinates'], []);
goog.addDependency('graphics/ext/element.js', ['goog.graphics.ext.Element'], ['goog.events', 'goog.events.EventTarget', 'goog.functions', 'goog.graphics', 'goog.graphics.ext.coordinates']);
goog.addDependency('graphics/ext/ellipse.js', ['goog.graphics.ext.Ellipse'], ['goog.graphics.ext.StrokeAndFillElement']);
goog.addDependency('graphics/ext/ext.js', ['goog.graphics.ext'], ['goog.graphics.ext.Ellipse', 'goog.graphics.ext.Graphics', 'goog.graphics.ext.Group', 'goog.graphics.ext.Image', 'goog.graphics.ext.Rectangle', 'goog.graphics.ext.Shape', 'goog.graphics.ext.coordinates']);
goog.addDependency('graphics/ext/graphics.js', ['goog.graphics.ext.Graphics'], ['goog.graphics.ext.Group']);
goog.addDependency('graphics/ext/group.js', ['goog.graphics.ext.Group'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/ext/image.js', ['goog.graphics.ext.Image'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/ext/path.js', ['goog.graphics.ext.Path'], ['goog.graphics.AffineTransform', 'goog.graphics.Path', 'goog.math', 'goog.math.Rect']);
goog.addDependency('graphics/ext/rectangle.js', ['goog.graphics.ext.Rectangle'], ['goog.graphics.ext.StrokeAndFillElement']);
goog.addDependency('graphics/ext/shape.js', ['goog.graphics.ext.Shape'], ['goog.graphics.ext.Path', 'goog.graphics.ext.StrokeAndFillElement', 'goog.math.Rect']);
goog.addDependency('graphics/ext/strokeandfillelement.js', ['goog.graphics.ext.StrokeAndFillElement'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/fill.js', ['goog.graphics.Fill'], []);
goog.addDependency('graphics/font.js', ['goog.graphics.Font'], []);
goog.addDependency('graphics/graphics.js', ['goog.graphics'], ['goog.graphics.CanvasGraphics', 'goog.graphics.SvgGraphics', 'goog.graphics.VmlGraphics', 'goog.userAgent']);
goog.addDependency('graphics/groupelement.js', ['goog.graphics.GroupElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/imageelement.js', ['goog.graphics.ImageElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/lineargradient.js', ['goog.graphics.LinearGradient'], ['goog.graphics.Fill']);
goog.addDependency('graphics/path.js', ['goog.graphics.Path', 'goog.graphics.Path.Segment'], ['goog.array', 'goog.math']);
goog.addDependency('graphics/pathelement.js', ['goog.graphics.PathElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/paths.js', ['goog.graphics.paths'], ['goog.graphics.Path', 'goog.math.Coordinate']);
goog.addDependency('graphics/rectelement.js', ['goog.graphics.RectElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/solidfill.js', ['goog.graphics.SolidFill'], ['goog.graphics.Fill']);
goog.addDependency('graphics/stroke.js', ['goog.graphics.Stroke'], []);
goog.addDependency('graphics/strokeandfillelement.js', ['goog.graphics.StrokeAndFillElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/svgelement.js', ['goog.graphics.SvgEllipseElement', 'goog.graphics.SvgGroupElement', 'goog.graphics.SvgImageElement', 'goog.graphics.SvgPathElement', 'goog.graphics.SvgRectElement', 'goog.graphics.SvgTextElement'], ['goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/svggraphics.js', ['goog.graphics.SvgGraphics'], ['goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.graphics.AbstractGraphics', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.SvgEllipseElement', 'goog.graphics.SvgGroupElement', 'goog.graphics.SvgImageElement', 'goog.graphics.SvgPathElement', 'goog.graphics.SvgRectElement', 'goog.graphics.SvgTextElement', 'goog.math.Size', 'goog.userAgent']);
goog.addDependency('graphics/textelement.js', ['goog.graphics.TextElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/vmlelement.js', ['goog.graphics.VmlEllipseElement', 'goog.graphics.VmlGroupElement', 'goog.graphics.VmlImageElement', 'goog.graphics.VmlPathElement', 'goog.graphics.VmlRectElement', 'goog.graphics.VmlTextElement'], ['goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/vmlgraphics.js', ['goog.graphics.VmlGraphics'], ['goog.array', 'goog.dom', 'goog.events.EventHandler', 'goog.graphics.AbstractGraphics', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.VmlEllipseElement', 'goog.graphics.VmlGroupElement', 'goog.graphics.VmlImageElement', 'goog.graphics.VmlPathElement', 'goog.graphics.VmlRectElement', 'goog.graphics.VmlTextElement', 'goog.math.Size', 'goog.string']);
goog.addDependency('history/event.js', ['goog.history.Event'], ['goog.events.Event', 'goog.history.EventType']);
goog.addDependency('history/eventtype.js', ['goog.history.EventType'], []);
goog.addDependency('history/history.js', ['goog.History', 'goog.History.Event', 'goog.History.EventType'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.history.Event', 'goog.history.EventType', 'goog.string', 'goog.userAgent']);
goog.addDependency('history/html5history.js', ['goog.history.Html5History'], ['goog.asserts', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.history.Event', 'goog.history.EventType']);
goog.addDependency('i18n/bidi.js', ['goog.i18n.bidi'], []);
goog.addDependency('i18n/bidiformatter.js', ['goog.i18n.BidiFormatter'], ['goog.i18n.bidi', 'goog.string']);
goog.addDependency('i18n/charlistdecompressor.js', ['goog.i18n.CharListDecompressor'], ['goog.array', 'goog.i18n.uChar']);
goog.addDependency('i18n/charpickerdata.js', ['goog.i18n.CharPickerData'], []);
goog.addDependency('i18n/currency.js', ['goog.i18n.currency'], []);
goog.addDependency('i18n/currencycodemap.js', ['goog.i18n.currencyCodeMap'], []);
goog.addDependency('i18n/datetimeformat.js', ['goog.i18n.DateTimeFormat'], ['goog.asserts', 'goog.i18n.DateTimeSymbols', 'goog.i18n.TimeZone', 'goog.string']);
goog.addDependency('i18n/datetimeparse.js', ['goog.i18n.DateTimeParse'], ['goog.i18n.DateTimeFormat', 'goog.i18n.DateTimeSymbols']);
goog.addDependency('i18n/datetimepatterns.js', ['goog.i18n.DateTimePatterns', 'goog.i18n.DateTimePatterns_am', 'goog.i18n.DateTimePatterns_ar', 'goog.i18n.DateTimePatterns_bg', 'goog.i18n.DateTimePatterns_bn', 'goog.i18n.DateTimePatterns_ca', 'goog.i18n.DateTimePatterns_cs', 'goog.i18n.DateTimePatterns_da', 'goog.i18n.DateTimePatterns_de', 'goog.i18n.DateTimePatterns_de_AT', 'goog.i18n.DateTimePatterns_de_CH', 'goog.i18n.DateTimePatterns_el', 'goog.i18n.DateTimePatterns_en', 'goog.i18n.DateTimePatterns_en_AU', 'goog.i18n.DateTimePatterns_en_GB', 'goog.i18n.DateTimePatterns_en_IE', 'goog.i18n.DateTimePatterns_en_IN', 'goog.i18n.DateTimePatterns_en_SG', 'goog.i18n.DateTimePatterns_en_US', 'goog.i18n.DateTimePatterns_en_ZA', 'goog.i18n.DateTimePatterns_es', 'goog.i18n.DateTimePatterns_et', 'goog.i18n.DateTimePatterns_eu', 'goog.i18n.DateTimePatterns_fa', 'goog.i18n.DateTimePatterns_fi', 'goog.i18n.DateTimePatterns_fil', 'goog.i18n.DateTimePatterns_fr', 'goog.i18n.DateTimePatterns_fr_CA', 'goog.i18n.DateTimePatterns_gl', 'goog.i18n.DateTimePatterns_gsw', 'goog.i18n.DateTimePatterns_gu', 'goog.i18n.DateTimePatterns_he', 'goog.i18n.DateTimePatterns_hi', 'goog.i18n.DateTimePatterns_hr', 'goog.i18n.DateTimePatterns_hu', 'goog.i18n.DateTimePatterns_id', 'goog.i18n.DateTimePatterns_is', 'goog.i18n.DateTimePatterns_it', 'goog.i18n.DateTimePatterns_ja', 'goog.i18n.DateTimePatterns_kn', 'goog.i18n.DateTimePatterns_ko', 'goog.i18n.DateTimePatterns_lt', 'goog.i18n.DateTimePatterns_lv', 'goog.i18n.DateTimePatterns_ml', 'goog.i18n.DateTimePatterns_mr', 'goog.i18n.DateTimePatterns_ms', 'goog.i18n.DateTimePatterns_mt', 'goog.i18n.DateTimePatterns_nl', 'goog.i18n.DateTimePatterns_or', 'goog.i18n.DateTimePatterns_pl', 'goog.i18n.DateTimePatterns_pt', 'goog.i18n.DateTimePatterns_pt_BR', 'goog.i18n.DateTimePatterns_pt_PT', 'goog.i18n.DateTimePatterns_ro', 'goog.i18n.DateTimePatterns_ru', 'goog.i18n.DateTimePatterns_sk', 'goog.i18n.DateTimePatterns_sl', 'goog.i18n.DateTimePatterns_sq', 'goog.i18n.DateTimePatterns_sr', 'goog.i18n.DateTimePatterns_sv', 'goog.i18n.DateTimePatterns_sw', 'goog.i18n.DateTimePatterns_ta', 'goog.i18n.DateTimePatterns_te', 'goog.i18n.DateTimePatterns_th', 'goog.i18n.DateTimePatterns_tr', 'goog.i18n.DateTimePatterns_uk', 'goog.i18n.DateTimePatterns_ur', 'goog.i18n.DateTimePatterns_vi', 'goog.i18n.DateTimePatterns_zh'], []);
goog.addDependency('i18n/datetimepatternsext.js', ['goog.i18n.DateTimePatternsExt', 'goog.i18n.DateTimePatterns_af', 'goog.i18n.DateTimePatterns_af_NA', 'goog.i18n.DateTimePatterns_af_ZA', 'goog.i18n.DateTimePatterns_ak', 'goog.i18n.DateTimePatterns_ak_GH', 'goog.i18n.DateTimePatterns_am_ET', 'goog.i18n.DateTimePatterns_ar_AE', 'goog.i18n.DateTimePatterns_ar_BH', 'goog.i18n.DateTimePatterns_ar_DZ', 'goog.i18n.DateTimePatterns_ar_EG', 'goog.i18n.DateTimePatterns_ar_IQ', 'goog.i18n.DateTimePatterns_ar_JO', 'goog.i18n.DateTimePatterns_ar_KW', 'goog.i18n.DateTimePatterns_ar_LB', 'goog.i18n.DateTimePatterns_ar_LY', 'goog.i18n.DateTimePatterns_ar_MA', 'goog.i18n.DateTimePatterns_ar_OM', 'goog.i18n.DateTimePatterns_ar_QA', 'goog.i18n.DateTimePatterns_ar_SA', 'goog.i18n.DateTimePatterns_ar_SD', 'goog.i18n.DateTimePatterns_ar_SY', 'goog.i18n.DateTimePatterns_ar_TN', 'goog.i18n.DateTimePatterns_ar_YE', 'goog.i18n.DateTimePatterns_as', 'goog.i18n.DateTimePatterns_as_IN', 'goog.i18n.DateTimePatterns_asa', 'goog.i18n.DateTimePatterns_asa_TZ', 'goog.i18n.DateTimePatterns_az', 'goog.i18n.DateTimePatterns_az_Cyrl', 'goog.i18n.DateTimePatterns_az_Cyrl_AZ', 'goog.i18n.DateTimePatterns_az_Latn', 'goog.i18n.DateTimePatterns_az_Latn_AZ', 'goog.i18n.DateTimePatterns_be', 'goog.i18n.DateTimePatterns_be_BY', 'goog.i18n.DateTimePatterns_bem', 'goog.i18n.DateTimePatterns_bem_ZM', 'goog.i18n.DateTimePatterns_bez', 'goog.i18n.DateTimePatterns_bez_TZ', 'goog.i18n.DateTimePatterns_bg_BG', 'goog.i18n.DateTimePatterns_bm', 'goog.i18n.DateTimePatterns_bm_ML', 'goog.i18n.DateTimePatterns_bn_BD', 'goog.i18n.DateTimePatterns_bn_IN', 'goog.i18n.DateTimePatterns_bo', 'goog.i18n.DateTimePatterns_bo_CN', 'goog.i18n.DateTimePatterns_bo_IN', 'goog.i18n.DateTimePatterns_ca_ES', 'goog.i18n.DateTimePatterns_cgg', 'goog.i18n.DateTimePatterns_cgg_UG', 'goog.i18n.DateTimePatterns_chr', 'goog.i18n.DateTimePatterns_chr_US', 'goog.i18n.DateTimePatterns_cs_CZ', 'goog.i18n.DateTimePatterns_cy', 'goog.i18n.DateTimePatterns_cy_GB', 'goog.i18n.DateTimePatterns_da_DK', 'goog.i18n.DateTimePatterns_dav', 'goog.i18n.DateTimePatterns_dav_KE', 'goog.i18n.DateTimePatterns_de_BE', 'goog.i18n.DateTimePatterns_de_DE', 'goog.i18n.DateTimePatterns_de_LI', 'goog.i18n.DateTimePatterns_de_LU', 'goog.i18n.DateTimePatterns_ebu', 'goog.i18n.DateTimePatterns_ebu_KE', 'goog.i18n.DateTimePatterns_ee', 'goog.i18n.DateTimePatterns_ee_GH', 'goog.i18n.DateTimePatterns_ee_TG', 'goog.i18n.DateTimePatterns_el_CY', 'goog.i18n.DateTimePatterns_el_GR', 'goog.i18n.DateTimePatterns_en_BE', 'goog.i18n.DateTimePatterns_en_BW', 'goog.i18n.DateTimePatterns_en_BZ', 'goog.i18n.DateTimePatterns_en_CA', 'goog.i18n.DateTimePatterns_en_HK', 'goog.i18n.DateTimePatterns_en_JM', 'goog.i18n.DateTimePatterns_en_MH', 'goog.i18n.DateTimePatterns_en_MT', 'goog.i18n.DateTimePatterns_en_MU', 'goog.i18n.DateTimePatterns_en_NA', 'goog.i18n.DateTimePatterns_en_NZ', 'goog.i18n.DateTimePatterns_en_PH', 'goog.i18n.DateTimePatterns_en_PK', 'goog.i18n.DateTimePatterns_en_TT', 'goog.i18n.DateTimePatterns_en_US_POSIX', 'goog.i18n.DateTimePatterns_en_VI', 'goog.i18n.DateTimePatterns_en_ZW', 'goog.i18n.DateTimePatterns_eo', 'goog.i18n.DateTimePatterns_es_AR', 'goog.i18n.DateTimePatterns_es_BO', 'goog.i18n.DateTimePatterns_es_CL', 'goog.i18n.DateTimePatterns_es_CO', 'goog.i18n.DateTimePatterns_es_CR', 'goog.i18n.DateTimePatterns_es_DO', 'goog.i18n.DateTimePatterns_es_EC', 'goog.i18n.DateTimePatterns_es_ES', 'goog.i18n.DateTimePatterns_es_GQ', 'goog.i18n.DateTimePatterns_es_GT', 'goog.i18n.DateTimePatterns_es_HN', 'goog.i18n.DateTimePatterns_es_MX', 'goog.i18n.DateTimePatterns_es_NI', 'goog.i18n.DateTimePatterns_es_PA', 'goog.i18n.DateTimePatterns_es_PE', 'goog.i18n.DateTimePatterns_es_PR', 'goog.i18n.DateTimePatterns_es_PY', 'goog.i18n.DateTimePatterns_es_SV', 'goog.i18n.DateTimePatterns_es_US', 'goog.i18n.DateTimePatterns_es_UY', 'goog.i18n.DateTimePatterns_es_VE', 'goog.i18n.DateTimePatterns_et_EE', 'goog.i18n.DateTimePatterns_eu_ES', 'goog.i18n.DateTimePatterns_fa_AF', 'goog.i18n.DateTimePatterns_fa_IR', 'goog.i18n.DateTimePatterns_ff', 'goog.i18n.DateTimePatterns_ff_SN', 'goog.i18n.DateTimePatterns_fi_FI', 'goog.i18n.DateTimePatterns_fil_PH', 'goog.i18n.DateTimePatterns_fo', 'goog.i18n.DateTimePatterns_fo_FO', 'goog.i18n.DateTimePatterns_fr_BE', 'goog.i18n.DateTimePatterns_fr_BL', 'goog.i18n.DateTimePatterns_fr_CF', 'goog.i18n.DateTimePatterns_fr_CH', 'goog.i18n.DateTimePatterns_fr_CI', 'goog.i18n.DateTimePatterns_fr_CM', 'goog.i18n.DateTimePatterns_fr_FR', 'goog.i18n.DateTimePatterns_fr_GN', 'goog.i18n.DateTimePatterns_fr_GP', 'goog.i18n.DateTimePatterns_fr_LU', 'goog.i18n.DateTimePatterns_fr_MC', 'goog.i18n.DateTimePatterns_fr_MF', 'goog.i18n.DateTimePatterns_fr_MG', 'goog.i18n.DateTimePatterns_fr_ML', 'goog.i18n.DateTimePatterns_fr_MQ', 'goog.i18n.DateTimePatterns_fr_NE', 'goog.i18n.DateTimePatterns_fr_RE', 'goog.i18n.DateTimePatterns_fr_SN', 'goog.i18n.DateTimePatterns_ga', 'goog.i18n.DateTimePatterns_ga_IE', 'goog.i18n.DateTimePatterns_gl_ES', 'goog.i18n.DateTimePatterns_gsw_CH', 'goog.i18n.DateTimePatterns_gu_IN', 'goog.i18n.DateTimePatterns_guz', 'goog.i18n.DateTimePatterns_guz_KE', 'goog.i18n.DateTimePatterns_gv', 'goog.i18n.DateTimePatterns_gv_GB', 'goog.i18n.DateTimePatterns_ha', 'goog.i18n.DateTimePatterns_ha_Latn', 'goog.i18n.DateTimePatterns_ha_Latn_GH', 'goog.i18n.DateTimePatterns_ha_Latn_NE', 'goog.i18n.DateTimePatterns_ha_Latn_NG', 'goog.i18n.DateTimePatterns_haw', 'goog.i18n.DateTimePatterns_haw_US', 'goog.i18n.DateTimePatterns_he_IL', 'goog.i18n.DateTimePatterns_hi_IN', 'goog.i18n.DateTimePatterns_hr_HR', 'goog.i18n.DateTimePatterns_hu_HU', 'goog.i18n.DateTimePatterns_hy', 'goog.i18n.DateTimePatterns_hy_AM', 'goog.i18n.DateTimePatterns_id_ID', 'goog.i18n.DateTimePatterns_ig', 'goog.i18n.DateTimePatterns_ig_NG', 'goog.i18n.DateTimePatterns_ii', 'goog.i18n.DateTimePatterns_ii_CN', 'goog.i18n.DateTimePatterns_is_IS', 'goog.i18n.DateTimePatterns_it_CH', 'goog.i18n.DateTimePatterns_it_IT', 'goog.i18n.DateTimePatterns_ja_JP', 'goog.i18n.DateTimePatterns_jmc', 'goog.i18n.DateTimePatterns_jmc_TZ', 'goog.i18n.DateTimePatterns_ka', 'goog.i18n.DateTimePatterns_ka_GE', 'goog.i18n.DateTimePatterns_kab', 'goog.i18n.DateTimePatterns_kab_DZ', 'goog.i18n.DateTimePatterns_kam', 'goog.i18n.DateTimePatterns_kam_KE', 'goog.i18n.DateTimePatterns_kde', 'goog.i18n.DateTimePatterns_kde_TZ', 'goog.i18n.DateTimePatterns_kea', 'goog.i18n.DateTimePatterns_kea_CV', 'goog.i18n.DateTimePatterns_khq', 'goog.i18n.DateTimePatterns_khq_ML', 'goog.i18n.DateTimePatterns_ki', 'goog.i18n.DateTimePatterns_ki_KE', 'goog.i18n.DateTimePatterns_kk', 'goog.i18n.DateTimePatterns_kk_Cyrl', 'goog.i18n.DateTimePatterns_kk_Cyrl_KZ', 'goog.i18n.DateTimePatterns_kl', 'goog.i18n.DateTimePatterns_kl_GL', 'goog.i18n.DateTimePatterns_kln', 'goog.i18n.DateTimePatterns_kln_KE', 'goog.i18n.DateTimePatterns_km', 'goog.i18n.DateTimePatterns_km_KH', 'goog.i18n.DateTimePatterns_kn_IN', 'goog.i18n.DateTimePatterns_ko_KR', 'goog.i18n.DateTimePatterns_kok', 'goog.i18n.DateTimePatterns_kok_IN', 'goog.i18n.DateTimePatterns_kw', 'goog.i18n.DateTimePatterns_kw_GB', 'goog.i18n.DateTimePatterns_lag', 'goog.i18n.DateTimePatterns_lag_TZ', 'goog.i18n.DateTimePatterns_lg', 'goog.i18n.DateTimePatterns_lg_UG', 'goog.i18n.DateTimePatterns_lt_LT', 'goog.i18n.DateTimePatterns_luo', 'goog.i18n.DateTimePatterns_luo_KE', 'goog.i18n.DateTimePatterns_luy', 'goog.i18n.DateTimePatterns_luy_KE', 'goog.i18n.DateTimePatterns_lv_LV', 'goog.i18n.DateTimePatterns_mas', 'goog.i18n.DateTimePatterns_mas_KE', 'goog.i18n.DateTimePatterns_mas_TZ', 'goog.i18n.DateTimePatterns_mer', 'goog.i18n.DateTimePatterns_mer_KE', 'goog.i18n.DateTimePatterns_mfe', 'goog.i18n.DateTimePatterns_mfe_MU', 'goog.i18n.DateTimePatterns_mg', 'goog.i18n.DateTimePatterns_mg_MG', 'goog.i18n.DateTimePatterns_mk', 'goog.i18n.DateTimePatterns_mk_MK', 'goog.i18n.DateTimePatterns_ml_IN', 'goog.i18n.DateTimePatterns_mr_IN', 'goog.i18n.DateTimePatterns_ms_BN', 'goog.i18n.DateTimePatterns_ms_MY', 'goog.i18n.DateTimePatterns_mt_MT', 'goog.i18n.DateTimePatterns_naq', 'goog.i18n.DateTimePatterns_naq_NA', 'goog.i18n.DateTimePatterns_nb', 'goog.i18n.DateTimePatterns_nb_NO', 'goog.i18n.DateTimePatterns_nd', 'goog.i18n.DateTimePatterns_nd_ZW', 'goog.i18n.DateTimePatterns_ne', 'goog.i18n.DateTimePatterns_ne_IN', 'goog.i18n.DateTimePatterns_ne_NP', 'goog.i18n.DateTimePatterns_nl_BE', 'goog.i18n.DateTimePatterns_nl_NL', 'goog.i18n.DateTimePatterns_nn', 'goog.i18n.DateTimePatterns_nn_NO', 'goog.i18n.DateTimePatterns_nyn', 'goog.i18n.DateTimePatterns_nyn_UG', 'goog.i18n.DateTimePatterns_om', 'goog.i18n.DateTimePatterns_om_ET', 'goog.i18n.DateTimePatterns_om_KE', 'goog.i18n.DateTimePatterns_or_IN', 'goog.i18n.DateTimePatterns_pa', 'goog.i18n.DateTimePatterns_pa_Arab', 'goog.i18n.DateTimePatterns_pa_Arab_PK', 'goog.i18n.DateTimePatterns_pa_Guru', 'goog.i18n.DateTimePatterns_pa_Guru_IN', 'goog.i18n.DateTimePatterns_pl_PL', 'goog.i18n.DateTimePatterns_ps', 'goog.i18n.DateTimePatterns_ps_AF', 'goog.i18n.DateTimePatterns_pt_GW', 'goog.i18n.DateTimePatterns_pt_MZ', 'goog.i18n.DateTimePatterns_rm', 'goog.i18n.DateTimePatterns_rm_CH', 'goog.i18n.DateTimePatterns_ro_MD', 'goog.i18n.DateTimePatterns_ro_RO', 'goog.i18n.DateTimePatterns_rof', 'goog.i18n.DateTimePatterns_rof_TZ', 'goog.i18n.DateTimePatterns_ru_MD', 'goog.i18n.DateTimePatterns_ru_RU', 'goog.i18n.DateTimePatterns_ru_UA', 'goog.i18n.DateTimePatterns_rw', 'goog.i18n.DateTimePatterns_rw_RW', 'goog.i18n.DateTimePatterns_rwk', 'goog.i18n.DateTimePatterns_rwk_TZ', 'goog.i18n.DateTimePatterns_saq', 'goog.i18n.DateTimePatterns_saq_KE', 'goog.i18n.DateTimePatterns_seh', 'goog.i18n.DateTimePatterns_seh_MZ', 'goog.i18n.DateTimePatterns_ses', 'goog.i18n.DateTimePatterns_ses_ML', 'goog.i18n.DateTimePatterns_sg', 'goog.i18n.DateTimePatterns_sg_CF', 'goog.i18n.DateTimePatterns_shi', 'goog.i18n.DateTimePatterns_shi_Latn', 'goog.i18n.DateTimePatterns_shi_Latn_MA', 'goog.i18n.DateTimePatterns_shi_Tfng', 'goog.i18n.DateTimePatterns_shi_Tfng_MA', 'goog.i18n.DateTimePatterns_si', 'goog.i18n.DateTimePatterns_si_LK', 'goog.i18n.DateTimePatterns_sk_SK', 'goog.i18n.DateTimePatterns_sl_SI', 'goog.i18n.DateTimePatterns_sn', 'goog.i18n.DateTimePatterns_sn_ZW', 'goog.i18n.DateTimePatterns_so', 'goog.i18n.DateTimePatterns_so_DJ', 'goog.i18n.DateTimePatterns_so_ET', 'goog.i18n.DateTimePatterns_so_KE', 'goog.i18n.DateTimePatterns_so_SO', 'goog.i18n.DateTimePatterns_sq_AL', 'goog.i18n.DateTimePatterns_sr_Cyrl', 'goog.i18n.DateTimePatterns_sr_Cyrl_BA', 'goog.i18n.DateTimePatterns_sr_Cyrl_ME', 'goog.i18n.DateTimePatterns_sr_Cyrl_RS', 'goog.i18n.DateTimePatterns_sr_Latn', 'goog.i18n.DateTimePatterns_sr_Latn_BA', 'goog.i18n.DateTimePatterns_sr_Latn_ME', 'goog.i18n.DateTimePatterns_sr_Latn_RS', 'goog.i18n.DateTimePatterns_sv_FI', 'goog.i18n.DateTimePatterns_sv_SE', 'goog.i18n.DateTimePatterns_sw_KE', 'goog.i18n.DateTimePatterns_sw_TZ', 'goog.i18n.DateTimePatterns_ta_IN', 'goog.i18n.DateTimePatterns_ta_LK', 'goog.i18n.DateTimePatterns_te_IN', 'goog.i18n.DateTimePatterns_teo', 'goog.i18n.DateTimePatterns_teo_KE', 'goog.i18n.DateTimePatterns_teo_UG', 'goog.i18n.DateTimePatterns_th_TH', 'goog.i18n.DateTimePatterns_ti', 'goog.i18n.DateTimePatterns_ti_ER', 'goog.i18n.DateTimePatterns_ti_ET', 'goog.i18n.DateTimePatterns_tl_PH', 'goog.i18n.DateTimePatterns_to', 'goog.i18n.DateTimePatterns_to_TO', 'goog.i18n.DateTimePatterns_tr_TR', 'goog.i18n.DateTimePatterns_tzm', 'goog.i18n.DateTimePatterns_tzm_Latn', 'goog.i18n.DateTimePatterns_tzm_Latn_MA', 'goog.i18n.DateTimePatterns_uk_UA', 'goog.i18n.DateTimePatterns_ur_IN', 'goog.i18n.DateTimePatterns_ur_PK', 'goog.i18n.DateTimePatterns_uz', 'goog.i18n.DateTimePatterns_uz_Arab', 'goog.i18n.DateTimePatterns_uz_Arab_AF', 'goog.i18n.DateTimePatterns_uz_Cyrl', 'goog.i18n.DateTimePatterns_uz_Cyrl_UZ', 'goog.i18n.DateTimePatterns_uz_Latn', 'goog.i18n.DateTimePatterns_uz_Latn_UZ', 'goog.i18n.DateTimePatterns_vi_VN', 'goog.i18n.DateTimePatterns_vun', 'goog.i18n.DateTimePatterns_vun_TZ', 'goog.i18n.DateTimePatterns_xog', 'goog.i18n.DateTimePatterns_xog_UG', 'goog.i18n.DateTimePatterns_yo', 'goog.i18n.DateTimePatterns_yo_NG', 'goog.i18n.DateTimePatterns_zh_Hans', 'goog.i18n.DateTimePatterns_zh_Hans_CN', 'goog.i18n.DateTimePatterns_zh_Hans_HK', 'goog.i18n.DateTimePatterns_zh_Hans_MO', 'goog.i18n.DateTimePatterns_zh_Hans_SG', 'goog.i18n.DateTimePatterns_zh_Hant', 'goog.i18n.DateTimePatterns_zh_Hant_HK', 'goog.i18n.DateTimePatterns_zh_Hant_MO', 'goog.i18n.DateTimePatterns_zh_Hant_TW', 'goog.i18n.DateTimePatterns_zu', 'goog.i18n.DateTimePatterns_zu_ZA'], ['goog.i18n.DateTimePatterns']);
goog.addDependency('i18n/datetimesymbols.js', ['goog.i18n.DateTimeSymbols', 'goog.i18n.DateTimeSymbols_am', 'goog.i18n.DateTimeSymbols_ar', 'goog.i18n.DateTimeSymbols_bg', 'goog.i18n.DateTimeSymbols_bn', 'goog.i18n.DateTimeSymbols_ca', 'goog.i18n.DateTimeSymbols_cs', 'goog.i18n.DateTimeSymbols_da', 'goog.i18n.DateTimeSymbols_de', 'goog.i18n.DateTimeSymbols_de_AT', 'goog.i18n.DateTimeSymbols_de_CH', 'goog.i18n.DateTimeSymbols_el', 'goog.i18n.DateTimeSymbols_en', 'goog.i18n.DateTimeSymbols_en_AU', 'goog.i18n.DateTimeSymbols_en_GB', 'goog.i18n.DateTimeSymbols_en_IE', 'goog.i18n.DateTimeSymbols_en_IN', 'goog.i18n.DateTimeSymbols_en_ISO', 'goog.i18n.DateTimeSymbols_en_SG', 'goog.i18n.DateTimeSymbols_en_US', 'goog.i18n.DateTimeSymbols_en_ZA', 'goog.i18n.DateTimeSymbols_es', 'goog.i18n.DateTimeSymbols_et', 'goog.i18n.DateTimeSymbols_eu', 'goog.i18n.DateTimeSymbols_fa', 'goog.i18n.DateTimeSymbols_fi', 'goog.i18n.DateTimeSymbols_fil', 'goog.i18n.DateTimeSymbols_fr', 'goog.i18n.DateTimeSymbols_fr_CA', 'goog.i18n.DateTimeSymbols_gl', 'goog.i18n.DateTimeSymbols_gsw', 'goog.i18n.DateTimeSymbols_gu', 'goog.i18n.DateTimeSymbols_he', 'goog.i18n.DateTimeSymbols_hi', 'goog.i18n.DateTimeSymbols_hr', 'goog.i18n.DateTimeSymbols_hu', 'goog.i18n.DateTimeSymbols_id', 'goog.i18n.DateTimeSymbols_in', 'goog.i18n.DateTimeSymbols_is', 'goog.i18n.DateTimeSymbols_it', 'goog.i18n.DateTimeSymbols_iw', 'goog.i18n.DateTimeSymbols_ja', 'goog.i18n.DateTimeSymbols_kn', 'goog.i18n.DateTimeSymbols_ko', 'goog.i18n.DateTimeSymbols_ln', 'goog.i18n.DateTimeSymbols_lt', 'goog.i18n.DateTimeSymbols_lv', 'goog.i18n.DateTimeSymbols_ml', 'goog.i18n.DateTimeSymbols_mo', 'goog.i18n.DateTimeSymbols_mr', 'goog.i18n.DateTimeSymbols_ms', 'goog.i18n.DateTimeSymbols_mt', 'goog.i18n.DateTimeSymbols_nl', 'goog.i18n.DateTimeSymbols_no', 'goog.i18n.DateTimeSymbols_or', 'goog.i18n.DateTimeSymbols_pl', 'goog.i18n.DateTimeSymbols_pt', 'goog.i18n.DateTimeSymbols_pt_BR', 'goog.i18n.DateTimeSymbols_pt_PT', 'goog.i18n.DateTimeSymbols_ro', 'goog.i18n.DateTimeSymbols_ru', 'goog.i18n.DateTimeSymbols_sk', 'goog.i18n.DateTimeSymbols_sl', 'goog.i18n.DateTimeSymbols_sq', 'goog.i18n.DateTimeSymbols_sr', 'goog.i18n.DateTimeSymbols_sv', 'goog.i18n.DateTimeSymbols_sw', 'goog.i18n.DateTimeSymbols_ta', 'goog.i18n.DateTimeSymbols_te', 'goog.i18n.DateTimeSymbols_th', 'goog.i18n.DateTimeSymbols_tl', 'goog.i18n.DateTimeSymbols_tr', 'goog.i18n.DateTimeSymbols_uk', 'goog.i18n.DateTimeSymbols_ur', 'goog.i18n.DateTimeSymbols_vi', 'goog.i18n.DateTimeSymbols_zh', 'goog.i18n.DateTimeSymbols_zh_CN', 'goog.i18n.DateTimeSymbols_zh_HK', 'goog.i18n.DateTimeSymbols_zh_TW'], []);
goog.addDependency('i18n/datetimesymbolsext.js', ['goog.i18n.DateTimeSymbolsExt', 'goog.i18n.DateTimeSymbols_aa', 'goog.i18n.DateTimeSymbols_aa_DJ', 'goog.i18n.DateTimeSymbols_aa_ER', 'goog.i18n.DateTimeSymbols_aa_ER_SAAHO', 'goog.i18n.DateTimeSymbols_aa_ET', 'goog.i18n.DateTimeSymbols_af', 'goog.i18n.DateTimeSymbols_af_NA', 'goog.i18n.DateTimeSymbols_af_ZA', 'goog.i18n.DateTimeSymbols_ak', 'goog.i18n.DateTimeSymbols_ak_GH', 'goog.i18n.DateTimeSymbols_am_ET', 'goog.i18n.DateTimeSymbols_ar_AE', 'goog.i18n.DateTimeSymbols_ar_BH', 'goog.i18n.DateTimeSymbols_ar_DZ', 'goog.i18n.DateTimeSymbols_ar_EG', 'goog.i18n.DateTimeSymbols_ar_IQ', 'goog.i18n.DateTimeSymbols_ar_JO', 'goog.i18n.DateTimeSymbols_ar_KW', 'goog.i18n.DateTimeSymbols_ar_LB', 'goog.i18n.DateTimeSymbols_ar_LY', 'goog.i18n.DateTimeSymbols_ar_MA', 'goog.i18n.DateTimeSymbols_ar_OM', 'goog.i18n.DateTimeSymbols_ar_QA', 'goog.i18n.DateTimeSymbols_ar_SA', 'goog.i18n.DateTimeSymbols_ar_SD', 'goog.i18n.DateTimeSymbols_ar_SY', 'goog.i18n.DateTimeSymbols_ar_TN', 'goog.i18n.DateTimeSymbols_ar_YE', 'goog.i18n.DateTimeSymbols_as', 'goog.i18n.DateTimeSymbols_as_IN', 'goog.i18n.DateTimeSymbols_az', 'goog.i18n.DateTimeSymbols_az_AZ', 'goog.i18n.DateTimeSymbols_az_Cyrl', 'goog.i18n.DateTimeSymbols_az_Cyrl_AZ', 'goog.i18n.DateTimeSymbols_az_Latn', 'goog.i18n.DateTimeSymbols_az_Latn_AZ', 'goog.i18n.DateTimeSymbols_be', 'goog.i18n.DateTimeSymbols_be_BY', 'goog.i18n.DateTimeSymbols_bg_BG', 'goog.i18n.DateTimeSymbols_bn_BD', 'goog.i18n.DateTimeSymbols_bn_IN', 'goog.i18n.DateTimeSymbols_bo', 'goog.i18n.DateTimeSymbols_bo_CN', 'goog.i18n.DateTimeSymbols_bo_IN', 'goog.i18n.DateTimeSymbols_bs', 'goog.i18n.DateTimeSymbols_bs_BA', 'goog.i18n.DateTimeSymbols_byn', 'goog.i18n.DateTimeSymbols_byn_ER', 'goog.i18n.DateTimeSymbols_ca_ES', 'goog.i18n.DateTimeSymbols_cch', 'goog.i18n.DateTimeSymbols_cch_NG', 'goog.i18n.DateTimeSymbols_cop', 'goog.i18n.DateTimeSymbols_cs_CZ', 'goog.i18n.DateTimeSymbols_cy', 'goog.i18n.DateTimeSymbols_cy_GB', 'goog.i18n.DateTimeSymbols_da_DK', 'goog.i18n.DateTimeSymbols_de_BE', 'goog.i18n.DateTimeSymbols_de_DE', 'goog.i18n.DateTimeSymbols_de_LI', 'goog.i18n.DateTimeSymbols_de_LU', 'goog.i18n.DateTimeSymbols_dv', 'goog.i18n.DateTimeSymbols_dv_MV', 'goog.i18n.DateTimeSymbols_dz', 'goog.i18n.DateTimeSymbols_dz_BT', 'goog.i18n.DateTimeSymbols_ee', 'goog.i18n.DateTimeSymbols_ee_GH', 'goog.i18n.DateTimeSymbols_ee_TG', 'goog.i18n.DateTimeSymbols_el_CY', 'goog.i18n.DateTimeSymbols_el_GR', 'goog.i18n.DateTimeSymbols_el_POLYTON', 'goog.i18n.DateTimeSymbols_en_AS', 'goog.i18n.DateTimeSymbols_en_BE', 'goog.i18n.DateTimeSymbols_en_BW', 'goog.i18n.DateTimeSymbols_en_BZ', 'goog.i18n.DateTimeSymbols_en_CA', 'goog.i18n.DateTimeSymbols_en_Dsrt', 'goog.i18n.DateTimeSymbols_en_Dsrt_US', 'goog.i18n.DateTimeSymbols_en_GU', 'goog.i18n.DateTimeSymbols_en_HK', 'goog.i18n.DateTimeSymbols_en_JM', 'goog.i18n.DateTimeSymbols_en_MH', 'goog.i18n.DateTimeSymbols_en_MP', 'goog.i18n.DateTimeSymbols_en_MT', 'goog.i18n.DateTimeSymbols_en_NA', 'goog.i18n.DateTimeSymbols_en_NZ', 'goog.i18n.DateTimeSymbols_en_PH', 'goog.i18n.DateTimeSymbols_en_PK', 'goog.i18n.DateTimeSymbols_en_Shaw', 'goog.i18n.DateTimeSymbols_en_TT', 'goog.i18n.DateTimeSymbols_en_UM', 'goog.i18n.DateTimeSymbols_en_VI', 'goog.i18n.DateTimeSymbols_en_ZW', 'goog.i18n.DateTimeSymbols_eo', 'goog.i18n.DateTimeSymbols_es_AR', 'goog.i18n.DateTimeSymbols_es_BO', 'goog.i18n.DateTimeSymbols_es_CL', 'goog.i18n.DateTimeSymbols_es_CO', 'goog.i18n.DateTimeSymbols_es_CR', 'goog.i18n.DateTimeSymbols_es_DO', 'goog.i18n.DateTimeSymbols_es_EC', 'goog.i18n.DateTimeSymbols_es_ES', 'goog.i18n.DateTimeSymbols_es_GT', 'goog.i18n.DateTimeSymbols_es_HN', 'goog.i18n.DateTimeSymbols_es_MX', 'goog.i18n.DateTimeSymbols_es_NI', 'goog.i18n.DateTimeSymbols_es_PA', 'goog.i18n.DateTimeSymbols_es_PE', 'goog.i18n.DateTimeSymbols_es_PR', 'goog.i18n.DateTimeSymbols_es_PY', 'goog.i18n.DateTimeSymbols_es_SV', 'goog.i18n.DateTimeSymbols_es_US', 'goog.i18n.DateTimeSymbols_es_UY', 'goog.i18n.DateTimeSymbols_es_VE', 'goog.i18n.DateTimeSymbols_et_EE', 'goog.i18n.DateTimeSymbols_eu_ES', 'goog.i18n.DateTimeSymbols_fa_AF', 'goog.i18n.DateTimeSymbols_fa_IR', 'goog.i18n.DateTimeSymbols_fi_FI', 'goog.i18n.DateTimeSymbols_fil_PH', 'goog.i18n.DateTimeSymbols_fo', 'goog.i18n.DateTimeSymbols_fo_FO', 'goog.i18n.DateTimeSymbols_fr_BE', 'goog.i18n.DateTimeSymbols_fr_CH', 'goog.i18n.DateTimeSymbols_fr_FR', 'goog.i18n.DateTimeSymbols_fr_LU', 'goog.i18n.DateTimeSymbols_fr_MC', 'goog.i18n.DateTimeSymbols_fr_SN', 'goog.i18n.DateTimeSymbols_fur', 'goog.i18n.DateTimeSymbols_fur_IT', 'goog.i18n.DateTimeSymbols_ga', 'goog.i18n.DateTimeSymbols_ga_IE', 'goog.i18n.DateTimeSymbols_gaa', 'goog.i18n.DateTimeSymbols_gaa_GH', 'goog.i18n.DateTimeSymbols_gez', 'goog.i18n.DateTimeSymbols_gez_ER', 'goog.i18n.DateTimeSymbols_gez_ET', 'goog.i18n.DateTimeSymbols_gl_ES', 'goog.i18n.DateTimeSymbols_gsw_CH', 'goog.i18n.DateTimeSymbols_gu_IN', 'goog.i18n.DateTimeSymbols_gv', 'goog.i18n.DateTimeSymbols_gv_GB', 'goog.i18n.DateTimeSymbols_ha', 'goog.i18n.DateTimeSymbols_ha_Arab', 'goog.i18n.DateTimeSymbols_ha_Arab_NG', 'goog.i18n.DateTimeSymbols_ha_Arab_SD', 'goog.i18n.DateTimeSymbols_ha_GH', 'goog.i18n.DateTimeSymbols_ha_Latn', 'goog.i18n.DateTimeSymbols_ha_Latn_GH', 'goog.i18n.DateTimeSymbols_ha_Latn_NE', 'goog.i18n.DateTimeSymbols_ha_Latn_NG', 'goog.i18n.DateTimeSymbols_ha_NE', 'goog.i18n.DateTimeSymbols_ha_NG', 'goog.i18n.DateTimeSymbols_ha_SD', 'goog.i18n.DateTimeSymbols_haw', 'goog.i18n.DateTimeSymbols_haw_US', 'goog.i18n.DateTimeSymbols_he_IL', 'goog.i18n.DateTimeSymbols_hi_IN', 'goog.i18n.DateTimeSymbols_hr_HR', 'goog.i18n.DateTimeSymbols_hu_HU', 'goog.i18n.DateTimeSymbols_hy', 'goog.i18n.DateTimeSymbols_hy_AM', 'goog.i18n.DateTimeSymbols_ia', 'goog.i18n.DateTimeSymbols_id_ID', 'goog.i18n.DateTimeSymbols_ig', 'goog.i18n.DateTimeSymbols_ig_NG', 'goog.i18n.DateTimeSymbols_ii', 'goog.i18n.DateTimeSymbols_ii_CN', 'goog.i18n.DateTimeSymbols_is_IS', 'goog.i18n.DateTimeSymbols_it_CH', 'goog.i18n.DateTimeSymbols_it_IT', 'goog.i18n.DateTimeSymbols_iu', 'goog.i18n.DateTimeSymbols_ja_JP', 'goog.i18n.DateTimeSymbols_ka', 'goog.i18n.DateTimeSymbols_ka_GE', 'goog.i18n.DateTimeSymbols_kaj', 'goog.i18n.DateTimeSymbols_kaj_NG', 'goog.i18n.DateTimeSymbols_kam', 'goog.i18n.DateTimeSymbols_kam_KE', 'goog.i18n.DateTimeSymbols_kcg', 'goog.i18n.DateTimeSymbols_kcg_NG', 'goog.i18n.DateTimeSymbols_kfo', 'goog.i18n.DateTimeSymbols_kfo_CI', 'goog.i18n.DateTimeSymbols_kk', 'goog.i18n.DateTimeSymbols_kk_Cyrl', 'goog.i18n.DateTimeSymbols_kk_Cyrl_KZ', 'goog.i18n.DateTimeSymbols_kk_KZ', 'goog.i18n.DateTimeSymbols_kl', 'goog.i18n.DateTimeSymbols_kl_GL', 'goog.i18n.DateTimeSymbols_km', 'goog.i18n.DateTimeSymbols_km_KH', 'goog.i18n.DateTimeSymbols_kn_IN', 'goog.i18n.DateTimeSymbols_ko_KR', 'goog.i18n.DateTimeSymbols_kok', 'goog.i18n.DateTimeSymbols_kok_IN', 'goog.i18n.DateTimeSymbols_kpe', 'goog.i18n.DateTimeSymbols_kpe_GN', 'goog.i18n.DateTimeSymbols_kpe_LR', 'goog.i18n.DateTimeSymbols_ku', 'goog.i18n.DateTimeSymbols_ku_Arab', 'goog.i18n.DateTimeSymbols_ku_Arab_IQ', 'goog.i18n.DateTimeSymbols_ku_Arab_IR', 'goog.i18n.DateTimeSymbols_ku_Arab_SY', 'goog.i18n.DateTimeSymbols_ku_IQ', 'goog.i18n.DateTimeSymbols_ku_IR', 'goog.i18n.DateTimeSymbols_ku_Latn', 'goog.i18n.DateTimeSymbols_ku_Latn_TR', 'goog.i18n.DateTimeSymbols_ku_SY', 'goog.i18n.DateTimeSymbols_ku_TR', 'goog.i18n.DateTimeSymbols_kw', 'goog.i18n.DateTimeSymbols_kw_GB', 'goog.i18n.DateTimeSymbols_ky', 'goog.i18n.DateTimeSymbols_ky_KG', 'goog.i18n.DateTimeSymbols_ln_CD', 'goog.i18n.DateTimeSymbols_ln_CG', 'goog.i18n.DateTimeSymbols_lo', 'goog.i18n.DateTimeSymbols_lo_LA', 'goog.i18n.DateTimeSymbols_lt_LT', 'goog.i18n.DateTimeSymbols_lv_LV', 'goog.i18n.DateTimeSymbols_mk', 'goog.i18n.DateTimeSymbols_mk_MK', 'goog.i18n.DateTimeSymbols_ml_IN', 'goog.i18n.DateTimeSymbols_mn', 'goog.i18n.DateTimeSymbols_mn_CN', 'goog.i18n.DateTimeSymbols_mn_Cyrl', 'goog.i18n.DateTimeSymbols_mn_Cyrl_MN', 'goog.i18n.DateTimeSymbols_mn_MN', 'goog.i18n.DateTimeSymbols_mn_Mong', 'goog.i18n.DateTimeSymbols_mn_Mong_CN', 'goog.i18n.DateTimeSymbols_mr_IN', 'goog.i18n.DateTimeSymbols_ms_BN', 'goog.i18n.DateTimeSymbols_ms_MY', 'goog.i18n.DateTimeSymbols_mt_MT', 'goog.i18n.DateTimeSymbols_my', 'goog.i18n.DateTimeSymbols_my_MM', 'goog.i18n.DateTimeSymbols_nb', 'goog.i18n.DateTimeSymbols_nb_NO', 'goog.i18n.DateTimeSymbols_nds', 'goog.i18n.DateTimeSymbols_nds_DE', 'goog.i18n.DateTimeSymbols_ne', 'goog.i18n.DateTimeSymbols_ne_IN', 'goog.i18n.DateTimeSymbols_ne_NP', 'goog.i18n.DateTimeSymbols_nl_BE', 'goog.i18n.DateTimeSymbols_nl_NL', 'goog.i18n.DateTimeSymbols_nn', 'goog.i18n.DateTimeSymbols_nn_NO', 'goog.i18n.DateTimeSymbols_nr', 'goog.i18n.DateTimeSymbols_nr_ZA', 'goog.i18n.DateTimeSymbols_nso', 'goog.i18n.DateTimeSymbols_nso_ZA', 'goog.i18n.DateTimeSymbols_ny', 'goog.i18n.DateTimeSymbols_ny_MW', 'goog.i18n.DateTimeSymbols_oc', 'goog.i18n.DateTimeSymbols_oc_FR', 'goog.i18n.DateTimeSymbols_om', 'goog.i18n.DateTimeSymbols_om_ET', 'goog.i18n.DateTimeSymbols_om_KE', 'goog.i18n.DateTimeSymbols_or_IN', 'goog.i18n.DateTimeSymbols_pa', 'goog.i18n.DateTimeSymbols_pa_Arab', 'goog.i18n.DateTimeSymbols_pa_Arab_PK', 'goog.i18n.DateTimeSymbols_pa_Guru', 'goog.i18n.DateTimeSymbols_pa_Guru_IN', 'goog.i18n.DateTimeSymbols_pa_IN', 'goog.i18n.DateTimeSymbols_pa_PK', 'goog.i18n.DateTimeSymbols_pl_PL', 'goog.i18n.DateTimeSymbols_ps', 'goog.i18n.DateTimeSymbols_ps_AF', 'goog.i18n.DateTimeSymbols_ro_MD', 'goog.i18n.DateTimeSymbols_ro_RO', 'goog.i18n.DateTimeSymbols_ru_RU', 'goog.i18n.DateTimeSymbols_ru_UA', 'goog.i18n.DateTimeSymbols_rw', 'goog.i18n.DateTimeSymbols_rw_RW', 'goog.i18n.DateTimeSymbols_sa', 'goog.i18n.DateTimeSymbols_sa_IN', 'goog.i18n.DateTimeSymbols_se', 'goog.i18n.DateTimeSymbols_se_FI', 'goog.i18n.DateTimeSymbols_se_NO', 'goog.i18n.DateTimeSymbols_sh', 'goog.i18n.DateTimeSymbols_sh_BA', 'goog.i18n.DateTimeSymbols_sh_CS', 'goog.i18n.DateTimeSymbols_sh_YU', 'goog.i18n.DateTimeSymbols_si', 'goog.i18n.DateTimeSymbols_si_LK', 'goog.i18n.DateTimeSymbols_sid', 'goog.i18n.DateTimeSymbols_sid_ET', 'goog.i18n.DateTimeSymbols_sk_SK', 'goog.i18n.DateTimeSymbols_sl_SI', 'goog.i18n.DateTimeSymbols_so', 'goog.i18n.DateTimeSymbols_so_DJ', 'goog.i18n.DateTimeSymbols_so_ET', 'goog.i18n.DateTimeSymbols_so_KE', 'goog.i18n.DateTimeSymbols_so_SO', 'goog.i18n.DateTimeSymbols_sq_AL', 'goog.i18n.DateTimeSymbols_sr_BA', 'goog.i18n.DateTimeSymbols_sr_CS', 'goog.i18n.DateTimeSymbols_sr_Cyrl', 'goog.i18n.DateTimeSymbols_sr_Cyrl_BA', 'goog.i18n.DateTimeSymbols_sr_Cyrl_CS', 'goog.i18n.DateTimeSymbols_sr_Cyrl_ME', 'goog.i18n.DateTimeSymbols_sr_Cyrl_RS', 'goog.i18n.DateTimeSymbols_sr_Cyrl_YU', 'goog.i18n.DateTimeSymbols_sr_Latn', 'goog.i18n.DateTimeSymbols_sr_Latn_BA', 'goog.i18n.DateTimeSymbols_sr_Latn_CS', 'goog.i18n.DateTimeSymbols_sr_Latn_ME', 'goog.i18n.DateTimeSymbols_sr_Latn_RS', 'goog.i18n.DateTimeSymbols_sr_Latn_YU', 'goog.i18n.DateTimeSymbols_sr_ME', 'goog.i18n.DateTimeSymbols_sr_RS', 'goog.i18n.DateTimeSymbols_sr_YU', 'goog.i18n.DateTimeSymbols_ss', 'goog.i18n.DateTimeSymbols_ss_SZ', 'goog.i18n.DateTimeSymbols_ss_ZA', 'goog.i18n.DateTimeSymbols_st', 'goog.i18n.DateTimeSymbols_st_LS', 'goog.i18n.DateTimeSymbols_st_ZA', 'goog.i18n.DateTimeSymbols_sv_FI', 'goog.i18n.DateTimeSymbols_sv_SE', 'goog.i18n.DateTimeSymbols_sw_KE', 'goog.i18n.DateTimeSymbols_sw_TZ', 'goog.i18n.DateTimeSymbols_syr', 'goog.i18n.DateTimeSymbols_syr_SY', 'goog.i18n.DateTimeSymbols_ta_IN', 'goog.i18n.DateTimeSymbols_te_IN', 'goog.i18n.DateTimeSymbols_tg', 'goog.i18n.DateTimeSymbols_tg_Cyrl', 'goog.i18n.DateTimeSymbols_tg_Cyrl_TJ', 'goog.i18n.DateTimeSymbols_tg_TJ', 'goog.i18n.DateTimeSymbols_th_TH', 'goog.i18n.DateTimeSymbols_ti', 'goog.i18n.DateTimeSymbols_ti_ER', 'goog.i18n.DateTimeSymbols_ti_ET', 'goog.i18n.DateTimeSymbols_tig', 'goog.i18n.DateTimeSymbols_tig_ER', 'goog.i18n.DateTimeSymbols_tl_PH', 'goog.i18n.DateTimeSymbols_tn', 'goog.i18n.DateTimeSymbols_tn_ZA', 'goog.i18n.DateTimeSymbols_to', 'goog.i18n.DateTimeSymbols_to_TO', 'goog.i18n.DateTimeSymbols_tr_TR', 'goog.i18n.DateTimeSymbols_trv', 'goog.i18n.DateTimeSymbols_trv_TW', 'goog.i18n.DateTimeSymbols_ts', 'goog.i18n.DateTimeSymbols_ts_ZA', 'goog.i18n.DateTimeSymbols_tt', 'goog.i18n.DateTimeSymbols_tt_RU', 'goog.i18n.DateTimeSymbols_ug', 'goog.i18n.DateTimeSymbols_ug_Arab', 'goog.i18n.DateTimeSymbols_ug_Arab_CN', 'goog.i18n.DateTimeSymbols_ug_CN', 'goog.i18n.DateTimeSymbols_uk_UA', 'goog.i18n.DateTimeSymbols_ur_IN', 'goog.i18n.DateTimeSymbols_ur_PK', 'goog.i18n.DateTimeSymbols_uz', 'goog.i18n.DateTimeSymbols_uz_AF', 'goog.i18n.DateTimeSymbols_uz_Arab', 'goog.i18n.DateTimeSymbols_uz_Arab_AF', 'goog.i18n.DateTimeSymbols_uz_Cyrl', 'goog.i18n.DateTimeSymbols_uz_Cyrl_UZ', 'goog.i18n.DateTimeSymbols_uz_Latn', 'goog.i18n.DateTimeSymbols_uz_Latn_UZ', 'goog.i18n.DateTimeSymbols_uz_UZ', 'goog.i18n.DateTimeSymbols_ve', 'goog.i18n.DateTimeSymbols_ve_ZA', 'goog.i18n.DateTimeSymbols_vi_VN', 'goog.i18n.DateTimeSymbols_wal', 'goog.i18n.DateTimeSymbols_wal_ET', 'goog.i18n.DateTimeSymbols_wo', 'goog.i18n.DateTimeSymbols_wo_Latn', 'goog.i18n.DateTimeSymbols_wo_Latn_SN', 'goog.i18n.DateTimeSymbols_wo_SN', 'goog.i18n.DateTimeSymbols_xh', 'goog.i18n.DateTimeSymbols_xh_ZA', 'goog.i18n.DateTimeSymbols_yo', 'goog.i18n.DateTimeSymbols_yo_NG', 'goog.i18n.DateTimeSymbols_zh_Hans', 'goog.i18n.DateTimeSymbols_zh_Hans_CN', 'goog.i18n.DateTimeSymbols_zh_Hans_HK', 'goog.i18n.DateTimeSymbols_zh_Hans_MO', 'goog.i18n.DateTimeSymbols_zh_Hans_SG', 'goog.i18n.DateTimeSymbols_zh_Hant', 'goog.i18n.DateTimeSymbols_zh_Hant_HK', 'goog.i18n.DateTimeSymbols_zh_Hant_MO', 'goog.i18n.DateTimeSymbols_zh_Hant_TW', 'goog.i18n.DateTimeSymbols_zh_MO', 'goog.i18n.DateTimeSymbols_zh_SG', 'goog.i18n.DateTimeSymbols_zu', 'goog.i18n.DateTimeSymbols_zu_ZA'], ['goog.i18n.DateTimeSymbols']);
goog.addDependency('i18n/graphemebreak.js', ['goog.i18n.GraphemeBreak'], ['goog.structs.InversionMap']);
goog.addDependency('i18n/mime.js', ['goog.i18n.mime', 'goog.i18n.mime.encode'], []);
goog.addDependency('i18n/numberformat.js', ['goog.i18n.NumberFormat'], ['goog.i18n.NumberFormatSymbols', 'goog.i18n.currencyCodeMap']);
goog.addDependency('i18n/numberformatsymbols.js', ['goog.i18n.NumberFormatSymbols', 'goog.i18n.NumberFormatSymbols_aa', 'goog.i18n.NumberFormatSymbols_aa_DJ', 'goog.i18n.NumberFormatSymbols_aa_ER', 'goog.i18n.NumberFormatSymbols_aa_ER_SAAHO', 'goog.i18n.NumberFormatSymbols_aa_ET', 'goog.i18n.NumberFormatSymbols_af', 'goog.i18n.NumberFormatSymbols_af_NA', 'goog.i18n.NumberFormatSymbols_af_ZA', 'goog.i18n.NumberFormatSymbols_ak', 'goog.i18n.NumberFormatSymbols_ak_GH', 'goog.i18n.NumberFormatSymbols_am', 'goog.i18n.NumberFormatSymbols_am_ET', 'goog.i18n.NumberFormatSymbols_ar', 'goog.i18n.NumberFormatSymbols_ar_AE', 'goog.i18n.NumberFormatSymbols_ar_BH', 'goog.i18n.NumberFormatSymbols_ar_DZ', 'goog.i18n.NumberFormatSymbols_ar_EG', 'goog.i18n.NumberFormatSymbols_ar_IQ', 'goog.i18n.NumberFormatSymbols_ar_JO', 'goog.i18n.NumberFormatSymbols_ar_KW', 'goog.i18n.NumberFormatSymbols_ar_LB', 'goog.i18n.NumberFormatSymbols_ar_LY', 'goog.i18n.NumberFormatSymbols_ar_MA', 'goog.i18n.NumberFormatSymbols_ar_OM', 'goog.i18n.NumberFormatSymbols_ar_QA', 'goog.i18n.NumberFormatSymbols_ar_SA', 'goog.i18n.NumberFormatSymbols_ar_SD', 'goog.i18n.NumberFormatSymbols_ar_SY', 'goog.i18n.NumberFormatSymbols_ar_TN', 'goog.i18n.NumberFormatSymbols_ar_YE', 'goog.i18n.NumberFormatSymbols_as', 'goog.i18n.NumberFormatSymbols_as_IN', 'goog.i18n.NumberFormatSymbols_az', 'goog.i18n.NumberFormatSymbols_az_AZ', 'goog.i18n.NumberFormatSymbols_az_Cyrl', 'goog.i18n.NumberFormatSymbols_az_Cyrl_AZ', 'goog.i18n.NumberFormatSymbols_az_Latn', 'goog.i18n.NumberFormatSymbols_az_Latn_AZ', 'goog.i18n.NumberFormatSymbols_be', 'goog.i18n.NumberFormatSymbols_be_BY', 'goog.i18n.NumberFormatSymbols_bg', 'goog.i18n.NumberFormatSymbols_bg_BG', 'goog.i18n.NumberFormatSymbols_bn', 'goog.i18n.NumberFormatSymbols_bn_BD', 'goog.i18n.NumberFormatSymbols_bn_IN', 'goog.i18n.NumberFormatSymbols_bo', 'goog.i18n.NumberFormatSymbols_bo_CN', 'goog.i18n.NumberFormatSymbols_bo_IN', 'goog.i18n.NumberFormatSymbols_bs', 'goog.i18n.NumberFormatSymbols_bs_BA', 'goog.i18n.NumberFormatSymbols_byn', 'goog.i18n.NumberFormatSymbols_byn_ER', 'goog.i18n.NumberFormatSymbols_ca', 'goog.i18n.NumberFormatSymbols_ca_ES', 'goog.i18n.NumberFormatSymbols_cch', 'goog.i18n.NumberFormatSymbols_cch_NG', 'goog.i18n.NumberFormatSymbols_cop', 'goog.i18n.NumberFormatSymbols_cs', 'goog.i18n.NumberFormatSymbols_cs_CZ', 'goog.i18n.NumberFormatSymbols_cy', 'goog.i18n.NumberFormatSymbols_cy_GB', 'goog.i18n.NumberFormatSymbols_da', 'goog.i18n.NumberFormatSymbols_da_DK', 'goog.i18n.NumberFormatSymbols_de', 'goog.i18n.NumberFormatSymbols_de_AT', 'goog.i18n.NumberFormatSymbols_de_BE', 'goog.i18n.NumberFormatSymbols_de_CH', 'goog.i18n.NumberFormatSymbols_de_DE', 'goog.i18n.NumberFormatSymbols_de_LI', 'goog.i18n.NumberFormatSymbols_de_LU', 'goog.i18n.NumberFormatSymbols_dv', 'goog.i18n.NumberFormatSymbols_dv_MV', 'goog.i18n.NumberFormatSymbols_dz', 'goog.i18n.NumberFormatSymbols_dz_BT', 'goog.i18n.NumberFormatSymbols_ee', 'goog.i18n.NumberFormatSymbols_ee_GH', 'goog.i18n.NumberFormatSymbols_ee_TG', 'goog.i18n.NumberFormatSymbols_el', 'goog.i18n.NumberFormatSymbols_el_CY', 'goog.i18n.NumberFormatSymbols_el_GR', 'goog.i18n.NumberFormatSymbols_el_POLYTON', 'goog.i18n.NumberFormatSymbols_en', 'goog.i18n.NumberFormatSymbols_en_AS', 'goog.i18n.NumberFormatSymbols_en_AU', 'goog.i18n.NumberFormatSymbols_en_BE', 'goog.i18n.NumberFormatSymbols_en_BW', 'goog.i18n.NumberFormatSymbols_en_BZ', 'goog.i18n.NumberFormatSymbols_en_CA', 'goog.i18n.NumberFormatSymbols_en_Dsrt', 'goog.i18n.NumberFormatSymbols_en_Dsrt_US', 'goog.i18n.NumberFormatSymbols_en_GB', 'goog.i18n.NumberFormatSymbols_en_GU', 'goog.i18n.NumberFormatSymbols_en_HK', 'goog.i18n.NumberFormatSymbols_en_IE', 'goog.i18n.NumberFormatSymbols_en_IN', 'goog.i18n.NumberFormatSymbols_en_JM', 'goog.i18n.NumberFormatSymbols_en_MH', 'goog.i18n.NumberFormatSymbols_en_MP', 'goog.i18n.NumberFormatSymbols_en_MT', 'goog.i18n.NumberFormatSymbols_en_NA', 'goog.i18n.NumberFormatSymbols_en_NZ', 'goog.i18n.NumberFormatSymbols_en_PH', 'goog.i18n.NumberFormatSymbols_en_PK', 'goog.i18n.NumberFormatSymbols_en_SG', 'goog.i18n.NumberFormatSymbols_en_Shaw', 'goog.i18n.NumberFormatSymbols_en_TT', 'goog.i18n.NumberFormatSymbols_en_UM', 'goog.i18n.NumberFormatSymbols_en_US', 'goog.i18n.NumberFormatSymbols_en_VI', 'goog.i18n.NumberFormatSymbols_en_ZA', 'goog.i18n.NumberFormatSymbols_en_ZW', 'goog.i18n.NumberFormatSymbols_eo', 'goog.i18n.NumberFormatSymbols_es', 'goog.i18n.NumberFormatSymbols_es_AR', 'goog.i18n.NumberFormatSymbols_es_BO', 'goog.i18n.NumberFormatSymbols_es_CL', 'goog.i18n.NumberFormatSymbols_es_CO', 'goog.i18n.NumberFormatSymbols_es_CR', 'goog.i18n.NumberFormatSymbols_es_DO', 'goog.i18n.NumberFormatSymbols_es_EC', 'goog.i18n.NumberFormatSymbols_es_ES', 'goog.i18n.NumberFormatSymbols_es_GT', 'goog.i18n.NumberFormatSymbols_es_HN', 'goog.i18n.NumberFormatSymbols_es_MX', 'goog.i18n.NumberFormatSymbols_es_NI', 'goog.i18n.NumberFormatSymbols_es_PA', 'goog.i18n.NumberFormatSymbols_es_PE', 'goog.i18n.NumberFormatSymbols_es_PR', 'goog.i18n.NumberFormatSymbols_es_PY', 'goog.i18n.NumberFormatSymbols_es_SV', 'goog.i18n.NumberFormatSymbols_es_US', 'goog.i18n.NumberFormatSymbols_es_UY', 'goog.i18n.NumberFormatSymbols_es_VE', 'goog.i18n.NumberFormatSymbols_et', 'goog.i18n.NumberFormatSymbols_et_EE', 'goog.i18n.NumberFormatSymbols_eu', 'goog.i18n.NumberFormatSymbols_eu_ES', 'goog.i18n.NumberFormatSymbols_fa', 'goog.i18n.NumberFormatSymbols_fa_AF', 'goog.i18n.NumberFormatSymbols_fa_IR', 'goog.i18n.NumberFormatSymbols_fi', 'goog.i18n.NumberFormatSymbols_fi_FI', 'goog.i18n.NumberFormatSymbols_fil', 'goog.i18n.NumberFormatSymbols_fil_PH', 'goog.i18n.NumberFormatSymbols_fo', 'goog.i18n.NumberFormatSymbols_fo_FO', 'goog.i18n.NumberFormatSymbols_fr', 'goog.i18n.NumberFormatSymbols_fr_BE', 'goog.i18n.NumberFormatSymbols_fr_CA', 'goog.i18n.NumberFormatSymbols_fr_CH', 'goog.i18n.NumberFormatSymbols_fr_FR', 'goog.i18n.NumberFormatSymbols_fr_LU', 'goog.i18n.NumberFormatSymbols_fr_MC', 'goog.i18n.NumberFormatSymbols_fr_SN', 'goog.i18n.NumberFormatSymbols_fur', 'goog.i18n.NumberFormatSymbols_fur_IT', 'goog.i18n.NumberFormatSymbols_ga', 'goog.i18n.NumberFormatSymbols_ga_IE', 'goog.i18n.NumberFormatSymbols_gaa', 'goog.i18n.NumberFormatSymbols_gaa_GH', 'goog.i18n.NumberFormatSymbols_gez', 'goog.i18n.NumberFormatSymbols_gez_ER', 'goog.i18n.NumberFormatSymbols_gez_ET', 'goog.i18n.NumberFormatSymbols_gl', 'goog.i18n.NumberFormatSymbols_gl_ES', 'goog.i18n.NumberFormatSymbols_gsw', 'goog.i18n.NumberFormatSymbols_gsw_CH', 'goog.i18n.NumberFormatSymbols_gu', 'goog.i18n.NumberFormatSymbols_gu_IN', 'goog.i18n.NumberFormatSymbols_gv', 'goog.i18n.NumberFormatSymbols_gv_GB', 'goog.i18n.NumberFormatSymbols_ha', 'goog.i18n.NumberFormatSymbols_ha_Arab', 'goog.i18n.NumberFormatSymbols_ha_Arab_NG', 'goog.i18n.NumberFormatSymbols_ha_Arab_SD', 'goog.i18n.NumberFormatSymbols_ha_GH', 'goog.i18n.NumberFormatSymbols_ha_Latn', 'goog.i18n.NumberFormatSymbols_ha_Latn_GH', 'goog.i18n.NumberFormatSymbols_ha_Latn_NE', 'goog.i18n.NumberFormatSymbols_ha_Latn_NG', 'goog.i18n.NumberFormatSymbols_ha_NE', 'goog.i18n.NumberFormatSymbols_ha_NG', 'goog.i18n.NumberFormatSymbols_ha_SD', 'goog.i18n.NumberFormatSymbols_haw', 'goog.i18n.NumberFormatSymbols_haw_US', 'goog.i18n.NumberFormatSymbols_he', 'goog.i18n.NumberFormatSymbols_he_IL', 'goog.i18n.NumberFormatSymbols_hi', 'goog.i18n.NumberFormatSymbols_hi_IN', 'goog.i18n.NumberFormatSymbols_hr', 'goog.i18n.NumberFormatSymbols_hr_HR', 'goog.i18n.NumberFormatSymbols_hu', 'goog.i18n.NumberFormatSymbols_hu_HU', 'goog.i18n.NumberFormatSymbols_hy', 'goog.i18n.NumberFormatSymbols_hy_AM', 'goog.i18n.NumberFormatSymbols_ia', 'goog.i18n.NumberFormatSymbols_id', 'goog.i18n.NumberFormatSymbols_id_ID', 'goog.i18n.NumberFormatSymbols_ig', 'goog.i18n.NumberFormatSymbols_ig_NG', 'goog.i18n.NumberFormatSymbols_ii', 'goog.i18n.NumberFormatSymbols_ii_CN', 'goog.i18n.NumberFormatSymbols_in', 'goog.i18n.NumberFormatSymbols_is', 'goog.i18n.NumberFormatSymbols_is_IS', 'goog.i18n.NumberFormatSymbols_it', 'goog.i18n.NumberFormatSymbols_it_CH', 'goog.i18n.NumberFormatSymbols_it_IT', 'goog.i18n.NumberFormatSymbols_iu', 'goog.i18n.NumberFormatSymbols_iw', 'goog.i18n.NumberFormatSymbols_ja', 'goog.i18n.NumberFormatSymbols_ja_JP', 'goog.i18n.NumberFormatSymbols_ka', 'goog.i18n.NumberFormatSymbols_ka_GE', 'goog.i18n.NumberFormatSymbols_kaj', 'goog.i18n.NumberFormatSymbols_kaj_NG', 'goog.i18n.NumberFormatSymbols_kam', 'goog.i18n.NumberFormatSymbols_kam_KE', 'goog.i18n.NumberFormatSymbols_kcg', 'goog.i18n.NumberFormatSymbols_kcg_NG', 'goog.i18n.NumberFormatSymbols_kfo', 'goog.i18n.NumberFormatSymbols_kfo_CI', 'goog.i18n.NumberFormatSymbols_kk', 'goog.i18n.NumberFormatSymbols_kk_Cyrl', 'goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ', 'goog.i18n.NumberFormatSymbols_kk_KZ', 'goog.i18n.NumberFormatSymbols_kl', 'goog.i18n.NumberFormatSymbols_kl_GL', 'goog.i18n.NumberFormatSymbols_km', 'goog.i18n.NumberFormatSymbols_km_KH', 'goog.i18n.NumberFormatSymbols_kn', 'goog.i18n.NumberFormatSymbols_kn_IN', 'goog.i18n.NumberFormatSymbols_ko', 'goog.i18n.NumberFormatSymbols_ko_KR', 'goog.i18n.NumberFormatSymbols_kok', 'goog.i18n.NumberFormatSymbols_kok_IN', 'goog.i18n.NumberFormatSymbols_kpe', 'goog.i18n.NumberFormatSymbols_kpe_GN', 'goog.i18n.NumberFormatSymbols_kpe_LR', 'goog.i18n.NumberFormatSymbols_ku', 'goog.i18n.NumberFormatSymbols_ku_Arab', 'goog.i18n.NumberFormatSymbols_ku_Arab_IQ', 'goog.i18n.NumberFormatSymbols_ku_Arab_IR', 'goog.i18n.NumberFormatSymbols_ku_Arab_SY', 'goog.i18n.NumberFormatSymbols_ku_IQ', 'goog.i18n.NumberFormatSymbols_ku_IR', 'goog.i18n.NumberFormatSymbols_ku_Latn', 'goog.i18n.NumberFormatSymbols_ku_Latn_TR', 'goog.i18n.NumberFormatSymbols_ku_SY', 'goog.i18n.NumberFormatSymbols_ku_TR', 'goog.i18n.NumberFormatSymbols_kw', 'goog.i18n.NumberFormatSymbols_kw_GB', 'goog.i18n.NumberFormatSymbols_ky', 'goog.i18n.NumberFormatSymbols_ky_KG', 'goog.i18n.NumberFormatSymbols_ln', 'goog.i18n.NumberFormatSymbols_ln_CD', 'goog.i18n.NumberFormatSymbols_ln_CG', 'goog.i18n.NumberFormatSymbols_lo', 'goog.i18n.NumberFormatSymbols_lo_LA', 'goog.i18n.NumberFormatSymbols_lt', 'goog.i18n.NumberFormatSymbols_lt_LT', 'goog.i18n.NumberFormatSymbols_lv', 'goog.i18n.NumberFormatSymbols_lv_LV', 'goog.i18n.NumberFormatSymbols_mk', 'goog.i18n.NumberFormatSymbols_mk_MK', 'goog.i18n.NumberFormatSymbols_ml', 'goog.i18n.NumberFormatSymbols_ml_IN', 'goog.i18n.NumberFormatSymbols_mn', 'goog.i18n.NumberFormatSymbols_mn_CN', 'goog.i18n.NumberFormatSymbols_mn_Cyrl', 'goog.i18n.NumberFormatSymbols_mn_Cyrl_MN', 'goog.i18n.NumberFormatSymbols_mn_MN', 'goog.i18n.NumberFormatSymbols_mn_Mong', 'goog.i18n.NumberFormatSymbols_mn_Mong_CN', 'goog.i18n.NumberFormatSymbols_mo', 'goog.i18n.NumberFormatSymbols_mr', 'goog.i18n.NumberFormatSymbols_mr_IN', 'goog.i18n.NumberFormatSymbols_ms', 'goog.i18n.NumberFormatSymbols_ms_BN', 'goog.i18n.NumberFormatSymbols_ms_MY', 'goog.i18n.NumberFormatSymbols_mt', 'goog.i18n.NumberFormatSymbols_mt_MT', 'goog.i18n.NumberFormatSymbols_my', 'goog.i18n.NumberFormatSymbols_my_MM', 'goog.i18n.NumberFormatSymbols_nb', 'goog.i18n.NumberFormatSymbols_nb_NO', 'goog.i18n.NumberFormatSymbols_nds', 'goog.i18n.NumberFormatSymbols_nds_DE', 'goog.i18n.NumberFormatSymbols_ne', 'goog.i18n.NumberFormatSymbols_ne_IN', 'goog.i18n.NumberFormatSymbols_ne_NP', 'goog.i18n.NumberFormatSymbols_nl', 'goog.i18n.NumberFormatSymbols_nl_BE', 'goog.i18n.NumberFormatSymbols_nl_NL', 'goog.i18n.NumberFormatSymbols_nn', 'goog.i18n.NumberFormatSymbols_nn_NO', 'goog.i18n.NumberFormatSymbols_no', 'goog.i18n.NumberFormatSymbols_nr', 'goog.i18n.NumberFormatSymbols_nr_ZA', 'goog.i18n.NumberFormatSymbols_nso', 'goog.i18n.NumberFormatSymbols_nso_ZA', 'goog.i18n.NumberFormatSymbols_ny', 'goog.i18n.NumberFormatSymbols_ny_MW', 'goog.i18n.NumberFormatSymbols_oc', 'goog.i18n.NumberFormatSymbols_oc_FR', 'goog.i18n.NumberFormatSymbols_om', 'goog.i18n.NumberFormatSymbols_om_ET', 'goog.i18n.NumberFormatSymbols_om_KE', 'goog.i18n.NumberFormatSymbols_or', 'goog.i18n.NumberFormatSymbols_or_IN', 'goog.i18n.NumberFormatSymbols_pa', 'goog.i18n.NumberFormatSymbols_pa_Arab', 'goog.i18n.NumberFormatSymbols_pa_Arab_PK', 'goog.i18n.NumberFormatSymbols_pa_Guru', 'goog.i18n.NumberFormatSymbols_pa_Guru_IN', 'goog.i18n.NumberFormatSymbols_pa_IN', 'goog.i18n.NumberFormatSymbols_pa_PK', 'goog.i18n.NumberFormatSymbols_pl', 'goog.i18n.NumberFormatSymbols_pl_PL', 'goog.i18n.NumberFormatSymbols_ps', 'goog.i18n.NumberFormatSymbols_ps_AF', 'goog.i18n.NumberFormatSymbols_pt', 'goog.i18n.NumberFormatSymbols_pt_BR', 'goog.i18n.NumberFormatSymbols_pt_PT', 'goog.i18n.NumberFormatSymbols_ro', 'goog.i18n.NumberFormatSymbols_ro_MD', 'goog.i18n.NumberFormatSymbols_ro_RO', 'goog.i18n.NumberFormatSymbols_ru', 'goog.i18n.NumberFormatSymbols_ru_RU', 'goog.i18n.NumberFormatSymbols_ru_UA', 'goog.i18n.NumberFormatSymbols_rw', 'goog.i18n.NumberFormatSymbols_rw_RW', 'goog.i18n.NumberFormatSymbols_sa', 'goog.i18n.NumberFormatSymbols_sa_IN', 'goog.i18n.NumberFormatSymbols_se', 'goog.i18n.NumberFormatSymbols_se_FI', 'goog.i18n.NumberFormatSymbols_se_NO', 'goog.i18n.NumberFormatSymbols_sh', 'goog.i18n.NumberFormatSymbols_sh_BA', 'goog.i18n.NumberFormatSymbols_sh_CS', 'goog.i18n.NumberFormatSymbols_sh_YU', 'goog.i18n.NumberFormatSymbols_si', 'goog.i18n.NumberFormatSymbols_si_LK', 'goog.i18n.NumberFormatSymbols_sid', 'goog.i18n.NumberFormatSymbols_sid_ET', 'goog.i18n.NumberFormatSymbols_sk', 'goog.i18n.NumberFormatSymbols_sk_SK', 'goog.i18n.NumberFormatSymbols_sl', 'goog.i18n.NumberFormatSymbols_sl_SI', 'goog.i18n.NumberFormatSymbols_so', 'goog.i18n.NumberFormatSymbols_so_DJ', 'goog.i18n.NumberFormatSymbols_so_ET', 'goog.i18n.NumberFormatSymbols_so_KE', 'goog.i18n.NumberFormatSymbols_so_SO', 'goog.i18n.NumberFormatSymbols_sq', 'goog.i18n.NumberFormatSymbols_sq_AL', 'goog.i18n.NumberFormatSymbols_sr', 'goog.i18n.NumberFormatSymbols_sr_BA', 'goog.i18n.NumberFormatSymbols_sr_CS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_BA', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_CS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_ME', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_RS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_YU', 'goog.i18n.NumberFormatSymbols_sr_Latn', 'goog.i18n.NumberFormatSymbols_sr_Latn_BA', 'goog.i18n.NumberFormatSymbols_sr_Latn_CS', 'goog.i18n.NumberFormatSymbols_sr_Latn_ME', 'goog.i18n.NumberFormatSymbols_sr_Latn_RS', 'goog.i18n.NumberFormatSymbols_sr_Latn_YU', 'goog.i18n.NumberFormatSymbols_sr_ME', 'goog.i18n.NumberFormatSymbols_sr_RS', 'goog.i18n.NumberFormatSymbols_sr_YU', 'goog.i18n.NumberFormatSymbols_ss', 'goog.i18n.NumberFormatSymbols_ss_SZ', 'goog.i18n.NumberFormatSymbols_ss_ZA', 'goog.i18n.NumberFormatSymbols_st', 'goog.i18n.NumberFormatSymbols_st_LS', 'goog.i18n.NumberFormatSymbols_st_ZA', 'goog.i18n.NumberFormatSymbols_sv', 'goog.i18n.NumberFormatSymbols_sv_FI', 'goog.i18n.NumberFormatSymbols_sv_SE', 'goog.i18n.NumberFormatSymbols_sw', 'goog.i18n.NumberFormatSymbols_sw_KE', 'goog.i18n.NumberFormatSymbols_sw_TZ', 'goog.i18n.NumberFormatSymbols_syr', 'goog.i18n.NumberFormatSymbols_syr_SY', 'goog.i18n.NumberFormatSymbols_ta', 'goog.i18n.NumberFormatSymbols_ta_IN', 'goog.i18n.NumberFormatSymbols_te', 'goog.i18n.NumberFormatSymbols_te_IN', 'goog.i18n.NumberFormatSymbols_tg', 'goog.i18n.NumberFormatSymbols_tg_Cyrl', 'goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ', 'goog.i18n.NumberFormatSymbols_tg_TJ', 'goog.i18n.NumberFormatSymbols_th', 'goog.i18n.NumberFormatSymbols_th_TH', 'goog.i18n.NumberFormatSymbols_ti', 'goog.i18n.NumberFormatSymbols_ti_ER', 'goog.i18n.NumberFormatSymbols_ti_ET', 'goog.i18n.NumberFormatSymbols_tig', 'goog.i18n.NumberFormatSymbols_tig_ER', 'goog.i18n.NumberFormatSymbols_tl', 'goog.i18n.NumberFormatSymbols_tl_PH', 'goog.i18n.NumberFormatSymbols_tn', 'goog.i18n.NumberFormatSymbols_tn_ZA', 'goog.i18n.NumberFormatSymbols_to', 'goog.i18n.NumberFormatSymbols_to_TO', 'goog.i18n.NumberFormatSymbols_tr', 'goog.i18n.NumberFormatSymbols_tr_TR', 'goog.i18n.NumberFormatSymbols_trv', 'goog.i18n.NumberFormatSymbols_trv_TW', 'goog.i18n.NumberFormatSymbols_ts', 'goog.i18n.NumberFormatSymbols_ts_ZA', 'goog.i18n.NumberFormatSymbols_tt', 'goog.i18n.NumberFormatSymbols_tt_RU', 'goog.i18n.NumberFormatSymbols_ug', 'goog.i18n.NumberFormatSymbols_ug_Arab', 'goog.i18n.NumberFormatSymbols_ug_Arab_CN', 'goog.i18n.NumberFormatSymbols_ug_CN', 'goog.i18n.NumberFormatSymbols_uk', 'goog.i18n.NumberFormatSymbols_uk_UA', 'goog.i18n.NumberFormatSymbols_ur', 'goog.i18n.NumberFormatSymbols_ur_IN', 'goog.i18n.NumberFormatSymbols_ur_PK', 'goog.i18n.NumberFormatSymbols_uz', 'goog.i18n.NumberFormatSymbols_uz_AF', 'goog.i18n.NumberFormatSymbols_uz_Arab', 'goog.i18n.NumberFormatSymbols_uz_Arab_AF', 'goog.i18n.NumberFormatSymbols_uz_Cyrl', 'goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ', 'goog.i18n.NumberFormatSymbols_uz_Latn', 'goog.i18n.NumberFormatSymbols_uz_Latn_UZ', 'goog.i18n.NumberFormatSymbols_uz_UZ', 'goog.i18n.NumberFormatSymbols_ve', 'goog.i18n.NumberFormatSymbols_ve_ZA', 'goog.i18n.NumberFormatSymbols_vi', 'goog.i18n.NumberFormatSymbols_vi_VN', 'goog.i18n.NumberFormatSymbols_wal', 'goog.i18n.NumberFormatSymbols_wal_ET', 'goog.i18n.NumberFormatSymbols_wo', 'goog.i18n.NumberFormatSymbols_wo_Latn', 'goog.i18n.NumberFormatSymbols_wo_Latn_SN', 'goog.i18n.NumberFormatSymbols_wo_SN', 'goog.i18n.NumberFormatSymbols_xh', 'goog.i18n.NumberFormatSymbols_xh_ZA', 'goog.i18n.NumberFormatSymbols_yo', 'goog.i18n.NumberFormatSymbols_yo_NG', 'goog.i18n.NumberFormatSymbols_zh', 'goog.i18n.NumberFormatSymbols_zh_CN', 'goog.i18n.NumberFormatSymbols_zh_HK', 'goog.i18n.NumberFormatSymbols_zh_Hans', 'goog.i18n.NumberFormatSymbols_zh_Hans_CN', 'goog.i18n.NumberFormatSymbols_zh_Hans_HK', 'goog.i18n.NumberFormatSymbols_zh_Hans_MO', 'goog.i18n.NumberFormatSymbols_zh_Hans_SG', 'goog.i18n.NumberFormatSymbols_zh_Hant', 'goog.i18n.NumberFormatSymbols_zh_Hant_HK', 'goog.i18n.NumberFormatSymbols_zh_Hant_MO', 'goog.i18n.NumberFormatSymbols_zh_Hant_TW', 'goog.i18n.NumberFormatSymbols_zh_MO', 'goog.i18n.NumberFormatSymbols_zh_SG', 'goog.i18n.NumberFormatSymbols_zh_TW', 'goog.i18n.NumberFormatSymbols_zu', 'goog.i18n.NumberFormatSymbols_zu_ZA'], []);
goog.addDependency('i18n/timezone.js', ['goog.i18n.TimeZone'], ['goog.array', 'goog.string']);
goog.addDependency('i18n/uchar.js', ['goog.i18n.uChar'], []);
goog.addDependency('iter/iter.js', ['goog.iter', 'goog.iter.Iterator', 'goog.iter.StopIteration'], ['goog.array']);
goog.addDependency('json/json.js', ['goog.json', 'goog.json.Serializer'], []);
goog.addDependency('locale/countries.js', ['goog.locale.countries'], []);
goog.addDependency('locale/defaultlocalenameconstants.js', ['goog.locale.defaultLocaleNameConstants'], []);
goog.addDependency('locale/genericfontnames.js', ['goog.locale.genericFontNames'], []);
goog.addDependency('locale/genericfontnamesdata.js', ['goog.locale.genericFontNamesData'], ['goog.locale']);
goog.addDependency('locale/locale.js', ['goog.locale'], ['goog.locale.nativeNameConstants']);
goog.addDependency('locale/nativenameconstants.js', ['goog.locale.nativeNameConstants'], []);
goog.addDependency('locale/scriptToLanguages.js', ['goog.locale.scriptToLanguages'], ['goog.locale']);
goog.addDependency('locale/timezonedetection.js', ['goog.locale.timeZoneDetection'], ['goog.locale', 'goog.locale.TimeZoneFingerprint']);
goog.addDependency('locale/timezonefingerprint.js', ['goog.locale.TimeZoneFingerprint'], ['goog.locale']);
goog.addDependency('locale/timezonelist.js', ['goog.locale.TimeZoneList'], ['goog.locale']);
goog.addDependency('math/bezier.js', ['goog.math.Bezier'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/box.js', ['goog.math.Box'], ['goog.math.Coordinate']);
goog.addDependency('math/coordinate.js', ['goog.math.Coordinate'], []);
goog.addDependency('math/coordinate3.js', ['goog.math.Coordinate3'], []);
goog.addDependency('math/integer.js', ['goog.math.Integer'], []);
goog.addDependency('math/line.js', ['goog.math.Line'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/long.js', ['goog.math.Long'], []);
goog.addDependency('math/math.js', ['goog.math'], ['goog.array']);
goog.addDependency('math/matrix.js', ['goog.math.Matrix'], ['goog.array', 'goog.math', 'goog.math.Size']);
goog.addDependency('math/range.js', ['goog.math.Range'], []);
goog.addDependency('math/rangeset.js', ['goog.math.RangeSet'], ['goog.array', 'goog.iter.Iterator', 'goog.iter.StopIteration', 'goog.math.Range']);
goog.addDependency('math/rect.js', ['goog.math.Rect'], ['goog.math.Box', 'goog.math.Size']);
goog.addDependency('math/size.js', ['goog.math.Size'], []);
goog.addDependency('math/vec2.js', ['goog.math.Vec2'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/vec3.js', ['goog.math.Vec3'], ['goog.math', 'goog.math.Coordinate3']);
goog.addDependency('memoize/memoize.js', ['goog.memoize'], []);
goog.addDependency('module/abstractmoduleloader.js', ['goog.module.AbstractModuleLoader'], []);
goog.addDependency('module/basemodule.js', ['goog.module.BaseModule'], ['goog.Disposable']);
goog.addDependency('module/basemoduleloader.js', ['goog.module.BaseModuleLoader'], ['goog.Disposable', 'goog.debug.Logger', 'goog.module.AbstractModuleLoader']);
goog.addDependency('module/loader.js', ['goog.module.Loader'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.object']);
goog.addDependency('module/module.js', ['goog.module'], ['goog.array', 'goog.module.Loader']);
goog.addDependency('module/moduleinfo.js', ['goog.module.ModuleInfo'], ['goog.Disposable', 'goog.Timer', 'goog.functions', 'goog.module.BaseModule', 'goog.module.ModuleLoadCallback']);
goog.addDependency('module/moduleloadcallback.js', ['goog.module.ModuleLoadCallback'], ['goog.debug.errorHandlerWeakDep']);
goog.addDependency('module/moduleloader.js', ['goog.module.ModuleLoader'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.events.EventHandler', 'goog.module.BaseModuleLoader', 'goog.net.BulkLoader', 'goog.net.EventType', 'goog.userAgent']);
goog.addDependency('module/modulemanager.js', ['goog.module.ModuleManager', 'goog.module.ModuleManager.FailureType'], ['goog.Disposable', 'goog.array', 'goog.async.Deferred', 'goog.debug.Logger', 'goog.debug.Trace', 'goog.module.AbstractModuleLoader', 'goog.module.ModuleInfo', 'goog.module.ModuleLoadCallback']);
goog.addDependency('module/testdata/modA_1.js', ['goog.module.testdata.modA_1'], []);
goog.addDependency('module/testdata/modA_2.js', ['goog.module.testdata.modA_2'], ['goog.module.ModuleManager']);
goog.addDependency('module/testdata/modB_1.js', ['goog.module.testdata.modB_1'], ['goog.module.ModuleManager']);
goog.addDependency('net/browserchannel.js', ['goog.net.BrowserChannel', 'goog.net.BrowserChannel.Handler', 'goog.net.BrowserChannel.LogSaver', 'goog.net.BrowserChannel.QueuedMap', 'goog.net.BrowserChannel.StatEvent', 'goog.net.BrowserChannel.TimingEvent'], ['goog.Uri', 'goog.array', 'goog.debug.TextFormatter', 'goog.events.Event', 'goog.events.EventTarget', 'goog.json', 'goog.net.BrowserTestChannel', 'goog.net.ChannelDebug', 'goog.net.ChannelRequest', 'goog.net.XhrIo', 'goog.string', 'goog.structs.CircularBuffer', 'goog.userAgent']);
goog.addDependency('net/browsertestchannel.js', ['goog.net.BrowserTestChannel'], ['goog.net.ChannelDebug', 'goog.net.ChannelRequest', 'goog.userAgent']);
goog.addDependency('net/bulkloader.js', ['goog.net.BulkLoader'], ['goog.debug.Logger', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.net.BulkLoaderHelper', 'goog.net.EventType', 'goog.net.XhrIo']);
goog.addDependency('net/bulkloaderhelper.js', ['goog.net.BulkLoaderHelper'], ['goog.Disposable', 'goog.debug.Logger']);
goog.addDependency('net/channeldebug.js', ['goog.net.ChannelDebug'], ['goog.debug.Logger', 'goog.json']);
goog.addDependency('net/channelrequest.js', ['goog.net.ChannelRequest'], ['goog.Timer', 'goog.Uri', 'goog.events.EventHandler', 'goog.net.XhrIo', 'goog.net.XmlHttp', 'goog.net.tmpnetwork', 'goog.object', 'goog.userAgent']);
goog.addDependency('net/cookies.js', ['goog.net.cookies'], ['goog.userAgent']);
goog.addDependency('net/crossdomainrpc.js', ['goog.net.CrossDomainRpc'], ['goog.Uri.QueryData', 'goog.debug.Logger', 'goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.json', 'goog.net.EventType', 'goog.userAgent']);
goog.addDependency('net/errorcode.js', ['goog.net.ErrorCode'], []);
goog.addDependency('net/eventtype.js', ['goog.net.EventType'], []);
goog.addDependency('net/iframeio.js', ['goog.net.IframeIo', 'goog.net.IframeIo.IncrementalDataEvent'], ['goog.Timer', 'goog.Uri', 'goog.debug', 'goog.debug.Logger', 'goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.xhrMonitor', 'goog.string', 'goog.structs', 'goog.userAgent']);
goog.addDependency('net/iframeloadmonitor.js', ['goog.net.IframeLoadMonitor'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.userAgent']);
goog.addDependency('net/imageloader.js', ['goog.net.ImageLoader'], ['goog.dom', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.net.EventType', 'goog.object', 'goog.userAgent']);
goog.addDependency('net/jsonp.js', ['goog.net.Jsonp'], ['goog.Uri', 'goog.dom']);
goog.addDependency('net/mockiframeio.js', ['goog.net.MockIFrameIo'], ['goog.events.EventTarget', 'goog.net.ErrorCode', 'goog.net.IframeIo', 'goog.net.IframeIo.IncrementalDataEvent']);
goog.addDependency('net/mockxhrlite.js', ['goog.net.MockXhrLite'], ['goog.testing.net.XhrIo']);
goog.addDependency('net/multiiframeloadmonitor.js', ['goog.net.MultiIframeLoadMonitor'], ['goog.net.IframeLoadMonitor']);
goog.addDependency('net/networktester.js', ['goog.net.NetworkTester'], ['goog.Timer', 'goog.Uri', 'goog.debug.Logger']);
goog.addDependency('net/tmpnetwork.js', ['goog.net.tmpnetwork'], ['goog.Uri', 'goog.net.ChannelDebug']);
goog.addDependency('net/wrapperxmlhttpfactory.js', ['goog.net.WrapperXmlHttpFactory'], ['goog.net.XmlHttpFactory']);
goog.addDependency('net/xhrio.js', ['goog.net.XhrIo'], ['goog.Timer', 'goog.debug.Logger', 'goog.debug.errorHandlerWeakDep', 'goog.events.EventTarget', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.XmlHttp', 'goog.net.xhrMonitor', 'goog.structs', 'goog.structs.Map']);
goog.addDependency('net/xhriopool.js', ['goog.net.XhrIoPool'], ['goog.net.XhrIo', 'goog.structs', 'goog.structs.PriorityPool']);
goog.addDependency('net/xhrlite.js', ['goog.net.XhrLite'], ['goog.net.XhrIo']);
goog.addDependency('net/xhrlitepool.js', ['goog.net.XhrLitePool'], ['goog.net.XhrIoPool']);
goog.addDependency('net/xhrmanager.js', ['goog.net.XhrManager', 'goog.net.XhrManager.Event', 'goog.net.XhrManager.Request'], ['goog.Disposable', 'goog.events', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.net.EventType', 'goog.net.XhrIo', 'goog.net.XhrIoPool', 'goog.structs.Map']);
goog.addDependency('net/xhrmonitor.js', ['goog.net.xhrMonitor'], ['goog.array', 'goog.debug.Logger', 'goog.userAgent']);
goog.addDependency('net/xmlhttp.js', ['goog.net.DefaultXmlHttpFactory', 'goog.net.XmlHttp', 'goog.net.XmlHttp.OptionType', 'goog.net.XmlHttp.ReadyState'], ['goog.net.WrapperXmlHttpFactory', 'goog.net.XmlHttpFactory']);
goog.addDependency('net/xmlhttpfactory.js', ['goog.net.XmlHttpFactory'], []);
goog.addDependency('net/xpc/crosspagechannel.js', ['goog.net.xpc.CrossPageChannel', 'goog.net.xpc.CrossPageChannel.Role'], ['goog.Disposable', 'goog.Uri', 'goog.dom', 'goog.json', 'goog.net.xpc', 'goog.net.xpc.FrameElementMethodTransport', 'goog.net.xpc.IframePollingTransport', 'goog.net.xpc.IframeRelayTransport', 'goog.net.xpc.NativeMessagingTransport', 'goog.net.xpc.NixTransport', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/frameelementmethodtransport.js', ['goog.net.xpc.FrameElementMethodTransport'], ['goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/iframepollingtransport.js', ['goog.net.xpc.IframePollingTransport', 'goog.net.xpc.IframePollingTransport.Receiver', 'goog.net.xpc.IframePollingTransport.Sender'], ['goog.array', 'goog.dom', 'goog.net.xpc', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/iframerelaytransport.js', ['goog.net.xpc.IframeRelayTransport'], ['goog.dom', 'goog.events', 'goog.net.xpc', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/nativemessagingtransport.js', ['goog.net.xpc.NativeMessagingTransport'], ['goog.events', 'goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/nixtransport.js', ['goog.net.xpc.NixTransport'], ['goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/relay.js', ['goog.net.xpc.relay'], []);
goog.addDependency('net/xpc/transport.js', ['goog.net.xpc.Transport'], ['goog.Disposable', 'goog.net.xpc']);
goog.addDependency('net/xpc/xpc.js', ['goog.net.xpc'], ['goog.debug.Logger']);
goog.addDependency('object/object.js', ['goog.object'], []);
goog.addDependency('positioning/absoluteposition.js', ['goog.positioning.AbsolutePosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/abstractposition.js', ['goog.positioning.AbstractPosition'], ['goog.math.Box', 'goog.math.Size', 'goog.positioning.Corner']);
goog.addDependency('positioning/anchoredposition.js', ['goog.positioning.AnchoredPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/anchoredviewportposition.js', ['goog.positioning.AnchoredViewportPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus']);
goog.addDependency('positioning/clientposition.js', ['goog.positioning.ClientPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/menuanchoredposition.js', ['goog.positioning.MenuAnchoredPosition'], ['goog.math.Box', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow']);
goog.addDependency('positioning/positioning.js', ['goog.positioning', 'goog.positioning.Corner', 'goog.positioning.CornerBit', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus'], ['goog.dom', 'goog.dom.TagName', 'goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.style']);
goog.addDependency('positioning/viewportclientposition.js', ['goog.positioning.ViewportClientPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning.ClientPosition']);
goog.addDependency('positioning/viewportposition.js', ['goog.positioning.ViewportPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning.AbstractPosition']);
goog.addDependency('proto/proto.js', ['goog.proto'], ['goog.proto.Serializer']);
goog.addDependency('proto/serializer.js', ['goog.proto.Serializer'], ['goog.json.Serializer', 'goog.string']);
goog.addDependency('proto2/descriptor.js', ['goog.proto2.Descriptor', 'goog.proto2.Metadata'], ['goog.array', 'goog.object', 'goog.proto2.Util']);
goog.addDependency('proto2/fielddescriptor.js', ['goog.proto2.FieldDescriptor'], ['goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/lazydeserializer.js', ['goog.proto2.LazyDeserializer'], ['goog.proto2.Serializer', 'goog.proto2.Util']);
goog.addDependency('proto2/message.js', ['goog.proto2.Message'], ['goog.proto2.Descriptor', 'goog.proto2.FieldDescriptor', 'goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/objectserializer.js', ['goog.proto2.ObjectSerializer'], ['goog.proto2.Serializer', 'goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/package_test.pb.js', ['someprotopackage.TestPackageTypes'], ['goog.proto2.Message', 'proto2.TestAllTypes']);
goog.addDependency('proto2/pbliteserializer.js', ['goog.proto2.PbLiteSerializer'], ['goog.proto2.LazyDeserializer', 'goog.proto2.Util']);
goog.addDependency('proto2/serializer.js', ['goog.proto2.Serializer'], ['goog.proto2.Descriptor', 'goog.proto2.FieldDescriptor', 'goog.proto2.Message', 'goog.proto2.Util']);
goog.addDependency('proto2/test.pb.js', ['proto2.TestAllTypes', 'proto2.TestAllTypes.NestedEnum', 'proto2.TestAllTypes.NestedMessage', 'proto2.TestAllTypes.OptionalGroup', 'proto2.TestAllTypes.RepeatedGroup'], ['goog.proto2.Message']);
goog.addDependency('proto2/util.js', ['goog.proto2.Util'], ['goog.asserts']);
goog.addDependency('pubsub/pubsub.js', ['goog.pubsub.PubSub'], ['goog.Disposable', 'goog.array']);
goog.addDependency('reflect/reflect.js', ['goog.reflect'], []);
goog.addDependency('spell/spellcheck.js', ['goog.spell.SpellCheck', 'goog.spell.SpellCheck.WordChangedEvent'], ['goog.Timer', 'goog.events.EventTarget', 'goog.structs.Set']);
goog.addDependency('string/string.js', ['goog.string', 'goog.string.Unicode'], []);
goog.addDependency('string/stringbuffer.js', ['goog.string.StringBuffer'], ['goog.userAgent.jscript']);
goog.addDependency('string/stringformat.js', ['goog.string.format'], ['goog.string']);
goog.addDependency('structs/avltree.js', ['goog.structs.AvlTree', 'goog.structs.AvlTree.Node'], ['goog.structs']);
goog.addDependency('structs/circularbuffer.js', ['goog.structs.CircularBuffer'], []);
goog.addDependency('structs/heap.js', ['goog.structs.Heap'], ['goog.array', 'goog.structs.Node']);
goog.addDependency('structs/inversionmap.js', ['goog.structs.InversionMap'], ['goog.array']);
goog.addDependency('structs/linkedmap.js', ['goog.structs.LinkedMap'], ['goog.structs.Map']);
goog.addDependency('structs/map.js', ['goog.structs.Map'], ['goog.iter.Iterator', 'goog.iter.StopIteration', 'goog.object', 'goog.structs']);
goog.addDependency('structs/node.js', ['goog.structs.Node'], []);
goog.addDependency('structs/pool.js', ['goog.structs.Pool'], ['goog.Disposable', 'goog.structs.Queue', 'goog.structs.Set']);
goog.addDependency('structs/prioritypool.js', ['goog.structs.PriorityPool'], ['goog.structs.Pool', 'goog.structs.PriorityQueue']);
goog.addDependency('structs/priorityqueue.js', ['goog.structs.PriorityQueue'], ['goog.structs', 'goog.structs.Heap']);
goog.addDependency('structs/quadtree.js', ['goog.structs.QuadTree', 'goog.structs.QuadTree.Node', 'goog.structs.QuadTree.Point'], ['goog.math.Coordinate']);
goog.addDependency('structs/queue.js', ['goog.structs.Queue'], ['goog.array']);
goog.addDependency('structs/set.js', ['goog.structs.Set'], ['goog.structs', 'goog.structs.Map']);
goog.addDependency('structs/simplepool.js', ['goog.structs.SimplePool'], ['goog.Disposable']);
goog.addDependency('structs/stringset.js', ['goog.structs.StringSet'], ['goog.iter']);
goog.addDependency('structs/structs.js', ['goog.structs'], ['goog.array', 'goog.object']);
goog.addDependency('structs/treenode.js', ['goog.structs.TreeNode'], ['goog.array', 'goog.asserts', 'goog.structs.Node']);
goog.addDependency('structs/trie.js', ['goog.structs.Trie'], ['goog.object', 'goog.structs']);
goog.addDependency('style/cursor.js', ['goog.style.cursor'], ['goog.userAgent']);
goog.addDependency('style/style.js', ['goog.style'], ['goog.array', 'goog.dom', 'goog.math.Box', 'goog.math.Coordinate', 'goog.math.Rect', 'goog.math.Size', 'goog.object', 'goog.userAgent']);
goog.addDependency('testing/asserts.js', ['goog.testing.JsUnitException', 'goog.testing.asserts'], ['goog.testing.stacktrace']);
goog.addDependency('testing/asynctestcase.js', ['goog.testing.AsyncTestCase', 'goog.testing.AsyncTestCase.ControlBreakingException'], ['goog.testing.TestCase', 'goog.testing.TestCase.Test', 'goog.testing.asserts']);
goog.addDependency('testing/benchmark.js', ['goog.testing.benchmark'], ['goog.dom', 'goog.dom.TagName', 'goog.testing.PerformanceTable', 'goog.testing.PerformanceTimer', 'goog.testing.TestCase']);
goog.addDependency('testing/continuationtestcase.js', ['goog.testing.ContinuationTestCase', 'goog.testing.ContinuationTestCase.Step', 'goog.testing.ContinuationTestCase.Test'], ['goog.array', 'goog.events.EventHandler', 'goog.testing.TestCase', 'goog.testing.TestCase.Test', 'goog.testing.asserts']);
goog.addDependency('testing/dom.js', ['goog.testing.dom'], ['goog.dom', 'goog.dom.NodeIterator', 'goog.dom.NodeType', 'goog.dom.TagIterator', 'goog.dom.TagName', 'goog.dom.classes', 'goog.iter', 'goog.object', 'goog.string', 'goog.style', 'goog.testing.asserts', 'goog.userAgent']);
goog.addDependency('testing/editor/dom.js', ['goog.testing.editor.dom'], ['goog.dom.NodeType', 'goog.dom.TagIterator', 'goog.dom.TagWalkType', 'goog.iter', 'goog.string', 'goog.testing.asserts']);
goog.addDependency('testing/editor/fieldmock.js', ['goog.testing.editor.FieldMock'], ['goog.dom', 'goog.dom.Range', 'goog.editor.Field', 'goog.testing.LooseMock']);
goog.addDependency('testing/editor/testhelper.js', ['goog.testing.editor.TestHelper'], ['goog.Disposable', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.testing.dom']);
goog.addDependency('testing/events/eventobserver.js', ['goog.testing.events.EventObserver'], ['goog.array']);
goog.addDependency('testing/events/events.js', ['goog.testing.events', 'goog.testing.events.Event'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.object', 'goog.userAgent']);
goog.addDependency('testing/events/matchers.js', ['goog.testing.events.EventMatcher'], ['goog.events.Event', 'goog.testing.mockmatchers.ArgumentMatcher']);
goog.addDependency('testing/expectedfailures.js', ['goog.testing.ExpectedFailures'], ['goog.debug.DivConsole', 'goog.debug.Logger', 'goog.dom', 'goog.dom.TagName', 'goog.events', 'goog.events.EventType', 'goog.style', 'goog.testing.JsUnitException', 'goog.testing.TestCase', 'goog.testing.asserts']);
goog.addDependency('testing/functionmock.js', ['goog.testing', 'goog.testing.FunctionMock', 'goog.testing.GlobalFunctionMock', 'goog.testing.MethodMock'], ['goog.object', 'goog.testing.PropertyReplacer', 'goog.testing.StrictMock']);
goog.addDependency('testing/graphics.js', ['goog.testing.graphics'], ['goog.graphics.Path.Segment', 'goog.testing.asserts']);
goog.addDependency('testing/jsunit.js', ['goog.testing.jsunit'], ['goog.testing.TestCase', 'goog.testing.TestRunner']);
goog.addDependency('testing/loosemock.js', ['goog.testing.LooseExpectationCollection', 'goog.testing.LooseMock'], ['goog.array', 'goog.structs.Map', 'goog.testing.Mock']);
goog.addDependency('testing/mock.js', ['goog.testing.Mock', 'goog.testing.MockExpectation'], ['goog.array', 'goog.testing.JsUnitException', 'goog.testing.mockmatchers']);
goog.addDependency('testing/mockclassfactory.js', ['goog.testing.MockClassFactory', 'goog.testing.MockClassRecord'], ['goog.array', 'goog.object', 'goog.testing.LooseMock', 'goog.testing.StrictMock', 'goog.testing.TestCase', 'goog.testing.mockmatchers']);
goog.addDependency('testing/mockclock.js', ['goog.testing.MockClock'], ['goog.Disposable', 'goog.testing.PropertyReplacer']);
goog.addDependency('testing/mockcontrol.js', ['goog.testing.MockControl'], ['goog.array', 'goog.testing', 'goog.testing.LooseMock', 'goog.testing.StrictMock']);
goog.addDependency('testing/mockmatchers.js', ['goog.testing.mockmatchers', 'goog.testing.mockmatchers.ArgumentMatcher', 'goog.testing.mockmatchers.IgnoreArgument', 'goog.testing.mockmatchers.InstanceOf', 'goog.testing.mockmatchers.ObjectEquals', 'goog.testing.mockmatchers.RegexpMatch', 'goog.testing.mockmatchers.SaveArgument', 'goog.testing.mockmatchers.TypeOf'], ['goog.array', 'goog.dom', 'goog.testing.asserts']);
goog.addDependency('testing/mockrandom.js', ['goog.testing.MockRandom'], ['goog.Disposable']);
goog.addDependency('testing/mockrange.js', ['goog.testing.MockRange'], ['goog.dom.AbstractRange', 'goog.testing.LooseMock']);
goog.addDependency('testing/mockuseragent.js', ['goog.testing.MockUserAgent'], ['goog.Disposable', 'goog.userAgent']);
goog.addDependency('testing/multitestrunner.js', ['goog.testing.MultiTestRunner', 'goog.testing.MultiTestRunner.TestFrame'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.dom.classes', 'goog.events.EventHandler', 'goog.functions', 'goog.string', 'goog.ui.Component', 'goog.ui.ServerChart', 'goog.ui.ServerChart.ChartType', 'goog.ui.TableSorter']);
goog.addDependency('testing/net/xhrio.js', ['goog.testing.net.XhrIo'], ['goog.array', 'goog.dom.xml', 'goog.events', 'goog.events.EventTarget', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.XmlHttp', 'goog.structs.Map']);
goog.addDependency('testing/objectpropertystring.js', ['goog.testing.ObjectPropertyString'], []);
goog.addDependency('testing/performancetable.js', ['goog.testing.PerformanceTable'], ['goog.dom', 'goog.testing.PerformanceTimer']);
goog.addDependency('testing/performancetimer.js', ['goog.testing.PerformanceTimer'], ['goog.array', 'goog.math']);
goog.addDependency('testing/propertyreplacer.js', ['goog.testing.PropertyReplacer'], ['goog.userAgent']);
goog.addDependency('testing/pseudorandom.js', ['goog.testing.PseudoRandom'], ['goog.Disposable']);
goog.addDependency('testing/recordfunction.js', ['goog.testing.FunctionCall', 'goog.testing.recordConstructor', 'goog.testing.recordFunction'], []);
goog.addDependency('testing/singleton.js', ['goog.testing.singleton'], ['goog.array']);
goog.addDependency('testing/stacktrace.js', ['goog.testing.stacktrace', 'goog.testing.stacktrace.Frame'], []);
goog.addDependency('testing/strictmock.js', ['goog.testing.StrictMock'], ['goog.array', 'goog.testing.Mock']);
goog.addDependency('testing/style/layoutasserts.js', ['goog.testing.style.layoutasserts'], ['goog.style', 'goog.testing.asserts']);
goog.addDependency('testing/testcase.js', ['goog.testing.TestCase', 'goog.testing.TestCase.Error', 'goog.testing.TestCase.Order', 'goog.testing.TestCase.Result', 'goog.testing.TestCase.Test'], ['goog.testing.asserts', 'goog.testing.stacktrace']);
goog.addDependency('testing/testqueue.js', ['goog.testing.TestQueue'], []);
goog.addDependency('testing/testrunner.js', ['goog.testing.TestRunner'], ['goog.testing.TestCase']);
goog.addDependency('testing/ui/rendererasserts.js', ['goog.testing.ui.rendererasserts'], ['goog.testing.asserts']);
goog.addDependency('testing/ui/rendererharness.js', ['goog.testing.ui.RendererHarness'], ['goog.Disposable', 'goog.dom.NodeType', 'goog.testing.asserts']);
goog.addDependency('testing/ui/style.js', ['goog.testing.ui.style'], ['goog.array', 'goog.dom', 'goog.dom.classes', 'goog.testing.asserts']);
goog.addDependency('timer/timer.js', ['goog.Timer'], ['goog.events.EventTarget']);
goog.addDependency('tweak/entries.js', ['goog.tweak.BaseEntry', 'goog.tweak.BasePrimitiveSetting', 'goog.tweak.BaseSetting', 'goog.tweak.BooleanGroup', 'goog.tweak.BooleanInGroupSetting', 'goog.tweak.BooleanSetting', 'goog.tweak.ButtonAction', 'goog.tweak.NumericSetting', 'goog.tweak.StringSetting'], ['goog.array', 'goog.asserts', 'goog.debug.Logger', 'goog.object']);
goog.addDependency('tweak/registry.js', ['goog.tweak.Registry'], ['goog.asserts', 'goog.debug.Logger', 'goog.object', 'goog.tweak.BaseEntry', 'goog.uri.utils']);
goog.addDependency('tweak/testhelpers.js', ['goog.tweak.testhelpers'], ['goog.tweak']);
goog.addDependency('tweak/tweak.js', ['goog.tweak', 'goog.tweak.ConfigParams'], ['goog.asserts', 'goog.tweak.BooleanGroup', 'goog.tweak.BooleanInGroupSetting', 'goog.tweak.BooleanSetting', 'goog.tweak.ButtonAction', 'goog.tweak.NumericSetting', 'goog.tweak.Registry', 'goog.tweak.StringSetting']);
goog.addDependency('tweak/tweakui.js', ['goog.tweak.EntriesPanel', 'goog.tweak.TweakUi'], ['goog.array', 'goog.asserts', 'goog.dom.DomHelper', 'goog.object', 'goog.style', 'goog.tweak', 'goog.ui.Zippy']);
goog.addDependency('ui/abstractspellchecker.js', ['goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult'], ['goog.dom', 'goog.dom.classes', 'goog.dom.selection', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.spell.SpellCheck', 'goog.structs.Set', 'goog.style', 'goog.ui.MenuItem', 'goog.ui.MenuSeparator', 'goog.ui.PopupMenu']);
goog.addDependency('ui/activitymonitor.js', ['goog.ui.ActivityMonitor'], ['goog.dom', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventTarget']);
goog.addDependency('ui/advancedtooltip.js', ['goog.ui.AdvancedTooltip'], ['goog.math.Coordinate', 'goog.ui.Tooltip', 'goog.userAgent']);
goog.addDependency('ui/animatedzippy.js', ['goog.ui.AnimatedZippy'], ['goog.dom', 'goog.events', 'goog.fx.Animation', 'goog.fx.easing', 'goog.ui.Zippy', 'goog.ui.ZippyEvent']);
goog.addDependency('ui/attachablemenu.js', ['goog.ui.AttachableMenu'], ['goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.KeyCodes', 'goog.ui.ItemEvent', 'goog.ui.MenuBase']);
goog.addDependency('ui/autocomplete/arraymatcher.js', ['goog.ui.AutoComplete.ArrayMatcher'], ['goog.iter', 'goog.string', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/autocomplete.js', ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.EventType'], ['goog.events', 'goog.events.EventTarget']);
goog.addDependency('ui/autocomplete/basic.js', ['goog.ui.AutoComplete.Basic'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.ArrayMatcher', 'goog.ui.AutoComplete.InputHandler', 'goog.ui.AutoComplete.Renderer']);
goog.addDependency('ui/autocomplete/inputhandler.js', ['goog.ui.AutoComplete.InputHandler'], ['goog.Disposable', 'goog.Timer', 'goog.dom.a11y', 'goog.dom.selection', 'goog.events', 'goog.events.EventHandler', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.string', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/remote.js', ['goog.ui.AutoComplete.Remote'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.InputHandler', 'goog.ui.AutoComplete.RemoteArrayMatcher', 'goog.ui.AutoComplete.Renderer']);
goog.addDependency('ui/autocomplete/remotearraymatcher.js', ['goog.ui.AutoComplete.RemoteArrayMatcher'], ['goog.Disposable', 'goog.Uri', 'goog.events', 'goog.json', 'goog.net.XhrIo', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/renderer.js', ['goog.ui.AutoComplete.Renderer', 'goog.ui.AutoComplete.Renderer.CustomRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventTarget', 'goog.iter', 'goog.string', 'goog.style', 'goog.ui.AutoComplete', 'goog.ui.IdGenerator', 'goog.userAgent']);
goog.addDependency('ui/autocomplete/richinputhandler.js', ['goog.ui.AutoComplete.RichInputHandler'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.InputHandler']);
goog.addDependency('ui/autocomplete/richremote.js', ['goog.ui.AutoComplete.RichRemote'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.Remote', 'goog.ui.AutoComplete.Renderer', 'goog.ui.AutoComplete.RichInputHandler', 'goog.ui.AutoComplete.RichRemoteArrayMatcher']);
goog.addDependency('ui/autocomplete/richremotearraymatcher.js', ['goog.ui.AutoComplete.RichRemoteArrayMatcher'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.RemoteArrayMatcher']);
goog.addDependency('ui/basicmenu.js', ['goog.ui.BasicMenu', 'goog.ui.BasicMenu.Item', 'goog.ui.BasicMenu.Separator'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.ui.AttachableMenu', 'goog.ui.ItemEvent']);
goog.addDependency('ui/bidiinput.js', ['goog.ui.BidiInput'], ['goog.events', 'goog.events.InputHandler', 'goog.i18n.bidi', 'goog.ui.Component']);
goog.addDependency('ui/bubble.js', ['goog.ui.Bubble'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.Event', 'goog.math.Box', 'goog.positioning', 'goog.positioning.AbsolutePosition', 'goog.positioning.AbstractPosition', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.Popup', 'goog.ui.Popup.AnchoredPosition']);
goog.addDependency('ui/button.js', ['goog.ui.Button', 'goog.ui.Button.Side'], ['goog.events.KeyCodes', 'goog.ui.ButtonRenderer', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.NativeButtonRenderer']);
goog.addDependency('ui/buttonrenderer.js', ['goog.ui.ButtonRenderer'], ['goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/cccbutton.js', ['goog.ui.CccButton'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.ui.DeprecatedButton', 'goog.userAgent']);
goog.addDependency('ui/charcounter.js', ['goog.ui.CharCounter', 'goog.ui.CharCounter.Display'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.InputHandler']);
goog.addDependency('ui/charpicker.js', ['goog.ui.CharPicker'], ['goog.array', 'goog.dom', 'goog.events', 'goog.events.InputHandler', 'goog.i18n.CharListDecompressor', 'goog.i18n.uChar', 'goog.structs.Set', 'goog.style', 'goog.ui.Button', 'goog.ui.ContainerScroller', 'goog.ui.FlatButtonRenderer', 'goog.ui.HoverCard', 'goog.ui.LabelInput', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuItem']);
goog.addDependency('ui/checkbox.js', ['goog.ui.Checkbox', 'goog.ui.Checkbox.State'], ['goog.array', 'goog.dom.classes', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler.EventType', 'goog.object', 'goog.ui.Component.EventType', 'goog.ui.Control', 'goog.ui.registry']);
goog.addDependency('ui/checkboxmenuitem.js', ['goog.ui.CheckBoxMenuItem'], ['goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/colorbutton.js', ['goog.ui.ColorButton'], ['goog.ui.Button', 'goog.ui.ColorButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/colorbuttonrenderer.js', ['goog.ui.ColorButtonRenderer'], ['goog.dom.classes', 'goog.functions', 'goog.ui.ColorMenuButtonRenderer']);
goog.addDependency('ui/colormenubutton.js', ['goog.ui.ColorMenuButton'], ['goog.array', 'goog.object', 'goog.ui.ColorMenuButtonRenderer', 'goog.ui.ColorPalette', 'goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.registry']);
goog.addDependency('ui/colormenubuttonrenderer.js', ['goog.ui.ColorMenuButtonRenderer'], ['goog.color', 'goog.dom.classes', 'goog.ui.ControlContent', 'goog.ui.MenuButtonRenderer', 'goog.userAgent']);
goog.addDependency('ui/colorpalette.js', ['goog.ui.ColorPalette'], ['goog.array', 'goog.color', 'goog.dom', 'goog.style', 'goog.ui.Palette', 'goog.ui.PaletteRenderer']);
goog.addDependency('ui/colorpicker.js', ['goog.ui.ColorPicker', 'goog.ui.ColorPicker.EventType'], ['goog.ui.ColorPalette', 'goog.ui.Component', 'goog.ui.Component.State']);
goog.addDependency('ui/colorsplitbehavior.js', ['goog.ui.ColorSplitBehavior'], ['goog.ui.ColorButton', 'goog.ui.ColorMenuButton', 'goog.ui.SplitBehavior']);
goog.addDependency('ui/combobox.js', ['goog.ui.ComboBox', 'goog.ui.ComboBoxItem'], ['goog.Timer', 'goog.debug.Logger', 'goog.dom.classes', 'goog.events', 'goog.events.InputHandler', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.string', 'goog.style', 'goog.ui.Component', 'goog.ui.ItemEvent', 'goog.ui.LabelInput', 'goog.ui.Menu', 'goog.ui.MenuItem', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/component.js', ['goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State'], ['goog.array', 'goog.dom', 'goog.dom.DomHelper', 'goog.events', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.object', 'goog.style', 'goog.ui.IdGenerator']);
goog.addDependency('ui/container.js', ['goog.ui.Container', 'goog.ui.Container.EventType', 'goog.ui.Container.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ContainerRenderer']);
goog.addDependency('ui/containerrenderer.js', ['goog.ui.ContainerRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.string', 'goog.style', 'goog.ui.Separator', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/containerscroller.js', ['goog.ui.ContainerScroller'], ['goog.Timer', 'goog.events.EventHandler', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.Container.EventType']);
goog.addDependency('ui/control.js', ['goog.ui.Control'], ['goog.array', 'goog.dom', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.string', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer', 'goog.ui.decorate', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/controlcontent.js', ['goog.ui.ControlContent'], []);
goog.addDependency('ui/controlrenderer.js', ['goog.ui.ControlRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.object', 'goog.style', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.userAgent']);
goog.addDependency('ui/css3buttonrenderer.js', ['goog.ui.Css3ButtonRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.ui.Button', 'goog.ui.ButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/cssnames.js', ['goog.ui.INLINE_BLOCK_CLASSNAME'], []);
goog.addDependency('ui/custombutton.js', ['goog.ui.CustomButton'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/custombuttonrenderer.js', ['goog.ui.CustomButtonRenderer'], ['goog.dom', 'goog.dom.classes', 'goog.string', 'goog.ui.ButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME']);
goog.addDependency('ui/customcolorpalette.js', ['goog.ui.CustomColorPalette'], ['goog.color', 'goog.dom', 'goog.ui.ColorPalette']);
goog.addDependency('ui/datepicker.js', ['goog.ui.DatePicker', 'goog.ui.DatePicker.Events', 'goog.ui.DatePickerEvent'], ['goog.date', 'goog.date.Date', 'goog.date.Interval', 'goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.i18n.DateTimeFormat', 'goog.i18n.DateTimeSymbols', 'goog.style', 'goog.ui.Component']);
goog.addDependency('ui/decorate.js', ['goog.ui.decorate'], ['goog.ui.registry']);
goog.addDependency('ui/deprecatedbutton.js', ['goog.ui.DeprecatedButton'], ['goog.dom', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget']);
goog.addDependency('ui/dialog.js', ['goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.Event', 'goog.ui.Dialog.EventType'], ['goog.Timer', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.a11y', 'goog.dom.classes', 'goog.dom.iframe', 'goog.events', 'goog.events.FocusHandler', 'goog.events.KeyCodes', 'goog.fx.Dragger', 'goog.math.Rect', 'goog.structs', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/dimensionpicker.js', ['goog.ui.DimensionPicker'], ['goog.events.EventType', 'goog.math.Size', 'goog.ui.Control', 'goog.ui.DimensionPickerRenderer', 'goog.ui.registry']);
goog.addDependency('ui/dimensionpickerrenderer.js', ['goog.ui.DimensionPickerRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.i18n.bidi', 'goog.style', 'goog.ui.ControlRenderer', 'goog.userAgent']);
goog.addDependency('ui/drilldownrow.js', ['goog.ui.DrilldownRow'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.ui.Component']);
goog.addDependency('ui/editor/abstractdialog.js', ['goog.ui.editor.AbstractDialog', 'goog.ui.editor.AbstractDialog.Builder', 'goog.ui.editor.AbstractDialog.EventType'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventTarget', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.Event', 'goog.ui.Dialog.EventType']);
goog.addDependency('ui/editor/bubble.js', ['goog.ui.editor.Bubble'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.ViewportSizeMonitor', 'goog.editor.style', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.positioning', 'goog.string', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.PopupBase', 'goog.ui.PopupBase.EventType', 'goog.userAgent']);
goog.addDependency('ui/editor/defaulttoolbar.js', ['goog.ui.editor.DefaultToolbar'], ['goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.Command', 'goog.string.StringBuffer', 'goog.style', 'goog.ui.ControlContent', 'goog.ui.editor.ToolbarFactory', 'goog.ui.editor.messages']);
goog.addDependency('ui/editor/linkdialog.js', ['goog.ui.editor.LinkDialog', 'goog.ui.editor.LinkDialog.BeforeTestLinkEvent', 'goog.ui.editor.LinkDialog.EventType', 'goog.ui.editor.LinkDialog.OkEvent'], ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.TagName', 'goog.dom.classes', 'goog.dom.selection', 'goog.editor.BrowserFeature', 'goog.editor.Link', 'goog.editor.focus', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.events.InputHandler.EventType', 'goog.string', 'goog.style', 'goog.ui.Button', 'goog.ui.LinkButtonRenderer', 'goog.ui.editor.AbstractDialog', 'goog.ui.editor.AbstractDialog.Builder', 'goog.ui.editor.AbstractDialog.EventType', 'goog.ui.editor.TabPane', 'goog.ui.editor.messages', 'goog.userAgent', 'goog.window']);
goog.addDependency('ui/editor/messages.js', ['goog.ui.editor.messages'], []);
goog.addDependency('ui/editor/tabpane.js', ['goog.ui.editor.TabPane'], ['goog.dom.TagName', 'goog.events.EventHandler', 'goog.ui.Component', 'goog.ui.Control', 'goog.ui.Tab', 'goog.ui.TabBar']);
goog.addDependency('ui/editor/toolbarcontroller.js', ['goog.ui.editor.ToolbarController'], ['goog.editor.Field.EventType', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.ui.Component.EventType']);
goog.addDependency('ui/editor/toolbarfactory.js', ['goog.ui.editor.ToolbarFactory'], ['goog.array', 'goog.dom', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.ui.Component.State', 'goog.ui.Container.Orientation', 'goog.ui.ControlContent', 'goog.ui.Option', 'goog.ui.Toolbar', 'goog.ui.ToolbarButton', 'goog.ui.ToolbarColorMenuButton', 'goog.ui.ToolbarMenuButton', 'goog.ui.ToolbarRenderer', 'goog.ui.ToolbarSelect', 'goog.userAgent']);
goog.addDependency('ui/emoji/emoji.js', ['goog.ui.emoji.Emoji'], []);
goog.addDependency('ui/emoji/emojipalette.js', ['goog.ui.emoji.EmojiPalette'], ['goog.events.Event', 'goog.events.EventType', 'goog.net.ImageLoader', 'goog.ui.Palette', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.EmojiPaletteRenderer']);
goog.addDependency('ui/emoji/emojipaletterenderer.js', ['goog.ui.emoji.EmojiPaletteRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.ui.PaletteRenderer', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.SpriteInfo']);
goog.addDependency('ui/emoji/emojipicker.js', ['goog.ui.emoji.EmojiPicker'], ['goog.debug.Logger', 'goog.dom', 'goog.ui.Component', 'goog.ui.TabPane', 'goog.ui.TabPane.TabPage', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.EmojiPalette', 'goog.ui.emoji.EmojiPaletteRenderer', 'goog.ui.emoji.ProgressiveEmojiPaletteRenderer']);
goog.addDependency('ui/emoji/popupemojipicker.js', ['goog.ui.emoji.PopupEmojiPicker'], ['goog.dom', 'goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.ui.Component', 'goog.ui.Popup', 'goog.ui.emoji.EmojiPicker']);
goog.addDependency('ui/emoji/progressiveemojipaletterenderer.js', ['goog.ui.emoji.ProgressiveEmojiPaletteRenderer'], ['goog.ui.emoji.EmojiPaletteRenderer']);
goog.addDependency('ui/emoji/spriteinfo.js', ['goog.ui.emoji.SpriteInfo'], []);
goog.addDependency('ui/filteredmenu.js', ['goog.ui.FilteredMenu'], ['goog.dom', 'goog.events.InputHandler', 'goog.events.KeyCodes', 'goog.string', 'goog.ui.FilterObservingMenuItem', 'goog.ui.Menu']);
goog.addDependency('ui/filterobservingmenuitem.js', ['goog.ui.FilterObservingMenuItem'], ['goog.ui.ControlContent', 'goog.ui.FilterObservingMenuItemRenderer', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/filterobservingmenuitemrenderer.js', ['goog.ui.FilterObservingMenuItemRenderer'], ['goog.ui.MenuItemRenderer']);
goog.addDependency('ui/flatbuttonrenderer.js', ['goog.ui.FlatButtonRenderer'], ['goog.dom.classes', 'goog.ui.Button', 'goog.ui.ButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/flatmenubuttonrenderer.js', ['goog.ui.FlatMenuButtonRenderer'], ['goog.style', 'goog.ui.ControlContent', 'goog.ui.FlatButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuRenderer', 'goog.ui.registry']);
goog.addDependency('ui/formpost.js', ['goog.ui.FormPost'], ['goog.array', 'goog.dom.TagName', 'goog.string', 'goog.string.StringBuffer', 'goog.ui.Component']);
goog.addDependency('ui/gauge.js', ['goog.ui.Gauge', 'goog.ui.GaugeColoredRange'], ['goog.dom', 'goog.dom.a11y', 'goog.fx.Animation', 'goog.fx.easing', 'goog.graphics', 'goog.graphics.Font', 'goog.graphics.SolidFill', 'goog.ui.Component', 'goog.ui.GaugeTheme']);
goog.addDependency('ui/gaugetheme.js', ['goog.ui.GaugeTheme'], ['goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke']);
goog.addDependency('ui/hovercard.js', ['goog.ui.HoverCard', 'goog.ui.HoverCard.EventType', 'goog.ui.HoverCard.TriggerEvent'], ['goog.dom', 'goog.events', 'goog.ui.AdvancedTooltip']);
goog.addDependency('ui/hsvapalette.js', ['goog.ui.HsvaPalette'], ['goog.array', 'goog.color', 'goog.color.alpha', 'goog.ui.Component.EventType', 'goog.ui.HsvPalette']);
goog.addDependency('ui/hsvpalette.js', ['goog.ui.HsvPalette'], ['goog.color', 'goog.dom', 'goog.dom.DomHelper', 'goog.events', 'goog.events.Event', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/idgenerator.js', ['goog.ui.IdGenerator'], []);
goog.addDependency('ui/idletimer.js', ['goog.ui.IdleTimer'], ['goog.Timer', 'goog.events', 'goog.events.EventTarget', 'goog.structs.Set', 'goog.ui.ActivityMonitor']);
goog.addDependency('ui/iframemask.js', ['goog.ui.IframeMask'], ['goog.Disposable', 'goog.Timer', 'goog.dom', 'goog.dom.DomHelper', 'goog.dom.iframe', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.style']);
goog.addDependency('ui/imagelessbuttonrenderer.js', ['goog.ui.ImagelessButtonRenderer'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/imagelessroundedcorner.js', ['goog.ui.AbstractImagelessRoundedCorner', 'goog.ui.CanvasRoundedCorner', 'goog.ui.ImagelessRoundedCorner', 'goog.ui.VmlRoundedCorner'], ['goog.dom.DomHelper', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.VmlGraphics', 'goog.userAgent']);
goog.addDependency('ui/inputdatepicker.js', ['goog.ui.InputDatePicker'], ['goog.date.DateTime', 'goog.dom', 'goog.i18n.DateTimeParse', 'goog.string', 'goog.ui.Component', 'goog.ui.PopupDatePicker']);
goog.addDependency('ui/itemevent.js', ['goog.ui.ItemEvent'], ['goog.events.Event']);
goog.addDependency('ui/keyboardshortcuthandler.js', ['goog.ui.KeyboardShortcutEvent', 'goog.ui.KeyboardShortcutHandler', 'goog.ui.KeyboardShortcutHandler.EventType'], ['goog.Timer', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.KeyCodes', 'goog.events.KeyNames', 'goog.object']);
goog.addDependency('ui/labelinput.js', ['goog.ui.LabelInput'], ['goog.Timer', 'goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.ui.Component']);
goog.addDependency('ui/linkbuttonrenderer.js', ['goog.ui.LinkButtonRenderer'], ['goog.ui.Button', 'goog.ui.FlatButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/media/flashobject.js', ['goog.ui.media.FlashObject', 'goog.ui.media.FlashObject.ScriptAccessLevel', 'goog.ui.media.FlashObject.Wmodes'], ['goog.asserts', 'goog.debug.Logger', 'goog.events.EventHandler', 'goog.string', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.userAgent', 'goog.userAgent.flash']);
goog.addDependency('ui/media/flickr.js', ['goog.ui.media.FlickrSet', 'goog.ui.media.FlickrSetModel'], ['goog.object', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/media.js', ['goog.ui.media.Media', 'goog.ui.media.MediaRenderer'], ['goog.style', 'goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/media/mediamodel.js', ['goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Category', 'goog.ui.media.MediaModel.MimeType', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaModel.Thumbnail'], []);
goog.addDependency('ui/media/mp3.js', ['goog.ui.media.Mp3'], ['goog.string', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/photo.js', ['goog.ui.media.Photo'], ['goog.ui.media.Media', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/picasa.js', ['goog.ui.media.PicasaAlbum', 'goog.ui.media.PicasaAlbumModel'], ['goog.object', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/vimeo.js', ['goog.ui.media.Vimeo', 'goog.ui.media.VimeoModel'], ['goog.string', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/youtube.js', ['goog.ui.media.Youtube', 'goog.ui.media.YoutubeModel'], ['goog.string', 'goog.ui.Component.Error', 'goog.ui.Component.State', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaModel.Thumbnail', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/menu.js', ['goog.ui.Menu', 'goog.ui.Menu.EventType'], ['goog.string', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.Container', 'goog.ui.Container.Orientation', 'goog.ui.MenuItem', 'goog.ui.MenuRenderer', 'goog.ui.MenuSeparator']);
goog.addDependency('ui/menubase.js', ['goog.ui.MenuBase'], ['goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.ui.Popup']);
goog.addDependency('ui/menubutton.js', ['goog.ui.MenuButton'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler.EventType', 'goog.math.Box', 'goog.math.Rect', 'goog.positioning.Corner', 'goog.positioning.MenuAnchoredPosition', 'goog.style', 'goog.ui.Button', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/menubuttonrenderer.js', ['goog.ui.MenuButtonRenderer'], ['goog.dom', 'goog.style', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.Menu', 'goog.ui.MenuRenderer', 'goog.userAgent']);
goog.addDependency('ui/menuitem.js', ['goog.ui.MenuItem'], ['goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.MenuItemRenderer', 'goog.ui.registry']);
goog.addDependency('ui/menuitemrenderer.js', ['goog.ui.MenuItemRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.classes', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/menurenderer.js', ['goog.ui.MenuRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.ui.ContainerRenderer', 'goog.ui.Separator']);
goog.addDependency('ui/menuseparator.js', ['goog.ui.MenuSeparator'], ['goog.ui.MenuSeparatorRenderer', 'goog.ui.Separator', 'goog.ui.registry']);
goog.addDependency('ui/menuseparatorrenderer.js', ['goog.ui.MenuSeparatorRenderer'], ['goog.dom', 'goog.dom.classes', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/mockactivitymonitor.js', ['goog.ui.MockActivityMonitor'], ['goog.events.EventType', 'goog.ui.ActivityMonitor']);
goog.addDependency('ui/nativebuttonrenderer.js', ['goog.ui.NativeButtonRenderer'], ['goog.dom.classes', 'goog.events.EventType', 'goog.ui.ButtonRenderer', 'goog.ui.Component.State']);
goog.addDependency('ui/offlineinstalldialog.js', ['goog.ui.OfflineInstallDialog', 'goog.ui.OfflineInstallDialog.ButtonKeyType', 'goog.ui.OfflineInstallDialog.EnableScreen', 'goog.ui.OfflineInstallDialog.InstallScreen', 'goog.ui.OfflineInstallDialog.InstallingGearsScreen', 'goog.ui.OfflineInstallDialog.ScreenType', 'goog.ui.OfflineInstallDialog.UpgradeScreen', 'goog.ui.OfflineInstallDialogScreen'], ['goog.Disposable', 'goog.dom.classes', 'goog.gears', 'goog.string', 'goog.string.StringBuffer', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.EventType', 'goog.window']);
goog.addDependency('ui/offlinestatuscard.js', ['goog.ui.OfflineStatusCard', 'goog.ui.OfflineStatusCard.EventType'], ['goog.dom', 'goog.events.EventType', 'goog.gears.StatusType', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.ProgressBar']);
goog.addDependency('ui/offlinestatuscomponent.js', ['goog.ui.OfflineStatusComponent', 'goog.ui.OfflineStatusComponent.StatusClassNames'], ['goog.dom.classes', 'goog.events.EventType', 'goog.gears.StatusType', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.ui.Component', 'goog.ui.Popup']);
goog.addDependency('ui/option.js', ['goog.ui.Option'], ['goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/palette.js', ['goog.ui.Palette'], ['goog.array', 'goog.dom', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.math.Size', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Control', 'goog.ui.PaletteRenderer', 'goog.ui.SelectionModel']);
goog.addDependency('ui/paletterenderer.js', ['goog.ui.PaletteRenderer'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.a11y', 'goog.dom.classes', 'goog.style', 'goog.ui.ControlRenderer', 'goog.userAgent']);
goog.addDependency('ui/plaintextspellchecker.js', ['goog.ui.PlainTextSpellChecker'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.style', 'goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/popup.js', ['goog.ui.Popup', 'goog.ui.Popup.AbsolutePosition', 'goog.ui.Popup.AnchoredPosition', 'goog.ui.Popup.AnchoredViewPortPosition', 'goog.ui.Popup.ClientPosition', 'goog.ui.Popup.Corner', 'goog.ui.Popup.Overflow', 'goog.ui.Popup.ViewPortClientPosition', 'goog.ui.Popup.ViewPortPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AbsolutePosition', 'goog.positioning.AnchoredPosition', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.ClientPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus', 'goog.positioning.ViewportClientPosition', 'goog.positioning.ViewportPosition', 'goog.style', 'goog.ui.PopupBase']);
goog.addDependency('ui/popupbase.js', ['goog.ui.PopupBase', 'goog.ui.PopupBase.EventType', 'goog.ui.PopupBase.Type'], ['goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style', 'goog.userAgent']);
goog.addDependency('ui/popupcolorpicker.js', ['goog.ui.PopupColorPicker'], ['goog.dom.classes', 'goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.ui.ColorPicker', 'goog.ui.ColorPicker.EventType', 'goog.ui.Component', 'goog.ui.Popup']);
goog.addDependency('ui/popupdatepicker.js', ['goog.ui.PopupDatePicker'], ['goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.DatePicker', 'goog.ui.DatePicker.Events', 'goog.ui.Popup', 'goog.ui.PopupBase.EventType']);
goog.addDependency('ui/popupmenu.js', ['goog.ui.PopupMenu'], ['goog.events.EventType', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.positioning.MenuAnchoredPosition', 'goog.positioning.ViewportClientPosition', 'goog.structs', 'goog.structs.Map', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.Menu', 'goog.ui.PopupBase', 'goog.userAgent']);
goog.addDependency('ui/progressbar.js', ['goog.ui.ProgressBar', 'goog.ui.ProgressBar.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.RangeModel', 'goog.userAgent']);
goog.addDependency('ui/prompt.js', ['goog.ui.Prompt'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.ui.Component.Error', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.EventType', 'goog.userAgent']);
goog.addDependency('ui/rangemodel.js', ['goog.ui.RangeModel'], ['goog.events.EventTarget', 'goog.ui.Component.EventType']);
goog.addDependency('ui/ratings.js', ['goog.ui.Ratings', 'goog.ui.Ratings.EventType'], ['goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventType', 'goog.ui.Component']);
goog.addDependency('ui/registry.js', ['goog.ui.registry'], ['goog.dom.classes']);
goog.addDependency('ui/richtextspellchecker.js', ['goog.ui.RichTextSpellChecker'], ['goog.Timer', 'goog.dom', 'goog.dom.NodeType', 'goog.events', 'goog.events.EventType', 'goog.string.StringBuffer', 'goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult']);
goog.addDependency('ui/roundedcorners.js', ['goog.ui.RoundedCorners', 'goog.ui.RoundedCorners.Corners'], ['goog.Uri', 'goog.color', 'goog.dom', 'goog.math.Size', 'goog.string', 'goog.style', 'goog.userAgent']);
goog.addDependency('ui/roundedpanel.js', ['goog.ui.BaseRoundedPanel', 'goog.ui.CssRoundedPanel', 'goog.ui.GraphicsRoundedPanel', 'goog.ui.RoundedPanel', 'goog.ui.RoundedPanel.Corner'], ['goog.dom', 'goog.dom.classes', 'goog.graphics', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.math.Coordinate', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/roundedtabrenderer.js', ['goog.ui.RoundedTabRenderer'], ['goog.dom', 'goog.ui.Tab', 'goog.ui.TabBar.Location', 'goog.ui.TabRenderer', 'goog.ui.registry']);
goog.addDependency('ui/scrollfloater.js', ['goog.ui.ScrollFloater'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventType', 'goog.object', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/select.js', ['goog.ui.Select'], ['goog.events.EventType', 'goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.MenuButton', 'goog.ui.SelectionModel', 'goog.ui.registry']);
goog.addDependency('ui/selectionmenubutton.js', ['goog.ui.SelectionMenuButton', 'goog.ui.SelectionMenuButton.SelectionState'], ['goog.ui.Component.EventType', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuItem']);
goog.addDependency('ui/selectionmodel.js', ['goog.ui.SelectionModel'], ['goog.array', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency('ui/separator.js', ['goog.ui.Separator'], ['goog.dom.a11y', 'goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.MenuSeparatorRenderer', 'goog.ui.registry']);
goog.addDependency('ui/serverchart.js', ['goog.ui.ServerChart', 'goog.ui.ServerChart.AxisDisplayType', 'goog.ui.ServerChart.ChartType', 'goog.ui.ServerChart.EncodingType', 'goog.ui.ServerChart.Event', 'goog.ui.ServerChart.LegendPosition', 'goog.ui.ServerChart.MaximumValue', 'goog.ui.ServerChart.MultiAxisAlignment', 'goog.ui.ServerChart.MultiAxisType', 'goog.ui.ServerChart.UriParam', 'goog.ui.ServerChart.UriTooLongEvent'], ['goog.Uri', 'goog.array', 'goog.asserts', 'goog.events.Event', 'goog.string', 'goog.ui.Component']);
goog.addDependency('ui/slider.js', ['goog.ui.Slider', 'goog.ui.Slider.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.ui.SliderBase', 'goog.ui.SliderBase.Orientation']);
goog.addDependency('ui/sliderbase.js', ['goog.ui.SliderBase', 'goog.ui.SliderBase.Orientation'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.events.MouseWheelHandler', 'goog.events.MouseWheelHandler.EventType', 'goog.fx.Animation.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.fx.dom.SlideFrom', 'goog.math', 'goog.math.Coordinate', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.RangeModel']);
goog.addDependency('ui/splitbehavior.js', ['goog.ui.SplitBehavior', 'goog.ui.SplitBehavior.DefaultHandlers'], ['goog.Disposable', 'goog.array', 'goog.dispose', 'goog.dom', 'goog.dom.DomHelper', 'goog.dom.classes', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.string', 'goog.ui.Button.Side', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.decorate', 'goog.ui.registry']);
goog.addDependency('ui/splitpane.js', ['goog.ui.SplitPane', 'goog.ui.SplitPane.Orientation'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Rect', 'goog.math.Size', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/style/app/buttonrenderer.js', ['goog.ui.style.app.ButtonRenderer'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/style/app/menubuttonrenderer.js', ['goog.ui.style.app.MenuButtonRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y.Role', 'goog.style', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuRenderer', 'goog.ui.style.app.ButtonRenderer']);
goog.addDependency('ui/style/app/primaryactionbuttonrenderer.js', ['goog.ui.style.app.PrimaryActionButtonRenderer'], ['goog.ui.Button', 'goog.ui.registry', 'goog.ui.style.app.ButtonRenderer']);
goog.addDependency('ui/submenu.js', ['goog.ui.SubMenu'], ['goog.Timer', 'goog.dom', 'goog.dom.classes', 'goog.events.KeyCodes', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuItem', 'goog.ui.SubMenuRenderer', 'goog.ui.registry']);
goog.addDependency('ui/submenurenderer.js', ['goog.ui.SubMenuRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.style', 'goog.ui.Menu', 'goog.ui.MenuItemRenderer']);
goog.addDependency('ui/tab.js', ['goog.ui.Tab'], ['goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.TabRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tabbar.js', ['goog.ui.TabBar', 'goog.ui.TabBar.Location'], ['goog.ui.Component.EventType', 'goog.ui.Container', 'goog.ui.Container.Orientation', 'goog.ui.Tab', 'goog.ui.TabBarRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tabbarrenderer.js', ['goog.ui.TabBarRenderer'], ['goog.dom.a11y.Role', 'goog.object', 'goog.ui.ContainerRenderer']);
goog.addDependency('ui/tablesorter.js', ['goog.ui.TableSorter', 'goog.ui.TableSorter.EventType'], ['goog.array', 'goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.ui.Component']);
goog.addDependency('ui/tabpane.js', ['goog.ui.TabPane', 'goog.ui.TabPane.Events', 'goog.ui.TabPane.TabLocation', 'goog.ui.TabPane.TabPage', 'goog.ui.TabPaneEvent'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style']);
goog.addDependency('ui/tabrenderer.js', ['goog.ui.TabRenderer'], ['goog.dom.a11y.Role', 'goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/textarea.js', ['goog.ui.Textarea'], ['goog.Timer', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style', 'goog.ui.Control', 'goog.ui.TextareaRenderer', 'goog.userAgent', 'goog.userAgent.product']);
goog.addDependency('ui/textarearenderer.js', ['goog.ui.TextareaRenderer'], ['goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/togglebutton.js', ['goog.ui.ToggleButton'], ['goog.ui.Button', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbar.js', ['goog.ui.Toolbar'], ['goog.ui.Container', 'goog.ui.ToolbarRenderer']);
goog.addDependency('ui/toolbarbutton.js', ['goog.ui.ToolbarButton'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.ToolbarButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarbuttonrenderer.js', ['goog.ui.ToolbarButtonRenderer'], ['goog.ui.CustomButtonRenderer']);
goog.addDependency('ui/toolbarcolormenubutton.js', ['goog.ui.ToolbarColorMenuButton'], ['goog.ui.ColorMenuButton', 'goog.ui.ControlContent', 'goog.ui.ToolbarColorMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarcolormenubuttonrenderer.js', ['goog.ui.ToolbarColorMenuButtonRenderer'], ['goog.dom.classes', 'goog.ui.ColorMenuButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.MenuButtonRenderer', 'goog.ui.ToolbarMenuButtonRenderer']);
goog.addDependency('ui/toolbarmenubutton.js', ['goog.ui.ToolbarMenuButton'], ['goog.ui.ControlContent', 'goog.ui.MenuButton', 'goog.ui.ToolbarMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarmenubuttonrenderer.js', ['goog.ui.ToolbarMenuButtonRenderer'], ['goog.ui.MenuButtonRenderer']);
goog.addDependency('ui/toolbarrenderer.js', ['goog.ui.ToolbarRenderer'], ['goog.dom.a11y.Role', 'goog.ui.Container.Orientation', 'goog.ui.ContainerRenderer', 'goog.ui.Separator', 'goog.ui.ToolbarSeparatorRenderer']);
goog.addDependency('ui/toolbarselect.js', ['goog.ui.ToolbarSelect'], ['goog.ui.ControlContent', 'goog.ui.Select', 'goog.ui.ToolbarMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarseparator.js', ['goog.ui.ToolbarSeparator'], ['goog.ui.Separator', 'goog.ui.ToolbarSeparatorRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarseparatorrenderer.js', ['goog.ui.ToolbarSeparatorRenderer'], ['goog.dom.classes', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.MenuSeparatorRenderer']);
goog.addDependency('ui/toolbartogglebutton.js', ['goog.ui.ToolbarToggleButton'], ['goog.ui.ControlContent', 'goog.ui.ToggleButton', 'goog.ui.ToolbarButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tooltip.js', ['goog.ui.Tooltip', 'goog.ui.Tooltip.CursorTooltipPosition', 'goog.ui.Tooltip.ElementTooltipPosition', 'goog.ui.Tooltip.State'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.events', 'goog.events.EventType', 'goog.math.Box', 'goog.math.Coordinate', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus', 'goog.positioning.ViewportPosition', 'goog.structs.Set', 'goog.style', 'goog.ui.Popup', 'goog.ui.PopupBase']);
goog.addDependency('ui/tree/basenode.js', ['goog.ui.tree.BaseNode', 'goog.ui.tree.BaseNode.EventType'], ['goog.Timer', 'goog.asserts', 'goog.dom.a11y', 'goog.events.KeyCodes', 'goog.string', 'goog.string.StringBuffer', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/tree/treecontrol.js', ['goog.ui.tree.TreeControl'], ['goog.debug.Logger', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventType', 'goog.events.FocusHandler', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.ui.tree.BaseNode', 'goog.ui.tree.TreeNode', 'goog.ui.tree.TypeAhead', 'goog.userAgent']);
goog.addDependency('ui/tree/treenode.js', ['goog.ui.tree.TreeNode'], ['goog.ui.tree.BaseNode']);
goog.addDependency('ui/tree/typeahead.js', ['goog.ui.tree.TypeAhead', 'goog.ui.tree.TypeAhead.Offset'], ['goog.array', 'goog.events.KeyCodes', 'goog.string', 'goog.structs.Trie']);
goog.addDependency('ui/tristatemenuitem.js', ['goog.ui.TriStateMenuItem', 'goog.ui.TriStateMenuItem.State'], ['goog.dom.classes', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.TriStateMenuItemRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tristatemenuitemrenderer.js', ['goog.ui.TriStateMenuItemRenderer'], ['goog.dom.classes', 'goog.ui.MenuItemRenderer']);
goog.addDependency('ui/twothumbslider.js', ['goog.ui.TwoThumbSlider'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.ui.SliderBase']);
goog.addDependency('ui/zippy.js', ['goog.ui.Zippy', 'goog.ui.ZippyEvent'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style']);
goog.addDependency('uri/uri.js', ['goog.Uri', 'goog.Uri.QueryData'], ['goog.array', 'goog.string', 'goog.structs', 'goog.structs.Map', 'goog.uri.utils', 'goog.uri.utils.ComponentIndex']);
goog.addDependency('uri/utils.js', ['goog.uri.utils', 'goog.uri.utils.ComponentIndex'], ['goog.asserts', 'goog.string']);
goog.addDependency('useragent/adobereader.js', ['goog.userAgent.adobeReader'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/flash.js', ['goog.userAgent.flash'], ['goog.string']);
goog.addDependency('useragent/iphoto.js', ['goog.userAgent.iphoto'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/jscript.js', ['goog.userAgent.jscript'], ['goog.string']);
goog.addDependency('useragent/picasa.js', ['goog.userAgent.picasa'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/platform.js', ['goog.userAgent.platform'], ['goog.userAgent']);
goog.addDependency('useragent/product.js', ['goog.userAgent.product'], ['goog.userAgent']);
goog.addDependency('useragent/product_isversion.js', ['goog.userAgent.product.isVersion'], ['goog.userAgent.product']);
goog.addDependency('useragent/useragent.js', ['goog.userAgent'], ['goog.string']);
goog.addDependency('window/window.js', ['goog.window'], ['goog.string']);

goog.addDependency('../../third_party/closure/goog/caja/string/html/htmlparser.js', ['goog.string.html.HtmlParser', 'goog.string.html.HtmlParser.EFlags', 'goog.string.html.HtmlParser.Elements', 'goog.string.html.HtmlParser.Entities', 'goog.string.html.HtmlSaxHandler'], []);
goog.addDependency('../../third_party/closure/goog/caja/string/html/htmlsanitizer.js', ['goog.string.html.HtmlSanitizer', 'goog.string.html.HtmlSanitizer.AttributeType', 'goog.string.html.HtmlSanitizer.Attributes', 'goog.string.html.htmlSanitize'], ['goog.string.StringBuffer', 'goog.string.html.HtmlParser', 'goog.string.html.HtmlParser.EFlags', 'goog.string.html.HtmlParser.Elements', 'goog.string.html.HtmlSaxHandler']);
goog.addDependency('../../third_party/closure/goog/dojo/dom/query.js', ['goog.dom.query'], ['goog.array', 'goog.dom', 'goog.functions', 'goog.string', 'goog.userAgent']);
goog.addDependency('../../third_party/closure/goog/jpeg_encoder/jpeg_encoder_basic.js', ['goog.crypt.JpegEncoder'], ['goog.crypt.base64']);
goog.addDependency('../../third_party/closure/goog/loremipsum/text/loremipsum.js', ['goog.text.LoremIpsum'], ['goog.array', 'goog.math', 'goog.string', 'goog.structs.Map', 'goog.structs.Set']);
goog.addDependency('../../third_party/closure/goog/mochikit/async/deferred.js', ['goog.async.Deferred', 'goog.async.Deferred.AlreadyCalledError', 'goog.async.Deferred.CancelledError'], ['goog.Timer', 'goog.asserts', 'goog.debug.Error']);
goog.addDependency('../../third_party/closure/goog/mochikit/async/deferredlist.js', ['goog.async.DeferredList'], ['goog.array', 'goog.async.Deferred']);
// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
*
*
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, empty, or whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * Regular expression used for determining if a string needs to be encoded.
 * @type {RegExp}
 * @private
 */
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;

/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  str = String(str);
  // Checking if the search matches before calling encodeURIComponent avoids an
  // extra allocation in IE6. This adds about 10us time in FF and a similiar
  // over head in IE6 for lower working set apps, but for large working set
  // apps like Gmail, it saves about 70us per call.
  if (!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    // If the string contains < then there could be a script tag in there and in
    // that case we fall back to a non DOM solution as well.
    if ('document' in goog.global && !goog.string.contains(str, '<')) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM. Don't use this function directly, it
 * should only be used by unescapeEntities. If used directly you will be
 * vulnerable to XSS attacks.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global['document']['createElement']('a');
  el['innerHTML'] = str;
  // Accesing the function directly triggers some virus scanners.
  if (el[goog.string.NORMALIZE_FN_]) {
    el[goog.string.NORMALIZE_FN_]();
  }
  str = el['firstChild']['nodeValue'];
  el['innerHTML'] = '';
  return str;
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};

/**
 * String name for the node.normalize function. Anti-virus programs use this as
 * a signature for some viruses so we need a work around (temporary).
 * @private
 * @type {string}
 */
goog.string.NORMALIZE_FN_ = 'normalize';

/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that charater.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO(user): It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given character.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
                   replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  return Math.floor(Math.random() * 2147483648).toString(36) +
         (Math.floor(Math.random() * 2147483648) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
    // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is corectly maintained.
 *
*
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  this.stack = new Error().stack || '';

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @inheritDoc */
goog.debug.Error.prototype.name = 'CustomError';
// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
*
 * @author agrieve@google.com (Andrew Grieve)
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');

// TODO(nicksantos): Add return values for all these functions, so that they
// can be chained like:
// eatNumber(goog.asserts.isNumber(foo));
// for more lisp-y asserts.

/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;


/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @inheritDoc */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s.', [value],
         opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
         opt_message, Array.prototype.slice.call(arguments, 3));
  }
};

/**
 * Base namespace for Skulpt. This is the only symbol that Skulpt adds to the
 * global namespace. Other user accessible symbols are noted and described
 * below.
 */

var Sk = Sk || {};

/**
 * Resets Skulpt's global runtime data. This is called automatically in
 * Sk.configure and Sk.importMain, but there may be situations where you
 * need to reset manually (for example, if you're implementing some kind
 * of REPL).
 */
Sk.reset = function()
{
    Sk._moduleStack = [];
    Sk._frames = [];

    Sk._initingObjects = [];
    Sk._initingObjectsIndex = 0;

    delete Sk._preservedFrames;
    delete Sk._frameRestoreIndex;
    delete Sk._futureResult;
};

/**
 *
 * Set various customizable parts of Skulpt.
 *
 * output: Replacable output redirection (called from print, etc.).
 * read: Replacable function to load modules with (called via import, etc.)
 * sysargv: Setable to emulate arguments to the script. Should be an array of JS
 * strings.
 * syspath: Setable to emulate PYTHONPATH environment variable (for finding
 * modules). Should be an array of JS strings.
 *
 * Any variables that aren't set will be left alone.
 */
Sk.configure = function(options)
{
    // added by allevato
    Sk.reset();

    Sk.output = options["output"] || Sk.output;
    goog.asserts.assert(typeof Sk.output === "function");

    Sk.input = options["input"] || Sk.input;
    goog.asserts.assert(typeof Sk.input === "function");

    Sk.debugout = options["debugout"] || Sk.debugout;
    goog.asserts.assert(typeof Sk.debugout === "function");

    Sk.read = options["read"] || Sk.read;
    goog.asserts.assert(typeof Sk.read === "function");

    Sk.transformUrl = options["transformUrl"] || Sk.transformUrl;
    goog.asserts.assert(typeof Sk.transformUrl === "function");

    Sk.sysargv = options["sysargv"] || Sk.sysargv;
    goog.asserts.assert(goog.isArrayLike(Sk.sysargv));

    // added by allevato: When the code is running in the browser,
    // it is running in the same UI thread as the rest of the page, so the
    // code is suspended at regular intervals to give the DOM an opportunity
    // to update and for user input to take place. The "suspend interval" is
    // the number of milliseconds that should pass between suspensions.
    // Higher values of this parameter will increase the speed of the Python
    // code because less time will be spent yielding back to the DOM thread,
    // but will also make the browser significantly less responsive. Lower
    // values will make the browser more responsive but significantly slow
    // down execution. The default is 100 milliseconds.
    Sk.suspendInterval = options["suspendInterval"] || 100;
    goog.asserts.assert(typeof Sk.suspendInterval === "number");

    if (options["syspath"])
    {
        Sk.syspath = options["syspath"];
        goog.asserts.assert(goog.isArrayLike(Sk.syspath));
        // assume that if we're changing syspath we want to force reimports.
        // not sure how valid this is, perhaps a separate api for that.
        Sk.realsyspath = undefined;
        Sk.sysmodules = new Sk.builtin.dict([]);
    }

    Sk.misceval.softspace_ = false;
};
goog.exportSymbol("Sk.configure", Sk.configure);

/*
 * Replacable output redirection (called from print, etc).
 */
Sk.output = function(x) {};

/*
 * Replacable input redirection (called from input, etc).
 */
Sk.input = function(x) { return prompt(x); };

/*
 * Replacable function to load modules with (called via import, etc.)
 * todo; this should be an async api
 */
Sk.read = function(x) { throw "Sk.read has not been implemented"; };

/*
 * Transform a URL. This is used by modules that make web requests,
 * since cross-origin requests are usually not allowed for security
 * reasons.
 *
 * For example, a web application that uses Skulpt can implement this
 * function to make the URL passthrough the local service. For example,
 * transform "http://foreignsite.com" to
 * "http://localservice.com/proxy?url=http://foreignsite.com".
 *
 * Note that this function should take and return a JS string (not a
 * wrapped Skulpt string).
 */
Sk.transformUrl = function(x) { return x; };

/*
 * Setable to emulate arguments to the script. Should be array of JS strings.
 */
Sk.sysargv = [];

// lame function for sys module
Sk.getSysArgv = function()
{
    return Sk.sysargv;
};
goog.exportSymbol("Sk.getSysArgv", Sk.getSysArgv);


/**
 * Setable to emulate PYTHONPATH environment variable (for finding modules).
 * Should be an array of JS strings.
 */
Sk.syspath = [];

Sk.inBrowser = goog.global.document !== undefined;

/**
 * Internal function used for debug output.
 * @param {...} args
 */
Sk.debugout = function(args) {};

/**
 * A basic run loop for Skulpt-generated code. Since this fork of Skulpt has
 * yield/resume-style execution, a loop is needed to catch the
 * SuspendExecution exceptions that the Sk.yield() primitve throws, and then
 * resume execution afterwards.
 *
 * The function that simpleRun takes as an argument is a function that kicks
 * off the actual execution. The most basic example would be:
 *
 *   Sk.simpleRun(function() { return Sk.importMain('module name'); });
 *
 * This simpleRun function returns whatever value the passed in function
 * returns. This makes it easy to return the imported module, to access its
 * locals table and so forth.
 *
 * If the executing Python code throws any exceptions that a type other than
 * SuspendExecution, the exception will be rethrown out of simpleRun so that
 * the caller can catch it.
 *
 * WARNING: This function is NOT appropriate for in-browser execution -- it
 * is a hard loop that will block the browser UI thread. Use the
 * Sk.runInBrowser function for this instead, which uses a repeated
 * setTimeout mechanism to ensure that the UI has an opportunity to update.
 *
 * @param start the function that starts a Skulpt execution; see the example
 *              above
 * @return the result of start
 */
Sk.simpleRun = function(start)
{
    var result;
    var running = true;
    var firsttime = true;

    while (running)
    {
        running = false;
        try
        {
            if (!firsttime)
            {
                Sk.resume();
            }
            else
            {
                firsttime = false;
                result = start();
            }
        }
        catch (e)
        {
            if (e instanceof SuspendExecution)
            {
                running = true;
            }
            else
            {
                throw e;
            }
        }
    }

    return result;
};
goog.exportSymbol("Sk.simpleRun", Sk.simpleRun);

/**
 * A browser-friendly run loop for Skulpt-generated code. Since this fork of
 * Skulpt has yield/resume-style execution, this function uses a setTimeout
 * "loop" to execute the code; the code is started, and when it yields, it
 * is resumed with another call to setTimeout. This allows the Python code
 * to give some idle time to the browser UI thread, allowing it to update the
 * DOM and handle user interaction (for example, to let them click a button
 * to stop long-running code).
 *
 * The function that runInBrowser takes as an argument is a function that
 * kicks off the actual execution. The most basic example would be:
 *
 *   Sk.runInBrowser(function() { return Sk.importMain('module name'); });
 *
 * This runInBrowser function can optionally take two other arguments: the
 * first is a callback function called when the code successfully completes
 * execution (takes no arguments); the second is a callback function called
 * if an exception occurs while the code is executing (takes one argument,
 * the exception that was thrown).
 *
 * @param {function()} start
 * @param {function()=} onSuccess
 * @param {function(Object)=} onError
 */
Sk.runInBrowser = function(start, onSuccess, onError)
{
    /**
     * @param {boolean} first
     * @param {Object=} continuationResult
     */
    var runner = function(first, continuationResult) {
        var resume = false;
        var success = false;

        try
        {
            if (first)
            {
                start();
            }
            else
            {
                Sk.resume(continuationResult);
            }
            
            success = true;
        }
        catch (e)
        {
            if (e instanceof SuspendExecution)
            {
                if (e.future)
                {
                    e.future(function(result) { runner(false, result); });
                }
                else
                {
                    resume = true;
                }
            }
            else
            {
                resume = false;
                success = false;

                if (onError)
                {
                    onError(e);
                }
                else
                {
                    goog.global.console.log(e);
                }
            }
        }

        if (resume)
        {
            Sk._nextRunTimeout = window.setTimeout(
              function() { runner(false); }, 1);
        }
        else if (success && onSuccess)
        {
            onSuccess();
        }
    };

    runner(true);
};

Sk.cancelInBrowser = function()
{
  window.clearTimeout(Sk._nextRunTimeout);
  delete Sk._nextRunTimeout;
};

goog.exportSymbol("Sk.runInBrowser", Sk.runInBrowser);
goog.exportSymbol("Sk.cancelInBrowser", Sk.cancelInBrowser);


(function() {
    // set up some sane defaults based on availability
    if (goog.global.write !== undefined) Sk.output = goog.global.write;
    else if (goog.global.console !== undefined && goog.global.console.log !== undefined) Sk.output = function (x) {goog.global.console.log(x);};
    else if (goog.global.print !== undefined) Sk.output = goog.global.print;

    if (goog.global.print !== undefined) Sk.debugout = goog.global.print;
}());

// override for closure to load stuff from the command line.
if (!Sk.inBrowser)
{
    goog.writeScriptTag_ = function(src)
    {
        if (!goog.dependencies_.written[src])
        {
            goog.dependencies_.written[src] = true;
            goog.global.eval(goog.global.read("support/closure-library/closure/goog/" + src));
        }
    };
}

goog.require("goog.asserts");

// builtins are supposed to come from the __builtin__ module, but we don't do
// that yet.
Sk.builtin = {};

// todo; these should all be func objects too, otherwise str() of them won't
// work, etc.

Sk.builtin.range = function(start, stop, step)
{
    var ret = [];
    var s = new Sk.builtin.slice(start, stop, step);
    s.sssiter$(0, function(i) { ret.push(i); });
    return new Sk.builtin.list(ret);
};

Sk.builtin.len = function(item)
{
    if (item.sq$length)
        return item.sq$length();
    
    if (item.mp$length)
        return item.mp$length();

    throw new Sk.builtin.TypeError("object of type '" + item.tp$name + "' has no len()");
};

Sk.builtin.min = function min()
{
    // todo; throw if no args
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var lowest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (Sk.misceval.richCompareBool(arguments[i], lowest, 'Lt'))
            lowest = arguments[i];
    }
    return lowest;
};

Sk.builtin.max = function max()
{
    // todo; throw if no args
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var highest = arguments[0];
    for (var i = 1; i < arguments.length; ++i)
    {
        if (Sk.misceval.richCompareBool(arguments[i], highest, 'Gt'))
            highest = arguments[i];
    }
    return highest;
};

Sk.builtin.sum = function sum(iter,start)
{
    var tot = 0;
    if (iter instanceof Sk.builtin.list) {
        iter = iter.v;
    } else {
        throw "TypeError: an iterable is required";   
    }
    if (start === undefined ) {
        start = 0;
    }
    for (var i = start; i < iter.length; ++i) {
        if (typeof iter[i] !== "number")
        {
            throw "TypeError: an number is required";
        }
        tot = tot + iter[i];
    }
    return tot;
};

Sk.builtin.abs = function abs(x)
{
    return Math.abs(x);
};

Sk.builtin.ord = function ord(x)
{
    if (x.constructor !== Sk.builtin.str || x.v.length !== 1)
    {
        throw "ord() expected string of length 1";
    }
    return (x.v).charCodeAt(0);
};

Sk.builtin.chr = function chr(x)
{
    if (typeof x !== "number")
    {
        throw "TypeError: an integer is required";
    }
    return new Sk.builtin.str(String.fromCharCode(x));
};

Sk.builtin.dir = function dir(x)
{
    var names = [];
    for (var k in x.constructor.prototype)
    {
        var s;
        if (k.indexOf('$') !== -1)
            s = Sk.builtin.dir.slotNameToRichName(k);
        else if (k.charAt(k.length - 1) !== '_')
            s = k;
        if (s)
            names.push(new Sk.builtin.str(s));
    }
    names.sort(function(a, b) { return (a.v > b.v) - (a.v < b.v); });
    return new Sk.builtin.list(names);
};

Sk.builtin.dir.slotNameToRichName = function(k)
{
    // Added by allevato
    if (k.indexOf("tp$") === 0)
        return "__" + k.substring(3) + "__";
    else
        return undefined;
};

Sk.builtin.repr = function repr(x)
{
    return Sk.misceval.objectRepr(x);
};

Sk.builtin.open = function open(filename, mode, bufsize)
{
    if (mode === undefined) mode = "r";
    if (mode.v !== "r" && mode.v !== "rb") throw "todo; haven't implemented non-read opens";
    return new Sk.builtin.file(filename, mode, bufsize);
};

Sk.builtin.isinstance = function(obj, type)
{
    if (obj.ob$type === type) return true;

    if (type instanceof Sk.builtin.tuple)
    {
        for (var i = 0; i < type.v.length; ++i)
        {
            if (Sk.builtin.isinstance(obj, type.v[i]))
                return true;
        }
        return false;
    }

    var issubclass = function(klass, base)
    {
        if (klass === base) return true;
        if (klass['$d'] === undefined) return false;
        var bases = klass['$d'].mp$subscript(Sk.builtin.type.basesStr_);
        for (var i = 0; i < bases.v.length; ++i)
        {
            if (issubclass(bases.v[i], base))
                return true;
        }
        return false;
    };

    return issubclass(obj.ob$type, type);
};

Sk.builtin.hashCount = 0;
Sk.builtin.hash = function hash(value)
{
    if (value instanceof Object && value.tp$hash !== undefined)
    {
        if (value.$savedHash_) return value.$savedHash_;
        value.$savedHash_ = 'custom ' + value.tp$hash();
        return value.$savedHash_;
    }

    if (value instanceof Object)
    {
        if (value.__id === undefined)
        {
            Sk.builtin.hashCount += 1;
            value.__id = 'object ' + Sk.builtin.hashCount;
        }
        return value.__id;
    }
    return (typeof value) + ' ' + String(value);

    // todo; throw properly for unhashable types
};

Sk.builtin.getattr = function(obj, name, default_)
{
    var ret = obj.tp$getattr(name.v);
    if (ret === undefined)
    {
        if (default_ !== undefined)
            return default_;
        else
            throw new Sk.builtin.AttributeError();
    }
    return ret;
};

Sk.builtin.input = function(obj, name, default_)
{
    // AJA: We want to be able to configure input() function just as we do
    // output; no reason to force it to use window.prompt
    var x = Sk.input(obj.v);
    return new Sk.builtin.str(x);
};

Sk.builtin.jseval = function jseval(evalcode)
{
    goog.global.eval(evalcode);
};

Sk.builtin.jsmillis = function jsmillis()
{
	var now = new Date()
	return now.valueOf();
};

// Added by allevato
Sk.builtin.round = function round()
{
    // todo; delegate to x.__round__(n)

    // todo; throw if wrong num of args
    arguments = Sk.misceval.arrayFromArguments(arguments);
    var value = arguments[0];
    var places = arguments[1] || 0;

    if (places == 0)
    {
        return Math.round(value);
    }
    else
    {
        // TODO Might be some precision problems here? Should
        // look into coming up with a better way.
        var factor = Math.pow(10, places);
        return Math.round(value * factor) / factor;
    }
};

// Added by allevato
Sk.builtin.globals = function()
{
  var gbl = Sk._frames[Sk._frames.length - 1].ctx['$gbl'];
  return Sk.ffi.varTableToDict(gbl);
};

// Added by allevato
Sk.builtin.locals = function()
{
  // FIXME Needs fixes in the compiler
  var loc = Sk._frames[Sk._frames.length - 1].ctx['$loc'];
  return Sk.ffi.varTableToDict(loc);
};

/*
Sk.builtinFiles = {};
Sk.builtin.read = function read(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
};
Sk.builtinFiles = undefined;
*//**
 * @constructor
 * @param {...*} args
 */
Sk.builtin.Exception = function(args)
{
    var args = Array.prototype.slice.call(arguments);
    // hackage to allow shorter throws
    for (var i = 0; i < args.length; ++i)
    {
        if (typeof args[i] === "string")
            args[i] = new Sk.builtin.str(args[i]);
    }
    this.args = new Sk.builtin.tuple(args);
};
Sk.builtin.Exception.prototype.tp$name = "Exception";

Sk.builtin.Exception.prototype.tp$str = function()
{
    var ret = "";
    //print(JSON.stringify(this.args));

    ret += this.tp$name;
    if (this.args)
        ret += ": " + this.args.v[0].v;

    if (this.args.v.length > 4)		//	RNL from length > 1
    {
        ret += "\nFile \"" + this.args.v[1].v + "\", " + "line " + this.args.v[2] + "\n" +
            this.args.v[4].v + "\n";
        for (var i = 0; i < this.args.v[3]; ++i) ret += " ";
        ret += "^\n";
    }
    return new Sk.builtin.str(ret);
};

Sk.builtin.Exception.prototype.toString = function()
{
    return this.tp$str().v;
}

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.AssertionError = function(args) { Sk.builtin.Exception.apply(this, arguments); };
goog.inherits(Sk.builtin.AssertionError, Sk.builtin.Exception);
Sk.builtin.AssertionError.prototype.tp$name = "AssertionError";
goog.exportSymbol("Sk.builtin.AssertionError", Sk.builtin.AssertionError);

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.AttributeError = function(args) { Sk.builtin.Exception.apply(this, arguments); };
goog.inherits(Sk.builtin.AttributeError, Sk.builtin.Exception);
Sk.builtin.AttributeError.prototype.tp$name = "AttributeError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ImportError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ImportError, Sk.builtin.Exception);
Sk.builtin.ImportError.prototype.tp$name = "ImportError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndentationError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.IndentationError, Sk.builtin.Exception);
Sk.builtin.IndentationError.prototype.tp$name = "IndentationError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.IndexError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.IndexError, Sk.builtin.Exception);
Sk.builtin.IndexError.prototype.tp$name = "IndexError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.KeyError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.KeyError, Sk.builtin.Exception);
Sk.builtin.KeyError.prototype.tp$name = "KeyError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.NameError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.NameError, Sk.builtin.Exception);
Sk.builtin.NameError.prototype.tp$name = "NameError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ParseError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ParseError, Sk.builtin.Exception);
Sk.builtin.ParseError.prototype.tp$name = "ParseError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.SyntaxError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.SyntaxError, Sk.builtin.Exception);
Sk.builtin.SyntaxError.prototype.tp$name = "SyntaxError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TokenError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TokenError, Sk.builtin.Exception);
Sk.builtin.TokenError.prototype.tp$name = "TokenError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TypeError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TypeError, Sk.builtin.Exception);
Sk.builtin.TypeError.prototype.tp$name = "TypeError";
goog.exportSymbol("Sk.builtin.TypeError", Sk.builtin.TypeError);
/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ValueError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ValueError, Sk.builtin.Exception);
Sk.builtin.ValueError.prototype.tp$name = "ValueError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.ZeroDivisionError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.ZeroDivisionError, Sk.builtin.Exception);
Sk.builtin.ZeroDivisionError.prototype.tp$name = "ZeroDivisionError";

/**
 * @constructor
 * @extends Sk.builtin.Exception
 * @param {...*} args
 */
Sk.builtin.TimeLimitError = function(args) { Sk.builtin.Exception.apply(this, arguments); }
goog.inherits(Sk.builtin.TimeLimitError, Sk.builtin.Exception);
Sk.builtin.TimeLimitError.prototype.tp$name = "TimeLimitError";
goog.exportSymbol("Sk.builtin.TimeLimitError", Sk.builtin.TimeLimitError);
/**
 *
 * @constructor
 *
 * @param {*} name name or object to get type of, if only one arg
 *
 * @param {Array.<Object>=} bases
 *
 * @param {Object=} dict
 *
 *
 * This type represents the type of `type'. *Calling* an instance of
 * this builtin type named "type" creates class objects. The resulting
 * class objects will have various tp$xyz attributes on them that allow
 * for the various operations on that object.
 *
 * calling the type or calling an instance of the type? or both?
 */

Sk.builtin.type = function(name, bases, dict)
{
    if (bases === undefined && dict === undefined)
    {
        // 1 arg version of type()
        var obj = name;
        if (obj === true || obj === false) return Sk.builtin.BoolObj.prototype.ob$type;
        if (obj === null) return Sk.builtin.NoneObj.prototype.ob$type;
        if (typeof obj === "number")
        {
            if (Math.floor(obj) === obj)
                return Sk.builtin.IntObj.prototype.ob$type;
            else
                return Sk.builtin.FloatObj.prototype.ob$type;
        }
        return obj.ob$type;
    }
    else if (bases !== undefined && dict !== undefined)
    {
        // type building version of type

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).

        /**
         * @constructor
         */
        var klass = (function(args)
        {
            if (!(this instanceof klass))
            {
              return new klass(Array.prototype.slice.call(arguments, 0));
            }
            else
            {
              args = args || [];
              goog.asserts.assert(Sk.builtin.dict !== undefined);

              // Added by allevato: Protect against multiple initialization
              // when yielding inside a constructor.
              var self = Sk._createOrRetrieveObject(this, function() {
                this['$d'] = new Sk.builtin.dict([]);
              });

              var init = Sk.builtin.type.typeLookup(self.ob$type, "__init__");
              if (init !== undefined)
              {
                  // return ignored I guess?
                  args.unshift(self);
                  Sk.misceval.apply(init, undefined, undefined, undefined, args);
              }

              Sk._finishCreatingObject();

              return self;
            }
        });
        //print("type(nbd):",name,JSON.stringify(dict, null,2));
        for (var v in dict)
        {
            klass.prototype[v] = dict[v];
            klass[v] = dict[v];
        }
        klass['__class__'] = klass;
        klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
        klass.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
        klass.prototype.tp$descr_get = function() { goog.asserts.fail("in type tp$descr_get"); };
        klass.prototype['$r'] = function()
        {
            var reprf = this.tp$getattr("__repr__");
            if (reprf !== undefined)
                return Sk.misceval.apply(reprf, undefined, undefined, undefined, []);
            var mod = dict.__module__;
            var cname = "";
            if (mod) cname = mod.v + ".";
            return new Sk.builtin.str("<" + cname + name + " object>");
        };
        klass.prototype.tp$call = function(args, kw)
        {
            var callf = this.tp$getattr("__call__");
            /* todo; vararg kwdict */
            if (callf)
                return Sk.misceval.apply(callf, undefined, undefined, kw, args);
            throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not callable");
        };
        klass.prototype.tp$iter = function()
        {
            var iterf = this.tp$getattr("__iter__");
            if (iterf)
            {
                 var ret = Sk.misceval.callsim(iterf);
                 if (ret.tp$getattr("next") === undefined)
                    throw new Sk.builtin.TypeError("iter() return non-iterator of type '" + this.tp$name + "'");
                 return ret;
            }
            throw new Sk.builtin.TypeError("'" + this.tp$name + "' object is not iterable");
        };
        klass.prototype.tp$iternext = function()
        {
            var iternextf = this.tp$getattr("next");
            goog.asserts.assert(iternextf !== undefined, "iter() should have caught this");
            return Sk.misceval.callsim(iternextf);
        };

        klass.tp$name = name;

        if (bases)
        {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
                //print("base[" + i + "]=" + bases[i].tp$name);
            klass['$d'] = new Sk.builtin.dict([]);
            klass['$d'].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple(bases));
            var mro = Sk.builtin.type.buildMRO(klass);
            klass['$d'].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
            klass.tp$mro = mro;
            //print("mro result", Sk.builtin.repr(mro).v);
        }

        // because we're not returning a new type() here, we have to manually
        // add all the methods we want from the type class.
        klass.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
        klass.ob$type = Sk.builtin.type;

        klass.prototype.ob$type = klass;
        Sk.builtin.type.makeIntoTypeObj(name, klass);

        return klass;
    }
    else if (arguments.length < 1 || arguments.length > 3)
    {
        throw new Sk.builtin.TypeError("type() takes 1 or 3 arguments");        
    }
};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function(name, newedInstanceOfType)
{
    var t = newedInstanceOfType;
    Sk.builtin.type.makeIntoTypeObj(name, t);
    return newedInstanceOfType;
};

Sk.builtin.type.makeIntoTypeObj = function(name, t)
{
    goog.asserts.assert(name !== undefined);
    goog.asserts.assert(t !== undefined);
    t.ob$type = Sk.builtin.type;
    t.tp$name = name;
    t['$r'] = function()
    {
        var mod = t.__module__;
        var cname = "";
        if (mod) cname = mod.v + ".";
        return new Sk.builtin.str("<class '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    t.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
    t.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
    return t;
};

Sk.builtin.type.ob$type = Sk.builtin.type;
Sk.builtin.type.tp$name = "type";
Sk.builtin.type['$r'] = function() { return new Sk.builtin.str("<type 'type'>"); };

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };

//Sk.builtin.type.prototype.tp$name = "type";

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function(name)
{
    var tp = this;
    var descr = Sk.builtin.type.typeLookup(tp, name);
    var f;
    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined && descr.ob$type !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            // return f.call(descr, this, this.ob$type);
    }

    if (this['$d'])
    {
        //print("hi");
        var res = this['$d'].mp$subscript(new Sk.builtin.str(name));
        //print(res);
        if (res !== undefined)
            return res;
    }

    if (f)
    {
        // non-data descriptor
        return f.call(descr, null, tp);
    }

    if (descr)
    {
        return descr;
    }

    return undefined;
};

Sk.builtin.type.typeLookup = function(type, name)
{
    var mro = type.tp$mro;

    // todo; probably should fix this, used for builtin types to get stuff
    // from prototype
    if (!mro)
        return type.prototype[name];

    for (var i = 0; i < mro.v.length; ++i)
    {
        var base = mro.v[i];
        if (base.hasOwnProperty(name))
            return base[name];
        var res = base['$d'].mp$subscript(new Sk.builtin.str(name));
        if (res !== undefined)
            return res;
    }

    return undefined;
};

Sk.builtin.type.mroMerge_ = function(seqs)
{
    /*
    var tmp = [];
    for (var i = 0; i < seqs.length; ++i)
    {
        tmp.push(new Sk.builtin.list(seqs[i]));
    }
    print(Sk.builtin.repr(new Sk.builtin.list(tmp)).v);
    */
    var res = [];
    for (;;)
    {
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            if (seq.length !== 0)
                break;
        }
        if (i === seqs.length) // all empty
            return res;
        var cands = [];
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            //print("XXX", Sk.builtin.repr(new Sk.builtin.list(seq)).v);
            if (seq.length !== 0)
            {
                var cand = seq[0];
                //print("CAND", Sk.builtin.repr(cand).v);
                OUTER:
                for (var j = 0; j < seqs.length; ++j)
                {
                    var sseq = seqs[j];
                    for (var k = 1; k < sseq.length; ++k)
                        if (sseq[k] === cand)
                            break OUTER;
                }

                // cand is not in any sequences' tail -> constraint-free
                if (j === seqs.length)
                    cands.push(cand);
            }
        }

        if (cands.length === 0)
            throw new TypeError("Inconsistent precedences in type hierarchy");

        var next = cands[0];
        // append next to result and remove from sequences
        res.push(next);
        for (var i = 0; i < seqs.length; ++i)
        {
            var seq = seqs[i];
            if (seq.length > 0 && seq[0] === next)
                seq.splice(0, 1);
        }
    }
};

Sk.builtin.type.buildMRO_ = function(klass)
{
    // MERGE(klass + mro(bases) + bases)
    var all = [ [klass] ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    var kbases = klass['$d'].mp$subscript(Sk.builtin.type.basesStr_);
    for (var i = 0; i < kbases.v.length; ++i)
        all.push(Sk.builtin.type.buildMRO_(kbases.v[i]));

    var bases = [];
    for (var i = 0; i < kbases.v.length; ++i)
        bases.push(kbases.v[i]);
    all.push(bases);

    return Sk.builtin.type.mroMerge_(all);
};

/*
 * C3 MRO (aka CPL) linearization. Figures out which order to search through
 * base classes to determine what should override what. C3 does the "right
 * thing", and it's what Python has used since 2.3.
 *
 * Kind of complicated to explain, but not really that complicated in
 * implementation. Explanations:
 * 
 * http://people.csail.mit.edu/jrb/goo/manual.43/goomanual_55.html
 * http://www.python.org/download/releases/2.3/mro/
 * http://192.220.96.201/dylan/linearization-oopsla96.html
 *
 * This implementation is based on a post by Samuele Pedroni on python-dev
 * (http://mail.python.org/pipermail/python-dev/2002-October/029176.html) when
 * discussing its addition to Python.
 */ 
Sk.builtin.type.buildMRO = function(klass)
{
    return new Sk.builtin.tuple(Sk.builtin.type.buildMRO_(klass));
};

/**
 * @constructor
 */
Sk.builtin.object = function()
{
    if (!(this instanceof Sk.builtin.object)) return new Sk.builtin.object();
    this['$d'] = new Sk.builtin.dict([]);
    return this;
};

Sk.builtin.object.prototype.GenericGetAttr = function(name)
{
    goog.asserts.assert(typeof name === "string");

    var tp = this.ob$type;
    goog.asserts.assert(tp !== undefined, "object has no ob$type!");

    //print("getattr", tp.tp$name, name);

    var descr = Sk.builtin.type.typeLookup(tp, name);

    // otherwise, look in the type for a descr
    var f;
    //print("descr", descr);
    if (descr !== undefined && descr.ob$type !== undefined)
    {
        f = descr.ob$type.tp$descr_get;
        // todo;
        //if (f && descr.tp$descr_set) // is a data descriptor if it has a set
            //return f.call(descr, this, this.ob$type);
    }

    // todo; assert? force?
    if (this['$d'])
    {
        var res;
        if (this['$d'].mp$subscript)
            res = this['$d'].mp$subscript(new Sk.builtin.str(name));
        else if (typeof this['$d'] === "object") // todo; definitely the wrong place for this. other custom tp$getattr won't work on object -- bnm -- implemented custom __getattr__ in abstract.js
            res = this['$d'][name];
        if (res !== undefined)
            return res;
    }

    if (f)
    {
        // non-data descriptor
        return f.call(descr, this, this.ob$type);
    }

    if (descr)
    {
        return descr;
    }

    return undefined;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericGetAttr", Sk.builtin.object.prototype.GenericGetAttr);

Sk.builtin.object.prototype.GenericSetAttr = function(name, value)
{
    goog.asserts.assert(typeof name === "string");
    // todo; lots o' stuff
    if (this['$d'].mp$ass_subscript)
        this['$d'].mp$ass_subscript(new Sk.builtin.str(name), value);
    else if (typeof this['$d'] === "object")
        this['$d'][name] = value;
};
goog.exportSymbol("Sk.builtin.object.prototype.GenericSetAttr", Sk.builtin.object.prototype.GenericSetAttr);

Sk.builtin.object.prototype.HashNotImplemented = function()
{
    throw new Sk.builtin.TypeError("unhashable type: '" + this.tp$name + "'");
};

Sk.builtin.object.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.object.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
Sk.builtin.type.makeIntoTypeObj('object', Sk.builtin.object);

Sk.builtin.BoolObj = function() {};
Sk.builtin.BoolObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('Bool', new Sk.builtin.BoolObj());

Sk.builtin.IntObj = function() {};
Sk.builtin.IntObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('int', new Sk.builtin.IntObj());

Sk.builtin.FloatObj = function() {};
Sk.builtin.FloatObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('float', new Sk.builtin.FloatObj());

Sk.builtin.NoneObj = function() {};
Sk.builtin.NoneObj.prototype.ob$type = Sk.builtin.type.makeTypeObj('None', new Sk.builtin.NoneObj());
/**
 * @constructor
 *
 * @param {Function} code the javascript implementation of this function
 * @param {Object=} globals the globals where this function was defined.
 * Can be undefined (which will be stored as null) for builtins. (is
 * that ok?)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * closure is the cell variables from the parent scope that we need to close
 * over. closure2 is the free variables in the parent scope that we also might
 * need to access.
 *
 * NOTE: co_varnames and co_name are defined by compiled code only, so we have
 * to access them via dict-style lookup for closure.
 *
 */
Sk.builtin.func = function(code, globals, closure, closure2)
{
    this.func_code = code;
    this.func_globals = globals || null;
    if (closure2 !== undefined)
    {
        // todo; confirm that modification here can't cause problems
        for (var k in closure2)
            closure[k] = closure2[k];
    }
    this.func_closure = closure;
    return this;
};
goog.exportSymbol("Sk.builtin.func", Sk.builtin.func);


Sk.builtin.func.prototype.tp$name = "function";
Sk.builtin.func.prototype.tp$descr_get = function(obj, objtype)
{
    goog.asserts.assert(obj !== undefined && objtype !== undefined)
    if (obj == null) return this;
    return new Sk.builtin.method(this, obj);
};
Sk.builtin.func.prototype.tp$call = function(args, kw)
{
    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    if (this.func_closure)
    {
        // todo; OK to modify?
        args.push(this.func_closure);
    }

    var expectskw = this.func_code['co_kwargs'];
    var kwargsarr = [];

    if (kw)
    {
        // bind the kw args
        var kwlen = kw.length;
        var varnames = this.func_code['co_varnames'];
        var numvarnames = varnames && varnames.length;
        for (var i = 0; i < kwlen; i += 2)
        {
            // todo; make this a dict mapping name to offset
            for (var j = 0; j < numvarnames; ++j)
            {
                if (kw[i] === varnames[j])
                    break;
            }
            if (varnames && j !== numvarnames)
            {
                args[j] = kw[i+1];
            }
            else if (this.func_code['co_kwargs'])
            {
                // build kwargs dict
                kwargsarr.push(new Sk.builtin.str(kw[i]));
                kwargsarr.push(kw[i + 1]);
            }
        }
    }
    if (expectskw)
    {
        args.unshift(kwargsarr);
    }

    //print(JSON.stringify(args, null, 2));

    return this.func_code.apply(this.func_globals, args);
};

//todo; investigate why the other doesn't work
//Sk.builtin.type.makeIntoTypeObj('function', Sk.builtin.func);
Sk.builtin.func.prototype.ob$type = Sk.builtin.type.makeTypeObj('function', new Sk.builtin.func(null, null));

Sk.builtin.func.prototype['$r'] = function()
{
    var name = (this.func_code && this.func_code['co_name'] && this.func_code['co_name'].v) || '<native JS>';
    return new Sk.builtin.str("<function " + name + ">");
};
/**
 * @constructor
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.method = function(func, self)
{
    this.im_func = func;
    this.im_self = self;
    //print("constructing method", this.im_func.tp$name, this.im_self.tp$name);
};
goog.exportSymbol("Sk.builtin.method", Sk.builtin.method);

Sk.builtin.method.prototype.tp$call = function(args, kw)
{
    goog.asserts.assert(this.im_self, "should just be a function, not a method since there's no self?");
    goog.asserts.assert(this.im_func instanceof Sk.builtin.func);

    //print("calling method");
    // todo; modification OK?
    args.unshift(this.im_self);

    if (kw)
    {
        // bind the kw args
        var kwlen = kw.length;
        for (var i = 0; i < kwlen; i += 2)
        {
            // todo; make this a dict mapping name to offset
            var varnames = this.im_func.func_code['co_varnames'];
            var numvarnames = varnames &&  varnames.length;
            for (var j = 0; j < numvarnames; ++j)
            {
                if (kw[i] === varnames[j])
                    break;
            }
            args[j] = kw[i+1];
        }
    }

    // note: functions expect globals to be their 'this'. see compile.js and function.js also
    return this.im_func.func_code.apply(this.im_func.func_globals, args);
};

Sk.builtin.method.prototype['$r'] = function()
{
    return new Sk.builtin.str("<bound method " + this.im_self.ob$type.tp$name + "." + this.im_func.func_code['co_name'].v
            + " of " + this.im_self['$r']().v + ">");
};
Sk.misceval = {};

Sk.misceval.isIndex = function(o)
{
    return o === null || typeof o === "number" || o.constructor === Sk.builtin.lng || o.tp$index;
};
goog.exportSymbol("Sk.misceval.isIndex", Sk.misceval.isIndex);

Sk.misceval.asIndex = function(o)
{
    if (!Sk.misceval.isIndex(o)) return undefined;
    if (o === null) return undefined;
    if (typeof o === "number") return o;
    goog.asserts.fail("todo;");
};

/**
 * return u[v:w]
 */
Sk.misceval.applySlice = function(u, v, w)
{
    if (u.sq$slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v);
        if (ilow === undefined) ilow = 0;
        var ihigh = Sk.misceval.asIndex(w);
        if (ihigh === undefined) ihigh = 1e100;
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null));
};
goog.exportSymbol("Sk.misceval.applySlice", Sk.misceval.applySlice);

/**
 * u[v:w] = x
 */
Sk.misceval.assignSlice = function(u, v, w, x)
{
    if (u.sq$ass_slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w))
    {
        var ilow = Sk.misceval.asIndex(v) || 0;
        var ihigh = Sk.misceval.asIndex(w) || 1e100;
        if (x === null)
            Sk.abstr.sequenceDelSlice(u, ilow, ihigh);
        else
            Sk.abstr.sequenceSetSlice(u, ilow, ihigh, x);
    }
    else
    {
        var slice = new Sk.builtin.slice(v, w);
        if (x === null)
            return Sk.abstr.objectDelItem(u, slice);
        else
            return Sk.abstr.objectSetItem(u, slice, x);
    }
};
goog.exportSymbol("Sk.misceval.assignSlice", Sk.misceval.assignSlice);

/**
 * Used by min() and max() to get an array from arbitrary input.
 * Note that this does no validation, just coercion.
 */
Sk.misceval.arrayFromArguments = function(args)
{
    // If args is not a single thing return as is
    if ( args.length != 1 )
    {
        return args;
    }
    var arg = args[0];
    if ( arg instanceof Sk.builtin.set )
    {
        // this is a Sk.builtin.list
        arg = arg.tp$iter().$obj;
    }
    else if ( arg instanceof Sk.builtin.dict )
    {
        // this is a Sk.builtin.list
        arg = Sk.builtin.dict.prototype['keys'].func_code(arg);
    }
    // shouldn't else if here as the two above output lists to arg.
    if ( arg instanceof Sk.builtin.list || arg instanceof Sk.builtin.tuple )
    {
        return arg.v;
    }
    return args;
};
goog.exportSymbol("Sk.misceval.arrayFromArguments", Sk.misceval.arrayFromArguments);

/**
 * for reversed comparison: Eq -> NotEq, etc.
 */
Sk.misceval.swappedOp_ = {
    'Eq': 'NotEq',
    'NotEq': 'Eq',
    'Lt': 'Gt',
    'LtE': 'GtE',
    'Gt': 'Lt',
    'GtE': 'LtE',
    'Is': 'IsNot',
    'IsNot': 'Is',
    'In_': 'NotIn',
    'NotIn': 'In_'
};


Sk.misceval.richCompareBool = function(v, w, op)
{
    if (op === 'Is')
        return v === w;

    if (op === 'IsNot')
        return v !== w;

    if (v === w)
    {
        if (op === 'Eq')
            return true;
        else if (op === 'NotEq')
            return false;
    }

    if (v instanceof Sk.builtin.str && w instanceof Sk.builtin.str)
    {
        if (op === 'Eq')
            return v === w;
        else if (op === 'NotEq')
            return v !== w;
    }

    if ((typeof v === "number" || typeof v === "boolean") && (typeof w === "number" || typeof w === "boolean"))
    {
        switch (op)
        {
            case 'Lt': return v < w;
            case 'LtE': return v <= w;
            case 'Gt': return v > w;
            case 'GtE': return v >= w;
            case 'NotEq': return v != w;
            case 'Eq': return v == w;
            default: throw "assert";
        }
    }
    else
    {

        if (op === "In") return Sk.abstr.sequenceContains(w, v);
        if (op === "NotIn") return !Sk.abstr.sequenceContains(w, v);


        var res;
        //print("  -- rcb:", JSON.stringify(v), JSON.stringify(w), op);
        if (v && w && v.tp$richcompare && (res = v.tp$richcompare(w, op)) !== undefined)
        {
            return res;
        }
        else if (w && v && w.tp$richcompare && (res = w.tp$richcompare(v, Sk.misceval.swappedOp_[op])) !== undefined)
        {
            return res;
        }
        else
        {
            // depending on the op, try left:op:right, and if not, then
            // right:reversed-top:left
            // yeah, a macro or 3 would be nice...
            if (op === 'Eq') {
                if (v && v['__eq__']) 
                    return Sk.misceval.callsim(v['__eq__'], v, w);
                else if (w && w['__ne__'])
                    return Sk.misceval.callsim(w['__ne__'], w, v);
                }
            else if (op === 'NotEq') {
                if (v && v['__ne__'])
                    return Sk.misceval.callsim(v['__ne__'], v, w);
                else if (w && w['__eq__'])
                    return Sk.misceval.callsim(w['__eq__'], w, v);
                }
            else if (op === 'Gt') {
                if (v && v['__gt__'])
                    return Sk.misceval.callsim(v['__gt__'], v, w);
                else if (w && w['__lt__'])
                    return Sk.misceval.callsim(w['__lt__'], w, v);
                }
            else if (op === 'Lt') {
                if (v && v['__lt__'])
                    return Sk.misceval.callsim(v['__lt__'], v, w);
                else if (w && w['__gt__'])
                    return Sk.misceval.callsim(w['__gt__'], w, v);
                }
            else if (op === 'GtE') {
                if (v && v['__ge__'])
                    return Sk.misceval.callsim(v['__ge__'], v, w);
                else if (w && w['__le__'])
                    return Sk.misceval.callsim(w['__le__'], w, v);
                }
            else if (op === 'LtE') {
                if (v && v['__le__'])
                    return Sk.misceval.callsim(v['__le__'], v, w);
                else if (w && w['__ge__'])
                    return Sk.misceval.callsim(w['__ge__'], w, v);
                }

            // if those aren't defined, fallback on the __cmp__ method if it
            // exists
            if (v && v['__cmp__'])
            {
                var ret = Sk.misceval.callsim(v['__cmp__'], v, w);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret < 0;
                else if (op === 'Gt') return ret > 0;
                else if (op === 'LtE') return ret <= 0;
                else if (op === 'GtE') return ret >= 0;
            }
            else if (w && w['__cmp__'])
            {
                // note, flipped on return value and call
                var ret = Sk.misceval.callsim(w['__cmp__'], w, v);
                if (op === 'Eq') return ret === 0;
                else if (op === 'NotEq') return ret !== 0;
                else if (op === 'Lt') return ret > 0;
                else if (op === 'Gt') return ret < 0;
                else if (op === 'LtE') return ret >= 0;
                else if (op === 'GtE') return ret <= 0;
            }

        }
        if (typeof v !== typeof w) {
            if (op === 'NotEq') return true;
            else
                return false;
        }

    }

    // todo; some defaults, mostly to handle diff types -> false. are these ok?
    if (op === 'Eq') return v === w;
    if (op === 'NotEq') return v !== w;

    throw new Sk.builtin.ValueError("don't know how to compare '" + v.tp$name + "' and '" + w.tp$name + "'");
};
goog.exportSymbol("Sk.misceval.richCompareBool", Sk.misceval.richCompareBool);

Sk.misceval.objectRepr = function(v)
{
    goog.asserts.assert(v !== undefined, "trying to repr undefined");
    if (v === null)
        return new Sk.builtin.str("None"); // todo; these should be consts
    else if (v === true)
        return new Sk.builtin.str("True");
    else if (v === false)
        return new Sk.builtin.str("False");
    else if (typeof v === "number")
        return new Sk.builtin.str("" + v);
    else if (!v['$r'])
        return new Sk.builtin.str("<" + v.tp$name + " object>");
    else
        return v['$r']();
};
goog.exportSymbol("Sk.misceval.objectRepr", Sk.misceval.objectRepr);

Sk.misceval.opAllowsEquality = function(op)
{
    switch (op)
    {
        case 'LtE':
        case 'Eq':
        case 'GtE':
            return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.opAllowsEquality", Sk.misceval.opAllowsEquality);

Sk.misceval.isTrue = function(x)
{
    if (x === true) return true;
    if (x === false) return false;
    if (x === null) return false;
    if (typeof x === "number") return x !== 0;
    if (x.mp$length) return x.mp$length() !== 0;
    if (x.sq$length) return x.sq$length() !== 0;
    return true;
};
goog.exportSymbol("Sk.misceval.isTrue", Sk.misceval.isTrue);

Sk.misceval.softspace_ = false;
Sk.misceval.print_ = function(x)   // this was function print(x)   not sure why...
{
    if (Sk.misceval.softspace_)
    {
        if (x !== "\n") Sk.output(' ');
        Sk.misceval.softspace_ = false;
    }
    var s = new Sk.builtin.str(x);
    Sk.output(s.v);
    var isspace = function(c)
    {
        return c === '\n' || c === '\t' || c === '\r';
    };
    if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === ' ')
        Sk.misceval.softspace_ = true;
};
goog.exportSymbol("Sk.misceval.print_", Sk.misceval.print_);

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
Sk.misceval.loadname = function(name, other)
{
    var v = other[name];
    if (v !== undefined) return v;

    var bi = Sk.builtins[name];
    if (bi !== undefined) return bi;

    throw new Sk.builtin.NameError("name '" + name + "' is not defined");
};
goog.exportSymbol("Sk.misceval.loadname", Sk.misceval.loadname);

/**
 *
 * Notes on necessity for 'call()':
 *
 * Classes are callable in python to create an instance of the class. If
 * we're calling "C()" we cannot tell at the call site whether we're
 * calling a standard function, or instantiating a class.
 *
 * JS does not support user-level callables. So, we can't use the normal
 * prototype hierarchy to make the class inherit from a 'class' type
 * where the various tp$getattr, etc. methods would live.
 *
 * Instead, we must copy all the methods from the prototype of our class
 * type onto every instance of the class constructor function object.
 * That way, both "C()" and "C.tp$getattr(...)" can still work. This is
 * of course quite expensive.
 *
 * The alternative would be to indirect all calls (whether classes or
 * regular functions) through something like C.$call(...). In the case
 * of class construction, $call could then call the constructor after
 * munging arguments to pass them on. This would impose a penalty on
 * regular function calls unfortunately, as they would have to do the
 * same thing.
 *
 * Note that the same problem exists for function objects too (a "def"
 * creates a function object that also has properties). It just happens
 * that attributes on classes in python are much more useful and common
 * that the attributes on functions.
 *
 * Also note, that for full python compatibility we have to do the $call
 * method because any python object could have a __call__ method which
 * makes the python object callable too. So, unless we were to make
 * *all* objects simply (function(){...}) and use the dict to create
 * hierarchy, there would be no way to call that python user function. I
 * think I'm prepared to sacrifice __call__ support, or only support it
 * post-ECMA5 or something.
 *
 * Is using (function(){...}) as the only object type too crazy?
 * Probably. Better or worse than having two levels of function
 * invocation for every function call?
 *
 * For a class `C' with instance `inst' we have the following cases:
 *
 * 1. C.attr
 *
 * 2. C.staticmeth()
 *
 * 3. x = C.staticmeth; x()
 *
 * 4. inst = C()
 *
 * 5. inst.attr
 *
 * 6. inst.meth()
 *
 * 7. x = inst.meth; x()
 *
 * 8. inst(), where C defines a __call__
 *
 * Because in general these are accomplished by a helper function
 * (tp$getattr/setattr/slice/ass_slice/etc.) it seems appropriate to add
 * a call that generally just calls through, but sometimes handles the
 * unusual cases. Once ECMA-5 is more broadly supported we can revisit
 * and hopefully optimize.
 *
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */

Sk.misceval.call = function(func, kwdict, varargseq, kws, args)
{
    var args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.apply(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.call", Sk.misceval.call);

/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsim = function(func, args)
{
    var args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.apply(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsim", Sk.misceval.callsim);

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.apply = function(func, kwdict, varargseq, kws, args)
{

    if (typeof func === "function")
    {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.
        // alternatively, put it to more use, and perhaps use
        // descriptors to create builtin.func's in other places.

        goog.asserts.assert(kws === undefined);
        return func.apply(null, args);
    }
    else
    {
        var fcall = func.tp$call;
        if (fcall !== undefined)
        {
            if (varargseq)
            {
                for (var it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
                {
                    args.push(i);
                }
            }
            if (kwdict)
            {
                goog.asserts.fail("todo;");
            }
            return fcall.call(func, args, kws, kwdict);
        }

        // todo; can we push this into a tp$call somewhere so there's
        // not redundant checks everywhere for all of these __x__ ones?
        fcall = func.__call__;
        if (fcall !== undefined)
        {
            // func is actually the object here because we got __call__
            // from it. todo; should probably use descr_get here
            args.unshift(func);
            return Sk.misceval.apply(fcall, kws, args, kwdict, varargseq);
        }
        throw new TypeError("'" + func.tp$name + "' object is not callable");
    }
};
goog.exportSymbol("Sk.misceval.apply", Sk.misceval.apply);

/**
 * Constructs a class object given a code object representing the body
 * of the class, the name of the class, and the list of bases.
 *
 * There are no "old-style" classes in Skulpt, so use the user-specified
 * metaclass (todo;) if there is one, the type of the 0th base class if
 * there's bases, or otherwise the 'type' type.
 *
 * The func code object is passed a (js) dict for its locals which it
 * stores everything into.
 *
 * The metaclass is then called as metaclass(name, bases, locals) and
 * should return a newly constructed class object.
 *
 */
Sk.misceval.buildClass = function(globals, func, name, bases)
{
    // todo; metaclass
    var meta = Sk.builtin.type;

    var locals = {};

    // init the dict for the class
    //print("CALLING", func);
    func(globals, locals);

    // file's __name__ is class's __module__
    locals.__module__ = globals['__name__'];

    var klass = Sk.misceval.callsim(meta, name, bases, locals);
    //print("class", klass, JSON.stringify(klass.prototype));
    return klass;
};
goog.exportSymbol("Sk.misceval.buildClass", Sk.misceval.buildClass);
Sk.abstr = {};

//
//
//
//
// Number
//
//
//
//

Sk.abstr.binop_type_error = function(v, w, name)
{
    throw new TypeError("unsupported operand type(s) for " + name + ": '"
            + v.tp$name + "' and '" + w.tp$name + "'");
};

// this can't be a table for closure
// bnm -- this seems like the most logical place to add support for user defined
//        operators. (__xxx__ that I've defined in my own class)
Sk.abstr.boNameToSlotFunc_ = function(obj, name)
{
    switch (name)
    {
        case "Add": return obj.nb$add ? obj.nb$add : obj['__add__'];
        case "Sub": return obj.nb$subtract ? obj.nb$subtract : obj['__sub__'];
        case "Mult": return obj.nb$multiply ? obj.nb$multiply : obj['__mul__'];
        case "Div": return obj.nb$divide ? obj.nb$divide : obj['__div__'];
        case "FloorDiv": return obj.nb$floor_divide ? obj.nb$floor_divide : obj['__floordiv__'];
        case "Mod": return obj.nb$remainder ? obj.nb$remainder : obj['__mod__'];
        case "Pow": return obj.nb$power ? obj.nb$power : obj['__pow__'];
        //case "LShift": return obj.nb$lshift;
        //case "RShift": return obj.nb$rshift;
        //case "BitAnd": return obj.nb$and;
        //case "BitOr": return obj.nb$or;
        //case "BitXor": return obj.nb$xor;
    }
};
Sk.abstr.iboNameToSlotFunc_ = function(obj, name)
{
    switch (name)
    {
        case "Add": return obj.nb$inplace_add;
        //case "Sub": return obj.nb$inplace_subtract;
        //case "Mult": return obj.nb$inplace_multiply;
        //case "Div": return obj.nb$divide;
        //case "FloorDiv": return obj.nb$floor_divide;
        //case "Mod": return obj.nb$inplace_remainder;
        //case "Pow": return obj.nb$inplace_power;
        //case "LShift": return obj.nb$lshift;
        //case "RShift": return obj.nb$rshift;
        //case "BitAnd": return obj.nb$and;
        //case "BitOr": return obj.nb$or;
        //case "BitXor": return obj.nb$xor;
    }
};

Sk.abstr.binary_op_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstr.boNameToSlotFunc_(v, opname);
    if (vop !== undefined)
    {	
		if (vop.call)
        	ret = vop.call(v, w);
		else {  // assume that vop is an __xxx__ type method
			ret = Sk.misceval.callsim(vop,v,w)
		}
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstr.boNameToSlotFunc_(w, opname);
    if (wop !== undefined)
    {
		if (wop.call)
        	ret = wop.call(w, v);
		else { // assume that wop is an __xxx__ type method
			ret = Sk.misceval.callsim(wop,w,v)
		}
        if (ret !== undefined) return ret;
    }

    if (opname === "Add" && v.sq$concat)
        return v.sq$concat(w);
    else if (opname === "Mult" && v.sq$repeat)
        return Sk.abstr.sequenceRepeat(v.sq$repeat, v, w);
    else if (opname === "Mult" && w.sq$repeat)
        return Sk.abstr.sequenceRepeat(w.sq$repeat, w, v);

    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined)
    {
        ret = vop.call(v, w);
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstr.iboNameToSlotFunc_(w, opname);
    if (wop !== undefined)
    {
        ret = wop.call(w, v);
        if (ret !== undefined) return ret;
    }

    if (opname === "Add")
    {
        if (v.sq$inplace_concat)
            return v.sq$inplace_concat(w);
        else if (v.sq$concat)
            return v.sq$concat(w);
    }
    else if (opname === "Mult")
    {
        if (v.sq$inplace_repeat)
            return Sk.abstr.sequenceRepeat(v.sq$inplace_repeat, v, w);
        else if (v.sq$repeat)
            return Sk.abstr.sequenceRepeat(v.sq$repeat, v, w);
        // note, don't use w inplace_repeat because we don't want to mutate rhs
        else if (w.sq$repeat)
            return Sk.abstr.sequenceRepeat(w.sq$repeat, w, v);
    }

    Sk.abstr.binop_type_error(v, w, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function(a, b, opfn)
{
    if (typeof a === "number" && typeof b === "number")
    {
        var ans = opfn(a, b);
        // todo; handle float	Removed RNL (bugs in lng, and it should be a question of precision, not magnitude -- this was just wrong)
        if ( (ans > Sk.builtin.lng.threshold$ || ans < -Sk.builtin.lng.threshold$)	// RNL
        && Math.floor(ans) === ans)	{												// RNL
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];		// RNL
        } else																		// RNL
            return ans;
    }
	else if (a === undefined || b === undefined) {
		throw new Sk.builtin.NameError('Undefined variable in expression')
	}
    else if (a.constructor === Sk.builtin.lng && typeof b === "number")
        return [a, Sk.builtin.lng.fromInt$(b)];
    else if (b.constructor === Sk.builtin.lng && typeof a === "number")
        return [Sk.builtin.lng.fromInt$(a), b];

    return undefined;
};

Sk.abstr.boNumPromote_ = {
    "Add": function(a, b) { return a + b; },
    "Sub": function(a, b) { return a - b; },
    "Mult": function(a, b) { return a * b; },
    "Mod": function(a, b) { return (b < 0 ? -1 : 1) * (Math.abs(a) % b); },
    "Div": function(a, b) {
        if (b === 0)
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        else
            return a / b;
    },
    "FloorDiv": function(a, b) { return Math.floor(a / b); }, // todo; wrong? neg?
    "Pow": Math.pow,
    "BitAnd": function(a, b) { return a & b; },
    "BitOr": function(a, b) { return a | b; },
    "BitXor": function(a, b) { return a ^ b; },
    "LShift": function(a, b) { return a << b; },
    "RShift": function(a, b) { return a >> b; }
};

Sk.abstr.numberBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        else if (tmp !== undefined)
        {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_op_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

Sk.abstr.numberInplaceBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        else if (tmp !== undefined)
        {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_iop_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function(v, op)
{
    if (op === "Not") return Sk.misceval.isTrue(v) ? false : true;
    else if (typeof v === "number" || typeof v === "boolean")
    {
        if (op === "USub") return -v;
        if (op === "UAdd") return v;
        if (op === "Invert") return ~v;
    }
    else
    {
        if (op === "USub" && v.nb$negative) return v.nb$negative();
        if (op === "UAdd" && v.nb$positive) return v.nb$positive();
        //todo; if (op === "Invert" && v.nb$positive) return v.nb$invert();
    }
    throw new TypeError("unsupported operand type for " + op + " '" + v.tp$name + "'");
};
goog.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

//
//
//
//
// Sequence
//
//
//
//

Sk.abstr.fixSeqIndex_ = function(seq, i)
{
    if (i < 0 && seq.sq$length)
        i += seq.sq$length();
    return i;
};

Sk.abstr.sequenceContains = function(seq, ob)
{
    if (seq.sq$contains) return seq.sq$contains(ob);

    if (!seq.tp$iter) throw new TypeError("argument of type '" + seq.tp$name + "' is not iterable");
    
    for (var it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        if (Sk.misceval.richCompareBool(i, ob, "Eq"))
            return true;
    }
    return false;
};

Sk.abstr.sequenceGetItem = function(seq, i)
{
    goog.asserts.fail();
};

Sk.abstr.sequenceSetItem = function(seq, i, x)
{
    goog.asserts.fail();
};

Sk.abstr.sequenceDelItem = function(seq, i)
{
    if (seq.sq$ass_item)
    {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        return seq.sq$ass_item(i, null);
    }
    throw new TypeError("'" + seq.tp$name + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function(f, seq, n)
{
    var count = Sk.misceval.asIndex(n);
    if (count === undefined)
    {
        throw new TypeError("can't multiply sequence by non-int of type '" + n.tp$name + "'");
    }
    return f.call(seq, n);
};

Sk.abstr.sequenceGetSlice = function(seq, i1, i2)
{
    if (seq.sq$slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    }
    else if (seq.mp$subscript)
    {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }
    throw new TypeError("'" + seq.tp$name + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function(seq, i1, i2)
{
    if (seq.sq$ass_slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$ass_slice(i1, i2, null);
    }
    throw new TypeError("'" + seq.tp$name + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function(seq, i1, i2, x)
{
    if (seq.sq$ass_slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    }
    else if (seq.mp$ass_subscript)
    {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    }
    else
    {
        throw new TypeError("'" + seq.tp$name + "' object doesn't support slice assignment");
    }
};



//
//
//
//
// Object
//
//
//
//

Sk.abstr.objectDelItem = function(o, key)
{
    if (o.mp$ass_subscript) {
        var kf = Sk.builtin.hash;
        var k = kf(key)
        if (o[k] !== undefined) {
            o.size -= 1;
            delete o[k];
            return;
        }
        return o.mp$ass_subscript(key, null);
    }
    if (o.sq$ass_item)
    {
        var keyValue = Sk.misceval.asIndex(key);
        if (keyValue === undefined)
            throw new TypeError("sequence index must be integer, not '" + key.tp$name + "'");
        return Sk.abstr.sequenceDelItem(o, keyValue);
    }
    // if o is a slice do something else...
    throw new TypeError("'" + o.tp$name + "' object does not support item deletion");
};
goog.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

Sk.abstr.objectGetItem = function(o, key)
{
    if (o.mp$subscript)
        return o.mp$subscript(key);
    else if (Sk.misceval.isIndex(key) && o.sq$item)
        return Sk.abstr.sequenceGetItem(o, Sk.misceval.asIndex(key));
    else if (o.__getitem__ !== undefined) {
        return Sk.misceval.callsim(o.__getitem__,o,key);
    }
    throw new TypeError("'" + o.tp$name + "' does not support indexing");
};
goog.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

Sk.abstr.objectSetItem = function(o, key, v)
{
    if (o.mp$ass_subscript)
        return o.mp$ass_subscript(key, v);
    else if (Sk.misceval.isIndex(key) && o.sq$ass_item)
        return Sk.abstr.sequenceSetItem(o, Sk.misceval.asIndex(key), v);
    throw new TypeError("'" + o.tp$name + "' does not support item assignment");
};
goog.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);



Sk.abstr.gattr = function(obj, nameJS)
{
    var ret;
    if(obj['__getattr__']) {
        ret = Sk.misceval.callsim(obj['__getattr__'],obj,nameJS)
    } else {
        ret = obj.tp$getattr(nameJS);
    }
    if (ret === undefined)
        throw new Sk.builtin.AttributeError("'" + obj.tp$name + "' object has no attribute '" + nameJS + "'");
    return ret;
    
};
goog.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);

Sk.abstr.sattr = function(obj, nameJS, data)
{
    if(obj['__setattr__']) {
            Sk.misceval.callsim(obj['__setattr__'],obj, nameJS, data)
    } else {
        obj.tp$setattr(nameJS, data);
    }
};

goog.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);

Sk.abstr.iter = function(obj)
{
    return obj.tp$iter();
};
goog.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

Sk.abstr.iternext = function(it)
{
    return it.tp$iternext();
};
goog.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);
/**
 * py sort is guaranteed to be stable, js's is not (and isn't in some
 * browsers). we also have to do cmp/key/rev anyway, so this is a simple
 * mergesort implementation to handle sorting for list (and other stuff
 * eventually).
 *
 * @param {Array.<Object>} arr
 * @param {Sk.builtin.func} cmp
 * @param {Sk.builtin.func=} key
 * @param {boolean=} reverse
 */
Sk.mergeSort = function(arr, cmp, key, reverse)	//	Replaced by quicksort
{
	Sk.quickSort(arr, cmp, key, reverse)
}

Sk.quickSort = function(arr, cmp, key, reverse)
{
    goog.asserts.assert(!key, "todo;");
    goog.asserts.assert(!reverse, "todo;");

    if (!cmp)
    {
        cmp = Sk.mergeSort.stdCmp;
    }

    var partition = function(arr, begin, end, pivot)
	{
		var tmp;
		var piv=arr[pivot];
		
//		swap pivot, end-1
		tmp=arr[pivot];
		arr[pivot]=arr[end-1];
		arr[end-1]=tmp;

		var store=begin;
		var ix;
		for(ix=begin; ix<end-1; ++ix) {
			if(Sk.misceval.callsim(cmp, arr[ix], piv) < 0) { // arr[ix]<=piv) {
//				swap store, ix
				tmp=arr[store];
				arr[store]=arr[ix];
				arr[ix]=tmp;
				++store;
			}
		}
		
//		swap end-1, store
		tmp=arr[end-1];
		arr[end-1]=arr[store];
		arr[store]=tmp;
	
		return store;
	}
	
	var qsort = function(arr, begin, end)
	{
		if(end-1>begin) {
			var pivot=begin+Math.floor(Math.random()*(end-begin));
	
			pivot=partition(arr, begin, end, pivot);
	
			qsort(arr, begin, pivot);
			qsort(arr, pivot+1, end);
		}
	}

    qsort(arr, 0, arr.length);
    return null;
};

Sk.mergeSort.stdCmp = new Sk.builtin.func(function(k0, k1)
{
    //print("CMP", JSON.stringify(k0), JSON.stringify(k1));
    var res = Sk.misceval.richCompareBool(k0, k1, "Lt") ? -1 : 0;
    //print("  ret:", res);
    return res;
});

//	A javascript mergesort from the web

//function merge_sort(arr) {  
//    var l = arr.length, m = Math.floor(l/2);  
//    if (l <= 1) return arr;  
//    return merge(merge_sort(arr.slice(0, m)), merge_sort(arr.slice(m)));  
//}  
//  
//function merge(left,right) {  
//    var result = [];  
//    var ll = left.length, rl = right.length;  
//    while (ll > 0 && rl > 0) {  
//        if (left[0] <= right[0]) {  
//            result.push(left.shift());  
//            ll--;  
//        } else {  
//            result.push(right.shift());  
//            rl--;  
//        }  
//    }  
//    if (ll > 0) {  
//        result.push.apply(result, left);  
//    } else if (rl > 0) {  
//        result.push.apply(result, right);  
//    }  
//    return result;  
//} 

//	Old, original code (doesn't work)
//Sk.mergeSort = function(arr, cmp, key, reverse)
//{
//    goog.asserts.assert(!key, "todo;");
//    goog.asserts.assert(!reverse, "todo;");
//
//    if (!cmp)
//    {
//        cmp = Sk.mergeSort.stdCmp;
//    }
//
//    var mergeInPlace = function(begin, beginRight, end)
//    {
//        for (; begin < beginRight; ++begin)
//        {
//            if (!(Sk.misceval.callsim(cmp, arr[begin], arr[beginRight]) < 0))
//            {
//                var v = arr[begin];
//                arr[begin] = arr[beginRight];
//
//                while (begin + 1 < end && Sk.misceval.callsim(cmp, arr[begin + 1], v) < 0)
//                {
//                    var tmp = arr[begin];
//                    arr[begin] = arr[begin + 1];
//                    arr[begin + 1] = tmp;
//                    begin += 1;
//                }
//                arr[begin] = v;
//            }
//        }
//    };
//
//    var sort = function(begin, end)
//    {
//        var size = end - begin;
//        if (size < 2) return;
//
//        var beginRight = begin + Math.floor(size / 2);
//
//        sort(begin, beginRight);
//        sort(beginRight, end);
//        mergeInPlace(begin, beginRight, end);
//    };
//
//    //print("SORT", JSON.stringify(arr, null, 2));
//    sort(0, arr.length);
//    //print("SORTRES", JSON.stringify(arr, null, 2));
//    return null;
//};
/**
 * @constructor
 * @param {Array.<Object>} L
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function(L)
{
    if (!(this instanceof Sk.builtin.list)) return new Sk.builtin.list(L);

    var self = this;

    if (Object.prototype.toString.apply(L) === '[object Array]')
    {
        self.v = L;
    }
    else
    {
        if (L.tp$iter)
        {
            // Added by allevato: Protect against multiple initialization
            // when yielding inside a constructor.
            self = Sk._createOrRetrieveObject(self, function() {
                this.v = [];
            });

            for (var it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
            {
                self.v.push(i);
            }

            Sk._finishCreatingObject();
        }
        else
            throw new Sk.builtin.ValueError("expecting Array or iterable");
    }

    self["v"] = self.v;
    return self;
};


Sk.builtin.list.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('list', Sk.builtin.list);

Sk.builtin.list.prototype.list_iter_ = function()
{
    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
            return ret.$obj.v[ret.$index++];
        }
    };
    return ret;
};

Sk.builtin.list.prototype.list_concat_ = function(other)
{
    var ret = this.v.slice();
    for (var i = 0; i < other.v.length; ++i)
    {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret);
}

Sk.builtin.list.prototype.list_ass_item_ = function(i, v)
{
    if (i < 0 || i >= this.v.length)
        throw new Sk.builtin.IndexError("list assignment index out of range");
    if (v === null)
        return Sk.builtin.list.prototype.list_ass_slice_.call(this, i, i+1, v);
    this.v[i] = v;
};

Sk.builtin.list.prototype.list_ass_slice_ = function(ilow, ihigh, v)
{
    // todo; item rather list/null
    var args = v === null ? [] : v.v.slice(0);
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.tp$name = "list";
Sk.builtin.list.prototype['$r'] = function()
{
    var ret = [];
    for (var it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        ret.push(Sk.misceval.objectRepr(i).v);
    return new Sk.builtin.str("[" + ret.join(", ") + "]");
};
Sk.builtin.list.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.list.prototype.tp$hash = Sk.builtin.object.prototype.HashNotImplemented;

Sk.builtin.list.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a list

    // todo; can't figure out where cpy handles this silly case (test/run/t96.py)
    // perhaps by trapping a stack overflow? otherwise i'm not sure for more
    // complicated cases. bleh
    //
    // if the comparison allows for equality then short-circuit it here
    if (this === w && Sk.misceval.opAllowsEquality(op))
        return true;

    var v = this.v;
    var w = w.v;
    var vl = v.length;
    var wl = w.length;

    var i;
    for (i = 0; i < vl && i < wl; ++i)
    {
        var k = Sk.misceval.richCompareBool(v[i], w[i], 'Eq');
        if (!k) break;
    }

    if (i >= vl || i >= wl)
    {
        // no more items to compare, compare sizes
        switch (op)
        {
            case 'Lt': return vl < wl;
            case 'LtE': return vl <= wl;
            case 'Eq': return vl === wl;
            case 'NotEq': return vl !== wl;
            case 'Gt': return vl > wl;
            case 'GtE': return vl >= wl;
            default: goog.asserts.fail();
        }
    }

    // we have an item that's different

    // shortcuts for eq/not
    if (op === 'Eq') return false;
    if (op === 'NotEq') return true;

    // or, compare the differing element using the proper operator
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

Sk.builtin.list.prototype.tp$iter = Sk.builtin.list.prototype.list_iter_;
Sk.builtin.list.prototype.sq$length = function() { return this.v.length; };
Sk.builtin.list.prototype.sq$concat = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.sq$repeat = function(n)
{
    var ret = [];
    for (var i = 0; i < n; ++i)
        for (var j = 0; j < this.v.length; ++j)
            ret.push(this.v[j]);
    return new Sk.builtin.list(ret);
};
/*
Sk.builtin.list.prototype.sq$item = list_item;
Sk.builtin.list.prototype.sq$slice = list_slice;
*/
Sk.builtin.list.prototype.sq$ass_item = Sk.builtin.list.prototype.list_ass_item_;
Sk.builtin.list.prototype.sq$ass_slice = Sk.builtin.list.prototype.list_ass_slice_;
//Sk.builtin.list.prototype.sq$contains // iter version is fine
/*
Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
*/

Sk.builtin.list.prototype.list_subscript_ = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("list index out of range");
        return this.v[index];
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Sk.builtin.list(ret);
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.prototype.list_ass_item_ = function(i, value)
{
    if (i < 0 || i >= this.v.length) throw new Sk.builtin.IndexError("list index out of range");
    if (value === null)
        this.list_ass_slice_(i, i+1, value);
    else
        this.v[i] = value;
};

Sk.builtin.list.prototype.list_ass_subscript_ = function(index, value)
{
    if (Sk.misceval.isIndex(index))
    {
        var i = Sk.misceval.asIndex(index);
        if (i < 0) i = this.v.length + i;
        this.list_ass_item_(i, value);
    }
    else if (index instanceof Sk.builtin.slice)
    {
        if (index.step === 1)
            this.list_ass_slice_(index.start, index.stop, value);
        else
        {
            if (value === null)
            {
                var self = this;
                var dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
                var offdir = index.step > 0 ? 1 : 0;
                index.sssiter$(this, function(i, wrt)
                        {
                            self.v.splice(i - dec, 1);
                            dec += offdir;
                        });
            }
            else
            {
                var tosub = [];
                index.sssiter$(this, function(i, wrt) { tosub.push(i); });
                var j = 0;
                if (tosub.length !== value.v.length) throw new Sk.builtin.ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
                for (var i = 0; i < tosub.length; ++i)
                {
                    this.v.splice(tosub[i], 1, value.v[j]);
                    j += 1;
                }
            }
        }
    }
    else
        throw new TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.prototype.list_subscript_;
Sk.builtin.list.prototype.mp$ass_subscript = Sk.builtin.list.prototype.list_ass_subscript_;

Sk.builtin.list.prototype.__getitem__ = new Sk.builtin.func(function(self, index)
        {
            return Sk.builtin.list.prototype.list_subscript_.call(self, index);
        });
//Sk.builtin.list.prototype.__reversed__ = todo;
Sk.builtin.list.prototype['append'] = new Sk.builtin.func(function(self, item)
{
    self.v.push(item);
    return null;
});

Sk.builtin.list.prototype['insert'] = new Sk.builtin.func(function(self, i, x)
{
    if (i < 0) i = 0;
    else if (i > self.v.length) i = self.v.length - 1;
    self.v.splice(i, 0, x);
});

Sk.builtin.list.prototype['extend'] = new Sk.builtin.func(function(self, b)
{
    for (var it = b.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
        self.v.push(i);
    return null;
});

Sk.builtin.list.prototype['pop'] = new Sk.builtin.func(function(self, i)
{
    if (i === undefined) i = self.v.length - 1;
    var ret = self.v[i];
    self.v.splice(i, 1);
    return ret;
});

Sk.builtin.list.prototype['remove'] = new Sk.builtin.func(function(self, item)
{
    var idx = Sk.builtin.list.prototype['index'].func_code(self, item);
    self.v.splice(idx, 1);
    return null;
});

Sk.builtin.list.prototype['index'] = new Sk.builtin.func(function(self, item)
{
    var len = self.v.length;
    var obj = self.v;
    for (var i = 0; i < len; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
            return i;
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
});

Sk.builtin.list.prototype['count'] = new Sk.builtin.func(function(self, item)
{
    var len = self.v.length;
    var obj = self.v;
    var count = 0;
    for (var i = 0; i < len; ++i)
    {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq"))
        {
            count += 1;
        }
    }
    return count;
});

Sk.builtin.list.prototype['reverse'] = new Sk.builtin.func(function(self)
{
    var len = self.v.length;
    var old = self.v;
    var newarr = [];
    for (var i = len -1; i > -1; --i)
    {
        newarr.push(old[i]);
    }
    self.v = newarr;
    return null;
});

Sk.builtin.list.prototype['sort'] = new Sk.builtin.func(function(self, cmp, key, reverse)
{
    goog.asserts.assert(!key, "todo;");
    goog.asserts.assert(!reverse, "todo;");
    Sk.mergeSort(self.v, cmp);
    return null;
});

goog.exportSymbol("Sk.builtin.list", Sk.builtin.list);var interned = {};

/**
 * @constructor
 * @param {*} x
 * @extends Sk.builtin.object
 */
Sk.builtin.str = function(x)
{
    if (x === undefined) throw "error: trying to str() undefined (should be at least null)";
    if (x instanceof Sk.builtin.str && x !== Sk.builtin.str.prototype.ob$type) return x;
    if (!(this instanceof Sk.builtin.str)) return new Sk.builtin.str(x);

    // convert to js string
    var ret;
    if (x === true) ret = "True";
    else if (x === false) ret = "False";
    else if (x === null) ret = "None";
    else if (typeof x === "number")
    {
        ret = x.toString();
        if (ret === "Infinity") ret = "inf";
        else if (ret === "-Infinity") ret = "-inf";
    }
    else if (typeof x === "string")
        ret = x;
    else if (x.tp$str !== undefined)
    {
        ret = x.tp$str();
        if (!(ret instanceof Sk.builtin.str)) throw new Sk.builtin.ValueError("__str__ didn't return a str");
        return ret;
    }
    else if (x.__str__ !== undefined) {
        return Sk.misceval.callsim(x.__str__,x);
    }
    else 
        return Sk.misceval.objectRepr(x);

    // interning required for strings in py
    if (Object.prototype.hasOwnProperty.call(interned, "1"+ret)) // note, have to use Object to avoid __proto__, etc. failing
    {
        return interned["1"+ret];
    }

    this.__class__ = Sk.builtin.str;
    this.v = ret;
    this["v"] = this.v;
    interned["1"+ret] = this;
    return this;

};
goog.exportSymbol("Sk.builtin.str", Sk.builtin.str);

Sk.builtin.str.$emptystr = new Sk.builtin.str('');

Sk.builtin.str.prototype.mp$subscript = function(index)
{
    if (typeof index === "number" && Math.floor(index) === index /* not a float*/ )
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("string index out of range");
        return new Sk.builtin.str(this.v.charAt(index));
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = '';
        index.sssiter$(this, function(i, wrt) {
                if (i >= 0 && i < wrt.v.length)
                    ret += wrt.v.charAt(i);
                });
        return new Sk.builtin.str(ret);
    }
    else
        throw new TypeError("string indices must be numbers, not " + typeof index);
};

Sk.builtin.str.prototype.sq$length = function()
{
    return this.v.length;
};
Sk.builtin.str.prototype.sq$concat = function(other) { return new Sk.builtin.str(this.v + other.v); };
Sk.builtin.str.prototype.sq$repeat = function(n)
{
    var ret = "";
    for (var i = 0; i < n; ++i)
        ret += this.v;
    return new Sk.builtin.str(ret);
};
Sk.builtin.str.prototype.sq$item = function() { goog.asserts.fail(); };
Sk.builtin.str.prototype.sq$slice = function(i1, i2)
{
    return new Sk.builtin.str(this.v.substr(i1, i2 - i1));
};

Sk.builtin.str.prototype.sq$contains = function(ob) {
    if ( ob.v === undefined || ob.v.constructor != String) {
        throw new TypeError("TypeError: 'In <string> requires string as left operand");
    }
    if (this.v.indexOf(ob.v) != -1) {
        return true;
    } else {
        return false;
    }

}

Sk.builtin.str.prototype.tp$name = "str";
Sk.builtin.str.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.str.prototype.tp$iter = function()
{
    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
           return new Sk.builtin.str(ret.$obj.v.substr(ret.$index++, 1));
        }
    };
    return ret;
};

Sk.builtin.str.prototype.tp$richcompare = function(other, op)
{
    if (!(other instanceof Sk.builtin.str)) return undefined;

    if (this === other)
    {
        switch (op)
        {
            case 'Eq': case 'LtE': case 'GtE':
                return true;
            case 'NotEq': case 'Lt': case 'Gt':
                return false;
        }
    }
    var lenA = this.v.length;
    var lenB = other.v.length;
    var minLength = Math.min(lenA, lenB);
    var c = 0;
    if (minLength > 0)
    {
        for (var i = 0; i < minLength; ++i)
        {
            if (this.v[i] != other.v[i])
            {
                c = this.v[i].charCodeAt(0) - other.v[i].charCodeAt(0);
                break;
            }
        }
    }
    else
    {
        c = 0;
    }

    if (c == 0)
    {
        c = (lenA < lenB) ? -1 : (lenA > lenB) ? 1 : 0;
    }

    switch (op)
    {
        case 'Lt': return c < 0;
        case 'LtE': return c <= 0;
        case 'Eq': return c == 0;
        case 'NotEq': return c != 0;
        case 'Gt': return c > 0;
        case 'GtE': return c >= 0;
        default:
            goog.asserts.fail();
    }
};

Sk.builtin.str.prototype['$r'] = function()
{
    // single is preferred
    var quote = "'";
    if (this.v.indexOf("'") !== -1 && this.v.indexOf('"') === -1)
    {
        quote = '"';
    }
    var len = this.v.length;
    var ret = quote;
    for (var i = 0; i < len; ++i)
    {
        var c = this.v.charAt(i);
        if (c === quote || c === '\\')
            ret += '\\' + c;
        else if (c === '\t')
            ret += '\\t';
        else if (c === '\n')
            ret += '\\n';
        else if (c === '\r')
            ret += '\\r';
        else if (c < ' ' || c >= 0x7f)
        {
            var ashex = c.charCodeAt(0).toString(16);
            if (ashex.length < 2) ashex = "0" + ashex;
            ret += "\\x" + ashex;
        }
        else
            ret += c;
    }
    ret += quote;
    return new Sk.builtin.str(ret);
};


Sk.builtin.str.re_escape_ = function(s)
{
    var ret = [];
	var re = /^[A-Za-z0-9]+$/;
    for (var i = 0; i < s.length; ++i)
    {
        var c = s.charAt(i);

        if (re.test(c))
        {
            ret.push(c);
        }
        else
        {
            if (c === "\\000")
                ret.push("\\000");
            else
                ret.push("\\" + c);
        }
    }
    return ret.join('');
};

Sk.builtin.str.prototype['lower'] = new Sk.builtin.func(function(self)
{
    return new Sk.builtin.str(self.v.toLowerCase());
});

Sk.builtin.str.prototype['upper'] = new Sk.builtin.func(function(self)
{
    return new Sk.builtin.str(self.v.toUpperCase());
});

Sk.builtin.str.prototype['capitalize'] = new Sk.builtin.func(function(self)
{
    return new Sk.builtin.str(self.v.charAt(0).toUpperCase()+self.v.substring(1));
});

Sk.builtin.str.prototype['join'] = new Sk.builtin.func(function(self, seq)
{
    var arrOfStrs = [];
    for (var it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        if (i.constructor !== Sk.builtin.str) throw "TypeError: sequence item " + arrOfStrs.length + ": expected string, " + typeof i + " found";
        arrOfStrs.push(i.v);
    }
    return new Sk.builtin.str(arrOfStrs.join(self.v));
});

Sk.builtin.str.prototype['split'] = new Sk.builtin.func(function(self, on, howmany)
{
    var res;
    if (! on) {
        res = self.v.trim().split(/[\s]+/, howmany);
    } else {
        res = self.v.split(new Sk.builtin.str(on).v, howmany);
    }
    var tmp = [];
    for (var i = 0; i < res.length; ++i)
    {
        tmp.push(new Sk.builtin.str(res[i]));
    }
    return new Sk.builtin.list(tmp);
});

Sk.builtin.str.prototype['strip'] = new Sk.builtin.func(function(self, chars)
{
    goog.asserts.assert(!chars, "todo;");
    return new Sk.builtin.str(self.v.replace(/^\s+|\s+$/g, ''));
});

Sk.builtin.str.prototype['lstrip'] = new Sk.builtin.func(function(self, chars)
{
    goog.asserts.assert(!chars, "todo;");
    return new Sk.builtin.str(self.v.replace(/^\s+/g, ''));
});

Sk.builtin.str.prototype['rstrip'] = new Sk.builtin.func(function(self, chars)
{
    goog.asserts.assert(!chars, "todo;");
    return new Sk.builtin.str(self.v.replace(/\s+$/g, ''));
});

Sk.builtin.str.prototype['partition'] = new Sk.builtin.func(function(self, sep)
{
    var sepStr = new Sk.builtin.str(sep);
    var pos = self.v.indexOf(sepStr.v);
    if (pos < 0)
    {
        return new Sk.builtin.tuple([self, Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype['rpartition'] = new Sk.builtin.func(function(self, sep)
{
    var sepStr = new Sk.builtin.str(sep);
    var pos = self.v.lastIndexOf(sepStr.v);
    if (pos < 0)
    {
        return new Sk.builtin.tuple([Sk.builtin.str.$emptystr, Sk.builtin.str.$emptystr, self]);
    }

    return new Sk.builtin.tuple([
        new Sk.builtin.str(self.v.substring(0, pos)),
        sepStr,
        new Sk.builtin.str(self.v.substring(pos + sepStr.v.length))]);
});

Sk.builtin.str.prototype['count'] = new Sk.builtin.func(function(self, pat) {
    var m = new RegExp(pat.v,'g');
    var ctl = self.v.match(m)
    if (! ctl) {
        return 0;
    } else {
        return ctl.length;
    }
    
});

Sk.builtin.str.prototype['ljust'] = new Sk.builtin.func(function(self, len) {
    if (self.v.length >= len) {
        return self;
    } else {
        var newstr = Array.prototype.join.call({length:Math.floor(len-self.v.length)+1}," ");
        return new Sk.builtin.str(self.v+newstr);
    }
});

Sk.builtin.str.prototype['rjust'] = new Sk.builtin.func(function(self, len) {
    if (self.v.length >= len) {
        return self;
    } else {
        var newstr = Array.prototype.join.call({length:Math.floor(len-self.v.length)+1}," ");
        return new Sk.builtin.str(newstr+self.v);
    }

});

Sk.builtin.str.prototype['center'] = new Sk.builtin.func(function(self, len) {
    if (self.v.length >= len) {
        return self;
    } else {
        var newstr1 = Array.prototype.join.call({length:Math.floor((len-self.v.length)/2)+1}," ");
        var newstr = newstr1+self.v+newstr1;
        if (newstr.length < len ) {
            newstr = newstr + " "
        }
        return new Sk.builtin.str(newstr);
    }

});

Sk.builtin.str.prototype['find'] = new Sk.builtin.func(function(self, tgt, start) {
   return self.v.indexOf(tgt.v,start);
});

Sk.builtin.str.prototype['index'] = new Sk.builtin.func(function(self, tgt, start) {
   return self.v.indexOf(tgt.v,start);
});

Sk.builtin.str.prototype['rfind'] = new Sk.builtin.func(function(self, tgt, start) {
   return self.v.lastIndexOf(tgt.v,start);
});

Sk.builtin.str.prototype['rindex'] = new Sk.builtin.func(function(self, tgt, start) {
   return self.v.lastIndexOf(tgt.v,start);
});

Sk.builtin.str.prototype['replace'] = new Sk.builtin.func(function(self, oldS, newS, count)
{
    if (oldS.constructor !== Sk.builtin.str || newS.constructor !== Sk.builtin.str)
        throw new Sk.builtin.TypeError("expecting a string");
    goog.asserts.assert(count === undefined, "todo; replace() with count not implemented");
    var patt = new RegExp(Sk.builtin.str.re_escape_(oldS.v), "g");
    return new Sk.builtin.str(self.v.replace(patt, newS.v));
});

Sk.builtin.str.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('str', Sk.builtin.str);

Sk.builtin.str.prototype.nb$remainder = function(rhs)
{
    // % format op. rhs can be a value, a tuple, or something with __getitem__ (dict)

    // From http://docs.python.org/library/stdtypes.html#string-formatting the
    // format looks like:
    // 1. The '%' character, which marks the start of the specifier.
    // 2. Mapping key (optional), consisting of a parenthesised sequence of characters (for example, (somename)).
    // 3. Conversion flags (optional), which affect the result of some conversion types.
    // 4. Minimum field width (optional). If specified as an '*' (asterisk), the actual width is read from the next element of the tuple in values, and the object to convert comes after the minimum field width and optional precision.
    // 5. Precision (optional), given as a '.' (dot) followed by the precision. If specified as '*' (an asterisk), the actual width is read from the next element of the tuple in values, and the value to convert comes after the precision.
    // 6. Length modifier (optional).
    // 7. Conversion type.
    //
    // length modifier is ignored

    if (rhs.constructor !== Sk.builtin.tuple && (rhs.mp$subscript === undefined || rhs.constructor === Sk.builtin.str)) rhs = new Sk.builtin.tuple([rhs]);
    
    // general approach is to use a regex that matches the format above, and
    // do an re.sub with a function as replacement to make the subs.

    //           1 2222222222222222   33333333   444444444   5555555555555  66666  777777777777777777
    var regex = /%(\([a-zA-Z0-9]+\))?([#0 +\-]+)?(\*|[0-9]+)?(\.(\*|[0-9]+))?[hlL]?([diouxXeEfFgGcrs%])/g;
    var index = 0;
    var replFunc = function(substring, mappingKey, conversionFlags, fieldWidth, precision, precbody, conversionType)
    {
        var i;
        if (mappingKey === undefined || mappingKey === "" ) i = index++; // ff passes '' not undef for some reason

        var zeroPad = false;
        var leftAdjust = false;
        var blankBeforePositive = false;
        var precedeWithSign = false;
        var alternateForm = false;
        if (conversionFlags)
        {
            if (conversionFlags.indexOf("-") !== -1) leftAdjust = true;
            else if (conversionFlags.indexOf("0") !== -1) zeroPad = true;

            if (conversionFlags.indexOf("+") !== -1) precedeWithSign = true;
            else if (conversionFlags.indexOf(" ") !== -1) blankBeforePositive = true;

            alternateForm = conversionFlags.indexOf("#") !== -1;
        }

        if (precision)
        {
            precision = parseInt(precision.substr(1), 10);
        }

        var formatNumber = function(n, base)
        {
            var j;
            var r;
            var neg = false;
            var didSign = false;
            if (typeof n === "number")
            {
                if (n < 0)
                {
                    n = -n;
                    neg = true;
                }
                r = n.toString(base);
            }
            else if (n instanceof Sk.builtin.lng)
            {
                r = n.str$(base, false);
                neg = n.compare(0) < 0;
            }

            goog.asserts.assert(r !== undefined, "unhandled number format");

            var precZeroPadded = false;

            if (precision)
            {
                //print("r.length",r.length,"precision",precision);
                for (j = r.length; j < precision; ++j)
                {
                    r = '0' + r;
                    precZeroPadded = true;
                }
            }

            var prefix = '';

            if (neg) prefix = "-";
            else if (precedeWithSign) prefix = "+" + prefix;
            else if (blankBeforePositive) prefix = " " + prefix;

            if (alternateForm)
            {
                if (base === 16) prefix += '0x';
                else if (base === 8 && !precZeroPadded && r !== "0") prefix += '0';
            }

            return [prefix, r];
        };

        var handleWidth = function(args)
        {
            var prefix = args[0];
            var r = args[1];
            var j;
            if (fieldWidth)
            {
                fieldWidth = parseInt(fieldWidth, 10);
                var totLen = r.length + prefix.length;
                if (zeroPad)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = '0' + r;
                else if (leftAdjust)
                    for (j = totLen; j < fieldWidth; ++j)
                        r = r + ' ';
                else
                    for (j = totLen; j < fieldWidth; ++j)
                        prefix = ' ' + prefix;
            }
            return prefix + r;
        };

        var value;
        //print("Rhs:",rhs, "ctor", rhs.constructor);
        if (rhs.constructor === Sk.builtin.tuple)
        {
            value = rhs.v[i];
        }
        else if (rhs.mp$subscript !== undefined)
        {
            var mk = mappingKey.substring(1, mappingKey.length - 1);
            //print("mk",mk);
            value = rhs.mp$subscript(new Sk.builtin.str(mk));
        }
        else throw new Sk.builtin.AttributeError(rhs.tp$name + " instance has no attribute 'mp$subscript'");
        var r;
        var base = 10;
        switch (conversionType)
        {
            case 'd':
            case 'i':
                return handleWidth(formatNumber(value, 10));
            case 'o':
                return handleWidth(formatNumber(value, 8));
            case 'x':
                return handleWidth(formatNumber(value, 16));
            case 'X':
                return handleWidth(formatNumber(value, 16)).toUpperCase();

            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
                var convName = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(conversionType.toLowerCase())];
                var result = (value)[convName](precision);
                if ('EFG'.indexOf(conversionType) !== -1) result = result.toUpperCase();
                // todo; signs etc.
                return handleWidth(['', result]);

            case 'c':
                if (typeof value === "number")
                    return String.fromCharCode(value);
                else if (value instanceof Sk.builtin.lng)
                    return String.fromCharCode(value.str$(10,false)[0]);
                else if (value.constructor === Sk.builtin.str)
                    return value.v.substr(0, 1);
                else
                    throw new TypeError("an integer is required");
                break; // stupid lint

            case 'r':
                r = Sk.builtin.repr(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case 's':
                //print("value",value);
                //print("replace:");
                //print("  index", index);
                //print("  substring", substring);
                //print("  mappingKey", mappingKey);
                //print("  conversionFlags", conversionFlags);
                //print("  fieldWidth", fieldWidth);
                //print("  precision", precision);
                //print("  conversionType", conversionType);
                r = new Sk.builtin.str(value);
                if (precision) return r.v.substr(0, precision);
                return r.v;
            case '%':
                return '%';
        }
    };
    
    var ret = this.v.replace(regex, replFunc);
    return new Sk.builtin.str(ret);
};

// Python 3 prefers the "format" method to the overloaded % operator.
// Added by allevato
Sk.builtin.str.prototype['format'] = new Sk.builtin.func(function() {
    var self = arguments[0];
    var args = Array.prototype.slice.call(arguments, 1);
    return Sk.builtin.str.prototype.nb$remainder.call(
        self, new Sk.builtin.tuple(args));
});
/**
 * @constructor
 * @param {Array.<Object>|Object} L
 */
Sk.builtin.tuple = function(L)
{
    if (arguments.length > 1) {
	throw new TypeError("tuple must be created from a sequence");
    }
    if (L instanceof Sk.builtin.tuple) return;
    if (!(this instanceof Sk.builtin.tuple)) return new Sk.builtin.tuple(L);
    if (Object.prototype.toString.apply(L) === '[object Array]')
        this.v = L;
    else
        this.v = L.v;
    this.__class__ = Sk.builtin.tuple;
    return this;
};

Sk.builtin.tuple.prototype['$r'] = function()
{
    if (this.v.length === 0) return new Sk.builtin.str("()");
    var bits = [];
    for (var i = 0; i < this.v.length; ++i)
    {
        bits[i] = Sk.misceval.objectRepr(this.v[i]).v;
    }
    var ret = bits.join(', ');
    if (this.v.length === 1) ret += ",";
    return new Sk.builtin.str("(" + ret + ")");
};

Sk.builtin.tuple.prototype.mp$subscript = function(index)
{
    if (typeof index === "number")
    {
        if (index < 0) index = this.v.length + index;
        if (index < 0 || index >= this.v.length) throw new Sk.builtin.IndexError("tuple index out of range");
        return this.v[index];
    }
    else if (index instanceof Sk.builtin.slice)
    {
        var ret = [];
        index.sssiter$(this, function(i, wrt)
                {
                    ret.push(wrt.v[i]);
                });
        return new Sk.builtin.tuple(ret);
    }
    else
        throw new TypeError("tuple indices must be integers, not " + typeof index);
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Sk.builtin.tuple.prototype.tp$hash = function()
{
    var mult = 1000003;
    var x = 0x345678;
    var len = this.v.length;
    for (var i = 0; i < len; ++i)
    {
        var y = Sk.builtin.hash(this.v[i]);
        if (y === -1) return -1;
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) x = -2;
    return x;
};

Sk.builtin.tuple.prototype.sq$repeat = function(n)
{
    var ret = [];
    for (var i = 0; i < n; ++i)
        for (var j = 0; j < this.v.length; ++ j)
            ret.push(this.v[j]);
    return new Sk.builtin.tuple(ret);
};


Sk.builtin.tuple.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('tuple', Sk.builtin.tuple);

Sk.builtin.tuple.prototype.tp$iter = function()
{
    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$obj.v.length) return undefined;
            return ret.$obj.v[ret.$index++];
        }
    };
    return ret;
};

Sk.builtin.tuple.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a tuple

    //print("  tup rc", JSON.stringify(this.v), JSON.stringify(w), op);
        
    var v = this.v;
    var w = w.v;
    var vl = v.length;
    var wl = w.length;

    var i;
    for (i = 0; i < vl && i < wl; ++i)
    {
        var k = Sk.misceval.richCompareBool(v[i], w[i], 'Eq');
        if (!k) break;
    }

    if (i >= vl || i >= wl)
    {
        // no more items to compare, compare sizes
        switch (op)
        {
            case 'Lt': return vl < wl;
            case 'LtE': return vl <= wl;
            case 'Eq': return vl === wl;
            case 'NotEq': return vl !== wl;
            case 'Gt': return vl > wl;
            case 'GtE': return vl >= wl;
            default: goog.asserts.fail();
        }
    }

    // we have an item that's different

    // shortcuts for eq/not
    if (op === 'Eq') return false;
    if (op === 'NotEq') return true;

    // or, compare the differing element using the proper operator
    //print("  tup rcb end", i, v[i] instanceof Sk.builtin.str, JSON.stringify(v[i]), w[i] instanceof Sk.builtin.str, JSON.stringify(w[i]), op);
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

Sk.builtin.tuple.prototype.sq$concat = function(other)
{
    return new Sk.builtin.tuple(this.v.concat(other.v));
};

Sk.builtin.tuple.prototype.sq$length = function() { return this.v.length; };

goog.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.dict = function dict(L)
{
    if (!(this instanceof Sk.builtin.dict)) return new Sk.builtin.dict(L);

    this.size = 0;

    for (var i = 0; i < L.length; i += 2)
    {
        this.mp$ass_subscript(L[i], L[i+1]);
    }

    this.__class__ = Sk.builtin.dict;

    return this;
};

Sk.builtin.dict.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('dict', Sk.builtin.dict);

var kf = Sk.builtin.hash;

Sk.builtin.dict.prototype.mp$subscript = function(key)
{
    var entry = this[kf(key)];
    // todo; does this need to go through mp$ma_lookup
    return entry === undefined ? undefined : entry.rhs;
};
Sk.builtin.dict.prototype.mp$ass_subscript = function(key, w)
{
    var k = kf(key);
    // if (this[k] !== undefined)
    // {
    //     this.size -=1;
    //     delete this[k];
    //     return;
    // }
    // only increment if it's not already used as a key
    if ( !(k in this) ) {
        this.size += 1;
    }
    this[k] = { lhs: key, rhs: w };
};

Sk.builtin.dict.prototype.tp$iter = function()
{
    var allkeys = [];
    for (var k in this)
    {
        if (this.hasOwnProperty(k))
        {
            var i = this[k];
            if (i && i.lhs !== undefined) // skip internal stuff. todo; merge pyobj and this
            {
                allkeys.push(k);
            }
        }
    }
    //print(allkeys);

    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        $keys: allkeys,
        tp$iternext: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) return undefined;
            return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};

Sk.builtin.dict.prototype['$r'] = function()
{
    var ret = [];
    for (var iter = this.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = this.mp$subscript(k);
        if (v === undefined)
        {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
};

Sk.builtin.dict.prototype.mp$length = function() { return this.size; };

Sk.builtin.dict.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.dict.prototype['get'] = new Sk.builtin.func(function(self, k, d)
{
    if (d === undefined) {
        //d = new Sk.builtin.NoneObj();
        d = null;
    }
    var ret = self.mp$subscript(k);
    if (ret !== undefined) return ret;
    return d;
});

Sk.builtin.dict.prototype['items'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = self.mp$subscript(k);
        if (v === undefined)
        {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(new Sk.builtin.tuple([k, v]));
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype['keys'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        ret.push(k);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype['values'] = new Sk.builtin.func(function(self)
{
    var ret = [];

    for (var iter = self.tp$iter(), k = iter.tp$iternext();
            k !== undefined;
            k = iter.tp$iternext())
    {
        var v = self.mp$subscript(k);
        if (v === undefined)
        {
            v = null;
        }
        ret.push(v);
    }
    return new Sk.builtin.list(ret);
});


goog.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

/*

$.prototype.clear = function() { throw "todo; dict.clear"; };
$.prototype.copy = function() { throw "todo; dict.copy"; };
$.prototype.fromkeys = function() { throw "todo; dict.fromkeys"; };
$.prototype.get = function() { throw "todo; dict.get"; };

$.prototype.has_key = function(key)
{
	return this.hasOwnProperty(kf(key));
};

$.prototype.items = function() { throw "todo; dict.items"; };
$.prototype.iteritems = function() { throw "todo; dict.iteritems"; };
$.prototype.iterkeys = function() { throw "todo; dict.iterkeys"; };
$.prototype.itervalues = function() { throw "todo; dict.itervalues"; };
$.prototype.keys = function() { throw "todo; dict.keys"; };
$.prototype.pop = function() { throw "todo; dict.pop"; };
$.prototype.popitem = function() { throw "todo; dict.popitem"; };
$.prototype.setdefault = function() { throw "todo; dict.setdefault"; };
$.prototype.update = function() { throw "todo; dict.update"; };
$.prototype.values = function() { throw "todo; dict.values"; };

$.prototype.__getitem__ = function(key)
{
    var entry = this[kf(key)];
    return typeof entry === 'undefined' ? undefined : entry.rhs;
};

$.prototype.__delitem__ = function(key)
{
    var k = kf(key);

    if (this.hasOwnProperty(k))
    {
        this.size -= 1;
        delete this[k];
    }

    return this;
};

$.prototype.__class__ = new Sk.builtin.type('dict', [Sk.types.object], {});

$.prototype.__iter__ = function()
{
    var allkeys = [];
    for (var k in this)
    {
        if (this.hasOwnProperty(k))
        {
            var i = this[k];
            if (i && i.hasOwnProperty('lhs')) // skip internal stuff. todo; merge pyobj and this
            {
                allkeys.push(k);
            }
        }
    }
    //print(allkeys);

    var ret =
    {
        __iter__: function() { return ret; },
        $obj: this,
        $index: 0,
        $keys: allkeys,
        next: function()
        {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) return undefined;
            return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};
*/
/*
 * Basic JavaScript BN library - subset useful for RSA encryption.
 * 
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */


// (public) Constructor
Sk.builtin.biginteger = function(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// Bits per digit
//Sk.builtin.biginteger.dbits;

// JavaScript engine analysis
Sk.builtin.biginteger.canary = 0xdeadbeefcafe;
Sk.builtin.biginteger.j_lm = ((Sk.builtin.biginteger.canary&0xffffff)==0xefcafe);

// return new, unset Sk.builtin.biginteger
Sk.builtin.biginteger.nbi = function() { return new Sk.builtin.biginteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
Sk.builtin.biginteger.prototype.am1 = function(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
Sk.builtin.biginteger.prototype.am2 = function(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
Sk.builtin.biginteger.prototype.am3 = function(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}

// We need to select the fastest one that works in this environment. 
//if (Sk.builtin.biginteger.j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
//	Sk.builtin.biginteger.prototype.am = am2;
//	Sk.builtin.biginteger.dbits = 30;
//} else if (Sk.builtin.biginteger.j_lm && (navigator.appName != "Netscape")) {
//	Sk.builtin.biginteger.prototype.am = am1;
//	Sk.builtin.biginteger.dbits = 26;
//} else { // Mozilla/Netscape seems to prefer am3
//	Sk.builtin.biginteger.prototype.am = am3;
//	Sk.builtin.biginteger.dbits = 28;
//}

// For node.js, we pick am3 with max Sk.builtin.biginteger.dbits to 28.
Sk.builtin.biginteger.prototype.am = Sk.builtin.biginteger.prototype.am3;
Sk.builtin.biginteger.dbits = 28;

Sk.builtin.biginteger.prototype.DB = Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.DM = ((1<<Sk.builtin.biginteger.dbits)-1);
Sk.builtin.biginteger.prototype.DV = (1<<Sk.builtin.biginteger.dbits);

Sk.builtin.biginteger.BI_FP = 52;
Sk.builtin.biginteger.prototype.FV = Math.pow(2,Sk.builtin.biginteger.BI_FP);
Sk.builtin.biginteger.prototype.F1 = Sk.builtin.biginteger.BI_FP-Sk.builtin.biginteger.dbits;
Sk.builtin.biginteger.prototype.F2 = 2*Sk.builtin.biginteger.dbits-Sk.builtin.biginteger.BI_FP;

// Digit conversions
Sk.builtin.biginteger.BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
Sk.builtin.biginteger.BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) Sk.builtin.biginteger.BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) Sk.builtin.biginteger.BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) Sk.builtin.biginteger.BI_RC[rr++] = vv;

Sk.builtin.biginteger.int2char = function(n) { return Sk.builtin.biginteger.BI_RM.charAt(n); }
Sk.builtin.biginteger.intAt = function(s,i) {
  var c = Sk.builtin.biginteger.BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
Sk.builtin.biginteger.prototype.bnpCopyTo = function(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
Sk.builtin.biginteger.prototype.bnpFromInt = function(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+this.DV;
  else this.t = 0;
}

// return bigint initialized to value
Sk.builtin.biginteger.nbv = function(i) { var r = new Sk.builtin.biginteger(null); r.bnpFromInt(i);  return r; }

// (protected) set from string and radix
Sk.builtin.biginteger.prototype.bnpFromString = function(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:Sk.builtin.biginteger.intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) Sk.builtin.biginteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
Sk.builtin.biginteger.prototype.bnpClamp = function() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
Sk.builtin.biginteger.prototype.bnToString = function(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = Sk.builtin.biginteger.int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += Sk.builtin.biginteger.int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
Sk.builtin.biginteger.prototype.bnNegate = function() { var r = Sk.builtin.biginteger.nbi(); Sk.builtin.biginteger.ZERO.subTo(this,r); return r; }

// (public) |this|
Sk.builtin.biginteger.prototype.bnAbs = function() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
Sk.builtin.biginteger.prototype.bnCompareTo = function(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
Sk.builtin.biginteger.nbits = function(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
Sk.builtin.biginteger.prototype.bnBitLength = function() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+Sk.builtin.biginteger.nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
Sk.builtin.biginteger.prototype.bnpDLShiftTo = function(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
Sk.builtin.biginteger.prototype.bnpDRShiftTo = function(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
Sk.builtin.biginteger.prototype.bnpLShiftTo = function(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
Sk.builtin.biginteger.prototype.bnpRShiftTo = function(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
Sk.builtin.biginteger.prototype.bnpSubTo = function(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyTo = function(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) Sk.builtin.biginteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
Sk.builtin.biginteger.prototype.bnpSquareTo = function(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
Sk.builtin.biginteger.prototype.bnpDivRemTo = function(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = Sk.builtin.biginteger.nbi();
  var y = Sk.builtin.biginteger.nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-Sk.builtin.biginteger.nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?Sk.builtin.biginteger.nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  Sk.builtin.biginteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) Sk.builtin.biginteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) Sk.builtin.biginteger.ZERO.subTo(r,r);
}

// (public) this mod a
Sk.builtin.biginteger.prototype.bnMod = function(a) {
  var r = Sk.builtin.biginteger.nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
Sk.builtin.biginteger.Classic = function(m) { this.m = m; }
Sk.builtin.biginteger.prototype.cConvert = function(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
Sk.builtin.biginteger.prototype.cRevert = function(x) { return x; }
Sk.builtin.biginteger.prototype.cReduce = function(x) { x.divRemTo(this.m,null,x); }
Sk.builtin.biginteger.prototype.cMulTo  = function(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
Sk.builtin.biginteger.prototype.cSqrTo  = function(x,r) { x.squareTo(r); this.reduce(r); }

Sk.builtin.biginteger.Classic.prototype.convert = Sk.builtin.biginteger.prototype.cConvert;
Sk.builtin.biginteger.Classic.prototype.revert = Sk.builtin.biginteger.prototype.cRevert;
Sk.builtin.biginteger.Classic.prototype.reduce = Sk.builtin.biginteger.prototype.cReduce;
Sk.builtin.biginteger.Classic.prototype.mulTo = Sk.builtin.biginteger.prototype.cMulTo;
Sk.builtin.biginteger.Classic.prototype.sqrTo = Sk.builtin.biginteger.prototype.cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
Sk.builtin.biginteger.prototype.bnpInvDigit = function() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^Sk.builtin.biginteger.dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Sk.builtin.Montgomery reduction
Sk.builtin.biginteger.Montgomery = function(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
Sk.builtin.biginteger.prototype.montConvert = function(x) {
  var r = Sk.builtin.biginteger.nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(Sk.builtin.biginteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
Sk.builtin.biginteger.prototype.montRevert = function(x) {
  var r = Sk.builtin.biginteger.nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
Sk.builtin.biginteger.prototype.montReduce = function(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
Sk.builtin.biginteger.prototype.montSqrTo = function(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
Sk.builtin.biginteger.prototype.montMulTo = function(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Sk.builtin.biginteger.Montgomery.prototype.convert = Sk.builtin.biginteger.prototype.montConvert;
Sk.builtin.biginteger.Montgomery.prototype.revert = Sk.builtin.biginteger.prototype.montRevert;
Sk.builtin.biginteger.Montgomery.prototype.reduce = Sk.builtin.biginteger.prototype.montReduce;
Sk.builtin.biginteger.Montgomery.prototype.mulTo = Sk.builtin.biginteger.prototype.montMulTo;
Sk.builtin.biginteger.Montgomery.prototype.sqrTo = Sk.builtin.biginteger.prototype.montSqrTo;

// (protected) true iff this is even
Sk.builtin.biginteger.prototype.bnpIsEven = function() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
Sk.builtin.biginteger.prototype.bnpExp = function(e,z) {
  if(e > 0xffffffff || e < 1) return Sk.builtin.biginteger.ONE;
  var r = Sk.builtin.biginteger.nbi(), r2 = Sk.builtin.biginteger.nbi(), g = z.convert(this), i = Sk.builtin.biginteger.nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
Sk.builtin.biginteger.prototype.bnModPowInt = function(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Sk.builtin.biginteger.Classic(m); else z = new Sk.builtin.biginteger.Montgomery(m);
  return this.exp(e,z);
}

// protected
Sk.builtin.biginteger.prototype.copyTo = Sk.builtin.biginteger.prototype.bnpCopyTo;
Sk.builtin.biginteger.prototype.fromInt = Sk.builtin.biginteger.prototype.bnpFromInt;
Sk.builtin.biginteger.prototype.fromString = Sk.builtin.biginteger.prototype.bnpFromString;
Sk.builtin.biginteger.prototype.clamp = Sk.builtin.biginteger.prototype.bnpClamp;
Sk.builtin.biginteger.prototype.dlShiftTo = Sk.builtin.biginteger.prototype.bnpDLShiftTo;
Sk.builtin.biginteger.prototype.drShiftTo = Sk.builtin.biginteger.prototype.bnpDRShiftTo;
Sk.builtin.biginteger.prototype.lShiftTo = Sk.builtin.biginteger.prototype.bnpLShiftTo;
Sk.builtin.biginteger.prototype.rShiftTo = Sk.builtin.biginteger.prototype.bnpRShiftTo;
Sk.builtin.biginteger.prototype.subTo = Sk.builtin.biginteger.prototype.bnpSubTo;
Sk.builtin.biginteger.prototype.multiplyTo = Sk.builtin.biginteger.prototype.bnpMultiplyTo;
Sk.builtin.biginteger.prototype.squareTo = Sk.builtin.biginteger.prototype.bnpSquareTo;
Sk.builtin.biginteger.prototype.divRemTo = Sk.builtin.biginteger.prototype.bnpDivRemTo;
Sk.builtin.biginteger.prototype.invDigit = Sk.builtin.biginteger.prototype.bnpInvDigit;
Sk.builtin.biginteger.prototype.isEven = Sk.builtin.biginteger.prototype.bnpIsEven;
Sk.builtin.biginteger.prototype.exp = Sk.builtin.biginteger.prototype.bnpExp;

// public
Sk.builtin.biginteger.prototype.toString = Sk.builtin.biginteger.prototype.bnToString;
Sk.builtin.biginteger.prototype.negate = Sk.builtin.biginteger.prototype.bnNegate;
Sk.builtin.biginteger.prototype.abs = Sk.builtin.biginteger.prototype.bnAbs;
Sk.builtin.biginteger.prototype.compareTo = Sk.builtin.biginteger.prototype.bnCompareTo;
Sk.builtin.biginteger.prototype.bitLength = Sk.builtin.biginteger.prototype.bnBitLength;
Sk.builtin.biginteger.prototype.mod = Sk.builtin.biginteger.prototype.bnMod;
Sk.builtin.biginteger.prototype.modPowInt = Sk.builtin.biginteger.prototype.bnModPowInt;

// "constants"
Sk.builtin.biginteger.ZERO = Sk.builtin.biginteger.nbv(0);
Sk.builtin.biginteger.ONE = Sk.builtin.biginteger.nbv(1);

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details.

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new Sk.builtin.biginteger("0", 10) returns "proper" zero

//(public)
Sk.builtin.biginteger.prototype.bnClone = function() { var r = Sk.builtin.biginteger.nbi(); this.copyTo(r); return r; }

//(public) return value as integer
Sk.builtin.biginteger.prototype.bnIntValue = function() {
if(this.s < 0) {
 if(this.t == 1) return this[0]-this.DV;
 else if(this.t == 0) return -1;
}
else if(this.t == 1) return this[0];
else if(this.t == 0) return 0;
// assumes 16 < DB < 32
return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
}

//(public) return value as byte
Sk.builtin.biginteger.prototype.bnByteValue = function() { return (this.t==0)?this.s:(this[0]<<24)>>24; }

//(public) return value as short (assumes DB>=16)
Sk.builtin.biginteger.prototype.bnShortValue = function() { return (this.t==0)?this.s:(this[0]<<16)>>16; }

//(protected) return x s.t. r^x < DV
Sk.builtin.biginteger.prototype.bnpChunkSize = function(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

//(public) 0 if this == 0, 1 if this > 0
Sk.builtin.biginteger.prototype.bnSigNum = function() {
if(this.s < 0) return -1;
else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
else return 1;
}

//(protected) convert to radix string
Sk.builtin.biginteger.prototype.bnpToRadix = function(b) {
if(b == null) b = 10;
if(this.signum() == 0 || b < 2 || b > 36) return "0";
var cs = this.chunkSize(b);
var a = Math.pow(b,cs);
var d = Sk.builtin.biginteger.nbv(a), y = Sk.builtin.biginteger.nbi(), z = Sk.builtin.biginteger.nbi(), r = "";
this.divRemTo(d,y,z);
while(y.signum() > 0) {
 r = (a+z.intValue()).toString(b).substr(1) + r;
 y.divRemTo(d,y,z);
}
return z.intValue().toString(b) + r;
}

//(protected) convert from radix string
Sk.builtin.biginteger.prototype.bnpFromRadix = function(s,b) {
this.fromInt(0);
if(b == null) b = 10;
var cs = this.chunkSize(b);
var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
for(var i = 0; i < s.length; ++i) {
 var x = Sk.builtin.biginteger.intAt(s,i);
 if(x < 0) {
   if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
   continue;
 }
 w = b*w+x;
 if(++j >= cs) {
   this.dMultiply(d);
   this.dAddOffset(w,0);
   j = 0;
   w = 0;
 }
}
if(j > 0) {
 this.dMultiply(Math.pow(b,j));
 this.dAddOffset(w,0);
}
if(mi) Sk.builtin.biginteger.ZERO.subTo(this,this);
}

//(protected) alternate constructor
Sk.builtin.biginteger.prototype.bnpFromNumber = function(a,b,c) {
if("number" == typeof b) {
 // new Sk.builtin.biginteger(int,int,RNG)
 if(a < 2) this.fromInt(1);
 else {
   this.fromNumber(a,c);
   if(!this.testBit(a-1))	// force MSB set
     this.bitwiseTo(Sk.builtin.biginteger.ONE.shiftLeft(a-1),Sk.builtin.biginteger.op_or,this);
   if(this.isEven()) this.dAddOffset(1,0); // force odd
   while(!this.isProbablePrime(b)) {
     this.dAddOffset(2,0);
     if(this.bitLength() > a) this.subTo(Sk.builtin.biginteger.ONE.shiftLeft(a-1),this);
   }
 }
}
//	Constructor to support Java BigInteger random generation.  Forget it.
   this.fromString(a+"");
//else {
// // new Sk.builtin.biginteger(int,RNG)
// var x = new Array(), t = a&7;
// x.length = (a>>3)+1;
// b.nextBytes(x);
// if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
// this.fromString(x,256);
//}
}

//(public) convert to bigendian byte array
Sk.builtin.biginteger.prototype.bnToByteArray = function() {
var i = this.t, r = new Array();
r[0] = this.s;
var p = this.DB-(i*this.DB)%8, d, k = 0;
if(i-- > 0) {
 if(p < this.DB && (d = this[i]>>p) != (this.s&this.DM)>>p)
   r[k++] = d|(this.s<<(this.DB-p));
 while(i >= 0) {
   if(p < 8) {
     d = (this[i]&((1<<p)-1))<<(8-p);
     d |= this[--i]>>(p+=this.DB-8);
   }
   else {
     d = (this[i]>>(p-=8))&0xff;
     if(p <= 0) { p += this.DB; --i; }
   }
   if((d&0x80) != 0) d |= -256;
   if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
   if(k > 0 || d != this.s) r[k++] = d;
 }
}
return r;
}

Sk.builtin.biginteger.prototype.bnEquals = function(a) { return(this.compareTo(a)==0); }
Sk.builtin.biginteger.prototype.bnMin = function(a) { return(this.compareTo(a)<0)?this:a; }
Sk.builtin.biginteger.prototype.bnMax = function(a) { return(this.compareTo(a)>0)?this:a; }

//(protected) r = this op a (bitwise)
Sk.builtin.biginteger.prototype.bnpBitwiseTo = function(a,op,r) {
var i, f, m = Math.min(a.t,this.t);
for(i = 0; i < m; ++i) r[i] = op(this[i],a[i]);
if(a.t < this.t) {
 f = a.s&this.DM;
 for(i = m; i < this.t; ++i) r[i] = op(this[i],f);
 r.t = this.t;
}
else {
 f = this.s&this.DM;
 for(i = m; i < a.t; ++i) r[i] = op(f,a[i]);
 r.t = a.t;
}
r.s = op(this.s,a.s);
r.clamp();
}

//(public) this & a
Sk.builtin.biginteger.op_and = function(x,y) { return x&y; }
Sk.builtin.biginteger.prototype.bnAnd = function(a) { var r = Sk.builtin.biginteger.nbi(); this.bitwiseTo(a,Sk.builtin.biginteger.op_and,r); return r; }

//(public) this | a
Sk.builtin.biginteger.op_or = function(x,y) { return x|y; }
Sk.builtin.biginteger.prototype.bnOr = function(a) { var r = Sk.builtin.biginteger.nbi(); this.bitwiseTo(a,Sk.builtin.biginteger.op_or,r); return r; }

//(public) this ^ a
Sk.builtin.biginteger.op_xor = function(x,y) { return x^y; }
Sk.builtin.biginteger.prototype.bnXor = function(a) { var r = Sk.builtin.biginteger.nbi(); this.bitwiseTo(a,Sk.builtin.biginteger.op_xor,r); return r; }

//(public) this & ~a
Sk.builtin.biginteger.op_andnot = function(x,y) { return x&~y; }
Sk.builtin.biginteger.prototype.bnAndNot = function(a) { var r = Sk.builtin.biginteger.nbi(); this.bitwiseTo(a,Sk.builtin.biginteger.op_andnot,r); return r; }

//(public) ~this
Sk.builtin.biginteger.prototype.bnNot = function() {
var r = Sk.builtin.biginteger.nbi();
for(var i = 0; i < this.t; ++i) r[i] = this.DM&~this[i];
r.t = this.t;
r.s = ~this.s;
return r;
}

//(public) this << n
Sk.builtin.biginteger.prototype.bnShiftLeft = function(n) {
var r = Sk.builtin.biginteger.nbi();
if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
return r;
}

//(public) this >> n
Sk.builtin.biginteger.prototype.bnShiftRight = function(n) {
var r = Sk.builtin.biginteger.nbi();
if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
return r;
}

//return index of lowest 1-bit in x, x < 2^31
Sk.builtin.biginteger.lbit = function(x) {
if(x == 0) return -1;
var r = 0;
if((x&0xffff) == 0) { x >>= 16; r += 16; }
if((x&0xff) == 0) { x >>= 8; r += 8; }
if((x&0xf) == 0) { x >>= 4; r += 4; }
if((x&3) == 0) { x >>= 2; r += 2; }
if((x&1) == 0) ++r;
return r;
}

//(public) returns index of lowest 1-bit (or -1 if none)
Sk.builtin.biginteger.prototype.bnGetLowestSetBit = function() {
for(var i = 0; i < this.t; ++i)
 if(this[i] != 0) return i*this.DB+Sk.builtin.biginteger.lbit(this[i]);
if(this.s < 0) return this.t*this.DB;
return -1;
}

//return number of 1 bits in x
Sk.builtin.biginteger.cbit = function(x) {
var r = 0;
while(x != 0) { x &= x-1; ++r; }
return r;
}

//(public) return number of set bits
Sk.builtin.biginteger.prototype.bnBitCount = function() {
var r = 0, x = this.s&this.DM;
for(var i = 0; i < this.t; ++i) r += Sk.builtin.biginteger.cbit(this[i]^x);
return r;
}

//(public) true iff nth bit is set
Sk.builtin.biginteger.prototype.bnTestBit = function(n) {
var j = Math.floor(n/this.DB);
if(j >= this.t) return(this.s!=0);
return((this[j]&(1<<(n%this.DB)))!=0);
}

//(protected) this op (1<<n)
Sk.builtin.biginteger.prototype.bnpChangeBit = function(n,op) {
var r = Sk.builtin.biginteger.ONE.shiftLeft(n);
this.bitwiseTo(r,op,r);
return r;
}

//(public) this | (1<<n)
Sk.builtin.biginteger.prototype.bnSetBit = function(n) { return this.changeBit(n,Sk.builtin.biginteger.op_or); }

//(public) this & ~(1<<n)
Sk.builtin.biginteger.prototype.bnClearBit = function(n) { return this.changeBit(n,Sk.builtin.biginteger.op_andnot); }

//(public) this ^ (1<<n)
Sk.builtin.biginteger.prototype.bnFlipBit = function(n) { return this.changeBit(n,Sk.builtin.biginteger.op_xor); }

//(protected) r = this + a
Sk.builtin.biginteger.prototype.bnpAddTo = function(a,r) {
var i = 0, c = 0, m = Math.min(a.t,this.t);
while(i < m) {
 c += this[i]+a[i];
 r[i++] = c&this.DM;
 c >>= this.DB;
}
if(a.t < this.t) {
 c += a.s;
 while(i < this.t) {
   c += this[i];
   r[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += this.s;
}
else {
 c += this.s;
 while(i < a.t) {
   c += a[i];
   r[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += a.s;
}
r.s = (c<0)?-1:0;
if(c > 0) r[i++] = c;
else if(c < -1) r[i++] = this.DV+c;
r.t = i;
r.clamp();
}

//(public) this + a
Sk.builtin.biginteger.prototype.bnAdd = function(a) { var r = Sk.builtin.biginteger.nbi(); this.addTo(a,r); return r; }

//(public) this - a
Sk.builtin.biginteger.prototype.bnSubtract = function(a) { var r = Sk.builtin.biginteger.nbi(); this.subTo(a,r); return r; }

//(public) this * a
Sk.builtin.biginteger.prototype.bnMultiply = function(a) { var r = Sk.builtin.biginteger.nbi(); this.multiplyTo(a,r); return r; }

//(public) this / a
Sk.builtin.biginteger.prototype.bnDivide = function(a) { var r = Sk.builtin.biginteger.nbi(); this.divRemTo(a,r,null); return r; }

//(public) this % a
Sk.builtin.biginteger.prototype.bnRemainder = function(a) { var r = Sk.builtin.biginteger.nbi(); this.divRemTo(a,null,r); return r; }

//(public) [this/a,this%a]
Sk.builtin.biginteger.prototype.bnDivideAndRemainder = function(a) {
var q = Sk.builtin.biginteger.nbi(), r = Sk.builtin.biginteger.nbi();
this.divRemTo(a,q,r);
return new Array(q,r);
}

//(protected) this *= n, this >= 0, 1 < n < DV
Sk.builtin.biginteger.prototype.bnpDMultiply = function(n) {
this[this.t] = this.am(0,n-1,this,0,0,this.t);
++this.t;
this.clamp();
}

//(protected) this += n << w words, this >= 0
Sk.builtin.biginteger.prototype.bnpDAddOffset = function(n,w) {
if(n == 0) return;
while(this.t <= w) this[this.t++] = 0;
this[w] += n;
while(this[w] >= this.DV) {
 this[w] -= this.DV;
 if(++w >= this.t) this[this.t++] = 0;
 ++this[w];
}
}

//A "null" reducer
Sk.builtin.biginteger.NullExp = function() {}
Sk.builtin.biginteger.prototype.nNop = function(x) { return x; }
Sk.builtin.biginteger.prototype.nMulTo = function(x,y,r) { x.multiplyTo(y,r); }
Sk.builtin.biginteger.prototype.nSqrTo = function(x,r) { x.squareTo(r); }

Sk.builtin.biginteger.NullExp.prototype.convert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.revert = Sk.builtin.biginteger.prototype.nNop;
Sk.builtin.biginteger.NullExp.prototype.mulTo = Sk.builtin.biginteger.prototype.nMulTo;
Sk.builtin.biginteger.NullExp.prototype.sqrTo = Sk.builtin.biginteger.prototype.nSqrTo;

//(public) this^e
Sk.builtin.biginteger.prototype.bnPow = function(e) { return this.exp(e,new Sk.builtin.biginteger.NullExp()); }

//(protected) r = lower n words of "this * a", a.t <= n
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo = function(a,n,r) {
var i = Math.min(this.t+a.t,n);
r.s = 0; // assumes a,this >= 0
r.t = i;
while(i > 0) r[--i] = 0;
var j;
for(j = r.t-this.t; i < j; ++i) r[i+this.t] = this.am(0,a[i],r,i,0,this.t);
for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a[i],r,i,0,n-i);
r.clamp();
}

//(protected) r = "this * a" without lower n words, n > 0
//"this" should be the larger one if appropriate.
Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo = function(a,n,r) {
--n;
var i = r.t = this.t+a.t-n;
r.s = 0; // assumes a,this >= 0
while(--i >= 0) r[i] = 0;
for(i = Math.max(n-this.t,0); i < a.t; ++i)
 r[this.t+i-n] = this.am(n-i,a[i],r,0,0,this.t+i-n);
r.clamp();
r.drShiftTo(1,r);
}

//Barrett modular reduction
Sk.builtin.biginteger.Barrett = function(m) {
// setup Barrett
this.r2 = Sk.builtin.biginteger.nbi();
this.q3 = Sk.builtin.biginteger.nbi();
Sk.builtin.biginteger.ONE.dlShiftTo(2*m.t,this.r2);
this.mu = this.r2.divide(m);
this.m = m;
}

Sk.builtin.biginteger.prototype.barrettConvert = function(x) {
if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
else if(x.compareTo(this.m) < 0) return x;
else { var r = Sk.builtin.biginteger.nbi(); x.copyTo(r); this.reduce(r); return r; }
}

Sk.builtin.biginteger.prototype.barrettRevert = function(x) { return x; }

//x = x mod m (HAC 14.42)
Sk.builtin.biginteger.prototype.barrettReduce = function(x) {
x.drShiftTo(this.m.t-1,this.r2);
if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
x.subTo(this.r2,x);
while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

//r = x^2 mod m; x != r
Sk.builtin.biginteger.prototype.barrettSqrTo = function(x,r) { x.squareTo(r); this.reduce(r); }

//r = x*y mod m; x,y != r
Sk.builtin.biginteger.prototype.barrettMulTo = function(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Sk.builtin.biginteger.Barrett.prototype.convert = Sk.builtin.biginteger.prototype.barrettConvert;
Sk.builtin.biginteger.Barrett.prototype.revert = Sk.builtin.biginteger.prototype.barrettRevert;
Sk.builtin.biginteger.Barrett.prototype.reduce = Sk.builtin.biginteger.prototype.barrettReduce;
Sk.builtin.biginteger.Barrett.prototype.mulTo = Sk.builtin.biginteger.prototype.barrettMulTo;
Sk.builtin.biginteger.Barrett.prototype.sqrTo = Sk.builtin.biginteger.prototype.barrettSqrTo;

//(public) this^e % m (HAC 14.85)
Sk.builtin.biginteger.prototype.bnModPow = function(e,m) {
var i = e.bitLength(), k, r = Sk.builtin.biginteger.nbv(1), z;
if(i <= 0) return r;
else if(i < 18) k = 1;
else if(i < 48) k = 3;
else if(i < 144) k = 4;
else if(i < 768) k = 5;
else k = 6;
if(i < 8)
 z = new Sk.builtin.biginteger.Classic(m);
else if(m.isEven())
 z = new Sk.builtin.biginteger.Barrett(m);
else
 z = new Sk.builtin.biginteger.Montgomery(m);

// precomputation
var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
g[1] = z.convert(this);
if(k > 1) {
 var g2 = Sk.builtin.biginteger.nbi();
 z.sqrTo(g[1],g2);
 while(n <= km) {
   g[n] = Sk.builtin.biginteger.nbi();
   z.mulTo(g2,g[n-2],g[n]);
   n += 2;
 }
}

var j = e.t-1, w, is1 = true, r2 = Sk.builtin.biginteger.nbi(), t;
i = Sk.builtin.biginteger.nbits(e[j])-1;
while(j >= 0) {
 if(i >= k1) w = (e[j]>>(i-k1))&km;
 else {
   w = (e[j]&((1<<(i+1))-1))<<(k1-i);
   if(j > 0) w |= e[j-1]>>(this.DB+i-k1);
 }

 n = k;
 while((w&1) == 0) { w >>= 1; --n; }
 if((i -= n) < 0) { i += this.DB; --j; }
 if(is1) {	// ret == 1, don't bother squaring or multiplying it
   g[w].copyTo(r);
   is1 = false;
 }
 else {
   while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
   if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
   z.mulTo(r2,g[w],r);
 }

 while(j >= 0 && (e[j]&(1<<i)) == 0) {
   z.sqrTo(r,r2); t = r; r = r2; r2 = t;
   if(--i < 0) { i = this.DB-1; --j; }
 }
}
return z.revert(r);
}

//(public) gcd(this,a) (HAC 14.54)
Sk.builtin.biginteger.prototype.bnGCD = function(a) {
var x = (this.s<0)?this.negate():this.clone();
var y = (a.s<0)?a.negate():a.clone();
if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
var i = x.getLowestSetBit(), g = y.getLowestSetBit();
if(g < 0) return x;
if(i < g) g = i;
if(g > 0) {
 x.rShiftTo(g,x);
 y.rShiftTo(g,y);
}
while(x.signum() > 0) {
 if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
 if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
 if(x.compareTo(y) >= 0) {
   x.subTo(y,x);
   x.rShiftTo(1,x);
 }
 else {
   y.subTo(x,y);
   y.rShiftTo(1,y);
 }
}
if(g > 0) y.lShiftTo(g,y);
return y;
}

//(protected) this % n, n < 2^26
Sk.builtin.biginteger.prototype.bnpModInt = function(n) {
if(n <= 0) return 0;
var d = this.DV%n, r = (this.s<0)?n-1:0;
if(this.t > 0)
 if(d == 0) r = this[0]%n;
 else for(var i = this.t-1; i >= 0; --i) r = (d*r+this[i])%n;
return r;
}

//(public) 1/this % m (HAC 14.61)
Sk.builtin.biginteger.prototype.bnModInverse = function(m) {
var ac = m.isEven();
if((this.isEven() && ac) || m.signum() == 0) return Sk.builtin.biginteger.ZERO;
var u = m.clone(), v = this.clone();
var a = Sk.builtin.biginteger.nbv(1), b = Sk.builtin.biginteger.nbv(0), c = Sk.builtin.biginteger.nbv(0), d = Sk.builtin.biginteger.nbv(1);
while(u.signum() != 0) {
 while(u.isEven()) {
   u.rShiftTo(1,u);
   if(ac) {
     if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
     a.rShiftTo(1,a);
   }
   else if(!b.isEven()) b.subTo(m,b);
   b.rShiftTo(1,b);
 }
 while(v.isEven()) {
   v.rShiftTo(1,v);
   if(ac) {
     if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
     c.rShiftTo(1,c);
   }
   else if(!d.isEven()) d.subTo(m,d);
   d.rShiftTo(1,d);
 }
 if(u.compareTo(v) >= 0) {
   u.subTo(v,u);
   if(ac) a.subTo(c,a);
   b.subTo(d,b);
 }
 else {
   v.subTo(u,v);
   if(ac) c.subTo(a,c);
   d.subTo(b,d);
 }
}
if(v.compareTo(Sk.builtin.biginteger.ONE) != 0) return Sk.builtin.biginteger.ZERO;
if(d.compareTo(m) >= 0) return d.subtract(m);
if(d.signum() < 0) d.addTo(m,d); else return d;
if(d.signum() < 0) return d.add(m); else return d;
}

Sk.builtin.biginteger.lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509];
Sk.builtin.biginteger.lplim = (1<<26)/Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length-1];

//(public) test primality with certainty >= 1-.5^t
Sk.builtin.biginteger.prototype.bnIsProbablePrime = function(t) {
var i, x = this.abs();
if(x.t == 1 && x[0] <= Sk.builtin.biginteger.lowprimes[Sk.builtin.biginteger.lowprimes.length-1]) {
 for(i = 0; i < Sk.builtin.biginteger.lowprimes.length; ++i)
   if(x[0] == Sk.builtin.biginteger.lowprimes[i]) return true;
 return false;
}
if(x.isEven()) return false;
i = 1;
while(i < Sk.builtin.biginteger.lowprimes.length) {
 var m = Sk.builtin.biginteger.lowprimes[i], j = i+1;
 while(j < Sk.builtin.biginteger.lowprimes.length && m < Sk.builtin.biginteger.lplim) m *= Sk.builtin.biginteger.lowprimes[j++];
 m = x.modInt(m);
 while(i < j) if(m%Sk.builtin.biginteger.lowprimes[i++] == 0) return false;
}
return x.millerRabin(t);
}

//(protected) true if probably prime (HAC 4.24, Miller-Rabin)
Sk.builtin.biginteger.prototype.bnpMillerRabin = function(t) {
var n1 = this.subtract(Sk.builtin.biginteger.ONE);
var k = n1.getLowestSetBit();
if(k <= 0) return false;
var r = n1.shiftRight(k);
t = (t+1)>>1;
if(t > Sk.builtin.biginteger.lowprimes.length) t = Sk.builtin.biginteger.lowprimes.length;
var a = Sk.builtin.biginteger.nbi();
for(var i = 0; i < t; ++i) {
 a.fromInt(Sk.builtin.biginteger.lowprimes[i]);
 var y = a.modPow(r,this);
 if(y.compareTo(Sk.builtin.biginteger.ONE) != 0 && y.compareTo(n1) != 0) {
   var j = 1;
   while(j++ < k && y.compareTo(n1) != 0) {
     y = y.modPowInt(2,this);
     if(y.compareTo(Sk.builtin.biginteger.ONE) == 0) return false;
   }
   if(y.compareTo(n1) != 0) return false;
 }
}
return true;
}

//protected
Sk.builtin.biginteger.prototype.chunkSize = Sk.builtin.biginteger.prototype.bnpChunkSize;
Sk.builtin.biginteger.prototype.toRadix = Sk.builtin.biginteger.prototype.bnpToRadix;
Sk.builtin.biginteger.prototype.fromRadix = Sk.builtin.biginteger.prototype.bnpFromRadix;
Sk.builtin.biginteger.prototype.fromNumber = Sk.builtin.biginteger.prototype.bnpFromNumber;
Sk.builtin.biginteger.prototype.bitwiseTo = Sk.builtin.biginteger.prototype.bnpBitwiseTo;
Sk.builtin.biginteger.prototype.changeBit = Sk.builtin.biginteger.prototype.bnpChangeBit;
Sk.builtin.biginteger.prototype.addTo = Sk.builtin.biginteger.prototype.bnpAddTo;
Sk.builtin.biginteger.prototype.dMultiply = Sk.builtin.biginteger.prototype.bnpDMultiply;
Sk.builtin.biginteger.prototype.dAddOffset = Sk.builtin.biginteger.prototype.bnpDAddOffset;
Sk.builtin.biginteger.prototype.multiplyLowerTo = Sk.builtin.biginteger.prototype.bnpMultiplyLowerTo;
Sk.builtin.biginteger.prototype.multiplyUpperTo = Sk.builtin.biginteger.prototype.bnpMultiplyUpperTo;
Sk.builtin.biginteger.prototype.modInt = Sk.builtin.biginteger.prototype.bnpModInt;
Sk.builtin.biginteger.prototype.millerRabin = Sk.builtin.biginteger.prototype.bnpMillerRabin;

//public
Sk.builtin.biginteger.prototype.clone = Sk.builtin.biginteger.prototype.bnClone;
Sk.builtin.biginteger.prototype.intValue = Sk.builtin.biginteger.prototype.bnIntValue;
Sk.builtin.biginteger.prototype.byteValue = Sk.builtin.biginteger.prototype.bnByteValue;
Sk.builtin.biginteger.prototype.shortValue = Sk.builtin.biginteger.prototype.bnShortValue;
Sk.builtin.biginteger.prototype.signum = Sk.builtin.biginteger.prototype.bnSigNum;
Sk.builtin.biginteger.prototype.toByteArray = Sk.builtin.biginteger.prototype.bnToByteArray;
Sk.builtin.biginteger.prototype.equals = Sk.builtin.biginteger.prototype.bnEquals;
Sk.builtin.biginteger.prototype.compare = Sk.builtin.biginteger.prototype.compareTo;
Sk.builtin.biginteger.prototype.min = Sk.builtin.biginteger.prototype.bnMin;
Sk.builtin.biginteger.prototype.max = Sk.builtin.biginteger.prototype.bnMax;
Sk.builtin.biginteger.prototype.and = Sk.builtin.biginteger.prototype.bnAnd;
Sk.builtin.biginteger.prototype.or = Sk.builtin.biginteger.prototype.bnOr;
Sk.builtin.biginteger.prototype.xor = Sk.builtin.biginteger.prototype.bnXor;
Sk.builtin.biginteger.prototype.andNot = Sk.builtin.biginteger.prototype.bnAndNot;
Sk.builtin.biginteger.prototype.not = Sk.builtin.biginteger.prototype.bnNot;
Sk.builtin.biginteger.prototype.shiftLeft = Sk.builtin.biginteger.prototype.bnShiftLeft;
Sk.builtin.biginteger.prototype.shiftRight = Sk.builtin.biginteger.prototype.bnShiftRight;
Sk.builtin.biginteger.prototype.getLowestSetBit = Sk.builtin.biginteger.prototype.bnGetLowestSetBit;
Sk.builtin.biginteger.prototype.bitCount = Sk.builtin.biginteger.prototype.bnBitCount;
Sk.builtin.biginteger.prototype.testBit = Sk.builtin.biginteger.prototype.bnTestBit;
Sk.builtin.biginteger.prototype.setBit = Sk.builtin.biginteger.prototype.bnSetBit;
Sk.builtin.biginteger.prototype.clearBit = Sk.builtin.biginteger.prototype.bnClearBit;
Sk.builtin.biginteger.prototype.flipBit = Sk.builtin.biginteger.prototype.bnFlipBit;
Sk.builtin.biginteger.prototype.add = Sk.builtin.biginteger.prototype.bnAdd;
Sk.builtin.biginteger.prototype.subtract = Sk.builtin.biginteger.prototype.bnSubtract;
Sk.builtin.biginteger.prototype.multiply = Sk.builtin.biginteger.prototype.bnMultiply;
Sk.builtin.biginteger.prototype.divide = Sk.builtin.biginteger.prototype.bnDivide;
Sk.builtin.biginteger.prototype.remainder = Sk.builtin.biginteger.prototype.bnRemainder;
Sk.builtin.biginteger.prototype.divideAndRemainder = Sk.builtin.biginteger.prototype.bnDivideAndRemainder;
Sk.builtin.biginteger.prototype.modPow = Sk.builtin.biginteger.prototype.bnModPow;
Sk.builtin.biginteger.prototype.modInverse = Sk.builtin.biginteger.prototype.bnModInverse;
Sk.builtin.biginteger.prototype.pow = Sk.builtin.biginteger.prototype.bnPow;
Sk.builtin.biginteger.prototype.gcd = Sk.builtin.biginteger.prototype.bnGCD;
Sk.builtin.biginteger.prototype.isProbablePrime = Sk.builtin.biginteger.prototype.bnIsProbablePrime;
//Sk.builtin.biginteger.int2char = int2char;

//Sk.builtin.biginteger interfaces not implemented in jsbn:

//Sk.builtin.biginteger(int signum, byte[] magnitude)
//double doubleValue()
//float floatValue()
//int hashCode()
//long longValue()
//static Sk.builtin.biginteger valueOf(long val)

//module.exports = Sk.builtin.biginteger;// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 */
Sk.builtin.lng = function(x)	/* long is a reserved word */
{
    if (!(this instanceof Sk.builtin.lng)) return new Sk.builtin.lng(x);

	if (x instanceof Sk.builtin.lng)
		this.biginteger = x.biginteger.clone();
	else if (x instanceof Sk.builtin.biginteger)
		this.biginteger = x;
	else if (x instanceof String)
		return Sk.longFromStr(x);
	else
		this.biginteger = new Sk.builtin.biginteger(x);

    return this;
};

Sk.builtin.lng.tp$index = function()
{
    goog.asserts.fail("todo;");
};

Sk.builtin.lng.prototype.tp$name = "long";
Sk.builtin.lng.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('long', Sk.builtin.lng);

//	Threshold to determine when types should be converted to long
Sk.builtin.lng.threshold$ = Math.pow(2, 53);

Sk.builtin.lng.LONG_DIVIDE$ = 0;
Sk.builtin.lng.FLOAT_DIVIDE$ = -1;
Sk.builtin.lng.VARIABLE_DIVIDE$ = -2;
// Positive values reserved for scaled, fixed precision big number implementations where mode = number of digits to the right of the decimal
Sk.builtin.lng.dividemode$ = Sk.builtin.lng.LONG_DIVIDE$;

Sk.builtin.lng.longDivideMode = function(m) 
{
	if (m) {
		if (m instanceof Sk.builtin.str) {
			if (m.v == 'float') m = Sk.builtin.lng.FLOAT_DIVIDE$;
			else if (m.v == 'long')  m = Sk.builtin.lng.LONG_DIVIDE$;
			else if (m.v == 'variable') m = Sk.builtin.lng.VARIABLE_DIVIDE$;
			else goog.asserts.assert(true, "Invalid long division mode.");
		}
		Sk.builtin.lng.dividemode$ = m;
	}
	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$)
		return new Sk.builtin.str('float');
	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.VARIABLE_DIVIDE$)
		return new Sk.builtin.str('variable');
	return new Sk.builtin.str('long'); 
};

Sk.builtin.lng.fromInt$ = function(ival) 
{
	return new Sk.builtin.lng(ival);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.longFromStr = function(s)
{
    goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

	var neg=false;
	if (s.substr(0, 1) == "-") {
		s = s.substr(1);
		neg=true;
	}
    var base = 10;
    if (s.substr(0, 2) === "0x" || s.substr(0, 2) === "0X")
    {
        s = s.substr(2);
        base = 16;
    }
    else if (s.substr(0, 2) === "0o")
    {
        s = s.substr(2);
        base = 8;
    }
    else if (s.substr(0, 1) === "0")
    {
        s = s.substr(1);
        base = 8;
    }
    else if (s.substr(0, 2) === "0b")
    {
        s = s.substr(2);
        base = 2;
    }

	var biginteger;
	if (base == 10)
		biginteger = new Sk.builtin.biginteger(s);
	else
		biginteger = new Sk.builtin.biginteger(s,base);

	if (neg)
		biginteger = biginteger.negate();

	return new Sk.builtin.lng(biginteger);

};
goog.exportSymbol("Sk.longFromStr", Sk.longFromStr);

Sk.builtin.lng.prototype.clone = function()
{
	return new Sk.builtin.lng(this);
};

Sk.builtin.lng.prototype.nb$add = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.add(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.add(other));
	}

	return new Sk.builtin.lng(this.biginteger.add(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$inplace_add = Sk.builtin.lng.prototype.nb$add;

Sk.builtin.lng.prototype.nb$subtract = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.subtract(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.subtract(other));
	}

	return new Sk.builtin.lng(this.biginteger.subtract(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$multiply = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.multiply(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.multiply(other));
	}

	return new Sk.builtin.lng(this.biginteger.multiply(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$divide = function(other)
{
	var result;
	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$ || Sk.builtin.lng.dividemode$ == Sk.builtin.lng.VARIABLE_DIVIDE$) {
		if (other instanceof Sk.builtin.lng) {
			result = this.biginteger.divideAndRemainder(other.biginteger);
		} else if (other instanceof Sk.builtin.biginteger) {
			result = this.biginteger.divideAndRemainder(other);
		} else {
			result = this.biginteger.divideAndRemainder(new Sk.builtin.biginteger(other));
		}

		//	result = Array of quotient [0], remainder [1]

		if (result [1].compare(Sk.builtin.biginteger.ZERO) != 0) {
			//	Non-zero remainder -- this will be a float no matter what
			return parseFloat(this.biginteger.toString()) / parseFloat(other.biginteger.toString());
		} else {
			//	No remainder
			if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$)
				return parseFloat(result [0].toString());		//	Float option with no remainder, return quotient as float
			else
				return new Sk.builtin.lng(result [0]);			//	Variable option with no remainder, return new long from quotient
		}
	}

//	Standard, long result mode
	if (other instanceof Sk.builtin.lng) {
		result = new Sk.builtin.lng(this.biginteger.divide(other.biginteger));
	} else if (other instanceof Sk.builtin.biginteger) {
		result = new Sk.builtin.lng(this.biginteger.divide(other));
	} else {
		result = new Sk.builtin.lng(this.biginteger.divide(new Sk.builtin.biginteger(other)));
	}

	return result;
};

Sk.builtin.lng.prototype.nb$floor_divide = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.divide(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.divide(other));
	}

	return new Sk.builtin.lng(this.biginteger.divide(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$remainder = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.remainder(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.remainder(other));
	}

	return new Sk.builtin.lng(this.biginteger.remainder(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$power = function(n)
{
	if (n instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.pow(n.biginteger));
	}

	if (n instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.pow(n));
	}

	return new Sk.builtin.lng(this.biginteger.pow(new Sk.builtin.biginteger(n)));
};

Sk.builtin.lng.prototype.nb$negative = function()
{
	return new Sk.builtin.lng(this.biginteger.negate());
};

Sk.builtin.lng.prototype.nb$positive = function() { return this; };

Sk.builtin.lng.prototype.nb$nonzero = function()
{
	return this.biginteger.compare(Sk.builtin.biginteger.ZERO) !== 0;
};

Sk.builtin.lng.prototype.compare = function(other)
{
	if (other instanceof Sk.builtin.lng) {
		return this.biginteger.compare(other.biginteger);
	}

	if (other instanceof Sk.builtin.biginteger) {
		return this.biginteger.compare(other);
	}

	return this.biginteger.compare(new Sk.builtin.biginteger(other));
}

Sk.builtin.lng.prototype.__eq__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) == 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) == 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) == 0;
};

Sk.builtin.lng.prototype.__ne__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) != 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) != 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) != 0;
};

Sk.builtin.lng.prototype.__lt__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) < 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) < 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) < 0;
};

Sk.builtin.lng.prototype.__le__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) <= 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) <= 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) <= 0;
};

Sk.builtin.lng.prototype.__gt__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) > 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) > 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) > 0;
};

Sk.builtin.lng.prototype.__ge__ = function(me, other) {
	if (other instanceof Sk.builtin.lng) {
		return me.biginteger.compare(other.biginteger) >= 0;
	}

	if (other instanceof Sk.builtin.biginteger) {
		return me.biginteger.compare(other) >= 0;
	}

	return me.biginteger.compare(new Sk.builtin.biginteger(other)) >= 0;
};

Sk.builtin.lng.prototype['$r'] = function()
{
    return new Sk.builtin.str(this.str$(10, true) + "L");
};

Sk.builtin.lng.prototype.tp$str = function()
{
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.lng.prototype.str$ = function(base, sign)
{
	if (sign === undefined) sign = true;

	var work = sign ? this.biginteger : this.biginteger.abs();

	if (base === undefined || base === 10) {
		return work.toString();
	}

	//	Another base... convert...
	return work.toString(base);
};
Sk.builtin.int_ = function(x, base)
{
    if (x instanceof Sk.builtin.str)
    {
        // todo; this should handle longs too
        if (base === undefined) base = 10; // default radix is 10, not dwim
		if ( x.v.substring(0,2).toLowerCase() == '0x' && base != 16 && base != 0) {
			throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
		}
		if ( x.v.substring(0,2).toLowerCase() == '0b' ) { 
			if (base != 2 && base != 0) {
				throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
			} else {
				x.v = x.v.substring(2);
				base = 2;
			}
		}

        if (!isNaN(x.v) && x.v.indexOf(".") < 0)
            return parseInt(x.v, base);
        else {
            throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
        }

    }
    // sneaky way to do truncate, floor doesn't work < 0, round doesn't work on the .5> side
    // bitwise ops convert to 32bit int in the "C-truncate-way" we want.
    return x | 0;
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
Sk.builtin.float_ = function(x)
{
    if (x instanceof Sk.builtin.str)
    {
        if (x.v === "inf") return Infinity;
        if (x.v === "-inf") return -Infinity;
        if (!isNaN(x.v))
            return parseFloat(x.v);
        else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
    }
    return x;
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('float', Sk.builtin.float_);
/**
 * @constructor
 * @param {number} start
 * @param {number=} stop
 * @param {null|number=} step
 */
Sk.builtin.slice = function slice(start, stop, step)
{
    if (!(this instanceof Sk.builtin.slice)) return new Sk.builtin.slice(start, stop, step);

    if (stop === undefined && step === undefined)
    {
        stop = start;
        start = null;
    }
    if (!start) start = null;
    if (stop === undefined) stop = null;
    if (step === undefined) step = null;
    this.start = start;
    this.stop = stop;
    this.step = step;
    return this;
};

Sk.builtin.slice.prototype.tp$str = function()
{
    var a = Sk.builtin.repr(this.start).v;
    var b = Sk.builtin.repr(this.stop).v;
    var c = Sk.builtin.repr(this.step).v;
    return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
};

Sk.builtin.slice.prototype.indices = function(length)
{
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (step === null) step = 1;
    if (step > 0)
    {
        if (start === null) start = 0;
        if (stop === null) stop = length;
        if (start < 0) start = length + start;
        if (stop < 0) stop = length + stop;
    }
    else
    {
        if (start === null) start = length - 1;
        else if (start < 0) start = length + start;
        if (stop === null) stop = -1;
        else if (stop < 0) stop = length + stop;
    }
    return [start, stop, step];
};

Sk.builtin.slice.prototype.sssiter$ = function(wrt, f)
{
    var sss = this.indices(typeof wrt === "number" ? wrt : wrt.v.length);
    if (sss[2] > 0)
    {
        var i;
        for (i = sss[0]; i < sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;
    }
    else
    {
        for (i = sss[0]; i > sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;

    }
};
/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.set = function(S)
{
    if (!(this instanceof Sk.builtin.set)) return new Sk.builtin.set(S);

    if (typeof(S) === 'undefined')
    {
        S = [];
    }

    this.set_reset_();
    S = new Sk.builtin.list(S);
    // python sorts sets on init, but not thereafter.
    // Skulpt seems to init a new set each time you add/remove something
    //Sk.builtin.list.prototype['sort'].func_code(S);
    for (var it = S.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        Sk.builtin.set.prototype['add'].func_code(this, i);
    }

    this.__class__ = Sk.builtin.set;

    this["v"] = this.v;
    return this;
};


Sk.builtin.set.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('set', Sk.builtin.set);

Sk.builtin.set.prototype.set_iter_ = function()
{
    var ret = Sk.builtin.dict.prototype['keys'].func_code(this['v']);
    return ret.tp$iter();
};

Sk.builtin.set.prototype.set_reset_ = function()
{
    this.v = new Sk.builtin.dict([]);
};

Sk.builtin.set.prototype.tp$name = 'set';
Sk.builtin.set.prototype['$r'] = function()
{
    var ret = [];
    for (var it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        ret.push(Sk.misceval.objectRepr(i).v);
    }
    return new Sk.builtin.str('set([' + ret.join(', ') + '])');
};
Sk.builtin.set.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
// todo; you can't hash a set() -- what should this be?
Sk.builtin.set.prototype.tp$hash = Sk.builtin.object.prototype.HashNotImplemented;

Sk.builtin.set.prototype.tp$richcompare = function(w, op)
{
    // todo; NotImplemented if either isn't a set

    if (this === w && Sk.misceval.opAllowsEquality(op))
        return true;

    var vl = this.sq$length();
    var wl = w.sq$length();

    // easy short-cut
    if (wl !== vl)
    {
        if (op === 'Eq')
            return false;
        if (op === 'NotEq')
            return true;
    }

    // used quite a lot in comparisons.
    var isSub = false;
    var isSuper = false;

    // gather common info
    switch (op)
    {
        case 'Lt':
        case 'LtE':
        case 'Eq':
        case 'NotEq':
            isSub = Sk.builtin.set.prototype['issubset'].func_code(this, w);
            break;
        case 'Gt':
        case 'GtE':
            isSuper = Sk.builtin.set.prototype['issuperset'].func_code(this, w);
            break;
        default:
            goog.asserts.fail();
    }

    switch (op)
    {
        case 'Lt':
            return vl < wl && isSub;
        case 'LtE':
        case 'Eq':  // we already know that the lengths are equal
            return isSub;
        case 'NotEq':
            return !isSub;
        case 'Gt':
            return vl > wl && isSuper;
        case 'GtE':
            return isSuper;
    }
};

Sk.builtin.set.prototype.tp$iter = Sk.builtin.set.prototype.set_iter_;
Sk.builtin.set.prototype.sq$length = function() { return this['v'].mp$length(); }

Sk.builtin.set.prototype['isdisjoint'] = new Sk.builtin.func(function(self, other)
{
    // requires all items in self to not be in other
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        var isIn = Sk.abstr.sequenceContains(other, item);
        if (isIn)
        {
            return false;
        }
    }
    return true;
});

Sk.builtin.set.prototype['issubset'] = new Sk.builtin.func(function(self, other)
{
    var selfLength = self.sq$length();
    var otherLength = other.sq$length();
    if (selfLength > otherLength)
    {
        // every item in this set can't be in other if it's shorter!
        return false;
    }
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        var isIn = Sk.abstr.sequenceContains(other, item);
        if (!isIn)
        {
            return false;
        }
    }
    return true;
});

Sk.builtin.set.prototype['issuperset'] = new Sk.builtin.func(function(self, other)
{
    return Sk.builtin.set.prototype['issubset'].func_code(other, self);
});

Sk.builtin.set.prototype['union'] = new Sk.builtin.func(function(self)
{
    var S = new Sk.builtin.set(self);
    for (var i=1; i < arguments.length; i++)
    {
        Sk.builtin.set.prototype['update'].func_code(S, arguments[i]);
    }
    return S;
});

Sk.builtin.set.prototype['intersection'] = new Sk.builtin.func(function(self)
{
    var S = Sk.builtin.set.prototype['copy'].func_code(self);
    arguments[0] = S;
    Sk.builtin.set.prototype['intersection_update'].func_code.apply(null, arguments);
    return S;
});

Sk.builtin.set.prototype['difference'] = new Sk.builtin.func(function(self, other)
{
    var S = Sk.builtin.set.prototype['copy'].func_code(self);
    arguments[0] = S;
    Sk.builtin.set.prototype['difference_update'].func_code.apply(null, arguments);
    return S;
});

Sk.builtin.set.prototype['symmetric_difference'] = new Sk.builtin.func(function(self, other)
{
    var S = Sk.builtin.set.prototype['union'].func_code(self, other);
    for (var it = S.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        if ( Sk.abstr.sequenceContains(self, item) && Sk.abstr.sequenceContains(other, item) )
        {
            Sk.builtin.set.prototype['discard'].func_code(S, item);
        }
    }
    return S;
});

Sk.builtin.set.prototype['copy'] = new Sk.builtin.func(function(self)
{
    return new Sk.builtin.set(self);
});

Sk.builtin.set.prototype['update'] = new Sk.builtin.func(function(self, other)
{
    for (var it = other.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        Sk.builtin.set.prototype['add'].func_code(self, item);
    }
    return null;
});

Sk.builtin.set.prototype['intersection_update'] = new Sk.builtin.func(function(self)
{
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        for (var i=1; i < arguments.length; i++)
        {
            if (!Sk.abstr.sequenceContains(arguments[i], item))
            {
                Sk.builtin.set.prototype['discard'].func_code(self, item);
                break;
            }
        }
    }
    return null;
});

Sk.builtin.set.prototype['difference_update'] = new Sk.builtin.func(function(self, other)
{
    for (var it = self.tp$iter(), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext())
    {
        for (var i=1; i < arguments.length; i++)
        {
            if (Sk.abstr.sequenceContains(arguments[i], item))
            {
                Sk.builtin.set.prototype['discard'].func_code(self, item);
                break;
            }
        }
    }
    return null;
});

Sk.builtin.set.prototype['symmetric_difference_update'] = new Sk.builtin.func(function(self, other)
{
    var sd = Sk.builtin.set.prototype['symmetric_difference'].func_code(self, other);
    self.set_reset_();
    Sk.builtin.set.prototype['update'].func_code(self, sd);
    return null;
});


Sk.builtin.set.prototype['add'] = new Sk.builtin.func(function(self, item)
{
    self.v.mp$ass_subscript(item, true);
    return null;
});

Sk.builtin.set.prototype['discard'] = new Sk.builtin.func(function(self, item)
{
    if (self.v.mp$subscript(item) !== undefined)
    {
        var kf = Sk.builtin.hash;
        var k = kf(item);
        if (self.v[k] !== undefined) {
            self.v.size -= 1;
            delete self.v[k];
        }
        //self.v.mp$ass_subscript(item, null);
    }
    return null;
});

Sk.builtin.set.prototype['pop'] = new Sk.builtin.func(function(self)
{
    if (self.sq$length() === 0)
    {
        throw new Sk.builtin.KeyError("pop from an empty set");
    }

    var it = self.tp$iter(), item = it.tp$iternext();
    Sk.builtin.set.prototype['discard'].func_code(self, item);
    return item;
});

Sk.builtin.set.prototype['remove'] = new Sk.builtin.func(function(self, item)
{
    if (Sk.abstr.sequenceContains(self, item))
    {
        Sk.builtin.set.prototype['discard'].func_code(self, item);
    }
    else
    {
        throw new Sk.builtin.KeyError(item);
    }
    return null;
});


goog.exportSymbol("Sk.builtin.set", Sk.builtin.set);/**
 * @constructor
 */
Sk.builtin.module = function()
{
};
goog.exportSymbol("Sk.builtin.module", Sk.builtin.module);

Sk.builtin.module.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('module', Sk.builtin.module);
Sk.builtin.module.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.module.prototype.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
/**
 * @constructor
 * @param {Function=} code javascript code object for the function
 * @param {Object=} globals where this function was defined
 * @param {Object=} args arguments to the original call (stored into locals for
 * the generator to reenter)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * co_varnames and co_name come from generated code, must access as dict.
 */
Sk.builtin.generator = function(code, globals, args, closure, closure2)
{
    if (!code) return; // ctor hack
    this.func_code = code;
    this.func_globals = globals || null;
    this.gi$running = false;
    this['gi$resumeat'] = 0;
    this['gi$sentvalue'] = undefined;
    this['gi$locals'] = {};
    if (args.length > 0)
    {
        // store arguments into locals because they have to be maintained
        // too. 'fast' var lookups are locals in generator functions.
        for (var i = 0; i < code['co_varnames'].length; ++i)
            this['gi$locals'][code['co_varnames'][i]] = args[i];
    }
    if (closure2 !== undefined)
    {
        // todo; confirm that modification here can't cause problems
        for (var k in closure2)
            closure[k] = closure2[k];
    }
    //print(JSON.stringify(closure));
    this.func_closure = closure;
    return this;
};
goog.exportSymbol("Sk.builtin.generator", Sk.builtin.generator);

Sk.builtin.generator.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.generator.prototype.tp$iter = function()
{
    return this;
};

Sk.builtin.generator.prototype.tp$iternext = function(yielded)
{
    this.gi$running = true;
    if (yielded === undefined) yielded = null;
    this['gi$sentvalue'] = yielded;

    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    var args = [ this ];
    if (this.func_closure)
        args.push(this.func_closure);
    var ret = this.func_code.apply(this.func_globals, args); 
    //print("ret", JSON.stringify(ret));
    this.gi$running = false;
    goog.asserts.assert(ret !== undefined);
    if (ret !== null)
    {
        // returns a pair: resume target and yielded value
        this['gi$resumeat'] = ret[0];
        ret = ret[1];
    }
    else
    {
        // todo; StopIteration
        return undefined;
    }
    //print("returning:", JSON.stringify(ret));
    return ret;
};

Sk.builtin.generator.prototype['next'] = new Sk.builtin.func(function(self)
{
    return self.tp$iternext();
});

Sk.builtin.generator.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('generator', Sk.builtin.generator);

Sk.builtin.generator.prototype['$r'] = function()
{
    return new Sk.builtin.str("<generator object " + this.func_code['co_name'].v + ">");
};

Sk.builtin.generator.prototype['send'] = new Sk.builtin.func(function(self, value)
{
    return self.tp$iternext(value);
});

/**
 * Creates a generator with the specified next function and additional
 * instance data. Useful in Javascript-implemented modules to implement
 * the __iter__ method.
 */
Sk.builtin.makeGenerator = function(next, data)
{
  var gen = new Sk.builtin.generator();
  gen.tp$iternext = next;

  for (var key in data)
  {
    if (data.hasOwnProperty(key))
    {
      gen[key] = data[key];
    }
  }

  return gen;
};
/**
 * @constructor
 * @param {Sk.builtin.str} name
 * @param {Sk.builtin.str} mode
 * @param {Object} buffering
 */
Sk.builtin.file = function(name, mode, buffering)
{
    this.mode = mode;
    this.name = name;
    this.closed = false;
	if ( Sk.inBrowser ) {  // todo:  Maybe provide a replaceable function for non-import files
	    if (document.all) {
		    this.data$ = document.getElementById(name.v).innerText;
	    } else { // stupid Firefox
	        this.data$ = document.getElementById(name.v).textContent;
	    }
	} else {
  		this.data$ = Sk.read(name.v);
	}
	this.lineList = this.data$.split("\n");
	this.lineList = this.lineList.slice(0,-1);
	for(var i in this.lineList) {
		this.lineList[i] = this.lineList[i]+'\n';
	}
	this.currentLine = 0;
    this.pos$ = 0;

	this.__class__ = Sk.builtin.file;
	
    return this;
};

Sk.builtin.file.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('file', Sk.builtin.file);

Sk.builtin.file.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.file.prototype['$r'] = function()
{
    return new Sk.builtin.str("<"
        + (this.closed ? "closed" : "open")
        + "file '"
        + this.name
        + "', mode '"
        + this.mode
        + "'>");
};

Sk.builtin.file.prototype.tp$iter = function()
{
    var allLines = this.lineList;

    var ret =
    {
        tp$iter: function() { return ret; },
        $obj: this,
        $index: 0,
        $lines: allLines,
        tp$iternext: function()
        {
            if (ret.$index >= ret.$lines.length) return undefined;
            return new Sk.builtin.str(ret.$lines[ret.$index++]);
        }
    };
    return ret;
};


Sk.builtin.file.prototype['close'] = new Sk.builtin.func(function(self)
{
    self.closed = true;
});


Sk.builtin.file.prototype['flush'] = new Sk.builtin.func(function(self) {});
Sk.builtin.file.prototype['fileno'] = new Sk.builtin.func(function(self) { return 10; }); // > 0, not 1/2/3
Sk.builtin.file.prototype['isatty'] = new Sk.builtin.func(function(self) { return false; });


Sk.builtin.file.prototype['read'] = new Sk.builtin.func(function(self, size)
{
    if (self.closed) throw new Sk.builtin.ValueError("I/O operation on closed file");
    var len = self.data$.length;
    if (size === undefined) size = len;
    var ret = new Sk.builtin.str(self.data$.substr(self.pos$, size));
    self.pos$ += size;
    if (self.pos$ >= len) self.pos$ = len;
    return ret;
});

Sk.builtin.file.prototype['readline'] = new Sk.builtin.func(function(self, size)
{
	var line = "";
	if (self.currentLine < self.lineList.length) {
		line = self.lineList[self.currentLine];
    	self.currentLine++;
	}
	return new Sk.builtin.str(line);
});

Sk.builtin.file.prototype['readlines'] = new Sk.builtin.func(function(self, sizehint)
{
    var arr = [];
    for(var i = self.currentLine; i < self.lineList.length; i++) {
		arr.push(new Sk.builtin.str(self.lineList[i]));
    }
	return new Sk.builtin.list(arr);
});

Sk.builtin.file.prototype['seek'] = new Sk.builtin.func(function(self, offset, whence)
{
    if (whence === undefined ) whence = 1;
    if (whence == 1) {
		self.pos$ = offset;
	} else {
		self.pos$ = self.data$ + offset;
	}
});

Sk.builtin.file.prototype['tell'] =  new Sk.builtin.func(function(self)
{
    return self.pos$;
});


Sk.builtin.file.prototype['truncate'] = new Sk.builtin.func(function(self, size)
{
    goog.asserts.fail();
});

Sk.builtin.file.prototype['write'] = new Sk.builtin.func(function(self, str)
{
    goog.asserts.fail();
});


goog.exportSymbol("Sk.builtin.file", Sk.builtin.file);
Sk.ffi = Sk.ffi || {};

/**
 * maps from Javascript Object/Array/string to Python dict/list/str.
 *
 * only works on basic objects that are being used as storage, doesn't handle
 * functions, etc.
 */
Sk.ffi.remapToPy = function(obj)
{
    if (obj === null)
    {
        return null;
    }
    else if (Object.prototype.toString.call(obj) === "[object Array]")
    {
        var arr = [];
        for (var i = 0; i < obj.length; ++i)
            arr.push(Sk.ffi.remapToPy(obj[i]));
        return new Sk.builtin.list(arr);
    }
    else if (typeof obj === "object")
    {
        var kvs = [];
        for (var k in obj)
        {
            kvs.push(Sk.ffi.remapToPy(k));
            kvs.push(Sk.ffi.remapToPy(obj[k]));
        }
        return new Sk.builtin.dict(kvs);
    }
    else if (typeof obj === "string")
        return new Sk.builtin.str(obj);
    else if (typeof obj === "number" || typeof obj === "boolean")
        return obj;
    goog.asserts.fail("unhandled remap type");
};
goog.exportSymbol("Sk.ffi.remapToPy", Sk.ffi.remapToPy);

/**
 * maps from Python dict/list/str to Javascript Object/Array/string.
 */
Sk.ffi.remapToJs = function(obj)
{
    if (obj instanceof Sk.builtin.dict)
    {
        var ret = {};
        for (var iter = obj.tp$iter(), k = iter.tp$iternext();
                k !== undefined;
                k = iter.tp$iternext())
        {
            var v = obj.mp$subscript(k);
            if (v === undefined)
                v = null;
            var kAsJs = Sk.ffi.remapToJs(k);
            // todo; assert that this is a reasonble lhs?
            ret[kAsJs] = Sk.ffi.remapToJs(v);
        }
        return ret;
    }
    else if (obj instanceof Sk.builtin.list)
    {
        var ret = [];
        for (var i = 0; i < obj.v.length; ++i)
            ret.push(Sk.ffi.remapToJs(obj.v[i]));
        return ret;
    }
    else if (obj === null || typeof obj === "number" || typeof obj === "boolean")
        return obj;
    else
        return obj.v;
};
goog.exportSymbol("Sk.ffi.remapToJs", Sk.ffi.remapToJs);

/*
 * Added by allevato
 *
 * Takes a kwargs array (which alternates [name, value, name, value...])
 * and returns a JS object with the appropriate keys/values.
 */
Sk.ffi.kwargsToJs = function(kwargs)
{
    var dict = {};

    for (var index = 0; index < kwargs.length; index += 2)
    {
        var pykey = kwargs[index];
        var pyval = kwargs[index + 1];

        dict[Sk.ffi.remapToJs(pykey)] = Sk.ffi.remapToJs(pyval);
    }

    return dict;
};
goog.exportSymbol("Sk.ffi.kwargsToJs", Sk.ffi.kwargsToJs);

Sk.ffi.callback = function(fn)
{
    if (fn === undefined) return fn;
    return function() {
        return Sk.misceval.apply(fn, undefined, undefined, undefined, Array.prototype.slice.call(arguments, 0));
    };
};
goog.exportSymbol("Sk.ffi.callback", Sk.ffi.callback);

Sk.ffi.stdwrap = function(type, towrap)
{
    var inst = new type();
    inst['v'] = towrap;
    return inst;
};
goog.exportSymbol("Sk.ffi.stdwrap", Sk.ffi.stdwrap);

/**
 * for when the return type might be one of a variety of basic types.
 * number|string, etc.
 */
Sk.ffi.basicwrap = function(obj)
{
    if (typeof obj === "number" || typeof obj === "boolean")
        return obj;
    if (typeof obj === "string")
        return new Sk.builtin.str(obj);
    goog.asserts.fail("unexpected type for basicwrap");
};
goog.exportSymbol("Sk.ffi.basicwrap", Sk.ffi.basicwrap);

Sk.ffi.unwrapo = function(obj)
{
    if (obj === undefined) return undefined;
    return obj['v'];
};
goog.exportSymbol("Sk.ffi.unwrapo", Sk.ffi.unwrapo);

Sk.ffi.unwrapn = function(obj)
{
    if (obj === null) return null;
    return obj['v'];
};
goog.exportSymbol("Sk.ffi.unwrapn", Sk.ffi.unwrapn);

/**
 * Converts a variable table (either $gbl or $loc from a stack frame) into
 * a Python dictionary. This function is used to implement the globals() and
 * locals() built-ins.
 *
 * @param vars the variable table
 * @return the Python dictionary with the variables
 */
Sk.ffi.varTableToDict = function(vars)
{
  var kvs = [];

  for (var name in vars)
  {
    if (vars.hasOwnProperty(name))
    {
      kvs.push(Sk.ffi.remapToPy(name));

      var value = vars[name];
      if (value.__proto__.ob$type)
      {
        kvs.push(value);
      }
      else
      {
        kvs.push(Sk.ffi.remapToPy(value));
      }
    }
  }

  return new Sk.builtin.dict(kvs);
};
goog.exportSymbol("Sk.ffi.varTableToDict", Sk.ffi.varTableToDict);
/*
 * This is a port of tokenize.py by Ka-Ping Yee.
 *
 * each call to readline should return one line of input as a string, or
 * undefined if it's finished.
 *
 * callback is called for each token with 5 args:
 * 1. the token type
 * 2. the token string
 * 3. [ start_row, start_col ]
 * 4. [ end_row, end_col ]
 * 5. logical line where the token was found, including continuation lines
 *
 * callback can return true to abort.
 *
 */

/**
 * @constructor
 */
Sk.Tokenizer = function (filename, interactive, callback)
{
    this.filename = filename;
    this.callback = callback;
    this.lnum = 0;
    this.parenlev = 0;
    this.continued = false;
    this.namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    this.numchars = '0123456789';
    this.contstr = '';
    this.needcont = false;
    this.contline = undefined;
    this.indents = [0];
    this.endprog = /.*/;
    this.strstart = [-1,-1];
    this.interactive = interactive;
    this.doneFunc = function()
    {
        for (var i = 1; i < this.indents.length; ++i) // pop remaining indent levels
        {
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';
        }
        if (this.callback(Sk.Tokenizer.Tokens.T_ENDMARKER, '', [this.lnum, 0], [this.lnum, 0], '')) return 'done';

        return 'failed';
    };

};

/**
 * @enum {number}
 */
Sk.Tokenizer.Tokens = {
    T_ENDMARKER: 0,
    T_NAME: 1,
    T_NUMBER: 2,
    T_STRING: 3,
    T_NEWLINE: 4,
    T_INDENT: 5,
    T_DEDENT: 6,
    T_LPAR: 7,
    T_RPAR: 8,
    T_LSQB: 9,
    T_RSQB: 10,
    T_COLON: 11,
    T_COMMA: 12,
    T_SEMI: 13,
    T_PLUS: 14,
    T_MINUS: 15,
    T_STAR: 16,
    T_SLASH: 17,
    T_VBAR: 18,
    T_AMPER: 19,
    T_LESS: 20,
    T_GREATER: 21,
    T_EQUAL: 22,
    T_DOT: 23,
    T_PERCENT: 24,
    T_BACKQUOTE: 25,
    T_LBRACE: 26,
    T_RBRACE: 27,
    T_EQEQUAL: 28,
    T_NOTEQUAL: 29,
    T_LESSEQUAL: 30,
    T_GREATEREQUAL: 31,
    T_TILDE: 32,
    T_CIRCUMFLEX: 33,
    T_LEFTSHIFT: 34,
    T_RIGHTSHIFT: 35,
    T_DOUBLESTAR: 36,
    T_PLUSEQUAL: 37,
    T_MINEQUAL: 38,
    T_STAREQUAL: 39,
    T_SLASHEQUAL: 40,
    T_PERCENTEQUAL: 41,
    T_AMPEREQUAL: 42,
    T_VBAREQUAL: 43,
    T_CIRCUMFLEXEQUAL: 44,
    T_LEFTSHIFTEQUAL: 45,
    T_RIGHTSHIFTEQUAL: 46,
    T_DOUBLESTAREQUAL: 47,
    T_DOUBLESLASH: 48,
    T_DOUBLESLASHEQUAL: 49,
    T_AT: 50,
    T_OP: 51,
    T_COMMENT: 52,
    T_NL: 53,
    T_RARROW: 54,
    T_ERRORTOKEN: 55,
    T_N_TOKENS: 56,
    T_NT_OFFSET: 256
};

/** @param {...*} x */
function group(x)
{
    var args = Array.prototype.slice.call(arguments);
    return '(' + args.join('|') + ')'; 
}

/** @param {...*} x */
function any(x) { return group.apply(null, arguments) + "*"; }

/** @param {...*} x */
function maybe(x) { return group.apply(null, arguments) + "?"; }

/* we have to use string and ctor to be able to build patterns up. + on /.../
 * does something strange. */
var Whitespace = "[ \\f\\t]*";
var Comment_ = "#[^\\r\\n]*";
var Ident = "[a-zA-Z_]\\w*";

var Binnumber = '0[bB][01]*';
var Hexnumber = '0[xX][\\da-fA-F]*[lL]?';
var Octnumber = '0[oO]?[0-7]*[lL]?';
var Decnumber = '[1-9]\\d*[lL]?';
var Intnumber = group(Binnumber, Hexnumber, Octnumber, Decnumber);

var Exponent = "[eE][-+]?\\d+";
var Pointfloat = group("\\d+\\.\\d*", "\\.\\d+") + maybe(Exponent);
var Expfloat = '\\d+' + Exponent;
var Floatnumber = group(Pointfloat, Expfloat);
var Imagnumber = group("\\d+[jJ]", Floatnumber + "[jJ]");
var Number_ = group(Imagnumber, Floatnumber, Intnumber);

// tail end of ' string
var Single = "^[^'\\\\]*(?:\\\\.[^'\\\\]*)*'";
// tail end of " string
var Double_= '^[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
// tail end of ''' string
var Single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
// tail end of """ string
var Double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
var Triple = group("[ubUB]?[rR]?'''", '[ubUB]?[rR]?"""');
var String_ = group("[uU]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
        '[uU]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

// Because of leftmost-then-longest match semantics, be sure to put the
// longest operators first (e.g., if = came before ==, == would get
// recognized as two instances of =).
var Operator = group("\\*\\*=?", ">>=?", "<<=?", "<>", "!=",
                 "//=?", "->",
                 "[+\\-*/%&|^=<>]=?",
                 "~");

var Bracket = '[\\][(){}]';
var Special = group('\\r?\\n', '[:;.,`@]');
var Funny  = group(Operator, Bracket, Special);

var ContStr = group("[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*" +
                group("'", '\\\\\\r?\\n'),
                '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
                group('"', '\\\\\\r?\\n'));
var PseudoExtras = group('\\\\\\r?\\n', Comment_, Triple);
var PseudoToken = group(PseudoExtras, Number_, Funny, ContStr, Ident);

var pseudoprog;
var single3prog;
var double3prog;
var endprogs = {};

var triple_quoted = {
"'''": true, '"""': true,
"r'''": true, 'r"""': true, "R'''": true, 'R"""': true,
"u'''": true, 'u"""': true, "U'''": true, 'U"""': true,
"b'''": true, 'b"""': true, "B'''": true, 'B"""': true,
"ur'''": true, 'ur"""': true, "Ur'''": true, 'Ur"""': true,
"uR'''": true, 'uR"""': true, "UR'''": true, 'UR"""': true,
"br'''": true, 'br"""': true, "Br'''": true, 'Br"""': true,
"bR'''": true, 'bR"""': true, "BR'''": true, 'BR"""': true
};

var single_quoted = {
"'": true, '"': true,
"r'": true, 'r"': true, "R'": true, 'R"': true,
"u'": true, 'u"': true, "U'": true, 'U"': true,
"b'": true, 'b"': true, "B'": true, 'B"': true,
"ur'": true, 'ur"': true, "Ur'": true, 'Ur"': true,
"uR'": true, 'uR"': true, "UR'": true, 'UR"': true,
"br'": true, 'br"': true, "Br'": true, 'Br"': true,
"bR'": true, 'bR"': true, "BR'": true, 'BR"': true
};

// hack to make closure keep those objects. not sure what a better way is.
(function() {
 for (var k in triple_quoted) {}
 for (var k in single_quoted) {}
 }());


var tabsize = 8;

function contains(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i] === obj)
        {
            return true;
        }
    }
    return false;
}

function rstrip(input, what)
{
    for (var i = input.length; i > 0; --i)
    {
        if (what.indexOf(input.charAt(i - 1)) === -1) break;
    }
    return input.substring(0, i);
}

Sk.Tokenizer.prototype.generateTokens = function(line)
{
    var endmatch, pos, column, end, max;


    // bnm - Move these definitions in this function otherwise test state is preserved between
    // calls on single3prog and double3prog causing weird errors with having multiple instances
    // of triple quoted strings in the same program.

    var pseudoprog = new RegExp(PseudoToken);
    var single3prog = new RegExp(Single3, "g");
    var double3prog = new RegExp(Double3, "g");

    var endprogs = {     "'": new RegExp(Single, "g"), '"': new RegExp(Double_, "g"),
    "'''": single3prog, '"""': double3prog,
    "r'''": single3prog, 'r"""': double3prog,
    "u'''": single3prog, 'u"""': double3prog,
    "b'''": single3prog, 'b"""': double3prog,
    "ur'''": single3prog, 'ur"""': double3prog,
    "br'''": single3prog, 'br"""': double3prog,
    "R'''": single3prog, 'R"""': double3prog,
    "U'''": single3prog, 'U"""': double3prog,
    "B'''": single3prog, 'B"""': double3prog,
    "uR'''": single3prog, 'uR"""': double3prog,
    "Ur'''": single3prog, 'Ur"""': double3prog,
    "UR'''": single3prog, 'UR"""': double3prog,
    "bR'''": single3prog, 'bR"""': double3prog,
    "Br'''": single3prog, 'Br"""': double3prog,
    "BR'''": single3prog, 'BR"""': double3prog,
    'r': null, 'R': null,
    'u': null, 'U': null,
    'b': null, 'B': null
    };



    if (!line) line = '';
    //print("LINE:'"+line+"'");

    this.lnum += 1;
    pos = 0;
    max = line.length;

    if (this.contstr.length > 0)
    {
        if (!line)
        {
            throw new Sk.builtin.TokenError("EOF in multi-line string", this.filename, this.strstart[0], this.strstart[1], this.contline);
        }
        endmatch = this.endprog.test(line);
        if (endmatch)
        {
            pos = end = this.endprog.lastIndex;
            if (this.callback(Sk.Tokenizer.Tokens.T_STRING, this.contstr + line.substring(0,end),
                        this.strstart, [this.lnum, end], this.contline + line))
                return 'done';
            this.contstr = '';
            this.needcont = false;
            this.contline = undefined;
        }
        else if (this.needcont && line.substring(line.length - 2) !== "\\\n" && line.substring(line.length - 3) !== "\\\r\n")
        {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, this.contstr + line,
                        this.strstart, [this.lnum, line.length], this.contline))
                return 'done';
            this.contstr = '';
            this.contline = undefined;
            return false;
        }
        else
        {
            this.contstr += line;
            this.contline = this.contline + line;
            return false;
        }
    }
    else if (this.parenlev === 0 && !this.continued)
    {
        if (!line) return this.doneFunc();
        column = 0;
        while (pos < max)
        {
            if (line.charAt(pos) === ' ') column += 1;
            else if (line.charAt(pos) === '\t') column = (column/tabsize + 1)*tabsize;
            else if (line.charAt(pos) === '\f') column = 0;
            else break;
            pos = pos + 1;
        }
        if (pos === max) return this.doneFunc();

        if ("#\r\n".indexOf(line.charAt(pos)) !== -1) // skip comments or blank lines
        {
            if (line.charAt(pos) === '#')
            {
                var comment_token = rstrip(line.substring(pos), '\r\n');
                var nl_pos = pos + comment_token.length;
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, comment_token,
                            [this.lnum, pos], [this.lnum, pos + comment_token.length], line))
                    return 'done';
                //print("HERE:1");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(nl_pos),
                            [this.lnum, nl_pos], [this.lnum, line.length], line))
                    return 'done';
                return false;
            }
            else
            {
                //print("HERE:2");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, line.substring(pos),
                            [this.lnum, pos], [this.lnum, line.length], line))
                    return 'done';
                if (!this.interactive) return false;
            }
        }

        if (column > this.indents[this.indents.length - 1]) // count indents or dedents
        {
            this.indents.push(column);
            if (this.callback(Sk.Tokenizer.Tokens.T_INDENT, line.substring(0, pos), [this.lnum, 0], [this.lnum, pos], line))
                return 'done';
        }
        while (column < this.indents[this.indents.length - 1])
        {
            if (!contains(this.indents, column))
            {
                throw new Sk.builtin.IndentationError("unindent does not match any outer indentation level",
                        this.filename, this.lnum, pos, line);
            }
            this.indents.splice(this.indents.length - 1, 1);
            //print("dedent here");
            if (this.callback(Sk.Tokenizer.Tokens.T_DEDENT, '', [this.lnum, pos], [this.lnum, pos], line))
                return 'done';
        }
    }
    else // continued statement
    {
        if (!line)
        {
            throw new Sk.builtin.TokenError("EOF in multi-line statement", this.filename, this.lnum, 0, line);
        }
        this.continued = false;
    }

    while (pos < max)
    {
        //print("pos:"+pos+":"+max);
        // js regexes don't return any info about matches, other than the
        // content. we'd like to put a \w+ before pseudomatch, but then we
        // can't get any data
        var capos = line.charAt(pos);
        while (capos === ' ' || capos === '\f' || capos === '\t')
        {
            pos += 1;
            capos = line.charAt(pos);
        }
        var pseudomatch = pseudoprog.exec(line.substring(pos));
        if (pseudomatch)
        {
            var start = pos;
            end = start + pseudomatch[1].length;
            var spos = [this.lnum, start];
            var epos = [this.lnum, end];
            pos = end;
            var token = line.substring(start, end);
            var initial = line.charAt(start);
            //Sk.debugout("token:",token, "initial:",initial, start, end);
            if (this.numchars.indexOf(initial) !== -1 || (initial === '.' && token !== '.'))
            {
                if (this.callback(Sk.Tokenizer.Tokens.T_NUMBER, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\r' || initial === '\n')
            {
                var newl = Sk.Tokenizer.Tokens.T_NEWLINE;
                //print("HERE:3");
                if (this.parenlev > 0) newl = Sk.Tokenizer.Tokens.T_NL;
                if (this.callback(newl, token, spos, epos, line)) return 'done';
            }
            else if (initial === '#')
            {
                if (this.callback(Sk.Tokenizer.Tokens.T_COMMENT, token, spos, epos, line)) return 'done';
            }
            else if (triple_quoted.hasOwnProperty(token))
            {
                this.endprog = endprogs[token];
                endmatch = this.endprog.test(line.substring(pos));
                if (endmatch)
                {
                    pos = this.endprog.lastIndex + pos;
                    token = line.substring(start, pos);
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, [this.lnum, pos], line)) return 'done';
                }
                else
                {
                    this.strstart = [this.lnum, start];
                    this.contstr = line.substring(start);
                    this.contline = line;
                    return false;
                }
            }
            else if (single_quoted.hasOwnProperty(initial) ||
                    single_quoted.hasOwnProperty(token.substring(0, 2)) ||
                    single_quoted.hasOwnProperty(token.substring(0, 3)))
            {
                if (token[token.length - 1] === '\n')
                {
                    this.strstart = [this.lnum, start];
                    this.endprog = endprogs[initial] || endprogs[token[1]] || endprogs[token[2]];
                    this.contstr = line.substring(start);
                    this.needcont = true;
                    this.contline = line;
                    //print("i, t1, t2", initial, token[1], token[2]);
                    //print("ep, cs", this.endprog, this.contstr);
                    return false;
                }
                else
                {
                    if (this.callback(Sk.Tokenizer.Tokens.T_STRING, token, spos, epos, line)) return 'done';
                }
            }
            else if (this.namechars.indexOf(initial) !== -1)
            {
                if (this.callback(Sk.Tokenizer.Tokens.T_NAME, token, spos, epos, line)) return 'done';
            }
            else if (initial === '\\')
            {
                //print("HERE:4");
                if (this.callback(Sk.Tokenizer.Tokens.T_NL, token, spos, [this.lnum, pos], line)) return 'done';
                this.continued = true;
            }
            else
            {
                if ('([{'.indexOf(initial) !== -1) this.parenlev += 1;
                else if (')]}'.indexOf(initial) !== -1) this.parenlev -= 1;
                if (this.callback(Sk.Tokenizer.Tokens.T_OP, token, spos, epos, line)) return 'done';
            }
        }
        else
        {
            if (this.callback(Sk.Tokenizer.Tokens.T_ERRORTOKEN, line.charAt(pos),
                        [this.lnum, pos], [this.lnum, pos+1], line))
                return 'done';
            pos += 1;
        }
    }

    return false;
};

Sk.Tokenizer.tokenNames = {
    0: 'T_ENDMARKER', 1: 'T_NAME', 2: 'T_NUMBER', 3: 'T_STRING', 4: 'T_NEWLINE',
    5: 'T_INDENT', 6: 'T_DEDENT', 7: 'T_LPAR', 8: 'T_RPAR', 9: 'T_LSQB',
    10: 'T_RSQB', 11: 'T_COLON', 12: 'T_COMMA', 13: 'T_SEMI', 14: 'T_PLUS',
    15: 'T_MINUS', 16: 'T_STAR', 17: 'T_SLASH', 18: 'T_VBAR', 19: 'T_AMPER',
    20: 'T_LESS', 21: 'T_GREATER', 22: 'T_EQUAL', 23: 'T_DOT', 24: 'T_PERCENT',
    25: 'T_BACKQUOTE', 26: 'T_LBRACE', 27: 'T_RBRACE', 28: 'T_EQEQUAL', 29: 'T_NOTEQUAL',
    30: 'T_LESSEQUAL', 31: 'T_GREATEREQUAL', 32: 'T_TILDE', 33: 'T_CIRCUMFLEX', 34: 'T_LEFTSHIFT',
    35: 'T_RIGHTSHIFT', 36: 'T_DOUBLESTAR', 37: 'T_PLUSEQUAL', 38: 'T_MINEQUAL', 39: 'T_STAREQUAL',
    40: 'T_SLASHEQUAL', 41: 'T_PERCENTEQUAL', 42: 'T_AMPEREQUAL', 43: 'T_VBAREQUAL', 44: 'T_CIRCUMFLEXEQUAL',
    45: 'T_LEFTSHIFTEQUAL', 46: 'T_RIGHTSHIFTEQUAL', 47: 'T_DOUBLESTAREQUAL', 48: 'T_DOUBLESLASH', 49: 'T_DOUBLESLASHEQUAL',
    50: 'T_AT', 51: 'T_OP', 52: 'T_COMMENT', 53: 'T_NL', 54: 'T_RARROW',
    55: 'T_ERRORTOKEN', 56: 'T_N_TOKENS',
    256: 'T_NT_OFFSET'
};

goog.exportSymbol("Sk.Tokenizer", Sk.Tokenizer);
goog.exportSymbol("Sk.Tokenizer.prototype.generateTokens", Sk.Tokenizer.prototype.generateTokens);
goog.exportSymbol("Sk.Tokenizer.tokenNames", Sk.Tokenizer.tokenNames);
// generated by pgen/main.py
Sk.OpMap = {
"(": Sk.Tokenizer.Tokens.T_LPAR,
")": Sk.Tokenizer.Tokens.T_RPAR,
"[": Sk.Tokenizer.Tokens.T_LSQB,
"]": Sk.Tokenizer.Tokens.T_RSQB,
":": Sk.Tokenizer.Tokens.T_COLON,
",": Sk.Tokenizer.Tokens.T_COMMA,
";": Sk.Tokenizer.Tokens.T_SEMI,
"+": Sk.Tokenizer.Tokens.T_PLUS,
"-": Sk.Tokenizer.Tokens.T_MINUS,
"*": Sk.Tokenizer.Tokens.T_STAR,
"/": Sk.Tokenizer.Tokens.T_SLASH,
"|": Sk.Tokenizer.Tokens.T_VBAR,
"&": Sk.Tokenizer.Tokens.T_AMPER,
"<": Sk.Tokenizer.Tokens.T_LESS,
">": Sk.Tokenizer.Tokens.T_GREATER,
"=": Sk.Tokenizer.Tokens.T_EQUAL,
".": Sk.Tokenizer.Tokens.T_DOT,
"%": Sk.Tokenizer.Tokens.T_PERCENT,
"`": Sk.Tokenizer.Tokens.T_BACKQUOTE,
"{": Sk.Tokenizer.Tokens.T_LBRACE,
"}": Sk.Tokenizer.Tokens.T_RBRACE,
"@": Sk.Tokenizer.Tokens.T_AT,
"==": Sk.Tokenizer.Tokens.T_EQEQUAL,
"!=": Sk.Tokenizer.Tokens.T_NOTEQUAL,
"<>": Sk.Tokenizer.Tokens.T_NOTEQUAL,
"<=": Sk.Tokenizer.Tokens.T_LESSEQUAL,
">=": Sk.Tokenizer.Tokens.T_GREATEREQUAL,
"~": Sk.Tokenizer.Tokens.T_TILDE,
"^": Sk.Tokenizer.Tokens.T_CIRCUMFLEX,
"<<": Sk.Tokenizer.Tokens.T_LEFTSHIFT,
">>": Sk.Tokenizer.Tokens.T_RIGHTSHIFT,
"**": Sk.Tokenizer.Tokens.T_DOUBLESTAR,
"+=": Sk.Tokenizer.Tokens.T_PLUSEQUAL,
"-=": Sk.Tokenizer.Tokens.T_MINEQUAL,
"*=": Sk.Tokenizer.Tokens.T_STAREQUAL,
"/=": Sk.Tokenizer.Tokens.T_SLASHEQUAL,
"%=": Sk.Tokenizer.Tokens.T_PERCENTEQUAL,
"&=": Sk.Tokenizer.Tokens.T_AMPEREQUAL,
"|=": Sk.Tokenizer.Tokens.T_VBAREQUAL,
"^=": Sk.Tokenizer.Tokens.T_CIRCUMFLEXEQUAL,
"<<=": Sk.Tokenizer.Tokens.T_LEFTSHIFTEQUAL,
">>=": Sk.Tokenizer.Tokens.T_RIGHTSHIFTEQUAL,
"**=": Sk.Tokenizer.Tokens.T_DOUBLESTAREQUAL,
"//": Sk.Tokenizer.Tokens.T_DOUBLESLASH,
"//=": Sk.Tokenizer.Tokens.T_DOUBLESLASHEQUAL,
"->": Sk.Tokenizer.Tokens.T_RARROW
};
Sk.ParseTables = {
sym:
{and_expr: 257,
 and_test: 258,
 arglist: 259,
 argument: 260,
 arith_expr: 261,
 assert_stmt: 262,
 atom: 263,
 augassign: 264,
 break_stmt: 265,
 classdef: 266,
 comp_op: 267,
 comparison: 268,
 compound_stmt: 269,
 continue_stmt: 270,
 decorated: 271,
 decorator: 272,
 decorators: 273,
 del_stmt: 274,
 dictmaker: 275,
 dotted_as_name: 276,
 dotted_as_names: 277,
 dotted_name: 278,
 encoding_decl: 279,
 eval_input: 280,
 except_clause: 281,
 exec_stmt: 282,
 expr: 283,
 expr_stmt: 284,
 exprlist: 285,
 factor: 286,
 file_input: 287,
 flow_stmt: 288,
 for_stmt: 289,
 fpdef: 290,
 fplist: 291,
 funcdef: 292,
 gen_for: 293,
 gen_if: 294,
 gen_iter: 295,
 global_stmt: 296,
 if_stmt: 297,
 import_as_name: 298,
 import_as_names: 299,
 import_from: 300,
 import_name: 301,
 import_stmt: 302,
 lambdef: 303,
 list_for: 304,
 list_if: 305,
 list_iter: 306,
 listmaker: 307,
 not_test: 308,
 old_lambdef: 309,
 old_test: 310,
 or_test: 311,
 parameters: 312,
 pass_stmt: 313,
 power: 314,
 print_stmt: 315,
 raise_stmt: 316,
 return_stmt: 317,
 shift_expr: 318,
 simple_stmt: 319,
 single_input: 256,
 sliceop: 320,
 small_stmt: 321,
 stmt: 322,
 subscript: 323,
 subscriptlist: 324,
 suite: 325,
 term: 326,
 test: 327,
 testlist: 328,
 testlist1: 329,
 testlist_gexp: 330,
 testlist_safe: 331,
 trailer: 332,
 try_stmt: 333,
 varargslist: 334,
 while_stmt: 335,
 with_stmt: 336,
 with_var: 337,
 xor_expr: 338,
 yield_expr: 339,
 yield_stmt: 340},
number2symbol:
{256: 'single_input',
 257: 'and_expr',
 258: 'and_test',
 259: 'arglist',
 260: 'argument',
 261: 'arith_expr',
 262: 'assert_stmt',
 263: 'atom',
 264: 'augassign',
 265: 'break_stmt',
 266: 'classdef',
 267: 'comp_op',
 268: 'comparison',
 269: 'compound_stmt',
 270: 'continue_stmt',
 271: 'decorated',
 272: 'decorator',
 273: 'decorators',
 274: 'del_stmt',
 275: 'dictmaker',
 276: 'dotted_as_name',
 277: 'dotted_as_names',
 278: 'dotted_name',
 279: 'encoding_decl',
 280: 'eval_input',
 281: 'except_clause',
 282: 'exec_stmt',
 283: 'expr',
 284: 'expr_stmt',
 285: 'exprlist',
 286: 'factor',
 287: 'file_input',
 288: 'flow_stmt',
 289: 'for_stmt',
 290: 'fpdef',
 291: 'fplist',
 292: 'funcdef',
 293: 'gen_for',
 294: 'gen_if',
 295: 'gen_iter',
 296: 'global_stmt',
 297: 'if_stmt',
 298: 'import_as_name',
 299: 'import_as_names',
 300: 'import_from',
 301: 'import_name',
 302: 'import_stmt',
 303: 'lambdef',
 304: 'list_for',
 305: 'list_if',
 306: 'list_iter',
 307: 'listmaker',
 308: 'not_test',
 309: 'old_lambdef',
 310: 'old_test',
 311: 'or_test',
 312: 'parameters',
 313: 'pass_stmt',
 314: 'power',
 315: 'print_stmt',
 316: 'raise_stmt',
 317: 'return_stmt',
 318: 'shift_expr',
 319: 'simple_stmt',
 320: 'sliceop',
 321: 'small_stmt',
 322: 'stmt',
 323: 'subscript',
 324: 'subscriptlist',
 325: 'suite',
 326: 'term',
 327: 'test',
 328: 'testlist',
 329: 'testlist1',
 330: 'testlist_gexp',
 331: 'testlist_safe',
 332: 'trailer',
 333: 'try_stmt',
 334: 'varargslist',
 335: 'while_stmt',
 336: 'with_stmt',
 337: 'with_var',
 338: 'xor_expr',
 339: 'yield_expr',
 340: 'yield_stmt'},
dfas:
{256: [[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1}],
 257: [[[[37, 1]], [[38, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 258: [[[[39, 1]], [[40, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1}],
 259: [[[[41, 1], [42, 2], [43, 3]],
        [[44, 4]],
        [[45, 5], [0, 2]],
        [[44, 6]],
        [[45, 7], [0, 4]],
        [[41, 1], [42, 2], [43, 3], [0, 5]],
        [[0, 6]],
        [[42, 4], [43, 3]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1,
        41: 1,
        43: 1}],
 260: [[[[44, 1]], [[46, 2], [47, 3], [0, 1]], [[0, 2]], [[44, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 261: [[[[48, 1]], [[24, 0], [35, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 262: [[[[19, 1]], [[44, 2]], [[45, 3], [0, 2]], [[44, 4]], [[0, 4]]],
       {19: 1}],
 263: [[[[17, 1], [8, 2], [9, 5], [28, 4], [11, 3], [13, 6], [20, 2]],
        [[17, 1], [0, 1]],
        [[0, 2]],
        [[49, 7], [50, 2]],
        [[51, 2], [52, 8], [53, 8]],
        [[54, 9], [55, 2]],
        [[56, 10]],
        [[50, 2]],
        [[51, 2]],
        [[55, 2]],
        [[13, 2]]],
       {8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 28: 1}],
 264: [[[[57, 1],
         [58, 1],
         [59, 1],
         [60, 1],
         [61, 1],
         [62, 1],
         [63, 1],
         [64, 1],
         [65, 1],
         [66, 1],
         [67, 1],
         [68, 1]],
        [[0, 1]]],
       {57: 1,
        58: 1,
        59: 1,
        60: 1,
        61: 1,
        62: 1,
        63: 1,
        64: 1,
        65: 1,
        66: 1,
        67: 1,
        68: 1}],
 265: [[[[31, 1]], [[0, 1]]], {31: 1}],
 266: [[[[10, 1]],
        [[20, 2]],
        [[69, 3], [28, 4]],
        [[70, 5]],
        [[51, 6], [71, 7]],
        [[0, 5]],
        [[69, 3]],
        [[51, 6]]],
       {10: 1}],
 267: [[[[72, 1],
         [73, 1],
         [7, 2],
         [74, 1],
         [72, 1],
         [75, 1],
         [76, 1],
         [77, 3],
         [78, 1],
         [79, 1]],
        [[0, 1]],
        [[75, 1]],
        [[7, 1], [0, 3]]],
       {7: 1, 72: 1, 73: 1, 74: 1, 75: 1, 76: 1, 77: 1, 78: 1, 79: 1}],
 268: [[[[80, 1]], [[81, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 269: [[[[82, 1],
         [83, 1],
         [84, 1],
         [85, 1],
         [86, 1],
         [87, 1],
         [88, 1],
         [89, 1]],
        [[0, 1]]],
       {4: 1, 10: 1, 14: 1, 16: 1, 27: 1, 30: 1, 33: 1, 34: 1}],
 270: [[[[32, 1]], [[0, 1]]], {32: 1}],
 271: [[[[90, 1]], [[88, 2], [85, 2]], [[0, 2]]], {33: 1}],
 272: [[[[33, 1]],
        [[91, 2]],
        [[28, 4], [2, 3]],
        [[0, 3]],
        [[51, 5], [92, 6]],
        [[2, 3]],
        [[51, 5]]],
       {33: 1}],
 273: [[[[93, 1]], [[93, 1], [0, 1]]], {33: 1}],
 274: [[[[21, 1]], [[94, 2]], [[0, 2]]], {21: 1}],
 275: [[[[44, 1]],
        [[69, 2]],
        [[44, 3]],
        [[45, 4], [0, 3]],
        [[44, 1], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 276: [[[[91, 1]], [[95, 2], [0, 1]], [[20, 3]], [[0, 3]]], {20: 1}],
 277: [[[[96, 1]], [[45, 0], [0, 1]]], {20: 1}],
 278: [[[[20, 1]], [[97, 0], [0, 1]]], {20: 1}],
 279: [[[[20, 1]], [[0, 1]]], {20: 1}],
 280: [[[[71, 1]], [[2, 1], [98, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 281: [[[[99, 1]],
        [[44, 2], [0, 1]],
        [[95, 3], [45, 3], [0, 2]],
        [[44, 4]],
        [[0, 4]]],
       {99: 1}],
 282: [[[[15, 1]],
        [[80, 2]],
        [[75, 3], [0, 2]],
        [[44, 4]],
        [[45, 5], [0, 4]],
        [[44, 6]],
        [[0, 6]]],
       {15: 1}],
 283: [[[[100, 1]], [[101, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 284: [[[[71, 1]],
        [[102, 2], [47, 3], [0, 1]],
        [[71, 4], [53, 4]],
        [[71, 5], [53, 5]],
        [[0, 4]],
        [[47, 3], [0, 5]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 285: [[[[80, 1]], [[45, 2], [0, 1]], [[80, 1], [0, 2]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 286: [[[[103, 2], [24, 1], [6, 1], [35, 1]], [[104, 2]], [[0, 2]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 287: [[[[2, 0], [98, 1], [105, 0]], [[0, 1]]],
       {2: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1,
        98: 1}],
 288: [[[[106, 1], [107, 1], [108, 1], [109, 1], [110, 1]], [[0, 1]]],
       {5: 1, 18: 1, 25: 1, 31: 1, 32: 1}],
 289: [[[[27, 1]],
        [[94, 2]],
        [[75, 3]],
        [[71, 4]],
        [[69, 5]],
        [[70, 6]],
        [[111, 7], [0, 6]],
        [[69, 8]],
        [[70, 9]],
        [[0, 9]]],
       {27: 1}],
 290: [[[[28, 1], [20, 2]], [[112, 3]], [[0, 2]], [[51, 2]]], {20: 1, 28: 1}],
 291: [[[[113, 1]], [[45, 2], [0, 1]], [[113, 1], [0, 2]]], {20: 1, 28: 1}],
 292: [[[[4, 1]], [[20, 2]], [[114, 3]], [[69, 4]], [[70, 5]], [[0, 5]]],
       {4: 1}],
 293: [[[[27, 1]],
        [[94, 2]],
        [[75, 3]],
        [[115, 4]],
        [[116, 5], [0, 4]],
        [[0, 5]]],
       {27: 1}],
 294: [[[[30, 1]], [[117, 2]], [[116, 3], [0, 2]], [[0, 3]]], {30: 1}],
 295: [[[[46, 1], [118, 1]], [[0, 1]]], {27: 1, 30: 1}],
 296: [[[[26, 1]], [[20, 2]], [[45, 1], [0, 2]]], {26: 1}],
 297: [[[[30, 1]],
        [[44, 2]],
        [[69, 3]],
        [[70, 4]],
        [[111, 5], [119, 1], [0, 4]],
        [[69, 6]],
        [[70, 7]],
        [[0, 7]]],
       {30: 1}],
 298: [[[[20, 1]], [[95, 2], [0, 1]], [[20, 3]], [[0, 3]]], {20: 1}],
 299: [[[[120, 1]], [[45, 2], [0, 1]], [[120, 1], [0, 2]]], {20: 1}],
 300: [[[[29, 1]],
        [[91, 2], [97, 3]],
        [[23, 4]],
        [[91, 2], [23, 4], [97, 3]],
        [[121, 5], [41, 5], [28, 6]],
        [[0, 5]],
        [[121, 7]],
        [[51, 5]]],
       {29: 1}],
 301: [[[[23, 1]], [[122, 2]], [[0, 2]]], {23: 1}],
 302: [[[[123, 1], [124, 1]], [[0, 1]]], {23: 1, 29: 1}],
 303: [[[[36, 1]], [[69, 2], [125, 3]], [[44, 4]], [[69, 2]], [[0, 4]]],
       {36: 1}],
 304: [[[[27, 1]],
        [[94, 2]],
        [[75, 3]],
        [[126, 4]],
        [[127, 5], [0, 4]],
        [[0, 5]]],
       {27: 1}],
 305: [[[[30, 1]], [[117, 2]], [[127, 3], [0, 2]], [[0, 3]]], {30: 1}],
 306: [[[[128, 1], [129, 1]], [[0, 1]]], {27: 1, 30: 1}],
 307: [[[[44, 1]],
        [[128, 2], [45, 3], [0, 1]],
        [[0, 2]],
        [[44, 4], [0, 3]],
        [[45, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 308: [[[[7, 1], [130, 2]], [[39, 2]], [[0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1}],
 309: [[[[36, 1]], [[69, 2], [125, 3]], [[117, 4]], [[69, 2]], [[0, 4]]],
       {36: 1}],
 310: [[[[131, 1], [115, 1]], [[0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 311: [[[[132, 1]], [[133, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1}],
 312: [[[[28, 1]], [[51, 2], [125, 3]], [[0, 2]], [[51, 2]]], {28: 1}],
 313: [[[[22, 1]], [[0, 1]]], {22: 1}],
 314: [[[[134, 1]], [[135, 1], [43, 2], [0, 1]], [[104, 3]], [[0, 3]]],
       {8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 28: 1}],
 315: [[[[12, 1]],
        [[44, 2], [136, 3], [0, 1]],
        [[45, 4], [0, 2]],
        [[44, 5]],
        [[44, 2], [0, 4]],
        [[45, 6], [0, 5]],
        [[44, 7]],
        [[45, 8], [0, 7]],
        [[44, 7], [0, 8]]],
       {12: 1}],
 316: [[[[5, 1]],
        [[44, 2], [0, 1]],
        [[45, 3], [0, 2]],
        [[44, 4]],
        [[45, 5], [0, 4]],
        [[44, 6]],
        [[0, 6]]],
       {5: 1}],
 317: [[[[18, 1]], [[71, 2], [0, 1]], [[0, 2]]], {18: 1}],
 318: [[[[137, 1]], [[136, 0], [138, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 319: [[[[139, 1]], [[2, 2], [140, 3]], [[0, 2]], [[139, 1], [2, 2]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        15: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        31: 1,
        32: 1,
        35: 1,
        36: 1}],
 320: [[[[69, 1]], [[44, 2], [0, 1]], [[0, 2]]], {69: 1}],
 321: [[[[141, 1],
         [142, 1],
         [143, 1],
         [144, 1],
         [145, 1],
         [146, 1],
         [147, 1],
         [148, 1],
         [149, 1]],
        [[0, 1]]],
       {5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        15: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        31: 1,
        32: 1,
        35: 1,
        36: 1}],
 322: [[[[1, 1], [3, 1]], [[0, 1]]],
       {4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        27: 1,
        28: 1,
        29: 1,
        30: 1,
        31: 1,
        32: 1,
        33: 1,
        34: 1,
        35: 1,
        36: 1}],
 323: [[[[44, 1], [69, 2], [97, 3]],
        [[69, 2], [0, 1]],
        [[44, 4], [150, 5], [0, 2]],
        [[97, 6]],
        [[150, 5], [0, 4]],
        [[0, 5]],
        [[97, 5]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1,
        69: 1,
        97: 1}],
 324: [[[[151, 1]], [[45, 2], [0, 1]], [[151, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1,
        69: 1,
        97: 1}],
 325: [[[[1, 1], [2, 2]],
        [[0, 1]],
        [[152, 3]],
        [[105, 4]],
        [[153, 1], [105, 4]]],
       {2: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        12: 1,
        13: 1,
        15: 1,
        17: 1,
        18: 1,
        19: 1,
        20: 1,
        21: 1,
        22: 1,
        23: 1,
        24: 1,
        25: 1,
        26: 1,
        28: 1,
        29: 1,
        31: 1,
        32: 1,
        35: 1,
        36: 1}],
 326: [[[[104, 1]], [[154, 0], [41, 0], [155, 0], [156, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 327: [[[[115, 1], [157, 2]],
        [[30, 3], [0, 1]],
        [[0, 2]],
        [[115, 4]],
        [[111, 5]],
        [[44, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 328: [[[[44, 1]], [[45, 2], [0, 1]], [[44, 1], [0, 2]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 329: [[[[44, 1]], [[45, 0], [0, 1]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 330: [[[[44, 1]],
        [[46, 2], [45, 3], [0, 1]],
        [[0, 2]],
        [[44, 4], [0, 3]],
        [[45, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 331: [[[[117, 1]],
        [[45, 2], [0, 1]],
        [[117, 3]],
        [[45, 4], [0, 3]],
        [[117, 3], [0, 4]]],
       {6: 1,
        7: 1,
        8: 1,
        9: 1,
        11: 1,
        13: 1,
        17: 1,
        20: 1,
        24: 1,
        28: 1,
        35: 1,
        36: 1}],
 332: [[[[28, 1], [97, 2], [11, 3]],
        [[51, 4], [92, 5]],
        [[20, 4]],
        [[158, 6]],
        [[0, 4]],
        [[51, 4]],
        [[50, 4]]],
       {11: 1, 28: 1, 97: 1}],
 333: [[[[14, 1]],
        [[69, 2]],
        [[70, 3]],
        [[159, 4], [160, 5]],
        [[69, 6]],
        [[69, 7]],
        [[70, 8]],
        [[70, 9]],
        [[159, 4], [111, 10], [160, 5], [0, 8]],
        [[0, 9]],
        [[69, 11]],
        [[70, 12]],
        [[160, 5], [0, 12]]],
       {14: 1}],
 334: [[[[41, 1], [113, 2], [43, 3]],
        [[20, 4]],
        [[47, 5], [45, 6], [0, 2]],
        [[20, 7]],
        [[45, 8], [0, 4]],
        [[44, 9]],
        [[41, 1], [113, 2], [43, 3], [0, 6]],
        [[0, 7]],
        [[43, 3]],
        [[45, 6], [0, 9]]],
       {20: 1, 28: 1, 41: 1, 43: 1}],
 335: [[[[16, 1]],
        [[44, 2]],
        [[69, 3]],
        [[70, 4]],
        [[111, 5], [0, 4]],
        [[69, 6]],
        [[70, 7]],
        [[0, 7]]],
       {16: 1}],
 336: [[[[34, 1]],
        [[44, 2]],
        [[69, 3], [161, 4]],
        [[70, 5]],
        [[69, 3]],
        [[0, 5]]],
       {34: 1}],
 337: [[[[95, 1]], [[80, 2]], [[0, 2]]], {95: 1}],
 338: [[[[162, 1]], [[163, 0], [0, 1]]],
       {6: 1, 8: 1, 9: 1, 11: 1, 13: 1, 17: 1, 20: 1, 24: 1, 28: 1, 35: 1}],
 339: [[[[25, 1]], [[71, 2], [0, 1]], [[0, 2]]], {25: 1}],
 340: [[[[53, 1]], [[0, 1]]], {25: 1}]},
states:
[[[[1, 1], [2, 1], [3, 2]], [[0, 1]], [[2, 1]]],
 [[[37, 1]], [[38, 0], [0, 1]]],
 [[[39, 1]], [[40, 0], [0, 1]]],
 [[[41, 1], [42, 2], [43, 3]],
  [[44, 4]],
  [[45, 5], [0, 2]],
  [[44, 6]],
  [[45, 7], [0, 4]],
  [[41, 1], [42, 2], [43, 3], [0, 5]],
  [[0, 6]],
  [[42, 4], [43, 3]]],
 [[[44, 1]], [[46, 2], [47, 3], [0, 1]], [[0, 2]], [[44, 2]]],
 [[[48, 1]], [[24, 0], [35, 0], [0, 1]]],
 [[[19, 1]], [[44, 2]], [[45, 3], [0, 2]], [[44, 4]], [[0, 4]]],
 [[[17, 1], [8, 2], [9, 5], [28, 4], [11, 3], [13, 6], [20, 2]],
  [[17, 1], [0, 1]],
  [[0, 2]],
  [[49, 7], [50, 2]],
  [[51, 2], [52, 8], [53, 8]],
  [[54, 9], [55, 2]],
  [[56, 10]],
  [[50, 2]],
  [[51, 2]],
  [[55, 2]],
  [[13, 2]]],
 [[[57, 1],
   [58, 1],
   [59, 1],
   [60, 1],
   [61, 1],
   [62, 1],
   [63, 1],
   [64, 1],
   [65, 1],
   [66, 1],
   [67, 1],
   [68, 1]],
  [[0, 1]]],
 [[[31, 1]], [[0, 1]]],
 [[[10, 1]],
  [[20, 2]],
  [[69, 3], [28, 4]],
  [[70, 5]],
  [[51, 6], [71, 7]],
  [[0, 5]],
  [[69, 3]],
  [[51, 6]]],
 [[[72, 1],
   [73, 1],
   [7, 2],
   [74, 1],
   [72, 1],
   [75, 1],
   [76, 1],
   [77, 3],
   [78, 1],
   [79, 1]],
  [[0, 1]],
  [[75, 1]],
  [[7, 1], [0, 3]]],
 [[[80, 1]], [[81, 0], [0, 1]]],
 [[[82, 1], [83, 1], [84, 1], [85, 1], [86, 1], [87, 1], [88, 1], [89, 1]],
  [[0, 1]]],
 [[[32, 1]], [[0, 1]]],
 [[[90, 1]], [[88, 2], [85, 2]], [[0, 2]]],
 [[[33, 1]],
  [[91, 2]],
  [[28, 4], [2, 3]],
  [[0, 3]],
  [[51, 5], [92, 6]],
  [[2, 3]],
  [[51, 5]]],
 [[[93, 1]], [[93, 1], [0, 1]]],
 [[[21, 1]], [[94, 2]], [[0, 2]]],
 [[[44, 1]], [[69, 2]], [[44, 3]], [[45, 4], [0, 3]], [[44, 1], [0, 4]]],
 [[[91, 1]], [[95, 2], [0, 1]], [[20, 3]], [[0, 3]]],
 [[[96, 1]], [[45, 0], [0, 1]]],
 [[[20, 1]], [[97, 0], [0, 1]]],
 [[[20, 1]], [[0, 1]]],
 [[[71, 1]], [[2, 1], [98, 2]], [[0, 2]]],
 [[[99, 1]],
  [[44, 2], [0, 1]],
  [[95, 3], [45, 3], [0, 2]],
  [[44, 4]],
  [[0, 4]]],
 [[[15, 1]],
  [[80, 2]],
  [[75, 3], [0, 2]],
  [[44, 4]],
  [[45, 5], [0, 4]],
  [[44, 6]],
  [[0, 6]]],
 [[[100, 1]], [[101, 0], [0, 1]]],
 [[[71, 1]],
  [[102, 2], [47, 3], [0, 1]],
  [[71, 4], [53, 4]],
  [[71, 5], [53, 5]],
  [[0, 4]],
  [[47, 3], [0, 5]]],
 [[[80, 1]], [[45, 2], [0, 1]], [[80, 1], [0, 2]]],
 [[[103, 2], [24, 1], [6, 1], [35, 1]], [[104, 2]], [[0, 2]]],
 [[[2, 0], [98, 1], [105, 0]], [[0, 1]]],
 [[[106, 1], [107, 1], [108, 1], [109, 1], [110, 1]], [[0, 1]]],
 [[[27, 1]],
  [[94, 2]],
  [[75, 3]],
  [[71, 4]],
  [[69, 5]],
  [[70, 6]],
  [[111, 7], [0, 6]],
  [[69, 8]],
  [[70, 9]],
  [[0, 9]]],
 [[[28, 1], [20, 2]], [[112, 3]], [[0, 2]], [[51, 2]]],
 [[[113, 1]], [[45, 2], [0, 1]], [[113, 1], [0, 2]]],
 [[[4, 1]], [[20, 2]], [[114, 3]], [[69, 4]], [[70, 5]], [[0, 5]]],
 [[[27, 1]], [[94, 2]], [[75, 3]], [[115, 4]], [[116, 5], [0, 4]], [[0, 5]]],
 [[[30, 1]], [[117, 2]], [[116, 3], [0, 2]], [[0, 3]]],
 [[[46, 1], [118, 1]], [[0, 1]]],
 [[[26, 1]], [[20, 2]], [[45, 1], [0, 2]]],
 [[[30, 1]],
  [[44, 2]],
  [[69, 3]],
  [[70, 4]],
  [[111, 5], [119, 1], [0, 4]],
  [[69, 6]],
  [[70, 7]],
  [[0, 7]]],
 [[[20, 1]], [[95, 2], [0, 1]], [[20, 3]], [[0, 3]]],
 [[[120, 1]], [[45, 2], [0, 1]], [[120, 1], [0, 2]]],
 [[[29, 1]],
  [[91, 2], [97, 3]],
  [[23, 4]],
  [[91, 2], [23, 4], [97, 3]],
  [[121, 5], [41, 5], [28, 6]],
  [[0, 5]],
  [[121, 7]],
  [[51, 5]]],
 [[[23, 1]], [[122, 2]], [[0, 2]]],
 [[[123, 1], [124, 1]], [[0, 1]]],
 [[[36, 1]], [[69, 2], [125, 3]], [[44, 4]], [[69, 2]], [[0, 4]]],
 [[[27, 1]], [[94, 2]], [[75, 3]], [[126, 4]], [[127, 5], [0, 4]], [[0, 5]]],
 [[[30, 1]], [[117, 2]], [[127, 3], [0, 2]], [[0, 3]]],
 [[[128, 1], [129, 1]], [[0, 1]]],
 [[[44, 1]],
  [[128, 2], [45, 3], [0, 1]],
  [[0, 2]],
  [[44, 4], [0, 3]],
  [[45, 3], [0, 4]]],
 [[[7, 1], [130, 2]], [[39, 2]], [[0, 2]]],
 [[[36, 1]], [[69, 2], [125, 3]], [[117, 4]], [[69, 2]], [[0, 4]]],
 [[[131, 1], [115, 1]], [[0, 1]]],
 [[[132, 1]], [[133, 0], [0, 1]]],
 [[[28, 1]], [[51, 2], [125, 3]], [[0, 2]], [[51, 2]]],
 [[[22, 1]], [[0, 1]]],
 [[[134, 1]], [[135, 1], [43, 2], [0, 1]], [[104, 3]], [[0, 3]]],
 [[[12, 1]],
  [[44, 2], [136, 3], [0, 1]],
  [[45, 4], [0, 2]],
  [[44, 5]],
  [[44, 2], [0, 4]],
  [[45, 6], [0, 5]],
  [[44, 7]],
  [[45, 8], [0, 7]],
  [[44, 7], [0, 8]]],
 [[[5, 1]],
  [[44, 2], [0, 1]],
  [[45, 3], [0, 2]],
  [[44, 4]],
  [[45, 5], [0, 4]],
  [[44, 6]],
  [[0, 6]]],
 [[[18, 1]], [[71, 2], [0, 1]], [[0, 2]]],
 [[[137, 1]], [[136, 0], [138, 0], [0, 1]]],
 [[[139, 1]], [[2, 2], [140, 3]], [[0, 2]], [[139, 1], [2, 2]]],
 [[[69, 1]], [[44, 2], [0, 1]], [[0, 2]]],
 [[[141, 1],
   [142, 1],
   [143, 1],
   [144, 1],
   [145, 1],
   [146, 1],
   [147, 1],
   [148, 1],
   [149, 1]],
  [[0, 1]]],
 [[[1, 1], [3, 1]], [[0, 1]]],
 [[[44, 1], [69, 2], [97, 3]],
  [[69, 2], [0, 1]],
  [[44, 4], [150, 5], [0, 2]],
  [[97, 6]],
  [[150, 5], [0, 4]],
  [[0, 5]],
  [[97, 5]]],
 [[[151, 1]], [[45, 2], [0, 1]], [[151, 1], [0, 2]]],
 [[[1, 1], [2, 2]], [[0, 1]], [[152, 3]], [[105, 4]], [[153, 1], [105, 4]]],
 [[[104, 1]], [[154, 0], [41, 0], [155, 0], [156, 0], [0, 1]]],
 [[[115, 1], [157, 2]],
  [[30, 3], [0, 1]],
  [[0, 2]],
  [[115, 4]],
  [[111, 5]],
  [[44, 2]]],
 [[[44, 1]], [[45, 2], [0, 1]], [[44, 1], [0, 2]]],
 [[[44, 1]], [[45, 0], [0, 1]]],
 [[[44, 1]],
  [[46, 2], [45, 3], [0, 1]],
  [[0, 2]],
  [[44, 4], [0, 3]],
  [[45, 3], [0, 4]]],
 [[[117, 1]],
  [[45, 2], [0, 1]],
  [[117, 3]],
  [[45, 4], [0, 3]],
  [[117, 3], [0, 4]]],
 [[[28, 1], [97, 2], [11, 3]],
  [[51, 4], [92, 5]],
  [[20, 4]],
  [[158, 6]],
  [[0, 4]],
  [[51, 4]],
  [[50, 4]]],
 [[[14, 1]],
  [[69, 2]],
  [[70, 3]],
  [[159, 4], [160, 5]],
  [[69, 6]],
  [[69, 7]],
  [[70, 8]],
  [[70, 9]],
  [[159, 4], [111, 10], [160, 5], [0, 8]],
  [[0, 9]],
  [[69, 11]],
  [[70, 12]],
  [[160, 5], [0, 12]]],
 [[[41, 1], [113, 2], [43, 3]],
  [[20, 4]],
  [[47, 5], [45, 6], [0, 2]],
  [[20, 7]],
  [[45, 8], [0, 4]],
  [[44, 9]],
  [[41, 1], [113, 2], [43, 3], [0, 6]],
  [[0, 7]],
  [[43, 3]],
  [[45, 6], [0, 9]]],
 [[[16, 1]],
  [[44, 2]],
  [[69, 3]],
  [[70, 4]],
  [[111, 5], [0, 4]],
  [[69, 6]],
  [[70, 7]],
  [[0, 7]]],
 [[[34, 1]], [[44, 2]], [[69, 3], [161, 4]], [[70, 5]], [[69, 3]], [[0, 5]]],
 [[[95, 1]], [[80, 2]], [[0, 2]]],
 [[[162, 1]], [[163, 0], [0, 1]]],
 [[[25, 1]], [[71, 2], [0, 1]], [[0, 2]]],
 [[[53, 1]], [[0, 1]]]],
labels:
[[0, 'EMPTY'],
 [319, null],
 [4, null],
 [269, null],
 [1, 'def'],
 [1, 'raise'],
 [32, null],
 [1, 'not'],
 [2, null],
 [26, null],
 [1, 'class'],
 [9, null],
 [1, 'print'],
 [25, null],
 [1, 'try'],
 [1, 'exec'],
 [1, 'while'],
 [3, null],
 [1, 'return'],
 [1, 'assert'],
 [1, null],
 [1, 'del'],
 [1, 'pass'],
 [1, 'import'],
 [15, null],
 [1, 'yield'],
 [1, 'global'],
 [1, 'for'],
 [7, null],
 [1, 'from'],
 [1, 'if'],
 [1, 'break'],
 [1, 'continue'],
 [50, null],
 [1, 'with'],
 [14, null],
 [1, 'lambda'],
 [318, null],
 [19, null],
 [308, null],
 [1, 'and'],
 [16, null],
 [260, null],
 [36, null],
 [327, null],
 [12, null],
 [293, null],
 [22, null],
 [326, null],
 [307, null],
 [10, null],
 [8, null],
 [330, null],
 [339, null],
 [275, null],
 [27, null],
 [329, null],
 [46, null],
 [39, null],
 [41, null],
 [47, null],
 [42, null],
 [43, null],
 [37, null],
 [44, null],
 [49, null],
 [40, null],
 [38, null],
 [45, null],
 [11, null],
 [325, null],
 [328, null],
 [29, null],
 [21, null],
 [28, null],
 [1, 'in'],
 [30, null],
 [1, 'is'],
 [31, null],
 [20, null],
 [283, null],
 [267, null],
 [333, null],
 [297, null],
 [289, null],
 [266, null],
 [336, null],
 [335, null],
 [292, null],
 [271, null],
 [273, null],
 [278, null],
 [259, null],
 [272, null],
 [285, null],
 [1, 'as'],
 [276, null],
 [23, null],
 [0, null],
 [1, 'except'],
 [338, null],
 [18, null],
 [264, null],
 [314, null],
 [286, null],
 [322, null],
 [265, null],
 [270, null],
 [316, null],
 [317, null],
 [340, null],
 [1, 'else'],
 [291, null],
 [290, null],
 [312, null],
 [311, null],
 [295, null],
 [310, null],
 [294, null],
 [1, 'elif'],
 [298, null],
 [299, null],
 [277, null],
 [301, null],
 [300, null],
 [334, null],
 [331, null],
 [306, null],
 [304, null],
 [305, null],
 [268, null],
 [309, null],
 [258, null],
 [1, 'or'],
 [263, null],
 [332, null],
 [35, null],
 [261, null],
 [34, null],
 [321, null],
 [13, null],
 [288, null],
 [262, null],
 [284, null],
 [313, null],
 [315, null],
 [274, null],
 [282, null],
 [296, null],
 [302, null],
 [320, null],
 [323, null],
 [5, null],
 [6, null],
 [48, null],
 [17, null],
 [24, null],
 [303, null],
 [324, null],
 [281, null],
 [1, 'finally'],
 [337, null],
 [257, null],
 [33, null]],
keywords:
{'and': 40,
 'as': 95,
 'assert': 19,
 'break': 31,
 'class': 10,
 'continue': 32,
 'def': 4,
 'del': 21,
 'elif': 119,
 'else': 111,
 'except': 99,
 'exec': 15,
 'finally': 160,
 'for': 27,
 'from': 29,
 'global': 26,
 'if': 30,
 'import': 23,
 'in': 75,
 'is': 77,
 'lambda': 36,
 'not': 7,
 'or': 133,
 'pass': 22,
 'print': 12,
 'raise': 5,
 'return': 18,
 'try': 14,
 'while': 16,
 'with': 34,
 'yield': 25},
tokens:
{0: 98,
 1: 20,
 2: 8,
 3: 17,
 4: 2,
 5: 152,
 6: 153,
 7: 28,
 8: 51,
 9: 11,
 10: 50,
 11: 69,
 12: 45,
 13: 140,
 14: 35,
 15: 24,
 16: 41,
 17: 155,
 18: 101,
 19: 38,
 20: 79,
 21: 73,
 22: 47,
 23: 97,
 24: 156,
 25: 13,
 26: 9,
 27: 55,
 28: 74,
 29: 72,
 30: 76,
 31: 78,
 32: 6,
 33: 163,
 34: 138,
 35: 136,
 36: 43,
 37: 63,
 38: 67,
 39: 58,
 40: 66,
 41: 59,
 42: 61,
 43: 62,
 44: 64,
 45: 68,
 46: 57,
 47: 60,
 48: 154,
 49: 65,
 50: 33},
start: 256
};
// low level parser to a concrete syntax tree, derived from cpython's lib2to3

/**
 *
 * @constructor
 * @param {Object} grammar
 *
 * p = new Parser(grammar);
 * p.setup([start]);
 * foreach input token:
 *     if p.addtoken(...):
 *         break
 * root = p.rootnode
 *
 * can throw ParseError
 */
function Parser(grammar)
{
    this.grammar = grammar;
    return this;
}


Parser.prototype.setup = function(start)
{
    start = start || this.grammar.start;
    //print("START:"+start);

    var newnode =
    {
        type: start,
        value: null,
        context: null,
        children: []
    };
    var stackentry =
    {
        dfa: this.grammar.dfas[start],
        state: 0,
        node: newnode
    };
    this.stack = [stackentry];
    this.used_names = {};
};

function findInDfa(a, obj)
{
    var i = a.length;
    while (i--)
    {
        if (a[i][0] === obj[0] && a[i][1] === obj[1])
        {
            return true;
        }
    }
    return false;
}


// Add a token; return true if we're done
Parser.prototype.addtoken = function(type, value, context)
{
    var ilabel = this.classify(type, value, context);
    //print("ilabel:"+ilabel);

OUTERWHILE:
    while (true)
    {
        var tp = this.stack[this.stack.length - 1];
        var states = tp.dfa[0];
        var first = tp.dfa[1];
        var arcs = states[tp.state];

        // look for a state with this label
        for (var a = 0; a < arcs.length; ++a)
        {
            var i = arcs[a][0];
            var newstate = arcs[a][1];
            var t = this.grammar.labels[i][0];
            var v = this.grammar.labels[i][1];
            //print("a:"+a+", t:"+t+", i:"+i);
            if (ilabel === i)
            {
                // look it up in the list of labels
                goog.asserts.assert(t < 256);
                // shift a token; we're done with it
                this.shift(type, value, newstate, context);
                // pop while we are in an accept-only state
                var state = newstate;
                //print("before:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                while (states[state].length === 1
                        && states[state][0][0] === 0
                        && states[state][0][1] === state) // states[state] == [(0, state)])
                {
                    this.pop();
                    //print("in after pop:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                    if (this.stack.length === 0)
                    {
                        // done!
                        return true;
                    }
                    tp = this.stack[this.stack.length - 1];
                    state = tp.state;
                    states = tp.dfa[0];
                    first = tp.dfa[1];
                    //print(JSON.stringify(states), JSON.stringify(first));
                    //print("bottom:"+JSON.stringify(states[state]) + ":state:"+state+":"+JSON.stringify(states[state]));
                }
                // done with this token
                //print("DONE, return false");
                return false;
            }
            else if (t >= 256)
            {
                var itsdfa = this.grammar.dfas[t];
                var itsfirst = itsdfa[1];
                if (itsfirst.hasOwnProperty(ilabel))
                {
                    // push a symbol
                    this.push(t, this.grammar.dfas[t], newstate, context);
                    continue OUTERWHILE;
                }
            }
        }

        //print("findInDfa: " + JSON.stringify(arcs)+" vs. " + tp.state);
        if (findInDfa(arcs, [0, tp.state]))
        {
            // an accepting state, pop it and try somethign else
            //print("WAA");
            this.pop();
            if (this.stack.length === 0)
            {
                throw new Sk.builtin.ParseError("too much input");
            }
        }
        else
        {
            // no transition
            var errline = context[0][0];
            throw new Sk.builtin.ParseError("bad input on line " + errline.toString(), "", errline, context);	//	RNL
//          throw new Sk.builtin.ParseError("bad input on line " + errline.toString());		RNL
        }
    }
};

// turn a token into a label
Parser.prototype.classify = function(type, value, context)
{
    var ilabel;
    if (type === Sk.Tokenizer.Tokens.T_NAME)
    {
        this.used_names[value] = true;
        ilabel = this.grammar.keywords.hasOwnProperty(value) && this.grammar.keywords[value];
        if (ilabel)
        {
            //print("is keyword");
            return ilabel;
        }
    }
    ilabel = this.grammar.tokens.hasOwnProperty(type) && this.grammar.tokens[type];
    if (!ilabel)
        throw new Sk.builtin.ParseError("bad token", type, value, context);
    return ilabel;
};

// shift a token
Parser.prototype.shift = function(type, value, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa;
    var state = this.stack[this.stack.length - 1].state;
    var node = this.stack[this.stack.length - 1].node;
    //print("context", context);
    var newnode = {
        type: type, 
        value: value,
        lineno: context[0][0],         // throwing away end here to match cpython
        col_offset: context[0][1],
        children: null
    };
    if (newnode)
    {
        node.children.push(newnode);
    }
    this.stack[this.stack.length - 1] = {
        dfa: dfa,
        state: newstate,
        node: node
    };
};

// push a nonterminal
Parser.prototype.push = function(type, newdfa, newstate, context)
{
    var dfa = this.stack[this.stack.length - 1].dfa; 
    var node = this.stack[this.stack.length - 1].node; 
    var newnode = {
        type: type,
        value: null,
        lineno: context[0][0],      // throwing away end here to match cpython
        col_offset: context[0][1],
        children: []
    };
    this.stack[this.stack.length - 1] = {
            dfa: dfa,
            state: newstate,
            node: node
        };
    this.stack.push({
            dfa: newdfa,
            state: 0,
            node: newnode
        });
};

//var ac = 0;
//var bc = 0;

// pop a nonterminal
Parser.prototype.pop = function()
{
    var pop = this.stack.pop();
    var newnode = pop.node;
    //print("POP");
    if (newnode)
    {
        //print("A", ac++, newnode.type);
        //print("stacklen:"+this.stack.length);
        if (this.stack.length !== 0)
        {
            //print("B", bc++);
            var node = this.stack[this.stack.length - 1].node;
            node.children.push(newnode);
        }
        else
        {
            //print("C");
            this.rootnode = newnode;
            this.rootnode.used_names = this.used_names;
        }
    }
};

/**
 * parser for interactive input. returns a function that should be called with
 * lines of input as they are entered. the function will return false
 * until the input is complete, when it will return the rootnode of the parse.
 *
 * @param {string} filename
 * @param {string=} style root of parse tree (optional)
 */
function makeParser(filename, style)
{
    if (style === undefined) style = "file_input";
    var p = new Parser(Sk.ParseTables);
    // for closure's benefit
    if (style === "file_input")
        p.setup(Sk.ParseTables.sym.file_input);
    else
        goog.asserts.fail("todo;");
    var curIndex = 0;
    var lineno = 1;
    var column = 0;
    var prefix = "";
    var T_COMMENT = Sk.Tokenizer.Tokens.T_COMMENT;
    var T_NL = Sk.Tokenizer.Tokens.T_NL;
    var T_OP = Sk.Tokenizer.Tokens.T_OP;
    var tokenizer = new Sk.Tokenizer(filename, style === "single_input", function(type, value, start, end, line)
            {
                //print(JSON.stringify([type, value, start, end, line]));
                var s_lineno = start[0];
                var s_column = start[1];
                /*
                if (s_lineno !== lineno && s_column !== column)
                {
                    // todo; update prefix and line/col
                }
                */
                if (type === T_COMMENT || type === T_NL)
                {
                    prefix += value;
                    lineno = end[0];
                    column = end[1];
                    if (value[value.length - 1] === "\n")
                    {
                        lineno += 1;
                        column = 0;
                    }
                    //print("  not calling addtoken");
                    return undefined;
                }
                if (type === T_OP)
                {
                    type = Sk.OpMap[value];
                }
                if (p.addtoken(type, value, [start, end, line]))
                {
                    return true;
                }
            });
    return function(line)
    {
        var ret = tokenizer.generateTokens(line);
        //print("tok:"+ret);
        if (ret)
        {
            if (ret !== "done") {
                throw "ParseError: incomplete input";
			}
            return p.rootnode;
        }
        return false;
    };
}

Sk.parse = function parse(filename, input)
{
    var parseFunc = makeParser(filename);
    if (input.substr(input.length - 1, 1) !== "\n") input += "\n";
    //print("input:"+input);
    var lines = input.split("\n");
    var ret;
    for (var i = 0; i < lines.length; ++i)
    {
        ret = parseFunc(lines[i] + ((i === lines.length - 1) ? "" : "\n"));
    }
    return ret;
};

Sk.parseTreeDump = function parseTreeDump(n, indent)
{
    //return JSON.stringify(n, null, 2);
    indent = indent || "";
    var ret = "";
    ret += indent;
    if (n.type >= 256) // non-term
    {
        ret += Sk.ParseTables.number2symbol[n.type] + "\n";
        for (var i = 0; i < n.children.length; ++i)
        {
            ret += Sk.parseTreeDump(n.children[i], indent + "  ");
        }
    }
    else
    {
        ret += Sk.Tokenizer.tokenNames[n.type] + ": " + new Sk.builtin.str(n.value)['$r']().v + "\n";
    }
    return ret;
};


goog.exportSymbol("Sk.parse", Sk.parse);
goog.exportSymbol("Sk.parseTreeDump", Sk.parseTreeDump);
/* File automatically generated by asdl_js.py. */

/* ----- expr_context ----- */
/** @constructor */
function Load() {}
/** @constructor */
function Store() {}
/** @constructor */
function Del() {}
/** @constructor */
function AugLoad() {}
/** @constructor */
function AugStore() {}
/** @constructor */
function Param() {}

/* ----- boolop ----- */
/** @constructor */
function And() {}
/** @constructor */
function Or() {}

/* ----- operator ----- */
/** @constructor */
function Add() {}
/** @constructor */
function Sub() {}
/** @constructor */
function Mult() {}
/** @constructor */
function Div() {}
/** @constructor */
function Mod() {}
/** @constructor */
function Pow() {}
/** @constructor */
function LShift() {}
/** @constructor */
function RShift() {}
/** @constructor */
function BitOr() {}
/** @constructor */
function BitXor() {}
/** @constructor */
function BitAnd() {}
/** @constructor */
function FloorDiv() {}

/* ----- unaryop ----- */
/** @constructor */
function Invert() {}
/** @constructor */
function Not() {}
/** @constructor */
function UAdd() {}
/** @constructor */
function USub() {}

/* ----- cmpop ----- */
/** @constructor */
function Eq() {}
/** @constructor */
function NotEq() {}
/** @constructor */
function Lt() {}
/** @constructor */
function LtE() {}
/** @constructor */
function Gt() {}
/** @constructor */
function GtE() {}
/** @constructor */
function Is() {}
/** @constructor */
function IsNot() {}
/** @constructor */
function In_() {}
/** @constructor */
function NotIn() {}







/* ---------------------- */
/* constructors for nodes */
/* ---------------------- */





/** @constructor */
function Module(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function Interactive(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function Expression(/* {expr_ty} */ body)
{
    goog.asserts.assert(body !== null && body !== undefined);
    this.body = body;
    return this;
}

/** @constructor */
function Suite(/* {asdl_seq *} */ body)
{
    this.body = body;
    return this;
}

/** @constructor */
function FunctionDef(/* {identifier} */ name, /* {arguments__ty} */ args, /*
                          {asdl_seq *} */ body, /* {asdl_seq *} */
                          decorator_list, /* {int} */ lineno, /* {int} */
                          col_offset)
{
    goog.asserts.assert(name !== null && name !== undefined);
    goog.asserts.assert(args !== null && args !== undefined);
    this.name = name;
    this.args = args;
    this.body = body;
    this.decorator_list = decorator_list;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ClassDef(/* {identifier} */ name, /* {asdl_seq *} */ bases, /*
                       {asdl_seq *} */ body, /* {asdl_seq *} */ decorator_list,
                       /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(name !== null && name !== undefined);
    this.name = name;
    this.bases = bases;
    this.body = body;
    this.decorator_list = decorator_list;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Return_(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Delete_(/* {asdl_seq *} */ targets, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.targets = targets;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Assign(/* {asdl_seq *} */ targets, /* {expr_ty} */ value, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.targets = targets;
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function AugAssign(/* {expr_ty} */ target, /* {operator_ty} */ op, /* {expr_ty}
                        */ value, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(value !== null && value !== undefined);
    this.target = target;
    this.op = op;
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Print(/* {expr_ty} */ dest, /* {asdl_seq *} */ values, /* {bool} */
                    nl, /* {int} */ lineno, /* {int} */ col_offset)
{
    this.dest = dest;
    this.values = values;
    this.nl = nl;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function For_(/* {expr_ty} */ target, /* {expr_ty} */ iter, /* {asdl_seq *} */
                   body, /* {asdl_seq *} */ orelse, /* {int} */ lineno, /*
                   {int} */ col_offset)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(iter !== null && iter !== undefined);
    this.target = target;
    this.iter = iter;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function While_(/* {expr_ty} */ test, /* {asdl_seq *} */ body, /* {asdl_seq *}
                     */ orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function If_(/* {expr_ty} */ test, /* {asdl_seq *} */ body, /* {asdl_seq *} */
                  orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function With_(/* {expr_ty} */ context_expr, /* {expr_ty} */ optional_vars, /*
                    {asdl_seq *} */ body, /* {int} */ lineno, /* {int} */
                    col_offset)
{
    goog.asserts.assert(context_expr !== null && context_expr !== undefined);
    this.context_expr = context_expr;
    this.optional_vars = optional_vars;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Raise(/* {expr_ty} */ type, /* {expr_ty} */ inst, /* {expr_ty} */
                    tback, /* {int} */ lineno, /* {int} */ col_offset)
{
    this.type = type;
    this.inst = inst;
    this.tback = tback;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function TryExcept(/* {asdl_seq *} */ body, /* {asdl_seq *} */ handlers, /*
                        {asdl_seq *} */ orelse, /* {int} */ lineno, /* {int} */
                        col_offset)
{
    this.body = body;
    this.handlers = handlers;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function TryFinally(/* {asdl_seq *} */ body, /* {asdl_seq *} */ finalbody, /*
                         {int} */ lineno, /* {int} */ col_offset)
{
    this.body = body;
    this.finalbody = finalbody;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Assert(/* {expr_ty} */ test, /* {expr_ty} */ msg, /* {int} */ lineno,
                     /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    this.test = test;
    this.msg = msg;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Import_(/* {asdl_seq *} */ names, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    this.names = names;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ImportFrom(/* {identifier} */ module, /* {asdl_seq *} */ names, /*
                         {int} */ level, /* {int} */ lineno, /* {int} */
                         col_offset)
{
    goog.asserts.assert(module !== null && module !== undefined);
    this.module = module;
    this.names = names;
    this.level = level;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Exec(/* {expr_ty} */ body, /* {expr_ty} */ globals, /* {expr_ty} */
                   locals, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(body !== null && body !== undefined);
    this.body = body;
    this.globals = globals;
    this.locals = locals;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Global(/* {asdl_seq *} */ names, /* {int} */ lineno, /* {int} */
                     col_offset)
{
    this.names = names;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Expr(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Pass(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Break_(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Continue_(/* {int} */ lineno, /* {int} */ col_offset)
{
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function BoolOp(/* {boolop_ty} */ op, /* {asdl_seq *} */ values, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(op !== null && op !== undefined);
    this.op = op;
    this.values = values;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function BinOp(/* {expr_ty} */ left, /* {operator_ty} */ op, /* {expr_ty} */
                    right, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(left !== null && left !== undefined);
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(right !== null && right !== undefined);
    this.left = left;
    this.op = op;
    this.right = right;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function UnaryOp(/* {unaryop_ty} */ op, /* {expr_ty} */ operand, /* {int} */
                      lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(op !== null && op !== undefined);
    goog.asserts.assert(operand !== null && operand !== undefined);
    this.op = op;
    this.operand = operand;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Lambda(/* {arguments__ty} */ args, /* {expr_ty} */ body, /* {int} */
                     lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(args !== null && args !== undefined);
    goog.asserts.assert(body !== null && body !== undefined);
    this.args = args;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function IfExp(/* {expr_ty} */ test, /* {expr_ty} */ body, /* {expr_ty} */
                    orelse, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(test !== null && test !== undefined);
    goog.asserts.assert(body !== null && body !== undefined);
    goog.asserts.assert(orelse !== null && orelse !== undefined);
    this.test = test;
    this.body = body;
    this.orelse = orelse;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Dict(/* {asdl_seq *} */ keys, /* {asdl_seq *} */ values, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    this.keys = keys;
    this.values = values;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function ListComp(/* {expr_ty} */ elt, /* {asdl_seq *} */ generators, /* {int}
                       */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(elt !== null && elt !== undefined);
    this.elt = elt;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function GeneratorExp(/* {expr_ty} */ elt, /* {asdl_seq *} */ generators, /*
                           {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(elt !== null && elt !== undefined);
    this.elt = elt;
    this.generators = generators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Yield(/* {expr_ty} */ value, /* {int} */ lineno, /* {int} */
                    col_offset)
{
    this.value = value;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Compare(/* {expr_ty} */ left, /* {asdl_int_seq *} */ ops, /* {asdl_seq
                      *} */ comparators, /* {int} */ lineno, /* {int} */
                      col_offset)
{
    goog.asserts.assert(left !== null && left !== undefined);
    this.left = left;
    this.ops = ops;
    this.comparators = comparators;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Call(/* {expr_ty} */ func, /* {asdl_seq *} */ args, /* {asdl_seq *} */
                   keywords, /* {expr_ty} */ starargs, /* {expr_ty} */ kwargs,
                   /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(func !== null && func !== undefined);
    this.func = func;
    this.args = args;
    this.keywords = keywords;
    this.starargs = starargs;
    this.kwargs = kwargs;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Num(/* {object} */ n, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(n !== null && n !== undefined);
    this.n = n;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Str(/* {string} */ s, /* {int} */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(s !== null && s !== undefined);
    this.s = s;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Attribute(/* {expr_ty} */ value, /* {identifier} */ attr, /*
                        {expr_context_ty} */ ctx, /* {int} */ lineno, /* {int}
                        */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    goog.asserts.assert(attr !== null && attr !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.value = value;
    this.attr = attr;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Subscript(/* {expr_ty} */ value, /* {slice_ty} */ slice, /*
                        {expr_context_ty} */ ctx, /* {int} */ lineno, /* {int}
                        */ col_offset)
{
    goog.asserts.assert(value !== null && value !== undefined);
    goog.asserts.assert(slice !== null && slice !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.value = value;
    this.slice = slice;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Name(/* {identifier} */ id, /* {expr_context_ty} */ ctx, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(id !== null && id !== undefined);
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.id = id;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function List(/* {asdl_seq *} */ elts, /* {expr_context_ty} */ ctx, /* {int} */
                   lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.elts = elts;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Tuple(/* {asdl_seq *} */ elts, /* {expr_context_ty} */ ctx, /* {int}
                    */ lineno, /* {int} */ col_offset)
{
    goog.asserts.assert(ctx !== null && ctx !== undefined);
    this.elts = elts;
    this.ctx = ctx;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function Ellipsis()
{
    return this;
}

/** @constructor */
function Slice(/* {expr_ty} */ lower, /* {expr_ty} */ upper, /* {expr_ty} */
                    step)
{
    this.lower = lower;
    this.upper = upper;
    this.step = step;
    return this;
}

/** @constructor */
function ExtSlice(/* {asdl_seq *} */ dims)
{
    this.dims = dims;
    return this;
}

/** @constructor */
function Index(/* {expr_ty} */ value)
{
    goog.asserts.assert(value !== null && value !== undefined);
    this.value = value;
    return this;
}

/** @constructor */
function comprehension(/* {expr_ty} */ target, /* {expr_ty} */ iter, /*
                            {asdl_seq *} */ ifs)
{
    goog.asserts.assert(target !== null && target !== undefined);
    goog.asserts.assert(iter !== null && iter !== undefined);
    this.target = target;
    this.iter = iter;
    this.ifs = ifs;
    return this;
}

/** @constructor */
function ExceptHandler(/* {expr_ty} */ type, /* {expr_ty} */ name, /* {asdl_seq
                            *} */ body, /* {int} */ lineno, /* {int} */
                            col_offset)
{
    this.type = type;
    this.name = name;
    this.body = body;
    this.lineno = lineno;
    this.col_offset = col_offset;
    return this;
}

/** @constructor */
function arguments_(/* {asdl_seq *} */ args, /* {identifier} */ vararg, /*
                         {identifier} */ kwarg, /* {asdl_seq *} */ defaults)
{
    this.args = args;
    this.vararg = vararg;
    this.kwarg = kwarg;
    this.defaults = defaults;
    return this;
}

/** @constructor */
function keyword(/* {identifier} */ arg, /* {expr_ty} */ value)
{
    goog.asserts.assert(arg !== null && arg !== undefined);
    goog.asserts.assert(value !== null && value !== undefined);
    this.arg = arg;
    this.value = value;
    return this;
}

/** @constructor */
function alias(/* {identifier} */ name, /* {identifier} */ asname)
{
    goog.asserts.assert(name !== null && name !== undefined);
    this.name = name;
    this.asname = asname;
    return this;
}


Module.prototype._astname = "Module";
Module.prototype._fields = [
    "body", function(n) { return n.body; }
];
Interactive.prototype._astname = "Interactive";
Interactive.prototype._fields = [
    "body", function(n) { return n.body; }
];
Expression.prototype._astname = "Expression";
Expression.prototype._fields = [
    "body", function(n) { return n.body; }
];
Suite.prototype._astname = "Suite";
Suite.prototype._fields = [
    "body", function(n) { return n.body; }
];
FunctionDef.prototype._astname = "FunctionDef";
FunctionDef.prototype._fields = [
    "name", function(n) { return n.name; },
    "args", function(n) { return n.args; },
    "body", function(n) { return n.body; },
    "decorator_list", function(n) { return n.decorator_list; }
];
ClassDef.prototype._astname = "ClassDef";
ClassDef.prototype._fields = [
    "name", function(n) { return n.name; },
    "bases", function(n) { return n.bases; },
    "body", function(n) { return n.body; },
    "decorator_list", function(n) { return n.decorator_list; }
];
Return_.prototype._astname = "Return";
Return_.prototype._fields = [
    "value", function(n) { return n.value; }
];
Delete_.prototype._astname = "Delete";
Delete_.prototype._fields = [
    "targets", function(n) { return n.targets; }
];
Assign.prototype._astname = "Assign";
Assign.prototype._fields = [
    "targets", function(n) { return n.targets; },
    "value", function(n) { return n.value; }
];
AugAssign.prototype._astname = "AugAssign";
AugAssign.prototype._fields = [
    "target", function(n) { return n.target; },
    "op", function(n) { return n.op; },
    "value", function(n) { return n.value; }
];
Print.prototype._astname = "Print";
Print.prototype._fields = [
    "dest", function(n) { return n.dest; },
    "values", function(n) { return n.values; },
    "nl", function(n) { return n.nl; }
];
For_.prototype._astname = "For";
For_.prototype._fields = [
    "target", function(n) { return n.target; },
    "iter", function(n) { return n.iter; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
While_.prototype._astname = "While";
While_.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
If_.prototype._astname = "If";
If_.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
With_.prototype._astname = "With";
With_.prototype._fields = [
    "context_expr", function(n) { return n.context_expr; },
    "optional_vars", function(n) { return n.optional_vars; },
    "body", function(n) { return n.body; }
];
Raise.prototype._astname = "Raise";
Raise.prototype._fields = [
    "type", function(n) { return n.type; },
    "inst", function(n) { return n.inst; },
    "tback", function(n) { return n.tback; }
];
TryExcept.prototype._astname = "TryExcept";
TryExcept.prototype._fields = [
    "body", function(n) { return n.body; },
    "handlers", function(n) { return n.handlers; },
    "orelse", function(n) { return n.orelse; }
];
TryFinally.prototype._astname = "TryFinally";
TryFinally.prototype._fields = [
    "body", function(n) { return n.body; },
    "finalbody", function(n) { return n.finalbody; }
];
Assert.prototype._astname = "Assert";
Assert.prototype._fields = [
    "test", function(n) { return n.test; },
    "msg", function(n) { return n.msg; }
];
Import_.prototype._astname = "Import";
Import_.prototype._fields = [
    "names", function(n) { return n.names; }
];
ImportFrom.prototype._astname = "ImportFrom";
ImportFrom.prototype._fields = [
    "module", function(n) { return n.module; },
    "names", function(n) { return n.names; },
    "level", function(n) { return n.level; }
];
Exec.prototype._astname = "Exec";
Exec.prototype._fields = [
    "body", function(n) { return n.body; },
    "globals", function(n) { return n.globals; },
    "locals", function(n) { return n.locals; }
];
Global.prototype._astname = "Global";
Global.prototype._fields = [
    "names", function(n) { return n.names; }
];
Expr.prototype._astname = "Expr";
Expr.prototype._fields = [
    "value", function(n) { return n.value; }
];
Pass.prototype._astname = "Pass";
Pass.prototype._fields = [
];
Break_.prototype._astname = "Break";
Break_.prototype._fields = [
];
Continue_.prototype._astname = "Continue";
Continue_.prototype._fields = [
];
BoolOp.prototype._astname = "BoolOp";
BoolOp.prototype._fields = [
    "op", function(n) { return n.op; },
    "values", function(n) { return n.values; }
];
BinOp.prototype._astname = "BinOp";
BinOp.prototype._fields = [
    "left", function(n) { return n.left; },
    "op", function(n) { return n.op; },
    "right", function(n) { return n.right; }
];
UnaryOp.prototype._astname = "UnaryOp";
UnaryOp.prototype._fields = [
    "op", function(n) { return n.op; },
    "operand", function(n) { return n.operand; }
];
Lambda.prototype._astname = "Lambda";
Lambda.prototype._fields = [
    "args", function(n) { return n.args; },
    "body", function(n) { return n.body; }
];
IfExp.prototype._astname = "IfExp";
IfExp.prototype._fields = [
    "test", function(n) { return n.test; },
    "body", function(n) { return n.body; },
    "orelse", function(n) { return n.orelse; }
];
Dict.prototype._astname = "Dict";
Dict.prototype._fields = [
    "keys", function(n) { return n.keys; },
    "values", function(n) { return n.values; }
];
ListComp.prototype._astname = "ListComp";
ListComp.prototype._fields = [
    "elt", function(n) { return n.elt; },
    "generators", function(n) { return n.generators; }
];
GeneratorExp.prototype._astname = "GeneratorExp";
GeneratorExp.prototype._fields = [
    "elt", function(n) { return n.elt; },
    "generators", function(n) { return n.generators; }
];
Yield.prototype._astname = "Yield";
Yield.prototype._fields = [
    "value", function(n) { return n.value; }
];
Compare.prototype._astname = "Compare";
Compare.prototype._fields = [
    "left", function(n) { return n.left; },
    "ops", function(n) { return n.ops; },
    "comparators", function(n) { return n.comparators; }
];
Call.prototype._astname = "Call";
Call.prototype._fields = [
    "func", function(n) { return n.func; },
    "args", function(n) { return n.args; },
    "keywords", function(n) { return n.keywords; },
    "starargs", function(n) { return n.starargs; },
    "kwargs", function(n) { return n.kwargs; }
];
Num.prototype._astname = "Num";
Num.prototype._fields = [
    "n", function(n) { return n.n; }
];
Str.prototype._astname = "Str";
Str.prototype._fields = [
    "s", function(n) { return n.s; }
];
Attribute.prototype._astname = "Attribute";
Attribute.prototype._fields = [
    "value", function(n) { return n.value; },
    "attr", function(n) { return n.attr; },
    "ctx", function(n) { return n.ctx; }
];
Subscript.prototype._astname = "Subscript";
Subscript.prototype._fields = [
    "value", function(n) { return n.value; },
    "slice", function(n) { return n.slice; },
    "ctx", function(n) { return n.ctx; }
];
Name.prototype._astname = "Name";
Name.prototype._fields = [
    "id", function(n) { return n.id; },
    "ctx", function(n) { return n.ctx; }
];
List.prototype._astname = "List";
List.prototype._fields = [
    "elts", function(n) { return n.elts; },
    "ctx", function(n) { return n.ctx; }
];
Tuple.prototype._astname = "Tuple";
Tuple.prototype._fields = [
    "elts", function(n) { return n.elts; },
    "ctx", function(n) { return n.ctx; }
];
Load.prototype._astname = "Load";
Load.prototype._isenum = true;
Store.prototype._astname = "Store";
Store.prototype._isenum = true;
Del.prototype._astname = "Del";
Del.prototype._isenum = true;
AugLoad.prototype._astname = "AugLoad";
AugLoad.prototype._isenum = true;
AugStore.prototype._astname = "AugStore";
AugStore.prototype._isenum = true;
Param.prototype._astname = "Param";
Param.prototype._isenum = true;
Ellipsis.prototype._astname = "Ellipsis";
Ellipsis.prototype._fields = [
];
Slice.prototype._astname = "Slice";
Slice.prototype._fields = [
    "lower", function(n) { return n.lower; },
    "upper", function(n) { return n.upper; },
    "step", function(n) { return n.step; }
];
ExtSlice.prototype._astname = "ExtSlice";
ExtSlice.prototype._fields = [
    "dims", function(n) { return n.dims; }
];
Index.prototype._astname = "Index";
Index.prototype._fields = [
    "value", function(n) { return n.value; }
];
And.prototype._astname = "And";
And.prototype._isenum = true;
Or.prototype._astname = "Or";
Or.prototype._isenum = true;
Add.prototype._astname = "Add";
Add.prototype._isenum = true;
Sub.prototype._astname = "Sub";
Sub.prototype._isenum = true;
Mult.prototype._astname = "Mult";
Mult.prototype._isenum = true;
Div.prototype._astname = "Div";
Div.prototype._isenum = true;
Mod.prototype._astname = "Mod";
Mod.prototype._isenum = true;
Pow.prototype._astname = "Pow";
Pow.prototype._isenum = true;
LShift.prototype._astname = "LShift";
LShift.prototype._isenum = true;
RShift.prototype._astname = "RShift";
RShift.prototype._isenum = true;
BitOr.prototype._astname = "BitOr";
BitOr.prototype._isenum = true;
BitXor.prototype._astname = "BitXor";
BitXor.prototype._isenum = true;
BitAnd.prototype._astname = "BitAnd";
BitAnd.prototype._isenum = true;
FloorDiv.prototype._astname = "FloorDiv";
FloorDiv.prototype._isenum = true;
Invert.prototype._astname = "Invert";
Invert.prototype._isenum = true;
Not.prototype._astname = "Not";
Not.prototype._isenum = true;
UAdd.prototype._astname = "UAdd";
UAdd.prototype._isenum = true;
USub.prototype._astname = "USub";
USub.prototype._isenum = true;
Eq.prototype._astname = "Eq";
Eq.prototype._isenum = true;
NotEq.prototype._astname = "NotEq";
NotEq.prototype._isenum = true;
Lt.prototype._astname = "Lt";
Lt.prototype._isenum = true;
LtE.prototype._astname = "LtE";
LtE.prototype._isenum = true;
Gt.prototype._astname = "Gt";
Gt.prototype._isenum = true;
GtE.prototype._astname = "GtE";
GtE.prototype._isenum = true;
Is.prototype._astname = "Is";
Is.prototype._isenum = true;
IsNot.prototype._astname = "IsNot";
IsNot.prototype._isenum = true;
In_.prototype._astname = "In";
In_.prototype._isenum = true;
NotIn.prototype._astname = "NotIn";
NotIn.prototype._isenum = true;
comprehension.prototype._astname = "comprehension";
comprehension.prototype._fields = [
    "target", function(n) { return n.target; },
    "iter", function(n) { return n.iter; },
    "ifs", function(n) { return n.ifs; }
];
ExceptHandler.prototype._astname = "ExceptHandler";
ExceptHandler.prototype._fields = [
    "type", function(n) { return n.type; },
    "name", function(n) { return n.name; },
    "body", function(n) { return n.body; }
];
arguments_.prototype._astname = "arguments";
arguments_.prototype._fields = [
    "args", function(n) { return n.args; },
    "vararg", function(n) { return n.vararg; },
    "kwarg", function(n) { return n.kwarg; },
    "defaults", function(n) { return n.defaults; }
];
keyword.prototype._astname = "keyword";
keyword.prototype._fields = [
    "arg", function(n) { return n.arg; },
    "value", function(n) { return n.value; }
];
alias.prototype._astname = "alias";
alias.prototype._fields = [
    "name", function(n) { return n.name; },
    "asname", function(n) { return n.asname; }
];

//
// This is pretty much a straight port of ast.c from CPython 2.6.5.
//
// The previous version was easier to work with and more JS-ish, but having a
// somewhat different ast structure than cpython makes testing more difficult.
//
// This way, we can use a dump from the ast module on any arbitrary python
// code and know that we're the same up to ast level, at least.
//

var SYM = Sk.ParseTables.sym;
var TOK = Sk.Tokenizer.Tokens;

/** @constructor */
function Compiling(encoding, filename)
{
    this.c_encoding = encoding;
    this.c_filename = filename;
}

/**
 * @return {number}
 */
function NCH(n) { goog.asserts.assert(n !== undefined); if (n.children === null) return 0; return n.children.length; }

function CHILD(n, i)
{
    goog.asserts.assert(n !== undefined);
    goog.asserts.assert(i !== undefined);
    return n.children[i];
}

function REQ(n, type) { goog.asserts.assert(n.type === type, "node wasn't expected type"); }

function strobj(s)
{
    goog.asserts.assert(typeof s === "string", "expecting string, got " + (typeof s));
    return new Sk.builtin.str(s);
}

/** @return {number} */
function numStmts(n)
{
    switch (n.type)
    {
        case SYM.single_input:
            if (CHILD(n, 0).type === TOK.T_NEWLINE)
                return 0;
            else
                return numStmts(CHILD(n, 0));
        case SYM.file_input:
            var cnt = 0;
            for (var i = 0; i < NCH(n); ++i)
            {
                var ch = CHILD(n, i);
                if (ch.type === SYM.stmt)
                    cnt += numStmts(ch);
            }
            return cnt;
        case SYM.stmt:
            return numStmts(CHILD(n, 0));
        case SYM.compound_stmt:
            return 1;
        case SYM.simple_stmt:
            return Math.floor(NCH(n) / 2); // div 2 is to remove count of ;s
        case SYM.suite:
            if (NCH(n) === 1)
                return numStmts(CHILD(n, 0));
            else
            {
                 var cnt = 0;
                 for (var i = 2; i < NCH(n) - 1; ++i)
                     cnt += numStmts(CHILD(n, i));
                 return cnt;
            }
        default:
            goog.asserts.fail("Non-statement found");
    }
    return 0;
}

function forbiddenCheck(c, n, x)
{
    if (x === "None") throw new Sk.builtin.SyntaxError("assignment to None");
    if (x === "True" || x === "False") throw new Sk.builtin.SyntaxError("assignment to True or False is forbidden");
}

/**
 * Set the context ctx for e, recursively traversing e.
 *
 * Only sets context for expr kinds that can appear in assignment context as
 * per the asdl file.
 */
function setContext(c, e, ctx, n)
{
    goog.asserts.assert(ctx !== AugStore && ctx !== AugLoad);
    var s = null;
    var exprName = null;

    switch (e.constructor)
    {
        case Attribute:
        case Name:
            if (ctx === Store) forbiddenCheck(c, n, e.attr);
            e.ctx = ctx;
            break;
        case Subscript:
            e.ctx = ctx;
            break;
        case List:
            e.ctx = ctx;
            s = e.elts;
            break;
        case Tuple:
            if (e.elts.length === 0)
                throw new Sk.builtin.SyntaxError("can't assign to ()");
            e.ctx = ctx;
            s = e.elts;
            break;
        case Lambda:
            exprName = "lambda";
            break;
        case Call:
            exprName = "function call";
            break;
        case BoolOp:
        case BinOp:
        case UnaryOp:
            exprName = "operator";
            break;
        case GeneratorExp:
            exprName = "generator expression";
            break;
        case Yield:
            exprName = "yield expression";
            break;
        case ListComp:
            exprName = "list comprehension";
            break;
        case Dict:
        case Num:
        case Str:
            exprName = "literal";
            break;
        case Compare:
            exprName = "comparison";
            break;
        case IfExp:
            exprName = "conditional expression";
            break;
        default:
            goog.asserts.fail("unhandled expression in assignment");
    }
    if (exprName)
    {
        throw new Sk.builtin.SyntaxError("can't " + (ctx === Store ? "assign to" : "delete") + " " + exprName);
    }

    if (s)
    {
        for (var i = 0; i < s.length; ++i)
        {
            setContext(c, s[i], ctx, n);
        }
    }
}

var operatorMap = {};
(function() {
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_VBAR] = BitOr;
    operatorMap[TOK.T_CIRCUMFLEX] = BitXor;
    operatorMap[TOK.T_AMPER] = BitAnd;
    operatorMap[TOK.T_LEFTSHIFT] = LShift;
    operatorMap[TOK.T_RIGHTSHIFT] = RShift;
    operatorMap[TOK.T_PLUS] = Add;
    operatorMap[TOK.T_MINUS] = Sub;
    operatorMap[TOK.T_STAR] = Mult;
    operatorMap[TOK.T_SLASH] = Div;
    operatorMap[TOK.T_DOUBLESLASH] = FloorDiv;
    operatorMap[TOK.T_PERCENT] = Mod;
}());
function getOperator(n)
{
    goog.asserts.assert(operatorMap[n.type] !== undefined);
    return operatorMap[n.type];
}

function astForCompOp(c, n)
{
    /* comp_op: '<'|'>'|'=='|'>='|'<='|'<>'|'!='|'in'|'not' 'in'|'is'
               |'is' 'not'
    */
    REQ(n, SYM.comp_op);
    if (NCH(n) === 1)
    {
        n = CHILD(n, 0);
        switch (n.type)
        {
            case TOK.T_LESS: return Lt;
            case TOK.T_GREATER: return Gt;
            case TOK.T_EQEQUAL: return Eq;
            case TOK.T_LESSEQUAL: return LtE;
            case TOK.T_GREATEREQUAL: return GtE;
            case TOK.T_NOTEQUAL: return NotEq;
            case TOK.T_NAME:
                if (n.value === "in") return In_;
                if (n.value === "is") return Is;
        }
    }
    else if (NCH(n) === 2)
    {
        if (CHILD(n, 0).type === TOK.T_NAME)
        {
            if (CHILD(n, 1).value === "in") return NotIn;
            if (CHILD(n, 0).value === "is") return IsNot;
        }
    }
    goog.asserts.fail("invalid comp_op");
}

function seqForTestlist(c, n)
{
    /* testlist: test (',' test)* [','] */
    goog.asserts.assert(n.type === SYM.testlist ||
            n.type === SYM.listmaker ||
            n.type === SYM.testlist_gexp ||
            n.type === SYM.testlist_safe ||
            n.type === SYM.testlist1);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2)
    {
        goog.asserts.assert(CHILD(n, i).type === SYM.test || CHILD(n, i).type === SYM.old_test);
        seq[i / 2] = astForExpr(c, CHILD(n, i));
    }
    return seq;
}

function astForSuite(c, n)
{
    /* suite: simple_stmt | NEWLINE INDENT stmt+ DEDENT */
    REQ(n, SYM.suite);
    var seq = [];
    var pos = 0;
    var ch;
    if (CHILD(n, 0).type === SYM.simple_stmt)
    {
        n = CHILD(n, 0);
        /* simple_stmt always ends with an NEWLINE and may have a trailing
         * SEMI. */
        var end = NCH(n) - 1;
        if (CHILD(n, end - 1).type === TOK.T_SEMI)
            end -= 1;
        for (var i = 0; i < end; i += 2) // by 2 to skip ;
            seq[pos++] = astForStmt(c, CHILD(n, i));
    }
    else
    {
        for (var i = 2; i < NCH(n) - 1; ++i)
        {
            ch = CHILD(n, i);
            REQ(ch, SYM.stmt);
            var num = numStmts(ch);
            if (num === 1)
            {
                // small_stmt or compound_stmt w/ only 1 child
                seq[pos++] = astForStmt(c, ch);
            }
            else
            {
                ch = CHILD(ch, 0);
                REQ(ch, SYM.simple_stmt);
                for (var j = 0; j < NCH(ch); j += 2)
                {
                    if (NCH(CHILD(ch, j)) === 0)
                    {
                        goog.asserts.assert(j + 1 === NCH(ch));
                        break;
                    }
                    seq[pos++] = astForStmt(c, CHILD(ch, j));
                }
            }
        }
    }
    goog.asserts.assert(pos === numStmts(n));
    return seq;
}

function astForExceptClause(c, exc, body)
{
    /* except_clause: 'except' [test [(',' | 'as') test]] */
    REQ(exc, SYM.except_clause);
    REQ(body, SYM.suite);
    if (NCH(exc) === 1)
        return new ExceptHandler(null, null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 2)
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), null, astForSuite(c, body), exc.lineno, exc.col_offset);
    else if (NCH(exc) === 4)
    {
        var e = astForExpr(c, CHILD(exc, 3));
        setContext(c, e, Store, CHILD(exc, 3));
        return new ExceptHandler(astForExpr(c, CHILD(exc, 1)), e, astForSuite(c, body), exc.lineno, exc.col_offset);
    }
    goog.asserts.fail("wrong number of children for except clause");
}

function astForTryStmt(c, n)
{
    var nc = NCH(n);
    var nexcept = (nc - 3) / 3;
    var body, orelse = [], finally_ = null;

    REQ(n, SYM.try_stmt);
    body = astForSuite(c, CHILD(n, 2));
    if (CHILD(n, nc - 3).type === TOK.T_NAME)
    {
        if (CHILD(n, nc - 3).value === "finally")
        {
            if (nc >= 9 && CHILD(n, nc - 6).type === TOK.T_NAME)
            {
                /* we can assume it's an "else",
                   because nc >= 9 for try-else-finally and
                   it would otherwise have a type of except_clause */
                orelse = astForSuite(c, CHILD(n, nc - 4));
                nexcept--;
            }

            finally_ = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
        else
        {
            /* we can assume it's an "else",
               otherwise it would have a type of except_clause */
            orelse = astForSuite(c, CHILD(n, nc - 1));
            nexcept--;
        }
    }
    else if (CHILD(n, nc - 3).type !== SYM.except_clause)
    {
        throw new Sk.builtin.SyntaxError("malformed 'try' statement");
    }

    if (nexcept > 0)
    {
        var handlers = [];
        for (var i = 0; i < nexcept; ++i)
            handlers[i] = astForExceptClause(c, CHILD(n, 3 + i * 3), CHILD(n, 5 + i * 3));
        var exceptSt = new TryExcept(body, handlers, orelse, n.lineno, n.col_offset);

        if (!finally_)
            return exceptSt;

        /* if a 'finally' is present too, we nest the TryExcept within a
           TryFinally to emulate try ... except ... finally */
        body = [exceptSt];
    }

    goog.asserts.assert(finally_ !== null);
    return new TryFinally(body, finally_, n.lineno, n.col_offset);
}


function astForDottedName(c, n)
{
    REQ(n, SYM.dotted_name);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    var id = strobj(CHILD(n, 0).value);
    var e = new Name(id, Load, lineno, col_offset);
    for (var i = 2; i < NCH(n); i += 2)
    {
        id = strobj(CHILD(n, i).value);
        e = new Attribute(e, id, Load, lineno, col_offset);
    }
    return e;
}

function astForDecorator(c, n)
{
    /* decorator: '@' dotted_name [ '(' [arglist] ')' ] NEWLINE */
    REQ(n, SYM.decorator);
    REQ(CHILD(n, 0), TOK.T_AT);
    REQ(CHILD(n, NCH(n) - 1), TOK.T_NEWLINE);
    var nameExpr = astForDottedName(c, CHILD(n, 1));
    var d;
    if (NCH(n) === 3) // no args
        return nameExpr;
    else if (NCH(n) === 5) // call with no args
        return new Call(nameExpr, [], [], null, null, n.lineno, n.col_offset);
    else
        return astForCall(c, CHILD(n, 3), nameExpr);
}

function astForDecorators(c, n)
{
    REQ(n, SYM.decorators);
    var decoratorSeq = [];
    for (var i = 0; i < NCH(n); ++i)
        decoratorSeq[i] = astForDecorator(c, CHILD(n, i));
    return decoratorSeq;
}

function astForDecorated(c, n)
{
    REQ(n, SYM.decorated);
    var decoratorSeq = astForDecorators(c, CHILD(n, 0));
    goog.asserts.assert(CHILD(n, 1).type === SYM.funcdef || CHILD(n, 1).type === SYM.classdef);

    var thing = null;
    if (CHILD(n, 1).type === SYM.funcdef)
        thing = astForFuncdef(c, CHILD(n, 1), decoratorSeq);
    else if (CHILD(n, 1) === SYM.classdef)
        thing = astForClassdef(c, CHILD(n, 1), decoratorSeq);
    if (thing)
    {
        thing.lineno = n.lineno;
        thing.col_offset = n.col_offset;
    }
    return thing;
}

function astForWithVar(c, n)
{
    REQ(n, SYM.with_var);
    return astForExpr(c, CHILD(n, 1));
}

function astForWithStmt(c, n)
{
    /* with_stmt: 'with' test [ with_var ] ':' suite */
    var suiteIndex = 3; // skip with, test, :
    goog.asserts.assert(n.type === SYM.with_stmt);
    var contextExpr = astForExpr(c, CHILD(n, 1));
    if (CHILD(n, 2).type === SYM.with_var)
    {
        var optionalVars = astForWithVar(c, CHILD(n, 2));
        setContext(c, optionalVars, Store, n);
        suiteIndex = 4;
    }
    return new With_(contextExpr, optionalVars, astForSuite(c, CHILD(n, suiteIndex)), n.lineno, n.col_offset);
}

function astForExecStmt(c, n)
{
    var expr1, globals = null, locals = null;
    var nchildren = NCH(n);
    goog.asserts.assert(nchildren === 2 || nchildren === 4 || nchildren === 6);

    /* exec_stmt: 'exec' expr ['in' test [',' test]] */
    REQ(n, SYM.exec_stmt);
    var expr1 = astForExpr(c, CHILD(n, 1));
    if (nchildren >= 4)
        globals = astForExpr(c, CHILD(n, 3));
    if (nchildren === 6)
        locals = astForExpr(c, CHILD(n, 5));
    return new Exec(expr1, globals, locals, n.lineno, n.col_offset);
}

function astForIfStmt(c, n)
{
    /* if_stmt: 'if' test ':' suite ('elif' test ':' suite)*
       ['else' ':' suite]
    */
    REQ(n, SYM.if_stmt);
    if (NCH(n) === 4)
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)),
                [], n.lineno, n.col_offset);

    var s = CHILD(n, 4).value;
    var decider = s.charAt(2); // elSe or elIf
    if (decider === 's')
    {
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)), 
                astForSuite(c, CHILD(n, 6)), 
                n.lineno, n.col_offset);
    }
    else if (decider === 'i')
    {
        var nElif = NCH(n) - 4;
        var hasElse = false;
        var orelse = [];
        
        /* must reference the child nElif+1 since 'else' token is third, not
         * fourth child from the end. */
        if (CHILD(n, nElif + 1).type === TOK.T_NAME
            && CHILD(n, nElif + 1).value.charAt(2) === 's')
        {
            hasElse = true;
            nElif -= 3;
        }
        nElif /= 4;

        if (hasElse)
        {
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, NCH(n) - 6)),
                    astForSuite(c, CHILD(n, NCH(n) - 4)),
                    astForSuite(c, CHILD(n, NCH(n) - 1)),
                    CHILD(n, NCH(n) - 6).lineno,
                    CHILD(n, NCH(n) - 6).col_offset)];
            nElif--;
        }

        for (var i = 0; i < nElif; ++i)
        {
            var off = 5 + (nElif - i - 1) * 4;
            orelse = [
                new If_(
                    astForExpr(c, CHILD(n, off)),
                    astForSuite(c, CHILD(n, off + 2)),
                    orelse,
                    CHILD(n, off).lineno,
                    CHILD(n, off).col_offset)];
        }
        return new If_(
                astForExpr(c, CHILD(n, 1)),
                astForSuite(c, CHILD(n, 3)),
                orelse, n.lineno, n.col_offset);
    }
    
    goog.asserts.fail("unexpected token in 'if' statement");
}

function astForExprlist(c, n, context)
{
    REQ(n, SYM.exprlist);
    var seq = [];
    for (var i = 0; i < NCH(n); i += 2)
    {
        var e = astForExpr(c, CHILD(n, i));
        seq[i / 2] = e;
        if (context) setContext(c, e, context, CHILD(n, i));
    }
    return seq;
}

function astForDelStmt(c, n)
{
    /* del_stmt: 'del' exprlist */
    REQ(n, SYM.del_stmt);
    return new Delete_(astForExprlist(c, CHILD(n, 1), Del), n.lineno, n.col_offset);
}

function astForGlobalStmt(c, n)
{
    /* global_stmt: 'global' NAME (',' NAME)* */
    REQ(n, SYM.global_stmt);
    var s = [];
    for (var i = 1; i < NCH(n); i += 2)
    {
        s[(i - 1) / 2] = strobj(CHILD(n, i).value);
    }
    return new Global(s, n.lineno, n.col_offset);
}

function astForAssertStmt(c, n)
{
    /* assert_stmt: 'assert' test [',' test] */
    REQ(n, SYM.assert_stmt);
    if (NCH(n) === 2)
        return new Assert(astForExpr(c, CHILD(n, 1)), null, n.lineno, n.col_offset);
    else if (NCH(n) === 4)
        return new Assert(astForExpr(c, CHILD(n, 1)), astForExpr(c, CHILD(n, 3)), n.lineno, n.col_offset);
    goog.asserts.fail("improper number of parts to assert stmt");
}

function aliasForImportName(c, n)
{
    /*
      import_as_name: NAME ['as' NAME]
      dotted_as_name: dotted_name ['as' NAME]
      dotted_name: NAME ('.' NAME)*
    */

    loop: while (true) {
        switch (n.type)
        {
            case SYM.import_as_name:
                var str = null;
                var name = strobj(CHILD(n, 0).value);
                if (NCH(n) === 3)
                    str = CHILD(n, 2).value;
                return new alias(name, str == null ? null : strobj(str));
            case SYM.dotted_as_name:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue loop;
                }
                else
                {
                    var a = aliasForImportName(c, CHILD(n, 0));
                    goog.asserts.assert(!a.asname);
                    a.asname = strobj(CHILD(n, 2).value);
                    return a;
                }
            case SYM.dotted_name:
                if (NCH(n) === 1)
                    return new alias(strobj(CHILD(n, 0).value), null);
                else
                {
                    // create a string of the form a.b.c
                    var str = '';
                    for (var i = 0; i < NCH(n); i += 2)
                        str += CHILD(n, i).value + ".";
                    return new alias(strobj(str.substr(0, str.length - 1)), null);
                }
            case TOK.T_STAR:
                return new alias(strobj("*"), null);
            default:
                throw new Sk.builtin.SyntaxError("unexpected import name");
        }
    break; }
}

function astForImportStmt(c, n)
{
    /*
      import_stmt: import_name | import_from
      import_name: 'import' dotted_as_names
      import_from: 'from' ('.'* dotted_name | '.') 'import'
                          ('*' | '(' import_as_names ')' | import_as_names)
    */
    REQ(n, SYM.import_stmt);
    var lineno = n.lineno;
    var col_offset = n.col_offset;
    n = CHILD(n, 0);
    if (n.type === SYM.import_name)
    {
        n = CHILD(n, 1);
        REQ(n, SYM.dotted_as_names);
        var aliases = [];
        for (var i = 0; i < NCH(n); i += 2)
            aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        return new Import_(aliases, lineno, col_offset);
    }
    else if (n.type === SYM.import_from)
    {
        var mod = null;
        var ndots = 0;
        var nchildren;

        for (var idx = 1; idx < NCH(n); ++idx)
        {
            if (CHILD(n, idx).type === SYM.dotted_name)
            {
                mod = aliasForImportName(c, CHILD(n, idx));
                idx++;
                break;
            }
            else if (CHILD(n, idx).type !== TOK.T_DOT)
                break;
            ndots++;
        }
        ++idx; // skip the import keyword
        switch (CHILD(n, idx).type)
        {
            case TOK.T_STAR:
                // from ... import
                n = CHILD(n, idx);
                nchildren = 1;
                break;
            case TOK.T_LPAR:
                // from ... import (x, y, z)
                n = CHILD(n, idx + 1);
                nchildren = NCH(n);
                break;
            case SYM.import_as_names:
                // from ... import x, y, z
                n = CHILD(n, idx);
                nchildren = NCH(n);
                if (nchildren % 2 === 0)
                    throw new Sk.builtin.SyntaxError("trailing comma not allowed without surrounding parentheses");
                break;
            default:
                throw new Sk.builtin.SyntaxError("Unexpected node-type in from-import");
        }
        var aliases = [];
        if (n.type === TOK.T_STAR)
            aliases[0] = aliasForImportName(c, n);
        else
            for (var i = 0; i < NCH(n); i += 2)
                aliases[i / 2] = aliasForImportName(c, CHILD(n, i));
        var modname = mod ? mod.name.v : "";
        return new ImportFrom(strobj(modname), aliases, ndots, lineno, col_offset);
    }
    throw new Sk.builtin.SyntaxError("unknown import statement");
}

function astForTestlistGexp(c, n)
{
    /* testlist_gexp: test ( gen_for | (',' test)* [','] ) */
    /* argument: test [ gen_for ] */
    goog.asserts.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    if (NCH(n) > 1 && CHILD(n, 1).type === SYM.gen_for)
        return astForGenexp(c, n);
    return astForTestlist(c, n);
}

function astForListcomp(c, n)
{
    /* listmaker: test ( list_for | (',' test)* [','] )
       list_for: 'for' exprlist 'in' testlist_safe [list_iter]
       list_iter: list_for | list_if
       list_if: 'if' test [list_iter]
       testlist_safe: test [(',' test)+ [',']]
    */

    function countListFors(c, n)
    {
        var nfors = 0;
        var ch = CHILD(n, 1);
        count_list_for: while(true) {
            nfors++;
            REQ(ch, SYM.list_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_list_iter: while(true) {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.list_for)
                    continue count_list_for;
                else if (ch.type === SYM.list_if)
                {
                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 2);
                        continue count_list_iter;
                    }
                    else
                        return nfors;
                }
            break; }
        break; }
    }

    function countListIfs(c, n)
    {
        var nifs = 0;
        while (true)
        {
            REQ(n, SYM.list_iter);
            if (CHILD(n, 0).type === SYM.list_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.list_if);
            nifs++;
            if (NCH(n) == 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    REQ(n, SYM.listmaker);
    goog.asserts.assert(NCH(n) > 1);
    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countListFors(c, n);
    var listcomps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i)
    {
        REQ(ch, SYM.list_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForTestlist(c, CHILD(ch, 3));
        var lc;
        if (NCH(forch) === 1)
            lc = new comprehension(t[0], expression, []);
        else
            lc = new comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);

        if (NCH(ch) === 5)
        {
            ch = CHILD(ch, 4);
            var nifs = countListIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j)
            {
                REQ(ch, SYM.list_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.list_if);
                ifs[j] = astForExpr(c, CHILD(ch, 1));
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.list_iter)
                ch = CHILD(ch, 0);
            lc.ifs = ifs;
        }
        listcomps[i] = lc;
    }
    return new ListComp(elt, listcomps, n.lineno, n.col_offset);
}

function astForFactor(c, n)
{
    /* some random peephole thing that cpy does */
    if (CHILD(n, 0).type === TOK.T_MINUS && NCH(n) === 2)
    {
        var pfactor = CHILD(n, 1);
        if (pfactor.type === SYM.factor && NCH(pfactor) === 1)
        {
            var ppower = CHILD(pfactor, 0);
            if (ppower.type === SYM.power && NCH(ppower) === 1)
            {
                var patom = CHILD(ppower, 0);
                if (patom.type === SYM.atom)
                {
                    var pnum = CHILD(patom, 0);
                    if (pnum.type === TOK.T_NUMBER)
                    {
                        pnum.value = "-" + pnum.value;
                        return astForAtom(c, patom);
                    }
                }
            }
        }
    }

    var expression = astForExpr(c, CHILD(n, 1));
    switch (CHILD(n, 0).type)
    {
        case TOK.T_PLUS: return new UnaryOp(UAdd, expression, n.lineno, n.col_offset);
        case TOK.T_MINUS: return new UnaryOp(USub, expression, n.lineno, n.col_offset);
        case TOK.T_TILDE: return new UnaryOp(Invert, expression, n.lineno, n.col_offset);
    }

    goog.asserts.fail("unhandled factor");
}

function astForForStmt(c, n)
{
    /* for_stmt: 'for' exprlist 'in' testlist ':' suite ['else' ':' suite] */
    var seq = [];
    REQ(n, SYM.for_stmt);
    if (NCH(n) === 9)
        seq = astForSuite(c, CHILD(n, 8));
    var nodeTarget = CHILD(n, 1);
    var _target = astForExprlist(c, nodeTarget, Store);
    var target;
    if (NCH(nodeTarget) === 1)
        target = _target[0];
    else
        target = new Tuple(_target, Store, n.lineno, n.col_offset);

    return new For_(target,
            astForTestlist(c, CHILD(n, 3)),
            astForSuite(c, CHILD(n, 5)),
            seq, n.lineno, n.col_offset);
}

function astForCall(c, n, func)
{
    /*
      arglist: (argument ',')* (argument [',']| '*' test [',' '**' test]
               | '**' test)
      argument: [test '='] test [gen_for]        # Really [keyword '='] test
    */
    REQ(n, SYM.arglist);
    var nargs = 0;
    var nkeywords = 0;
    var ngens = 0;
    for (var i = 0; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument)
        {
            if (NCH(ch) === 1) nargs++;
            else if (CHILD(ch, 1).type === SYM.gen_for) ngens++;
            else nkeywords++;
        }
    }
    if (ngens > 1 || (ngens && (nargs || nkeywords)))
        throw new Sk.builtin.SyntaxError("Generator expression must be parenthesized if not sole argument");
    if (nargs + nkeywords + ngens > 255)
        throw new Sk.builtin.SyntaxError("more than 255 arguments");
    var args = [];
    var keywords = [];
    nargs = 0;
    nkeywords = 0;
    var vararg = null;
    var kwarg = null;
    for (var i = 0; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type === SYM.argument)
        {
            if (NCH(ch) === 1)
            {
                if (nkeywords) throw new Sk.builtin.SyntaxError("non-keyword arg after keyword arg");
                if (vararg) throw new Sk.builtin.SyntaxError("only named arguments may follow *expression");
                args[nargs++] = astForExpr(c, CHILD(ch, 0));
            }
            else if (CHILD(ch, 1).type === SYM.gen_for)
                args[nargs++] = astForGenexp(c, ch);
            else
            {
                var e = astForExpr(c, CHILD(ch, 0));
                if (e.constructor === Lambda) throw new Sk.builtin.SyntaxError("lambda cannot contain assignment");
                else if (e.constructor !== Name) throw new Sk.builtin.SyntaxError("keyword can't be an expression");
                var key = e.id;
                forbiddenCheck(c, CHILD(ch, 0), key);
                for (var k = 0; k < nkeywords; ++k)
                {
                    var tmp = keywords[k].arg;
                    if (tmp === key) throw new Sk.builtin.SyntaxError("keyword argument repeated");
                }
                keywords[nkeywords++] = new keyword(key, astForExpr(c, CHILD(ch, 2)));
            }
        }
        else if (ch.type === TOK.T_STAR)
            vararg = astForExpr(c, CHILD(n, ++i));
        else if (ch.type === TOK.T_DOUBLESTAR)
            kwarg = astForExpr(c, CHILD(n, ++i));
    }
    return new Call(func, args, keywords, vararg, kwarg, func.lineno, func.col_offset);
}

function astForTrailer(c, n, leftExpr)
{
    /* trailer: '(' [arglist] ')' | '[' subscriptlist ']' | '.' NAME 
       subscriptlist: subscript (',' subscript)* [',']
       subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
     */
    REQ(n, SYM.trailer);
    if (CHILD(n, 0).type === TOK.T_LPAR)
    {
        if (NCH(n) === 2)
            return new Call(leftExpr, [], [], null, null, n.lineno, n.col_offset);
        else
            return astForCall(c, CHILD(n, 1), leftExpr);
    }
    else if (CHILD(n, 0).type === TOK.T_DOT)
        return new Attribute(leftExpr, strobj(CHILD(n, 1).value), Load, n.lineno, n.col_offset);
    else
    {
        REQ(CHILD(n, 0), TOK.T_LSQB);
        REQ(CHILD(n, 2), TOK.T_RSQB);
        n = CHILD(n, 1);
        if (NCH(n) === 1)
            return new Subscript(leftExpr, astForSlice(c, CHILD(n, 0)), Load, n.lineno, n.col_offset);
        else
        {
            /* The grammar is ambiguous here. The ambiguity is resolved 
               by treating the sequence as a tuple literal if there are
               no slice features.
            */
            var simple = true;
            var slices = [];
            for (var j = 0; j < NCH(n); j += 2)
            {
                var slc = astForSlice(c, CHILD(n, j));
                if (slc.constructor !== Index)
                    simple = false;
                slices[j / 2] = slc;
            }
            if (!simple)
            {
                return new Subscript(leftExpr, new ExtSlice(slices), Load, n.lineno, n.col_offset);
            }
            var elts = [];
            for (var j = 0; j < slices.length; ++j)
            {
                var slc = slices[j];
                goog.asserts.assert(slc.constructor === Index && slc.value !== null && slc.value !== undefined);
                elts[j] = slc.value;
            }
            var e = new Tuple(elts, Load, n.lineno, n.col_offset);
            return new Subscript(leftExpr, new Index(e), Load, n.lineno, n.col_offset);
        }
    }
}

function astForFlowStmt(c, n)
{
    /*
      flow_stmt: break_stmt | continue_stmt | return_stmt | raise_stmt
                 | yield_stmt
      break_stmt: 'break'
      continue_stmt: 'continue'
      return_stmt: 'return' [testlist]
      yield_stmt: yield_expr
      yield_expr: 'yield' testlist
      raise_stmt: 'raise' [test [',' test [',' test]]]
    */
    var ch;
    REQ(n, SYM.flow_stmt);
    ch = CHILD(n, 0);
    switch (ch.type)
    {
        case SYM.break_stmt: return new Break_(n.lineno, n.col_offset);
        case SYM.continue_stmt: return new Continue_(n.lineno, n.col_offset);
        case SYM.yield_stmt:
            return new Expr(astForExpr(c, CHILD(ch, 0)), n.lineno, n.col_offset);
        case SYM.return_stmt:
            if (NCH(ch) === 1)
                return new Return_(null, n.lineno, n.col_offset);
            else
                return new Return_(astForTestlist(c, CHILD(ch, 1)), n.lineno, n.col_offset);
        case SYM.raise_stmt:
            if (NCH(ch) === 1)
                return new Raise(null, null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 2)
                return new Raise(astForExpr(c, CHILD(ch, 1)), null, null, n.lineno, n.col_offset);
            else if (NCH(ch) === 4)
                return new Raise(
                        astForExpr(c, CHILD(ch, 1)),
                        astForExpr(c, CHILD(ch, 3)),
                        null, n.lineno, n.col_offset);
            else if (NCH(ch) === 6)
                return new Raise(
                        astForExpr(c, CHILD(ch, 1)),
                        astForExpr(c, CHILD(ch, 3)),
                        astForExpr(c, CHILD(ch, 5)),
                        n.lineno, n.col_offset);
        default:
            goog.asserts.fail("unexpected flow_stmt");
    }
    goog.asserts.fail("unhandled flow statement");
}

function astForArguments(c, n)
{
    /* parameters: '(' [varargslist] ')'
       varargslist: (fpdef ['=' test] ',')* ('*' NAME [',' '**' NAME]
            | '**' NAME) | fpdef ['=' test] (',' fpdef ['=' test])* [',']
    */
    var ch;
    var vararg = null;
    var kwarg = null;
    if (n.type === SYM.parameters)
    {
        if (NCH(n) === 2) // () as arglist
            return new arguments_([], null, null, []);
        n = CHILD(n, 1);
    }
    REQ(n, SYM.varargslist);

    var args = [];
    var defaults = [];

    /* fpdef: NAME | '(' fplist ')'
       fplist: fpdef (',' fpdef)* [',']
    */
    var foundDefault = false;
    var i = 0;
    var j = 0; // index for defaults
    var k = 0; // index for args
    while (i < NCH(n))
    {
        ch = CHILD(n, i);
        switch (ch.type)
        {
            case SYM.fpdef:
                var complexArgs = 0;
                var parenthesized = 0;
                handle_fpdef: while (true) {
                    if (i + 1 < NCH(n) && CHILD(n, i + 1).type === TOK.T_EQUAL)
                    {
                        defaults[j++] = astForExpr(c, CHILD(n, i + 2));
                        i += 2;
                        foundDefault = true;
                    }
                    else if (foundDefault)
                    {
                        /* def f((x)=4): pass should raise an error.
                           def f((x, (y))): pass will just incur the tuple unpacking warning. */
                        if (parenthesized && !complexArgs)
                            throw new Sk.builtin.SyntaxError("parenthesized arg with default");
                        throw new Sk.builtin.SyntaxError("non-default argument follows default argument");
                    }

                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 1);
                        // def foo((x)): is not complex, special case.
                        if (NCH(ch) !== 1)
                        {
                            throw new Sk.builtin.SyntaxError("tuple parameter unpacking has been removed", this.c_filename, n.lineno);
                        }
                        else
                        {
                            /* def foo((x)): setup for checking NAME below. */
                            /* Loop because there can be many parens and tuple
                               unpacking mixed in. */
                            parenthesized = true;
                            ch = CHILD(ch, 0);
                            goog.asserts.assert(ch.type === SYM.fpdef);
                            continue handle_fpdef;
                        }
                    }
                    if (CHILD(ch, 0).type === TOK.T_NAME)
                    {
                        forbiddenCheck(c, n, CHILD(ch, 0).value);
                        var id = strobj(CHILD(ch, 0).value);
                        args[k++] = new Name(id, Param, ch.lineno, ch.col_offset);
                    }
                    i += 2;
                    if (parenthesized)
                        throw new Sk.builtin.SyntaxError("parenthesized argument names are invalid");
                break; }
                break;
            case TOK.T_STAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value);
                vararg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            case TOK.T_DOUBLESTAR:
                forbiddenCheck(c, CHILD(n, i + 1), CHILD(n, i + 1).value);
                kwarg = strobj(CHILD(n, i + 1).value);
                i += 3;
                break;
            default:
                goog.asserts.fail("unexpected node in varargslist");
        }
    }
    return new arguments_(args, vararg, kwarg, defaults);
}

function astForFuncdef(c, n, decoratorSeq)
{
    /* funcdef: 'def' NAME parameters ':' suite */
    REQ(n, SYM.funcdef);
    var name = strobj(CHILD(n, 1).value);
    forbiddenCheck(c, CHILD(n, 1), CHILD(n, 1).value);
    var args = astForArguments(c, CHILD(n, 2));
    var body = astForSuite(c, CHILD(n, 4));
    return new FunctionDef(name, args, body, decoratorSeq, n.lineno, n.col_offset);
}

function astForClassBases(c, n)
{
    /* testlist: test (',' test)* [','] */
    goog.asserts.assert(NCH(n) > 0);
    REQ(n, SYM.testlist);
    if (NCH(n) === 1)
        return [ astForExpr(c, CHILD(n, 0)) ];
    return seqForTestlist(c, n);
}

function astForClassdef(c, n, decoratorSeq)
{
    /* classdef: 'class' NAME ['(' testlist ')'] ':' suite */
    REQ(n, SYM.classdef);
    forbiddenCheck(c, n, CHILD(n, 1).value);
    var classname = strobj(CHILD(n, 1).value);
    if (NCH(n) === 4)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 3)), decoratorSeq, n.lineno, n.col_offset);
    if (CHILD(n, 3).type === TOK.T_RPAR)
        return new ClassDef(classname, [], astForSuite(c, CHILD(n, 5)), decoratorSeq, n.lineno, n.col_offset);

    var bases = astForClassBases(c, CHILD(n, 3));
    var s = astForSuite(c, CHILD(n, 6));
    return new ClassDef(classname, bases, s, decoratorSeq, n.lineno, n.col_offset);
}

function astForLambdef(c, n)
{
    /* lambdef: 'lambda' [varargslist] ':' test */
    var args;
    var expression;
    if (NCH(n) === 3)
    {
        args = new arguments_([], null, null, []);
        expression = astForExpr(c, CHILD(n, 2));
    }
    else
    {
        args = astForArguments(c, CHILD(n, 1));
        expression = astForExpr(c, CHILD(n, 3));
    }
    return new Lambda(args, expression, n.lineno, n.col_offset);
}

function astForGenexp(c, n)
{
    /* testlist_gexp: test ( gen_for | (',' test)* [','] )
       argument: [test '='] test [gen_for]       # Really [keyword '='] test */
    goog.asserts.assert(n.type === SYM.testlist_gexp || n.type === SYM.argument);
    goog.asserts.assert(NCH(n) > 1);

    function countGenFors(c, n)
    {
        var nfors = 0;
        var ch = CHILD(n, 1);
        count_gen_for: while(true) {
            nfors++;
            REQ(ch, SYM.gen_for);
            if (NCH(ch) === 5)
                ch = CHILD(ch, 4);
            else
                return nfors;
            count_gen_iter: while(true) {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                if (ch.type === SYM.gen_for)
                    continue count_gen_for;
                else if (ch.type === SYM.gen_if)
                {
                    if (NCH(ch) === 3)
                    {
                        ch = CHILD(ch, 2);
                        continue count_gen_iter;
                    }
                    else
                        return nfors;
                }
            break; }
        break; }
        goog.asserts.fail("logic error in countGenFors");
    }

    function countGenIfs(c, n)
    {
        var nifs = 0;
        while (true)
        {
            REQ(n, SYM.gen_iter);
            if (CHILD(n, 0).type === SYM.gen_for)
                return nifs;
            n = CHILD(n, 0);
            REQ(n, SYM.gen_if);
            nifs++;
            if (NCH(n) == 2)
                return nifs;
            n = CHILD(n, 2);
        }
    }

    var elt = astForExpr(c, CHILD(n, 0));
    var nfors = countGenFors(c, n);
    var genexps = [];
    var ch = CHILD(n, 1);
    for (var i = 0; i < nfors; ++i)
    {
        REQ(ch, SYM.gen_for);
        var forch = CHILD(ch, 1);
        var t = astForExprlist(c, forch, Store);
        var expression = astForExpr(c, CHILD(ch, 3));
        var ge;
        if (NCH(forch) === 1)
            ge = new comprehension(t[0], expression, []);
        else
            ge = new comprehension(new Tuple(t, Store, ch.lineno, ch.col_offset), expression, []);
        if (NCH(ch) === 5)
        {
            ch = CHILD(ch, 4);
            var nifs = countGenIfs(c, ch);
            var ifs = [];
            for (var j = 0; j < nifs; ++j)
            {
                REQ(ch, SYM.gen_iter);
                ch = CHILD(ch, 0);
                REQ(ch, SYM.gen_if);
                expression = astForExpr(c, CHILD(ch, 1));
                ifs[j] = expression;
                if (NCH(ch) === 3)
                    ch = CHILD(ch, 2);
            }
            if (ch.type === SYM.gen_iter)
                ch = CHILD(ch, 0);
            ge.ifs = ifs;
        }
        genexps[i] = ge;
    }
    return new GeneratorExp(elt, genexps, n.lineno, n.col_offset);
}

function astForWhileStmt(c, n)
{
    /* while_stmt: 'while' test ':' suite ['else' ':' suite] */
    REQ(n, SYM.while_stmt);
    if (NCH(n) === 4)
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), [], n.lineno, n.col_offset);
    else if (NCH(n) === 7)
        return new While_(astForExpr(c, CHILD(n, 1)), astForSuite(c, CHILD(n, 3)), astForSuite(c, CHILD(n, 6)), n.lineno, n.col_offset);
    goog.asserts.fail("wrong number of tokens for 'while' stmt");
}

function astForAugassign(c, n)
{
    REQ(n, SYM.augassign);
    n = CHILD(n, 0);
    switch (n.value.charAt(0))
    {
        case '+': return Add;
        case '-': return Sub;
        case '/': if (n.value.charAt(1) === '/') return FloorDiv;
                  return Div;
        case '%': return Mod;
        case '<': return LShift;
        case '>': return RShift;
        case '&': return BitAnd;
        case '^': return BitXor;
        case '|': return BitOr;
        case '*': if (n.value.charAt(1) === '*') return Pow;
                  return Mult;
        default: goog.asserts.fail("invalid augassign");
    }
}

function astForBinop(c, n)
{
    /* Must account for a sequence of expressions.
        How should A op B op C by represented?  
        BinOp(BinOp(A, op, B), op, C).
    */
    var result = new BinOp(
            astForExpr(c, CHILD(n, 0)),
            getOperator(CHILD(n, 1)),
            astForExpr(c, CHILD(n, 2)),
            n.lineno, n.col_offset);
    var nops = (NCH(n) - 1) / 2;
    for (var i = 1 ; i < nops; ++i)
    {
        var nextOper = CHILD(n, i * 2 + 1);
        var newoperator = getOperator(nextOper);
        var tmp = astForExpr(c, CHILD(n, i * 2 + 2));
        result = new BinOp(result, newoperator, tmp, nextOper.lineno, nextOper.col_offset);
    }
    return result;

}

function astForTestlist(c, n)
{
    /* testlist_gexp: test (',' test)* [','] */
    /* testlist: test (',' test)* [','] */
    /* testlist_safe: test (',' test)+ [','] */
    /* testlist1: test (',' test)* */
    goog.asserts.assert(NCH(n) > 0);
    if (n.type === SYM.testlist_gexp)
    {
        if (NCH(n) > 1)
        {
            goog.asserts.assert(CHILD(n, 1).type !== SYM.gen_for);
        }
    }
    else
    {
        goog.asserts.assert(n.type === SYM.testlist || n.type === SYM.testlist_safe || n.type === SYM.testlist1);
    }

    if (NCH(n) === 1)
    {
        return astForExpr(c, CHILD(n, 0));
    }
    else
    {
        return new Tuple(seqForTestlist(c, n), Load, n.lineno, n.col_offset);
    }

}

function astForExprStmt(c, n)
{
    REQ(n, SYM.expr_stmt);
    /* expr_stmt: testlist (augassign (yield_expr|testlist) 
                | ('=' (yield_expr|testlist))*)
       testlist: test (',' test)* [',']
       augassign: '+=' | '-=' | '*=' | '/=' | '%=' | '&=' | '|=' | '^='
                | '<<=' | '>>=' | '**=' | '//='
       test: ... here starts the operator precendence dance
     */
    if (NCH(n) === 1)
        return new Expr(astForTestlist(c, CHILD(n, 0)), n.lineno, n.col_offset);
    else if (CHILD(n, 1).type === SYM.augassign)
    {
        var ch = CHILD(n, 0);
        var expr1 = astForTestlist(c, ch);
        switch (expr1.constructor)
        {
            case GeneratorExp: throw new Sk.builtin.SyntaxError("augmented assignment to generator expression not possible");
            case Yield: throw new Sk.builtin.SyntaxError("augmented assignment to yield expression not possible");
            case Name:
                var varName = expr1.id;
                forbiddenCheck(c, ch, varName);
                break;
            case Attribute:
            case Subscript:
                break;
            default:
                throw new Sk.builtin.SyntaxError("illegal expression for augmented assignment");
        }
        setContext(c, expr1, Store, ch);

        ch = CHILD(n, 2);
        var expr2;
        if (ch.type === SYM.testlist)
            expr2 = astForTestlist(c, ch);
        else
            expr2 = astForExpr(c, ch);

        return new AugAssign(expr1, astForAugassign(c, CHILD(n, 1)), expr2, n.lineno, n.col_offset);
    }
    else
    {
        // normal assignment
        REQ(CHILD(n, 1), TOK.T_EQUAL);
        var targets = [];
        for (var i = 0; i < NCH(n) - 2; i += 2)
        {
            var ch = CHILD(n, i);
            if (ch.type === SYM.yield_expr) throw new Sk.builtin.SyntaxError("assignment to yield expression not possible");
            var e = astForTestlist(c, ch);
            setContext(c, e, Store, CHILD(n, i));
            targets[i / 2] = e;
        }
        var value = CHILD(n, NCH(n) - 1);
        var expression;
        if (value.type === SYM.testlist)
            expression = astForTestlist(c, value);
        else
            expression = astForExpr(c, value);
        return new Assign(targets, expression, n.lineno, n.col_offset);
    }
}

function astForIfexpr(c, n)
{
    /* test: or_test 'if' or_test 'else' test */ 
    goog.asserts.assert(NCH(n) === 5);
    return new IfExp(
            astForExpr(c, CHILD(n, 2)),
            astForExpr(c, CHILD(n, 0)),
            astForExpr(c, CHILD(n, 4)),
            n.lineno, n.col_offset);
}

/**
 * s is a python-style string literal, including quote characters and u/r/b
 * prefixes. Returns decoded string object.
 */
function parsestr(c, s)
{
    var encodeUtf8 = function(s) { return unescape(encodeURIComponent(s)); };
    var decodeUtf8 = function(s) { return decodeURIComponent(escape(s)); };
    var decodeEscape = function(s, quote)
    {
        var len = s.length;
        var ret = '';
        for (var i = 0; i < len; ++i)
        {
            var c = s[i];
            if (c === '\\')
            {
                ++i;
                c = s[i];
                if (c === 'n') ret += "\n";
                else if (c === '\\') ret += "\\";
                else if (c === 't') ret += "\t";
                else if (c === 'r') ret += "\r";
                else if (c === '0') ret += "\0";
                else if (c === '"') ret += '"';
                else if (c === '\'') ret += '\'';
                else if (c === '\n') /* escaped newline, join lines */ {}
                else if (c === 'x')
                {
                    var d0 = s[++i];
                    var d1 = s[++i];
                    ret += String.fromCharCode(parseInt(d0+d1, 16));
                }
                else if (c === 'u' || c === 'U')
                {
                    var d0 = s[++i];
                    var d1 = s[++i];
                    var d2 = s[++i];
                    var d3 = s[++i];
                    ret += String.fromCharCode(parseInt(d0+d1, 16), parseInt(d2+d3, 16));
                }
                else
                {
                    goog.asserts.fail("unhandled escape: '" + c.charCodeAt(0) + "'");
                }
            }
            else
            {
                ret += c;
            }
        }
        return ret;
    };

    //print("parsestr", s);

    var quote = s.charAt(0);
    var rawmode = false;

    if (quote === 'u' || quote === 'U')
    {
        s = s.substr(1);
        quote = s.charAt(0);
    }
    else if (quote === 'r' || quote === 'R')
    {
        s = s.substr(1);
        quote = s.charAt(0);
        rawmode = true;
    }
    goog.asserts.assert(quote !== 'b' && quote !== 'B', "todo; haven't done b'' strings yet");

    goog.asserts.assert(quote === "'" || quote === '"' && s.charAt(s.length - 1) === quote);
    s = s.substr(1, s.length - 2);

    if (s.length >= 4 && s.charAt(0) === quote && s.charAt(1) === quote)
    {
        goog.asserts.assert(s.charAt(s.length - 1) === quote && s.charAt(s.length - 2) === quote);
        s = s.substr(2, s.length - 4);
    }

    if (rawmode || s.indexOf('\\') === -1)
    {
        return strobj(decodeUtf8(s));
    }
    return strobj(decodeEscape(s, quote));
}

function parsestrplus(c, n)
{
    REQ(CHILD(n, 0), TOK.T_STRING);
    var ret = new Sk.builtin.str("");
    for (var i = 0; i < NCH(n); ++i)
    {
        ret = ret.sq$concat(parsestr(c, CHILD(n, i).value));
    }
    return ret;
}

function parsenumber(c, s)
{
    // todo; no complex support

    var end = s.charAt(s.length - 1);
    if (end === 'l' || end === 'L')
        return Sk.longFromStr(s.substr(0, s.length - 1));
    var k = goog.global.eval(s);
    if ((k > Sk.builtin.lng.threshold$ || k < -Sk.builtin.lng.threshold$)
            && Math.floor(k) === k
            && (s.indexOf('e') === -1 && s.indexOf('E') === -1))
    {
        return Sk.longFromStr(s);
    }

    // todo; we don't currently distinguish between int and float so str is wrong
    // for these.
    if (s.indexOf('.') !== -1
            || s.indexOf('e') !== -1
            || s.indexOf('E') !== -1)
    {
        return parseFloat(s);
    }

    // ugly gunk to placate an overly-nanny closure-compiler: 
    // http://code.google.com/p/closure-compiler/issues/detail?id=111
    // this is all just to emulate "parseInt(s)" with no radix.
    var tmp = s;
    if (s.charAt(0) === '-') tmp = s.substr(1);
    if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'x' || tmp.charAt(1) === 'X'))
        return parseInt(s, 16);
    else if (tmp.charAt(0) === '0' && (tmp.charAt(1) === 'b' || tmp.charAt(1) === 'B'))
        return parseInt(s, 2);
    else if (tmp.charAt(0) === '0')
        return parseInt(s, 8);
    else
        return parseInt(s, 10);
}

function astForSlice(c, n)
{
    REQ(n, SYM.subscript);

    /*
       subscript: '.' '.' '.' | test | [test] ':' [test] [sliceop]
       sliceop: ':' [test]
    */
    var ch = CHILD(n, 0);
    var lower = null;
    var upper = null;
    var step = null;
    if (ch.type === TOK.T_DOT)
        return new Ellipsis();
    if (NCH(n) === 1 && ch.type === SYM.test)
        return new Index(astForExpr(c, ch));
    if (ch.type === SYM.test)
        lower = astForExpr(c, ch);
    if (ch.type === TOK.T_COLON)
    {
        if (NCH(n) > 1)
        {
            var n2 = CHILD(n, 1);
            if (n2.type === SYM.test)
                upper = astForExpr(c, n2);
        }
    }
    else if (NCH(n) > 2)
    {
        var n2 = CHILD(n, 2);
        if (n2.type === SYM.test)
            upper = astForExpr(c, n2);
    }

    ch = CHILD(n, NCH(n) - 1);
    if (ch.type === SYM.sliceop)
    {
        if (NCH(ch) === 1)
        {
            ch = CHILD(ch, 0);
            step = new Name(strobj("None"), Load, ch.lineno, ch.col_offset);
        }
        else
        {
            ch = CHILD(ch, 1);
            if (ch.type === SYM.test)
                step = astForExpr(c, ch);
        }
    }
    return new Slice(lower, upper, step);
}

function astForAtom(c, n)
{
    /* atom: '(' [yield_expr|testlist_gexp] ')' | '[' [listmaker] ']'
       | '{' [dictmaker] '}' | '`' testlist '`' | NAME | NUMBER | STRING+
    */
    var ch = CHILD(n, 0);
    switch (ch.type)
    {
        case TOK.T_NAME:
            // All names start in Load context, but may be changed later
            return new Name(strobj(ch.value), Load, n.lineno, n.col_offset);
        case TOK.T_STRING:
            return new Str(parsestrplus(c, n), n.lineno, n.col_offset);
        case TOK.T_NUMBER:
            return new Num(parsenumber(c, ch.value), n.lineno, n.col_offset);
        case TOK.T_LPAR: // various uses for parens
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RPAR)
                return new Tuple([], Load, n.lineno, n.col_offset);
            if (ch.type === SYM.yield_expr)
                return astForExpr(c, ch);
            if (NCH(ch) > 1 && CHILD(ch, 1).type === SYM.gen_for)
                return astForGenexp(c, ch);
            return astForTestlistGexp(c, ch);
        case TOK.T_LSQB: // list or listcomp
            ch = CHILD(n, 1);
            if (ch.type === TOK.T_RSQB)
                return new List([], Load, n.lineno, n.col_offset);
            REQ(ch, SYM.listmaker);
            if (NCH(ch) === 1 || CHILD(ch, 1).type === TOK.T_COMMA)
                return new List(seqForTestlist(c, ch), Load, n.lineno, n.col_offset);
            else
                return astForListcomp(c, ch);
        case TOK.T_LBRACE:
            /* dictmaker: test ':' test (',' test ':' test)* [','] */
            ch = CHILD(n, 1);
            var size = Math.floor((NCH(ch) + 1) / 4); // + 1 for no trailing comma case
            var keys = [];
            var values = [];
            for (var i = 0; i < NCH(ch); i += 4)
            {
                keys[i / 4] = astForExpr(c, CHILD(ch, i));
                values[i / 4] = astForExpr(c, CHILD(ch, i + 2));
            }
            return new Dict(keys, values, n.lineno, n.col_offset);
        case TOK.T_BACKQUOTE:
            throw new Sk.builtin.SyntaxError("backquote not supported, use repr()");
        default:
            goog.asserts.fail("unhandled atom", ch.type);
    }
}

function astForPower(c, n)
{
    /* power: atom trailer* ('**' factor)*
     */
    REQ(n, SYM.power);
    var e = astForAtom(c, CHILD(n, 0));
    if (NCH(n) === 1) return e;
    for (var i = 1; i < NCH(n); ++i)
    {
        var ch = CHILD(n, i);
        if (ch.type !== SYM.trailer)
            break;
        var tmp = astForTrailer(c, ch, e);
        tmp.lineno = e.lineno;
        tmp.col_offset = e.col_offset;
        e = tmp;
    }
    if (CHILD(n, NCH(n) - 1).type === SYM.factor)
    {
        var f = astForExpr(c, CHILD(n, NCH(n) - 1));
        e = new BinOp(e, Pow, f, n.lineno, n.col_offset);
    }
    return e;
}

function astForExpr(c, n)
{
    /* handle the full range of simple expressions
       test: or_test ['if' or_test 'else' test] | lambdef
       or_test: and_test ('or' and_test)* 
       and_test: not_test ('and' not_test)*
       not_test: 'not' not_test | comparison
       comparison: expr (comp_op expr)*
       expr: xor_expr ('|' xor_expr)*
       xor_expr: and_expr ('^' and_expr)*
       and_expr: shift_expr ('&' shift_expr)*
       shift_expr: arith_expr (('<<'|'>>') arith_expr)*
       arith_expr: term (('+'|'-') term)*
       term: factor (('*'|'/'|'%'|'//') factor)*
       factor: ('+'|'-'|'~') factor | power
       power: atom trailer* ('**' factor)*

       As well as modified versions that exist for backward compatibility,
       to explicitly allow:
       [ x for x in lambda: 0, lambda: 1 ]
       (which would be ambiguous without these extra rules)
       
       old_test: or_test | old_lambdef
       old_lambdef: 'lambda' [vararglist] ':' old_test

    */

    LOOP: while (true) {
        switch (n.type)
        {
            case SYM.test:
            case SYM.old_test:
                if (CHILD(n, 0).type === SYM.lambdef || CHILD(n, 0).type === SYM.old_lambdef)
                    return astForLambdef(c, CHILD(n, 0));
                else if (NCH(n) > 1)
                    return astForIfexpr(c, n);
                // fallthrough
            case SYM.or_test:
            case SYM.and_test:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                var seq = [];
                for (var i = 0; i < NCH(n); i += 2)
                    seq[i / 2] = astForExpr(c, CHILD(n, i));
                if (CHILD(n, 1).value === "and")
                    return new BoolOp(And, seq, n.lineno, n.col_offset);
                goog.asserts.assert(CHILD(n, 1).value === "or");
                return new BoolOp(Or, seq, n.lineno, n.col_offset);
            case SYM.not_test:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else
                {
                    return new UnaryOp(Not, astForExpr(c, CHILD(n, 1)), n.lineno, n.col_offset);
                }
            case SYM.comparison:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                else
                {
                    var ops = [];
                    var cmps = [];
                    for (var i = 1; i < NCH(n); i += 2)
                    {
                        ops[(i - 1) / 2] = astForCompOp(c, CHILD(n, i));
                        cmps[(i - 1) / 2] = astForExpr(c, CHILD(n, i + 1));
                    }
                    return new Compare(astForExpr(c, CHILD(n, 0)), ops, cmps, n.lineno, n.col_offset);
                }
            case SYM.expr:
            case SYM.xor_expr:
            case SYM.and_expr:
            case SYM.shift_expr:
            case SYM.arith_expr:
            case SYM.term:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForBinop(c, n);
            case SYM.yield_expr:
                var exp = null;
                if (NCH(n) === 2)
                {
                    exp = astForTestlist(c, CHILD(n, 1))
                }
                return new Yield(exp, n.lineno, n.col_offset);
            case SYM.factor:
                if (NCH(n) === 1)
                {
                    n = CHILD(n, 0);
                    continue LOOP;
                }
                return astForFactor(c, n);
            case SYM.power:
                return astForPower(c, n);
            default:
                goog.asserts.fail("unhandled expr", "n.type: %d", n.type);
        }
    break; }
}

function astForPrintStmt(c, n)
{
    /* print_stmt: 'print' ( [ test (',' test)* [','] ]
                             | '>>' test [ (',' test)+ [','] ] )
     */
    var start = 1;
    var dest = null;
    REQ(n, SYM.print_stmt);
    if (NCH(n) >= 2 && CHILD(n, 1).type === TOK.T_RIGHTSHIFT)
    {
        dest = astForExpr(c, CHILD(n, 2));
        start = 4;
    }
    var seq = [];
    for (var i = start, j = 0; i < NCH(n); i += 2, ++j)
    {
        seq[j] = astForExpr(c, CHILD(n, i));
    }
    var nl = (CHILD(n, NCH(n) - 1)).type === TOK.T_COMMA ? false : true;
    return new Print(dest, seq, nl, n.lineno, n.col_offset);
}

function astForStmt(c, n)
{
    if (n.type === SYM.stmt)
    {
        goog.asserts.assert(NCH(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.simple_stmt)
    {
        goog.asserts.assert(numStmts(n) === 1);
        n = CHILD(n, 0);
    }
    if (n.type === SYM.small_stmt)
    {
        REQ(n, SYM.small_stmt);
        n = CHILD(n, 0);
        /* small_stmt: expr_stmt | print_stmt  | del_stmt | pass_stmt
                     | flow_stmt | import_stmt | global_stmt | exec_stmt
                     | assert_stmt
        */
        switch (n.type)
        {
            case SYM.expr_stmt: return astForExprStmt(c, n);
            case SYM.print_stmt: return astForPrintStmt(c, n);
            case SYM.del_stmt: return astForDelStmt(c, n);
            case SYM.pass_stmt: return new Pass(n.lineno, n.col_offset);
            case SYM.flow_stmt: return astForFlowStmt(c, n);
            case SYM.import_stmt: return astForImportStmt(c, n);
            case SYM.global_stmt: return astForGlobalStmt(c, n);
            case SYM.exec_stmt: return astForExecStmt(c, n);
            case SYM.assert_stmt: return astForAssertStmt(c, n);
            default: goog.asserts.fail("unhandled small_stmt");
        }
    }
    else
    {
        /* compound_stmt: if_stmt | while_stmt | for_stmt | try_stmt
                        | funcdef | classdef | decorated
        */
        var ch = CHILD(n, 0);
        REQ(n, SYM.compound_stmt);
        switch (ch.type)
        {
            case SYM.if_stmt: return astForIfStmt(c, ch);
            case SYM.while_stmt: return astForWhileStmt(c, ch);
            case SYM.for_stmt: return astForForStmt(c, ch);
            case SYM.try_stmt: return astForTryStmt(c, ch);
            case SYM.with_stmt: return astForWithStmt(c, ch);
            case SYM.funcdef: return astForFuncdef(c, ch, []);
            case SYM.classdef: return astForClassdef(c, ch, []);
            case SYM.decorated: return astForDecorated(c, ch);
            default: goog.asserts.assert("unhandled compound_stmt");
        }
    }
}

Sk.astFromParse = function(n, filename)
{
    var c = new Compiling("utf-8", filename);

    var stmts = [];
    var ch;
    var k = 0;
    switch (n.type)
    {
        case SYM.file_input:
            for (var i = 0; i < NCH(n) - 1; ++i)
            {
                var ch = CHILD(n, i);
                if (n.type === TOK.T_NEWLINE)
                    continue;
                REQ(ch, SYM.stmt);
                var num = numStmts(ch);
                if (num === 1)
                {
                    stmts[k++] = astForStmt(c, ch);
                }
                else
                {
                    ch = CHILD(ch, 0);
                    REQ(ch, SYM.simple_stmt);
                    for (var j = 0; j < num; ++j)
                    {
                        stmts[k++] = astForStmt(c, CHILD(ch, j * 2));
                    }
                }
            }
            return new Module(stmts);
        case SYM.eval_input:
            goog.asserts.fail("todo;");
        case SYM.single_input:
            goog.asserts.fail("todo;");
        default:
            goog.asserts.fail("todo;");
    }
};

Sk.astDump = function(node)
{
    var spaces = function(n) // todo; blurgh
    {
        var ret = "";
        for (var i = 0; i < n; ++i)
            ret += " ";
        return ret;
    }

    var _format = function(node, indent)
    {
        if (node === null)
        {
            return indent+"None";
        }
        else if (node.prototype && node.prototype._astname !== undefined && node.prototype._isenum)
        {
            return indent + node.prototype._astname + "()";
        }
        else if (node._astname !== undefined)
        {
            var namelen = spaces(node._astname.length + 1);
            var fields = [];
            for (var i = 0; i < node._fields.length; i += 2) // iter_fields
            {
                var a = node._fields[i]; // field name
                var b = node._fields[i + 1](node); // field getter func
                var fieldlen = spaces(a.length + 1);
                fields.push([a, _format(b, indent + namelen + fieldlen)]);
            }
            var attrs = [];
            for (var i = 0; i < fields.length; ++i)
            {
                var field = fields[i];
                attrs.push(field[0] + "=" + field[1].replace(/^\s+/, ''));
            }
            var fieldstr = attrs.join(',\n' + indent + namelen);
            return indent + node._astname + "(" + fieldstr + ")";
        }
        else if (goog.isArrayLike(node))
        {
            //Sk.debugout("arr", node.length);
            var elems = [];
            for (var i = 0; i < node.length; ++i)
            {
                var x = node[i];
                elems.push(_format(x, indent + " "));
            }
            var elemsstr = elems.join(',\n');
            return indent + "[" + elemsstr.replace(/^\s+/, '') + "]";
        }
        else
        {
            var ret;
            if (node === true) ret = "True";
            else if (node === false) ret = "False";
            else if (node instanceof Sk.builtin.lng) ret = node.tp$str().v;
            else if (node instanceof Sk.builtin.str) ret = node['$r']().v;
            else ret = "" + node;
            return indent + ret;
        }
    };

    return _format(node, "");
};

goog.exportSymbol("Sk.astFromParse", Sk.astFromParse);
goog.exportSymbol("Sk.astDump", Sk.astDump);
/* Flags for def-use information */

var DEF_GLOBAL = 1;           /* global stmt */
var DEF_LOCAL = 2;            /* assignment in code block */
var DEF_PARAM = 2<<1;         /* formal parameter */
var USE = 2<<2;               /* name is used */
var DEF_STAR = 2<<3;          /* parameter is star arg */
var DEF_DOUBLESTAR = 2<<4;    /* parameter is star-star arg */
var DEF_INTUPLE = 2<<5;       /* name defined in tuple in parameters */
var DEF_FREE = 2<<6;          /* name used but not defined in nested block */
var DEF_FREE_GLOBAL = 2<<7;   /* free variable is actually implicit global */
var DEF_FREE_CLASS = 2<<8;    /* free variable from class's method */
var DEF_IMPORT = 2<<9;        /* assignment occurred via import */

var DEF_BOUND = (DEF_LOCAL | DEF_PARAM | DEF_IMPORT);

/* GLOBAL_EXPLICIT and GLOBAL_IMPLICIT are used internally by the symbol
   table.  GLOBAL is returned from PyST_GetScope() for either of them. 
   It is stored in ste_symbols at bits 12-14.
*/
var SCOPE_OFF = 11;
var SCOPE_MASK = 7;

var LOCAL = 1;
var GLOBAL_EXPLICIT = 2;
var GLOBAL_IMPLICIT = 3;
var FREE = 4;
var CELL = 5;

/* The following three names are used for the ste_unoptimized bit field */
var OPT_IMPORT_STAR = 1;
var OPT_EXEC = 2;
var OPT_BARE_EXEC = 4;
var OPT_TOPLEVEL = 8;  /* top-level names, including eval and exec */

var GENERATOR = 2;
var GENERATOR_EXPRESSION = 2;

var ModuleBlock = 'module';
var FunctionBlock = 'function';
var ClassBlock = 'class';

/**
 * @constructor
 * @param {string} name
 * @param {number} flags
 * @param {Array.<SymbolTableScope>} namespaces
 */
function Symbol(name, flags, namespaces)
{
    this.__name = name;
    this.__flags = flags;
    this.__scope = (flags >> SCOPE_OFF) & SCOPE_MASK;
    this.__namespaces = namespaces || [];
};
Symbol.prototype.get_name = function() { return this.__name; }
Symbol.prototype.is_referenced = function() { return !!(this.__flags & USE); }
Symbol.prototype.is_parameter = function() { return !!(this.__flags & DEF_PARAM); }
Symbol.prototype.is_global = function() { return this.__scope === GLOBAL_IMPLICIT || this.__scope == GLOBAL_EXPLICIT; }
Symbol.prototype.is_declared_global = function() { return this.__scope == GLOBAL_EXPLICIT; }
Symbol.prototype.is_local = function() { return !!(this.__flags & DEF_BOUND); }
Symbol.prototype.is_free = function() { return this.__scope == FREE; }
Symbol.prototype.is_imported = function() { return !!(this.__flags & DEF_IMPORT); }
Symbol.prototype.is_assigned = function() { return !!(this.__flags & DEF_LOCAL); }
Symbol.prototype.is_namespace = function() { return this.__namespaces && this.__namespaces.length > 0; }
Symbol.prototype.get_namespaces = function() { return this.__namespaces; }

var astScopeCounter = 0;

/**
 * @constructor
 * @param {SymbolTable} table
 * @param {string} name
 * @param {string} type
 * @param {number} lineno
 */
function SymbolTableScope(table, name, type, ast, lineno)
{
    this.symFlags = {};
    this.name = name;
    this.varnames = [];
    this.children = [];
    this.blockType = type;

    this.isNested = false;
    this.hasFree = false;
    this.childHasFree = false;  // true if child block has free vars including free refs to globals
    this.generator = false;
    this.varargs = false;
    this.varkeywords = false;
    this.returnsValue = false;

    this.lineno = lineno;

    this.table = table;

    if (table.cur && (table.cur.nested || table.cur.blockType === FunctionBlock))
        this.isNested = true;

    ast.scopeId = astScopeCounter++;
    table.stss[ast.scopeId] = this;

    // cache of Symbols for returning to other parts of code
    this.symbols = {};
}
SymbolTableScope.prototype.get_type = function() { return this.blockType; };
SymbolTableScope.prototype.get_name = function() { return this.name; };
SymbolTableScope.prototype.get_lineno = function() { return this.lineno; };
SymbolTableScope.prototype.is_nested = function() { return this.isNested; };
SymbolTableScope.prototype.has_children = function() { return this.children.length > 0; };
SymbolTableScope.prototype.get_identifiers = function() { return this._identsMatching(function(x) { return true; }); };
SymbolTableScope.prototype.lookup = function(name)
{
    var sym;
    if (!this.symbols.hasOwnProperty(name))
    {
        var flags = this.symFlags[name];
        var namespaces = this.__check_children(name);
        sym = this.symbols[name] = new Symbol(name, flags, namespaces);
    }
    else
    {
        sym = this.symbols[name];
    }
    return sym;
};
SymbolTableScope.prototype.__check_children = function(name)
{
    //print("  check_children:", name);
    var ret = [];
    for (var i = 0; i < this.children.length; ++i)
    {
        var child = this.children[i];
        if (child.name === name)
            ret.push(child);
    }
    return ret;
};

SymbolTableScope.prototype._identsMatching = function(f)
{
    var ret = [];
    for (var k in this.symFlags)
    {
        if (this.symFlags.hasOwnProperty(k))
        {
            if (f(this.symFlags[k]))
                ret.push(k);
        }
    }
    ret.sort();
    return ret;
};
SymbolTableScope.prototype.get_parameters = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_parameters only valid for function scopes");
    if (!this._funcParams)
        this._funcParams = this._identsMatching(function(x) { return x & DEF_PARAM; });
    return this._funcParams;
};
SymbolTableScope.prototype.get_locals = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_locals only valid for function scopes");
    if (!this._funcLocals)
        this._funcLocals = this._identsMatching(function(x) { return x & DEF_BOUND; });
    return this._funcLocals;
};
SymbolTableScope.prototype.get_globals = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_globals only valid for function scopes");
    if (!this._funcGlobals)
    {
        this._funcGlobals = this._identsMatching(function(x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked == GLOBAL_IMPLICIT || masked == GLOBAL_EXPLICIT;
            });
    }
    return this._funcGlobals;
};
SymbolTableScope.prototype.get_frees = function()
{
    goog.asserts.assert(this.get_type() == 'function', "get_frees only valid for function scopes");
    if (!this._funcFrees)
    {
        this._funcFrees = this._identsMatching(function(x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked == FREE;
            });
    }
    return this._funcFrees;
};
SymbolTableScope.prototype.get_methods = function()
{
    goog.asserts.assert(this.get_type() == 'class', "get_methods only valid for class scopes");
    if (!this._classMethods)
    {
        // todo; uniq?
        var all = [];
        for (var i = 0; i < this.children.length; ++i)
            all.push(this.children[i].name);
        all.sort();
        this._classMethods = all;
    }
    return this._classMethods;
};
SymbolTableScope.prototype.getScope = function(name)
{
    //print("getScope");
    //for (var k in this.symFlags) print(k);
    var v = this.symFlags[name];
    if (v === undefined) return 0;
    return (v >> SCOPE_OFF) & SCOPE_MASK;
};

/**
 * @constructor
 * @param {string} filename
 */
function SymbolTable(filename)
{
    this.filename = filename;
    this.cur = null;
    this.top = null;
    this.stack = [];
    this.global = null; // points at top level module symFlags
    this.curClass = null; // current class or null
    this.tmpname = 0;

    // mapping from ast nodes to their scope if they have one. we add an
    // id to the ast node when a scope is created for it, and store it in
    // here for the compiler to lookup later.
    this.stss = {};
}
SymbolTable.prototype.getStsForAst = function(ast)
{
    goog.asserts.assert(ast.scopeId !== undefined, "ast wasn't added to st?");
    var v = this.stss[ast.scopeId];
    goog.asserts.assert(v !== undefined, "unknown sym tab entry");
    return v;
};

SymbolTable.prototype.SEQStmt = function(nodes)
{
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s", nodes);
    var len = nodes.length;
    for (var i = 0; i < len; ++i)
    {
        var val = nodes[i];
        if (val) this.visitStmt(val);
    }
};
SymbolTable.prototype.SEQExpr = function(nodes)
{
    goog.asserts.assert(goog.isArrayLike(nodes), "SEQ: nodes isn't array? got %s", nodes);
    var len = nodes.length;
    for (var i = 0; i < len; ++i)
    {
        var val = nodes[i];
        if (val) this.visitExpr(val);
    }
};

SymbolTable.prototype.enterBlock = function(name, blockType, ast, lineno)
{
    //print("enterBlock:", name);
    var prev = null;
    if (this.cur)
    {
        prev = this.cur;
        this.stack.push(this.cur);
    }
    this.cur = new SymbolTableScope(this, name, blockType, ast, lineno);
    if (name === 'top')
    {
        //print("    setting global because it's top");
        this.global = this.cur.symFlags;
    }
    if (prev)
    {
        //print("    adding", this.cur.name, "to", prev.name);
        prev.children.push(this.cur);
    }
};

SymbolTable.prototype.exitBlock = function()
{
    //print("exitBlock");
    this.cur = null;
    if (this.stack.length > 0)
        this.cur = this.stack.pop();
};

SymbolTable.prototype.visitParams = function(args, toplevel)
{
    for (var i = 0; i < args.length; ++i)
    {
        var arg = args[i];
        if (arg.constructor === Name)
        {
            goog.asserts.assert(arg.ctx === Param || (arg.ctx === Store && !toplevel));
            this.addDef(arg.id, DEF_PARAM);
        }
        else
        {
            // Tuple isn't supported
            throw new SyntaxError("invalid expression in parameter list");
        }
    }
}

SymbolTable.prototype.visitArguments = function(a)
{
    if (a.args) this.visitParams(a.args, true);
    if (a.vararg)
    {
        this.addDef(a.vararg, DEF_PARAM);
        this.cur.varargs = true;
    }
    if (a.kwarg)
    {
        this.addDef(a.kwarg, DEF_PARAM);
        this.cur.varkeywords = true;
    }
};

SymbolTable.prototype.newTmpname = function()
{
    this.addDef(new Sk.builtin.str("_[" + (++this.tmpname) + "]"), DEF_LOCAL);
}

SymbolTable.prototype.addDef = function(name, flag)
{
    //print("addDef:", name.v, flag);
    var mangled = mangleName(this.curClass, new Sk.builtin.str(name)).v;
    var val = this.cur.symFlags[mangled];
    if (val !== undefined)
    {
        if ((flag & DEF_PARAM) && (val & DEF_PARAM))
        {
            throw new Sk.builtin.SyntaxError("duplicate argument '" + name + "' in function definition");
        }
        val |= flag;
    }
    else
    {
        val = flag;
    }
    this.cur.symFlags[mangled] = val;
    if (flag & DEF_PARAM)
    {
        this.cur.varnames.push(mangled);
    }
    else if (flag & DEF_GLOBAL)
    {
        val = flag;
        var fromGlobal = this.global[mangled];
        if (fromGlobal !== undefined) val |= fromGlobal;
        this.global[mangled] = val;
    }
};

SymbolTable.prototype.visitSlice = function(s)
{
    switch (s.constructor)
    {
        case Slice:
            if (s.lower) this.visitExpr(s.lower);
            if (s.upper) this.visitExpr(s.upper);
            if (s.step) this.visitExpr(s.step);
            break;
        case ExtSlice:
            for (var i = 0; i < s.dims.length; ++i)
                this.visitSlice(s.dims[i]);
            break;
        case Index:
            this.visitExpr(s.value);
            break;
        case Ellipsis:
            break;
    }
};

SymbolTable.prototype.visitStmt = function(s)
{
    goog.asserts.assert(s !== undefined, "visitStmt called with undefined");
    switch (s.constructor)
    {
        case FunctionDef:
            this.addDef(s.name, DEF_LOCAL);
            if (s.args.defaults) this.SEQExpr(s.args.defaults);
            if (s.decorator_list) this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name.v, FunctionBlock, s, s.lineno);
            this.visitArguments(s.args);
            this.SEQStmt(s.body);
            this.exitBlock();
            break;
        case ClassDef:
            this.addDef(s.name, DEF_LOCAL);
            this.SEQExpr(s.bases);
            if (s.decorator_list) this.SEQExpr(s.decorator_list);
            this.enterBlock(s.name.v, ClassBlock, s, s.lineno);
            var tmp = this.curClass;
            this.curClass = s.name;
            this.SEQStmt(s.body);
            this.curCalss = tmp;
            this.exitBlock();
            break;
        case Return_:
            if (s.value)
            {
                this.visitExpr(s.value);
                this.cur.returnsValue = true;
                if (this.cur.generator)
                    throw new SyntaxError("'return' with argument inside generator");
            }
            break;
        case Delete_:
            this.SEQExpr(s.targets);
            break;
        case Assign:
            this.SEQExpr(s.targets);
            this.visitExpr(s.value);
            break;
        case AugAssign:
            this.visitExpr(s.target);
            this.visitExpr(s.value);
            break;
        case Print:
            if (s.dest) this.visitExpr(s.dest);
            this.SEQExpr(s.values);
            break;
        case For_:
            this.visitExpr(s.target);
            this.visitExpr(s.iter);
            this.SEQStmt(s.body);
            if (s.orelse) this.SEQStmt(s.orelse);
            break;
        case While_:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse) this.SEQStmt(s.orelse);
            break;
        case If_:
            this.visitExpr(s.test);
            this.SEQStmt(s.body);
            if (s.orelse)
                this.SEQStmt(s.orelse);
            break;
        case Raise:
            if (s.type)
            {
                this.visitExpr(s.type);
                if (s.inst)
                {
                    this.visitExpr(s.inst);
                    if (s.tback)
                        this.visitExpr(s.tback);
                }
            }
            break;
        case TryExcept:
            this.SEQStmt(s.body);
            this.SEQStmt(s.orelse);
            this.visitExcepthandlers(s.handlers);
            break;
        case TryFinally:
            this.SEQStmt(s.body);
            this.SEQStmt(s.finalbody);
            break;
        case Assert:
            this.visitExpr(s.test);
            if (s.msg) this.visitExpr(s.msg);
            break;
        case Import_:
        case ImportFrom:
            this.visitAlias(s.names);
            break;
        case Exec:
            this.visitExpr(s.body);
            if (s.globals)
            {
                this.visitExpr(s.globals);
                if (s.locals)
                    this.visitExpr(s.locals);
            }
            break;
        case Global:
            var nameslen = s.names.length;
            for (var i = 0; i < nameslen; ++i)
            {
                var name = mangleName(this.curClass, s.names[i]).v;
                var cur = this.cur.symFlags[name];
                if (cur & (DEF_LOCAL | USE))
                {
                    if (cur & DEF_LOCAL)
                        throw new SyntaxError("name '" + name + "' is assigned to before global declaration");
                    else
                        throw new SyntaxError("name '" + name + "' is used prior to global declaration");
                }
                this.addDef(new Sk.builtin.str(name), DEF_GLOBAL);
            }
            break;
        case Expr:
            this.visitExpr(s.value);
            break;
        case Pass:
        case Break_:
        case Continue_:
            // nothing
            break;
        case With_:
            this.newTmpname();
            this.visitExpr(s.context_expr);
            if (s.optional_vars)
            {
                this.newTmpname();
                this.visitExpr(s.optional_vars);
            }
            this.SEQStmt(s.body);
            break;

        default:
            goog.asserts.fail("Unhandled type " + s.constructor.name + " in visitStmt");
    }
};

SymbolTable.prototype.visitExpr = function(e)
{
    goog.asserts.assert(e !== undefined, "visitExpr called with undefined");
    //print("  e: ", e.constructor.name);
    switch (e.constructor)
    {
        case BoolOp:
            this.SEQExpr(e.values);
            break;
        case BinOp:
            this.visitExpr(e.left);
            this.visitExpr(e.right);
            break;
        case UnaryOp:
            this.visitExpr(e.operand);
            break;
        case Lambda:
            this.addDef(new Sk.builtin.str("lambda"), DEF_LOCAL);
            if (e.args.defaults)
                this.SEQExpr(e.args.defaults);
            this.enterBlock("lambda", FunctionBlock, e, e.lineno);
            this.visitArguments(e.args);
            this.visitExpr(e.body);
            this.exitBlock();
            break;
        case IfExp:
            this.visitExpr(e.test);
            this.visitExpr(e.body);
            this.visitExpr(e.orelse);
            break;
        case Dict:
            this.SEQExpr(e.keys);
            this.SEQExpr(e.values);
            break;
        case ListComp:
            this.newTmpname();
            this.visitExpr(e.elt);
            this.visitComprehension(e.generators, 0);
            break;
        case GeneratorExp:
            this.visitGenexp(e);
            break;
        case Yield:
            if (e.value) this.visitExpr(e.value);
            this.cur.generator = true;
            if (this.cur.returnsValue)
                throw new SyntaxError("'return' with argument inside generator");
            break;
        case Compare:
            this.visitExpr(e.left);
            this.SEQExpr(e.comparators);
            break;
        case Call:
            this.visitExpr(e.func);
            this.SEQExpr(e.args);
            for (var i = 0; i < e.keywords.length; ++i)
                this.visitExpr(e.keywords[i].value);
            //print(JSON.stringify(e.starargs, null, 2));
            //print(JSON.stringify(e.kwargs, null,2));
            if (e.starargs) this.visitExpr(e.starargs);
            if (e.kwargs) this.visitExpr(e.kwargs);
            break;
        case Num:
        case Str:
            break;
        case Attribute:
            this.visitExpr(e.value);
            break;
        case Subscript:
            this.visitExpr(e.value);
            this.visitSlice(e.slice);
            break;
        case Name:
            this.addDef(e.id, e.ctx === Load ? USE : DEF_LOCAL);
            break;
        case List:
        case Tuple:
            this.SEQExpr(e.elts);
            break;
        default:
            goog.asserts.fail("Unhandled type " + e.constructor.name + " in visitExpr");
    }
};

SymbolTable.prototype.visitComprehension = function(lcs, startAt)
{
    var len = lcs.length;
    for (var i = startAt; i < len; ++i)
    {
        var lc = lcs[i];
        this.visitExpr(lc.target);
        this.visitExpr(lc.iter);
        this.SEQExpr(lc.ifs);
    }
};

SymbolTable.prototype.visitAlias = function(names)
{
    /* Compute store_name, the name actually bound by the import
        operation.  It is diferent than a->name when a->name is a
        dotted package name (e.g. spam.eggs) 
    */
    for (var i = 0; i < names.length; ++i)
    {
        var a = names[i];
        var name = a.asname === null ? a.name.v : a.asname.v;
        var storename = name;
        var dot = name.indexOf('.');
        if (dot !== -1)
            storename = name.substr(0, dot);
        if (name !== "*")
            this.addDef(new Sk.builtin.str(storename), DEF_IMPORT);
        else
        {
            if (this.cur.blockType !== ModuleBlock)
                throw new SyntaxError("import * only allowed at module level");
        }
    }
};

SymbolTable.prototype.visitGenexp = function(e)
{
    var outermost = e.generators[0];
    // outermost is evaled in current scope
    this.visitExpr(outermost.iter);
    this.enterBlock("genexpr", FunctionBlock, e, e.lineno);
    this.cur.generator = true;
    this.addDef(new Sk.builtin.str(".0"), DEF_PARAM);
    this.visitExpr(outermost.target);
    this.SEQExpr(outermost.ifs);
    this.visitComprehension(e.generators, 1);
    this.visitExpr(e.elt);
    this.exitBlock();
};

SymbolTable.prototype.visitExcepthandlers = function(handlers)
{
    for (var i = 0, eh; eh = handlers[i]; ++i)
    {
        if (eh.type) this.visitExpr(eh.type);
        if (eh.name) this.visitExpr(eh.name);
        this.SEQStmt(eh.body);
    }
};

function _dictUpdate(a, b)
{
    for (var kb in b)
    {
        a[kb] = b[kb];
    }
}

SymbolTable.prototype.analyzeBlock = function(ste, bound, free, global)
{
    var local = {};
    var scope = {};
    var newglobal = {};
    var newbound = {};
    var newfree = {};

    if (ste.blockType == ClassBlock)
    {
        _dictUpdate(newglobal, global);
        if (bound)
            _dictUpdate(newbound, bound);
    }

    for (var name in ste.symFlags)
    {
        var flags = ste.symFlags[name];
        this.analyzeName(ste, scope, name, flags, bound, local, free, global);
    }

    if (ste.blockType !== ClassBlock)
    {
        if (ste.blockType === FunctionBlock)
            _dictUpdate(newbound, local);
        if (bound)
            _dictUpdate(newbound, bound);
        _dictUpdate(newglobal, global);
    }

    var allfree = {};
    var childlen = ste.children.length;
    for (var i = 0; i < childlen; ++i)
    {
        var c = ste.children[i];
        this.analyzeChildBlock(c, newbound, newfree, newglobal, allfree);
        if (c.hasFree || c.childHasFree)
            ste.childHasFree = true;
    }

    _dictUpdate(newfree, allfree);
    if (ste.blockType === FunctionBlock) this.analyzeCells(scope, newfree);
    this.updateSymbols(ste.symFlags, scope, bound, newfree, ste.blockType === ClassBlock);

    _dictUpdate(free, newfree);
};

SymbolTable.prototype.analyzeChildBlock = function(entry, bound, free, global, childFree)
{
    var tempBound = {};
    _dictUpdate(tempBound, bound);
    var tempFree = {};
    _dictUpdate(tempFree, free);
    var tempGlobal = {};
    _dictUpdate(tempGlobal, global);

    this.analyzeBlock(entry, tempBound, tempFree, tempGlobal);
    _dictUpdate(childFree, tempFree);
};

SymbolTable.prototype.analyzeCells = function(scope, free)
{
    for (var name in scope)
    {
        var flags = scope[name];
        if (flags !== LOCAL) continue;
        if (free[name] === undefined) continue;
        scope[name] = CELL;
        delete free[name];
    }
};

/**
 * store scope info back into the st symbols dict. symbols is modified,
 * others are not.
 */
SymbolTable.prototype.updateSymbols = function(symbols, scope, bound, free, classflag)
{
    for (var name in symbols)
    {
        var flags = symbols[name];
        var w = scope[name];
        flags |= w << SCOPE_OFF;
        symbols[name] = flags;
    }

    var freeValue = FREE << SCOPE_OFF;
    var pos = 0;
    for (var name in free)
    {
        var o = symbols[name];
        if (o !== undefined)
        {
            // it could be a free variable in a method of the class that has
            // the same name as a local or global in the class scope
            if (classflag && (o & (DEF_BOUND | DEF_GLOBAL)))
            {
                var i = o | DEF_FREE_CLASS;
                symbols[name] = i;
            }
            // else it's not free, probably a cell
            continue;
        }
        if (bound[name] === undefined) continue;
        symbols[name] = freeValue;
    }
};

SymbolTable.prototype.analyzeName = function(ste, dict, name, flags, bound, local, free, global)
{
    if (flags & DEF_GLOBAL)
    {
        if (flags & DEF_PARAM) throw new Sk.builtin.SyntaxError("name '" + name + "' is local and global");
        dict[name] = GLOBAL_EXPLICIT;
        global[name] = null;
        if (bound && bound[name] !== undefined) delete bound[name];
        return;
    }
    if (flags & DEF_BOUND)
    {
        dict[name] = LOCAL;
        local[name] = null;
        delete global[name];
        return;
    }

    if (bound && bound[name] !== undefined)
    {
        dict[name] = FREE;
        ste.hasFree = true;
        free[name] = null;
    }
    else if (global && global[name] !== undefined)
    {
        dict[name] = GLOBAL_IMPLICIT;
    }
    else
    {
        if (ste.isNested)
            ste.hasFree = true;
        dict[name] = GLOBAL_IMPLICIT;
    }
};

SymbolTable.prototype.analyze = function()
{
    var free = {};
    var global = {};
    this.analyzeBlock(this.top, null, free, global);
};

/**
 * @param {Object} ast
 * @param {string} filename
 */
Sk.symboltable = function(ast, filename)
{
    var ret = new SymbolTable(filename);

    ret.enterBlock("top", ModuleBlock, ast, 0);
    ret.top = ret.cur;

    //print(Sk.astDump(ast));
    for (var i = 0; i < ast.body.length; ++i)
        ret.visitStmt(ast.body[i]);

    ret.exitBlock();

    ret.analyze();

    return ret;
};

Sk.dumpSymtab = function(st)
{
    var pyBoolStr = function(b) { return b ? "True" : "False"; }
    var pyList = function(l) {
        var ret = [];
        for (var i = 0; i < l.length; ++i)
        {
            ret.push(new Sk.builtin.str(l[i])['$r']().v);
        }
        return '[' + ret.join(', ') + ']';
    };
    var getIdents = function(obj, indent)
    {
        if (indent === undefined) indent = "";
        var ret = "";
        ret += indent + "Sym_type: " + obj.get_type() + "\n";
        ret += indent + "Sym_name: " + obj.get_name() + "\n";
        ret += indent + "Sym_lineno: " + obj.get_lineno() + "\n";
        ret += indent + "Sym_nested: " + pyBoolStr(obj.is_nested()) + "\n";
        ret += indent + "Sym_haschildren: " + pyBoolStr(obj.has_children()) + "\n";
        if (obj.get_type() === "class")
        {
            ret += indent + "Class_methods: " + pyList(obj.get_methods()) + "\n";
        }
        else if (obj.get_type() === "function")
        {
            ret += indent + "Func_params: " + pyList(obj.get_parameters()) + "\n";
            ret += indent + "Func_locals: " + pyList(obj.get_locals()) + "\n";
            ret += indent + "Func_globals: " + pyList(obj.get_globals()) + "\n";
            ret += indent + "Func_frees: " + pyList(obj.get_frees()) + "\n";
        }
        ret += indent + "-- Identifiers --\n";
        var objidents = obj.get_identifiers();
        var objidentslen = objidents.length;
        for (var i = 0; i < objidentslen; ++i)
        {
            var info = obj.lookup(objidents[i]);
            ret += indent + "name: " + info.get_name() + "\n";
            ret += indent + "  is_referenced: " + pyBoolStr(info.is_referenced()) + "\n";
            ret += indent + "  is_imported: " + pyBoolStr(info.is_imported()) + "\n";
            ret += indent + "  is_parameter: " + pyBoolStr(info.is_parameter()) + "\n";
            ret += indent + "  is_global: " + pyBoolStr(info.is_global()) + "\n";
            ret += indent + "  is_declared_global: " + pyBoolStr(info.is_declared_global()) + "\n";
            ret += indent + "  is_local: " + pyBoolStr(info.is_local()) + "\n";
            ret += indent + "  is_free: " + pyBoolStr(info.is_free()) + "\n";
            ret += indent + "  is_assigned: " + pyBoolStr(info.is_assigned()) + "\n";
            ret += indent + "  is_namespace: " + pyBoolStr(info.is_namespace()) + "\n";
            var nss = info.get_namespaces();
            var nsslen = nss.length;
            ret += indent + "  namespaces: [\n";
            var sub = [];
            for (var j = 0; j < nsslen; ++j)
            {
                var ns = nss[j];
                sub.push(getIdents(ns, indent + "    "));
            }
            ret += sub.join('\n');
            ret += indent + "  ]\n";
        }
        return ret;
    }
    return getIdents(st.top, "");
};

goog.exportSymbol("Sk.symboltable", Sk.symboltable);
goog.exportSymbol("Sk.dumpSymtab", Sk.dumpSymtab);
/** @param {...*} x */
var out;

Sk._futureResult = null;

/**
 * @constructor
 * @param {string} filename
 * @param {SymbolTable} st
 * @param {number} flags
 * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
 */
function Compiler(filename, st, flags, sourceCodeForAnnotation)
{
    this.filename = filename;
    this.st = st;
    this.flags = flags;
    this.interactive = false;
    this.nestlevel = 0;

    this.u = null;
    this.stack = [];

    this.result = [];

    this.gensymcount = 0;

    this.allUnits = [];

    this.source = sourceCodeForAnnotation ? sourceCodeForAnnotation.split("\n") : false;
}

/**
 * @constructor
 *
 * Stuff that changes on entry/exit of code blocks. must be saved and restored
 * when returning to a block.
 *
 * Corresponds to the body of a module, class, or function.
 */

function CompilerUnit()
{
    this.ste = null;
    this.name = null;

    this.private_ = null;
    this.firstlineno = 0;
    this.lineno = 0;
    this.linenoSet = false;
    this.localnames = [];

    this.blocknum = 0;
    this.blocks = [];
    this.curblock = 0;

    this.scopename = null;

    this.prefixCode = '';
    this.varDeclsCode = '';
    this.switchCode = '';
    this.suffixCode = '';

    // stack of where to go on a break
    this.breakBlocks = [];
    // stack of where to go on a continue
    this.continueBlocks = [];
    this.exceptBlocks = [];
    this.finallyBlocks = [];
}

CompilerUnit.prototype.activateScope = function()
{
    var self = this;

    out = function() {
        var b = self.blocks[self.curblock];
        for (var i = 0; i < arguments.length; ++i)
            b.push(arguments[i]);
    };
};

Compiler.prototype.getSourceLine = function(lineno)
{
    goog.asserts.assert(this.source);
    return this.source[lineno - 1];
};

Compiler.prototype.annotateSource = function(ast)
{
    if (this.source)
    {
        var lineno = ast.lineno;
        var col_offset = ast.col_offset;
        out("\n//\n// line ", lineno, ":\n// ", this.getSourceLine(lineno), "\n// ");
        for (var i = 0; i < col_offset; ++i) out(" ");
        out("^\n//\n");

        out("\nSk.currLineNo = ", lineno,
            "; Sk.currColNo = ",col_offset,
            "; Sk.currFilename = '",this.filename,"';\n");  //  Added by RNL
    }
};

Compiler.prototype.gensym = function(hint)
{
    hint = hint || '';
    hint = '$' + hint;
    hint += this.gensymcount++;
    return hint;
};

Compiler.prototype.niceName = function(roughName)
{
    return this.gensym(roughName.replace("<", "").replace(">", "").replace(" ", "_"));
}

var reservedWords_ = { 'abstract': true, 'as': true, 'boolean': true,
    'break': true, 'byte': true, 'case': true, 'catch': true, 'char': true,
    'class': true, 'continue': true, 'const': true, 'debugger': true,
    'default': true, 'delete': true, 'do': true, 'double': true, 'else': true,
    'enum': true, 'export': true, 'extends': true, 'false': true,
    'final': true, 'finally': true, 'float': true, 'for': true,
    'function': true, 'goto': true, 'if': true, 'implements': true,
    'import': true, 'in': true, 'instanceof': true, 'int': true,
    'interface': true, 'is': true, 'long': true, 'namespace': true,
    'native': true, 'new': true, 'null': true, 'package': true,
    'private': true, 'protected': true, 'public': true, 'return': true,
    'short': true, 'static': true, 'super': true, 'switch': true,
    'synchronized': true, 'this': true, 'throw': true, 'throws': true,
    'transient': true, 'true': true, 'try': true, 'typeof': true, 'use': true,
    'var': true, 'void': true, 'volatile': true, 'while': true, 'with': true
};

function fixReservedWords(name)
{
    if (reservedWords_[name] !== true)
        return name;
    return name + "_$rw$";
}

function mangleName(priv, ident)
{
    var name = ident.v;
    if (priv === null || name === null || name.charAt(0) !== '_' || name.charAt(1) !== '_')
        return ident;
    // don't mangle __id__
    if (name.charAt(name.length - 1) === '_' && name.charAt(name.length - 2) === '_')
        return ident;
    // don't mangle classes that are all _ (obscure much?)
    if (priv.v.replace(/_/g, '') === '')
        return ident;
    priv = priv.v.replace(/^_*/, '');
    return '_' + priv + name;
}

/**
 * @param {string} hint basename for gensym
 * @param {...*} rest
 */
Compiler.prototype._gr = function(hint, rest)
{
    // Modified by allevato
    var v = "$ctx." + this.gensym(hint);
    out(v, "=");
    for (var i = 1; i < arguments.length; ++i)
    {
        out(arguments[i]);
    }
    out(";");
    return v;
}

/**
* Function to test if an interrupt should occur if the program has been running for too long.
* This function is executed at every test/branch operation. 
*/
Compiler.prototype._interruptTest = function() { // Added by RNL
// commented out by allevato
//  out("if (Sk.execStart === undefined) {Sk.execStart=new Date()}");
//      out("if (Sk.execLimit != null && new Date() - Sk.execStart > Sk.execLimit) {throw new Sk.builtin.TimeLimitError('Program exceeded run time limit.')}");
}

Compiler.prototype._jumpfalse = function(test, block)
{
    var cond = this._gr('jfalse', "(", test, "===false||!Sk.misceval.isTrue(", test, "))");
    this._interruptTest();  // Added by RNL
    out("if(", cond, "){/*test failed */$frm.blk=", block, ";Sk.yield();continue;}");
};

Compiler.prototype._jumpundef = function(test, block)
{
    this._interruptTest();  // Added by RNL
    out("if(", test, "===undefined){$frm.blk=", block, ";Sk.yield();continue;}");
};

Compiler.prototype._jumptrue = function(test, block)
{
    var cond = this._gr('jtrue', "(", test, "===true||Sk.misceval.isTrue(", test, "))");
    this._interruptTest();  // Added by RNL
    out("if(", cond, "){/*test passed */$frm.blk=", block, ";Sk.yield();continue;}");
};

/**
 * @param {number} block
 * @param {boolean=} forceYield
 */
Compiler.prototype._jump = function(block, forceYield)
{
    this._interruptTest();  // Added by RNL
    //if (forceYield)
    //  out("$frm.blk=", block, ";/* jump */Sk.yield(true);continue;");
    //else
      out("$frm.blk=", block, ";/* jump */Sk.yield();continue;");
};

Compiler.prototype.ctupleorlist = function(e, data, tuporlist)
{
    goog.asserts.assert(tuporlist === 'tuple' || tuporlist === 'list');
    if (e.ctx === Store)
    {
        for (var i = 0; i < e.elts.length; ++i)
        {
            this.vexpr(e.elts[i], "Sk.abstr.objectGetItem(" + data + "," + i + ")");
        }
    }
    else if (e.ctx === Load)
    {
        var items = [];
        for (var i = 0; i < e.elts.length; ++i)
        {
            items.push(this._gr('elem', this.vexpr(e.elts[i])));
        }
        return this._gr('load'+tuporlist, "new Sk.builtins['", tuporlist, "']([", items, "])");
    }
};

Compiler.prototype.cdict = function(e)
{
    goog.asserts.assert(e.values.length === e.keys.length);
    var items = [];
    for (var i = 0; i < e.values.length; ++i)
    {
        var v = this.vexpr(e.values[i]); // "backwards" to match order in cpy
        items.push(this.vexpr(e.keys[i]));
        items.push(v);
    }
    return this._gr('loaddict', "new Sk.builtins['dict']([", items, "])");
};

Compiler.prototype.clistcompgen = function(tmpname, generators, genIndex, elt)
{
    var start = this.newBlock('list gen start');
    var skip = this.newBlock('list gen skip');
    var anchor = this.newBlock('list gen anchor');

    var l = generators[genIndex];
    var toiter = this.vexpr(l.iter);
    var iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");
    this._jump(start);
    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
    this._jumpundef(nexti, anchor); // todo; this should be handled by StopIteration
    var target = this.vexpr(l.target, nexti);

    var n = l.ifs.length;
    for (var i = 0; i < n; ++i)
    {
        var ifres = this.vexpr(l.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length)
    {
        this.clistcompgen(tmpname, generators, genIndex, elt);
    }

    if (genIndex >= generators.length)
    {
        var velt = this.vexpr(elt);
        out(tmpname, ".v.push(", velt, ");"); // todo;
        this._jump(skip);
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(anchor);

    return tmpname;
};

Compiler.prototype.clistcomp = function(e)
{
    goog.asserts.assert(e instanceof ListComp);
    var tmp = this._gr("_compr", "new Sk.builtins['list']([])"); // note: _ is impt. for hack in name mangling (same as cpy)
    return this.clistcompgen(tmp, e.generators, 0, e.elt);
};

Compiler.prototype.cyield = function(e)
{
    if (this.u.ste.blockType !== FunctionBlock)
        throw new SyntaxError("'yield' outside function");
    var val = 'null';
    if (e.value)
        val = this.vexpr(e.value);
    var nextBlock = this.newBlock('after yield');
    // return a pair: resume target block and yielded value
    out("Sk._frameLeave();return [/*resume*/", nextBlock, ",/*ret*/", val, "];");
    this.setBlock(nextBlock);
    return '$gen.gi$sentvalue'; // will either be null if none sent, or the value from gen.send(value)
}

Compiler.prototype.ccompare = function(e)
{
    goog.asserts.assert(e.ops.length === e.comparators.length);
    var cur = this.vexpr(e.left);
    var n = e.ops.length;
    var done = this.newBlock("done");
    var fres = this._gr('compareres', 'null');

    for (var i = 0; i < n; ++i)
    {
        var rhs = this.vexpr(e.comparators[i]);
        var res = this._gr('compare', "Sk.misceval.richCompareBool(", cur, ",", rhs, ",'", e.ops[i].prototype._astname, "')");
        out(fres, '=', res, ';');
        this._jumpfalse(res, done);
        cur = rhs;
    }
    this._jump(done);
    this.setBlock(done);
    return fres;
};

Compiler.prototype.ccall = function(e)
{
    var func = this.vexpr(e.func);
    var args = this.vseqexpr(e.args);
    var retval;

    // added by allevato
    var beforecall = this.newBlock('before call');
    this._jump(beforecall, true);
    this.setBlock(beforecall);

    if (e.keywords.length > 0 || e.starargs || e.kwargs)
    {
        var kwarray = [];
        for (var i = 0; i < e.keywords.length; ++i)
        {
            kwarray.push("'" + e.keywords[i].arg.v + "'");
            kwarray.push(this.vexpr(e.keywords[i].value));
        }
        var keywords = "[" + kwarray.join(",") + "]";
        var starargs = "undefined";
        var kwargs = "undefined";
        if (e.starargs)
            starargs = this.vexpr(e.starargs);
        if (e.kwargs)
            kwargs = this.vexpr(e.kwargs);
        retval = this._gr('call', "Sk.misceval.call(", func, "," , kwargs, ",", starargs, ",", keywords, args.length > 0 ? "," : "", args, ")");
    }
    else
    {
        retval = this._gr('call', "Sk.misceval.callsim(", func, args.length > 0 ? "," : "", args, ")");
    }

    // added by allevato
    var aftercall = this.newBlock('after call');
    this._jump(aftercall);
    this.setBlock(aftercall);

    return retval;
};

Compiler.prototype.csimpleslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.assert(s.step === null);
    var lower = 'null', upper = 'null';
    if (s.lower)
        lower = this.vexpr(s.lower);
    if (s.upper)
        upper = this.vexpr(s.upper);

    // todo; don't require making a slice obj, and move logic into general sequence place
    switch (ctx)
    {
        case AugLoad:
        case Load:
            return this._gr("simpsliceload", "Sk.misceval.applySlice(", obj, ",", lower, ",", upper, ")");
        case AugStore:
        case Store:
            out("Sk.misceval.assignSlice(", obj, ",", lower, ",", upper, ",", dataToStore, ");");
            break;
        case Del:
            out("Sk.misceval.assignSlice(", obj, ",", lower, ",", upper, ",null);");
            break;
        case Param:
        default:
            goog.asserts.fail("invalid simple slice");
    }
};

Compiler.prototype.cslice = function(s, ctx, obj, dataToStore)
{
    goog.asserts.assert(s instanceof Slice);
    var low = s.lower ? this.vexpr(s.lower) : 'null';
    var high = s.upper ? this.vexpr(s.upper) : 'null';
    var step = s.step ? this.vexpr(s.step) : 'null';
    return this._gr('slice', "new Sk.builtins['slice'](", low, ",", high, ",", step, ")");
};

Compiler.prototype.vslice = function(s, ctx, obj, dataToStore)
{
    var kindname = null;
    var subs;
    switch (s.constructor)
    {
        case Index:
            kindname = "index";
            subs = this.vexpr(s.value);
            break;
        case Slice:
            if (!s.step)
                return this.csimpleslice(s, ctx, obj, dataToStore);
            if (ctx !== AugStore)
                subs = this.cslice(s, ctx, obj, dataToStore);
            break;
        case Ellipsis:
        case ExtSlice:
            goog.asserts.fail("todo;");
            break;
        default:
            goog.asserts.fail("invalid subscript kind");
    }
    return this.chandlesubscr(kindname, ctx, obj, subs, dataToStore);
};

Compiler.prototype.chandlesubscr = function(kindname, ctx, obj, subs, data)
{
    if (ctx === Load || ctx === AugLoad)
        return this._gr('lsubscr', "Sk.abstr.objectGetItem(", obj, ",", subs, ")");
    else if (ctx === Store || ctx === AugStore)
        out("Sk.abstr.objectSetItem(", obj, ",", subs, ",", data, ");");
    else if (ctx === Del)
        out("Sk.abstr.objectDelItem(", obj, ",", subs, ");");
    else
        goog.asserts.fail("handlesubscr fail");
};

Compiler.prototype.cboolop = function(e)
{
    goog.asserts.assert(e instanceof BoolOp);
    var jtype;
    var ifFailed;
    if (e.op === And)
        jtype = this._jumpfalse;
    else
        jtype = this._jumptrue;
    var end = this.newBlock('end of boolop');
    var s = e.values;
    var n = s.length;
    var retval;
    for (var i = 0; i < n; ++i)
    {
        var expres = this.vexpr(s[i])
        if (i === 0)
        {
            retval = this._gr('boolopsucc', expres);
        }
        out(retval, "=", expres, ";");
        jtype.call(this, expres, end);
    }
    this._jump(end);
    this.setBlock(end);
    return retval;
};


/**
 *
 * compiles an expression. to 'return' something, it'll gensym a var and store
 * into that var so that the calling code doesn't have avoid just pasting the
 * returned name.
 *
 * @param {Object} e
 * @param {string=} data data to store in a store operation
 * @param {Object=} augstoreval value to store to for an aug operation (not
 * vexpr'd yet)
 */
Compiler.prototype.vexpr = function(e, data, augstoreval)
{
    if (e.lineno > this.u.lineno)
    {
        this.u.lineno = e.lineno;
        this.u.linenoSet = false;
    }
    //this.annotateSource(e);
    switch (e.constructor)
    {
        case BoolOp:
            return this.cboolop(e);
        case BinOp:
            return this._gr('binop', "Sk.abstr.numberBinOp(", this.vexpr(e.left), ",", this.vexpr(e.right), ",'", e.op.prototype._astname, "')");
        case UnaryOp:
            return this._gr('unaryop', "Sk.abstr.numberUnaryOp(", this.vexpr(e.operand), ",'", e.op.prototype._astname, "')");
        case Lambda:
            return this.clambda(e);
        case IfExp:
            return this.cifexp(e);
        case Dict:
            return this.cdict(e);
        case ListComp:
            return this.clistcomp(e);
        case GeneratorExp:
            return this.cgenexp(e);
        case Yield:
            return this.cyield(e);
        case Compare:
            return this.ccompare(e);
        case Call:
            return this.ccall(e);
        case Num:
            if (typeof e.n === "number")
                return e.n;
            else if (e.n instanceof Sk.builtin.lng)
                return "Sk.longFromStr('" + e.n.tp$str().v + "')";
            goog.asserts.fail("unhandled Num type");
        case Str:
            return this._gr('str', "new Sk.builtins['str'](", e.s['$r']().v, ")");
        case Attribute:
            var val;
            if (e.ctx !== AugStore)
                val = this.vexpr(e.value);
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                    return this._gr("lattr", "Sk.abstr.gattr(", val, ",", e.attr['$r']().v, ")");
                case AugStore:
                    out("if(", data, "!==undefined){"); // special case to avoid re-store if inplace worked
                    val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                    out("Sk.abstr.sattr(", val, ",", e.attr['$r']().v, ",", data, ");");
                    out("}");
                    break;
                case Store:
                    out("Sk.abstr.sattr(", val, ",", e.attr['$r']().v, ",", data, ");");
                    break;
                case Del:
                    goog.asserts.fail("todo;");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid attribute expression");
            }
            break;
        case Subscript:
            var val;
            switch (e.ctx)
            {
                case AugLoad:
                case Load:
                case Store:
                case Del:
                    return this.vslice(e.slice, e.ctx, this.vexpr(e.value), data);
                case AugStore:
                    out("if(", data, "!==undefined){"); // special case to avoid re-store if inplace worked
                    val = this.vexpr(augstoreval || null); // the || null can never happen, but closure thinks we can get here with it being undef
                    this.vslice(e.slice, e.ctx, val, data);
                    out("}");
                    break;
                case Param:
                default:
                    goog.asserts.fail("invalid subscript expression");
            }
            break;
        case Name:
            return this.nameop(e.id, e.ctx, data);
        case List:
            return this.ctupleorlist(e, data, 'list');
        case Tuple:
            return this.ctupleorlist(e, data, 'tuple');
        default:
            goog.asserts.fail("unhandled case in vexpr");
    }
};

/**
 * @param {Array.<Object>} exprs
 * @param {Array.<string>=} data
 */
Compiler.prototype.vseqexpr = function(exprs, data)
{
    goog.asserts.assert(data === undefined || exprs.length === data.length);
    var ret = [];
    for (var i = 0; i < exprs.length; ++i)
        ret.push(this.vexpr(exprs[i], data === undefined ? undefined : data[i]));
    return ret;
};

Compiler.prototype.caugassign = function(s)
{
    goog.asserts.assert(s instanceof AugAssign);
    var e = s.target;
    switch (e.constructor)
    {
        case Attribute:
            var auge = new Attribute(e.value, e.attr, AugLoad, e.lineno, e.col_offset);
            var aug = this.vexpr(auge);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinopattr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value)
        case Subscript:
            var auge = new Subscript(e.value, e.slice, AugLoad, e.lineno, e.col_offset);
            var aug = this.vexpr(auge);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinopsubscr', "Sk.abstr.numberInplaceBinOp(", aug, ",", val, ",'", s.op.prototype._astname, "')");
            auge.ctx = AugStore;
            return this.vexpr(auge, res, e.value)
        case Name:
            var to = this.nameop(e.id, Load);
            var val = this.vexpr(s.value);
            var res = this._gr('inplbinop', "Sk.abstr.numberInplaceBinOp(", to, ",", val, ",'", s.op.prototype._astname, "')");
            return this.nameop(e.id, Store, res);
        default:
            goog.asserts.fail("unhandled case in augassign");
    }
};

/**
 * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
 */
Compiler.prototype.exprConstant = function(e)
{
    switch (e.constructor)
    {
        case Num:
            return Sk.misceval.isTrue(e.n);
        case Str:
            return Sk.misceval.isTrue(e.s);
        case Name:
            // todo; do __debug__ test here if opt
        default:
            return -1;
    }
};

Compiler.prototype.newBlock = function(name)
{
    var ret = this.u.blocknum++;
    this.u.blocks[ret] = [];
    this.u.blocks[ret]._name = name || '<unnamed>';
    return ret;
};
Compiler.prototype.setBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.curblock = n;
};

Compiler.prototype.pushBreakBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.breakBlocks.push(n);
};
Compiler.prototype.popBreakBlock = function()
{
    this.u.breakBlocks.pop();
};

Compiler.prototype.pushContinueBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.continueBlocks.push(n);
};
Compiler.prototype.popContinueBlock = function()
{
    this.u.continueBlocks.pop();
};

Compiler.prototype.pushExceptBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.exceptBlocks.push(n);
};
Compiler.prototype.popExceptBlock = function()
{
    this.u.exceptBlocks.pop();
};

Compiler.prototype.pushFinallyBlock = function(n)
{
    goog.asserts.assert(n >= 0 && n < this.u.blocknum);
    this.u.finallyBlocks.push(n);
};
Compiler.prototype.popFinallyBlock = function()
{
    this.u.finallyBlocks.pop();
};

Compiler.prototype.setupExcept = function(eb)
{
    out("$exc.push(", eb, ");try{");
    //this.pushExceptBlock(eb);
};

Compiler.prototype.endExcept = function()
{
    out("$exc.pop();}catch($err){");
    out("$frm.blk=$exc.pop();");
    out("Sk.yield();continue;}");
};

Compiler.prototype.outputLocals = function(unit)
{
    var have = {};
    //print("args", unit.name.v, JSON.stringify(unit.argnames));
    for (var i = 0; unit.argnames && i < unit.argnames.length; ++i)
        have[unit.argnames[i]] = true;
    unit.localnames.sort();
    var output = [];
    for (var i = 0; i < unit.localnames.length; ++i)
    {
        var name = unit.localnames[i];
        if (have[name] === undefined)
        {
            output.push(name);
            have[name] = true;
        }
    }
    if (output.length > 0)
        return "var " + output.join(",") + "; /* locals */";
    return "";
};

Compiler.prototype.outputAllUnits = function()
{
    var ret = '';
    for (var j = 0; j < this.allUnits.length; ++j)
    {
        var unit = this.allUnits[j];
        ret += unit.prefixCode;
        ret += unit.varDeclsCode;
        ret += this.outputLocals(unit);
        ret += unit.switchCode;
        var blocks = unit.blocks;
        for (var i = 0; i < blocks.length; ++i)
        {
            ret += "case " + i + ": /* --- " + blocks[i]._name + " --- */";
            ret += blocks[i].join('');

            ret += "goog.asserts.fail('unterminated block');";
        }
        ret += unit.suffixCode;
    }
    return ret;
};

Compiler.prototype.cif = function(s)
{
    goog.asserts.assert(s instanceof If_);
    var constant = this.exprConstant(s.test);
    if (constant === 0)
    {
        if (s.orelse) 
            this.vseqstmt(s.orelse);
    }
    else if (constant === 1)
    {
        this.vseqstmt(s.body);
    }
    else
    {
        var end = this.newBlock('end of if');
        var next = this.newBlock('next branch of if');

        var test = this.vexpr(s.test);
        this._jumpfalse(this.vexpr(s.test), next);
        this.vseqstmt(s.body);
        this._jump(end);

        this.setBlock(next);
        if (s.orelse)
            this.vseqstmt(s.orelse);
        this._jump(end);
    }
    this.setBlock(end);

};

Compiler.prototype.cwhile = function(s)
{
    var constant = this.exprConstant(s.test);
    if (constant === 0)
    {
        if (s.orelse)
            this.vseqstmt(s.orelse);
    }
    else
    {
        var top = this.newBlock('while test');
        this._jump(top);
        this.setBlock(top);

        var next = this.newBlock('after while');
        var orelse = s.orelse.length > 0 ? this.newBlock('while orelse') : null;
        var body = this.newBlock('while body');

        this._jumpfalse(this.vexpr(s.test), orelse ? orelse : next);
        this._jump(body);

        this.pushBreakBlock(next);
        this.pushContinueBlock(top);

        this.setBlock(body);
        this.vseqstmt(s.body);
        this._jump(top);

        this.popContinueBlock();
        this.popBreakBlock();

        if (s.orelse.length > 0)
        {
            this.setBlock(orelse);
            this.vseqstmt(s.orelse);
        }

        this.setBlock(next);
    }
};

Compiler.prototype.cfor = function(s)
{
    var start = this.newBlock('for start');
    var cleanup = this.newBlock('for cleanup');
    var end = this.newBlock('for end');

    this.pushBreakBlock(end);
    this.pushContinueBlock(start);

    // get the iterator
    var toiter = this.vexpr(s.iter);
    var iter;
    if (this.u.ste.generator)
    {
        // if we're in a generator, we have to store the iterator to a local
        // so it's preserved (as we cross blocks here and assume it survives)
        iter = "$loc." + this.gensym("iter");
        out(iter, "=Sk.abstr.iter(", toiter, ");");
    }
    else
        iter = this._gr("iter", "Sk.abstr.iter(", toiter, ")");

    this._jump(start);

    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
    this._jumpundef(nexti, cleanup); // todo; this should be handled by StopIteration
    var target = this.vexpr(s.target, nexti);

    // execute body
    this.vseqstmt(s.body);
    
    // jump to top of loop
    this._jump(start);

    this.setBlock(cleanup);
    this.popContinueBlock();
    this.popBreakBlock();

    this.vseqstmt(s.orelse);
    this._jump(end);

    this.setBlock(end);
};

Compiler.prototype.craise = function(s)
{
    if (s.type.id.v === "StopIteration")
    {
        // currently, we only handle StopIteration, and all it does it return
        // undefined which is what our iterator protocol requires.
        //
        // totally hacky, but good enough for now.
        out("return undefined;");
    }
    else
    {
        // todo;
        var inst = '';
        if (s.inst)
            inst = this.vexpr(s.inst);
        out("throw new ", this.vexpr(s.type), "(", inst, ");");
    }
};

Compiler.prototype.ctryexcept = function(s)
{
    var except = this.newBlock("except");
    var orelse = this.newBlock("orelse");
    var end = this.newBlock("end");

    this.setupExcept(except);

    this.vseqstmt(s.body);

    this.endExcept();

    this._jump(orelse);

    this.setBlock(except);
    var n = s.handlers.length;
    for (var i = 0; i < n; ++i)
    {
        var handler = s.handlers[i];
        if (handler.type && i < n - 1)
            throw new SyntaxError("default 'except:' must be last");
        except = this.newBlock("except_" + i + "_");
        if (handler.type)
        {
            // todo; not right at all
            this._jumpfalse(this.vexpr(handler.type), except);
        }
        // todo; name
        this.vseqstmt(handler.body);
    }

    this.setBlock(orelse);
    this.vseqstmt(s.orelse);
    this._jump(end);
    this.setBlock(end);
};

Compiler.prototype.ctryfinally = function(s)
{
    out("/*todo; tryfinally*/");
};

Compiler.prototype.cassert = function(s)
{
    /* todo; warnings method
    if (s.test instanceof Tuple && s.test.elts.length > 0)
        Sk.warn("assertion is always true, perhaps remove parentheses?");
    */

    var test = this.vexpr(s.test);
    var end = this.newBlock("end");
    this._jumptrue(test, end);
    // todo; exception handling
    // maybe replace with goog.asserts.fail?? or just an alert?
    out("throw new Sk.builtins.AssertionError(", s.msg ? this.vexpr(s.msg) : "", ");");
    this.setBlock(end);
};

Compiler.prototype.cimportas = function(name, asname, mod)
{
    var src = name.v;
    var dotLoc = src.indexOf(".");
    //print("src", src);
    //print("dotLoc", dotLoc);
    var cur = mod;
    if (dotLoc !== -1)
    {
        // if there's dots in the module name, __import__ will have returned
        // the top-level module. so, we need to extract the actual module by
        // getattr'ing up through the names, and then storing the leaf under
        // the name it was to be imported as.
        src = src.substr(dotLoc + 1);
        //print("src now", src);
        while (dotLoc !== -1)
        {
            dotLoc = src.indexOf(".");
            var attr = dotLoc !== -1 ? src.substr(0, dotLoc) : src;
            cur = this._gr('lattr', "Sk.abstr.gattr(", cur, ",'", attr, "')");
            src = src.substr(dotLoc + 1);
        }
    }
    return this.nameop(asname, Store, cur);
};

Compiler.prototype.cimport = function(s)
{
    var n = s.names.length;
    for (var i = 0; i < n; ++i)
    {
        var alias = s.names[i];
        var mod = this._gr('module', "Sk.builtin.__import__(", alias.name['$r']().v, ",$gbl,$loc,[])");

        if (alias.asname)
        {
            this.cimportas(alias.name, alias.asname, mod);
        }
        else
        {
            var tmp = alias.name;
            var lastDot = tmp.v.indexOf('.');
            if (lastDot !== -1)
                tmp = new Sk.builtin.str(tmp.v.substr(0, lastDot));
            this.nameop(tmp, Store, mod);
        }
    }
};

Compiler.prototype.cfromimport = function(s)
{
    var n = s.names.length;
    var names = [];
    for (var i = 0; i < n; ++i)
        names[i] = s.names[i].name['$r']().v;
    var mod = this._gr('module', "Sk.builtin.__import__(", s.module['$r']().v, ",$gbl,$loc,[", names, "])");
    for (var i = 0; i < n; ++i)
    {
        var alias = s.names[i];
        if (i === 0 && alias.name.v === "*")
        {
            goog.asserts.assert(n === 1);
            out("Sk.importStar(", mod, ");");
            return;
        }

        var got = this._gr('item', "Sk.abstr.gattr(", mod, ",", alias.name['$r']().v, ")");
        var storeName = alias.name;
        if (alias.asname)
            storeName = alias.asname;
        this.nameop(storeName, Store, got);
    }
};

/**
 * builds a code object (js function) for various constructs. used by def,
 * lambda, generator expressions. it isn't used for class because it seemed
 * different enough.
 *
 * handles:
 * - setting up a new scope
 * - decorators (if any)
 * - defaults setup
 * - setup for cell and free vars
 * - setup and modification for generators
 *
 * @param {Object} n ast node to build for
 * @param {Sk.builtin.str} coname name of code object to build
 * @param {Array} decorator_list ast of decorators if any
 * @param {arguments_} args arguments to function, if any
 * @param {Function} callback called after setup to do actual work of function
 *
 * @returns the name of the newly created function or generator object.
 *
 */
Compiler.prototype.buildcodeobj = function(n, coname, decorator_list, args, callback)
{
    var decos = [];
    var defaults = [];
    var vararg = null;
    var kwarg = null;

    // decorators and defaults have to be evaluated out here before we enter
    // the new scope. we output the defaults and attach them to this code
    // object, but only once we know the name of it (so we do it after we've
    // exited the scope near the end of this function).
    if (decorator_list)
        decos = this.vseqexpr(decorator_list);
    if (args && args.defaults)
        defaults = this.vseqexpr(args.defaults);
    if (args && args.vararg)
        vararg = args.vararg;
    if (args && args.kwarg)
        kwarg = args.kwarg;

    //
    // enter the new scope, and create the first block
    //
    var scopename = this.enterScope(coname, n, n.lineno);

    var isGenerator = this.u.ste.generator;
    var hasFree = this.u.ste.hasFree;
    var hasCell = this.u.ste.childHasFree;

    var entryBlock = this.newBlock('codeobj entry');

    //
    // the header of the function, and arguments
    //
    var cachedscope = "$moddata.scopes['" + scopename + "']";

    // modified by allevato
    this.u.prefixCode = cachedscope + "=" + cachedscope + "||(function " + this.niceName(coname.v) + "$(";

    var funcArgs = [];
    if (isGenerator)
        funcArgs.push("$gen");
    else
    {
        if (kwarg)
            funcArgs.push("$kwa");
        for (var i = 0; args && i < args.args.length; ++i)
            funcArgs.push(this.nameop(args.args[i].id, Param));
    }
    if (hasFree)
        funcArgs.push("$free");
    this.u.prefixCode += funcArgs.join(",");

    this.u.prefixCode += "){";

    if (isGenerator) this.u.prefixCode += "\n// generator\n";
    if (hasFree) this.u.prefixCode += "\n// has free\n";
    if (hasCell) this.u.prefixCode += "\n// has cell\n";

    //
    // set up standard dicts/variables
    //
    var locals = "$ctx.$loc||{}";
    if (isGenerator)
    {
        entryBlock = "$gen.gi$resumeat";
        locals = "$ctx.$loc||$gen.gi$locals";
    }
    var cells = "";
    if (hasCell)
        cells = ",$cell=$ctx.$cell||{}";

    // note special usage of 'this' to avoid having to slice globals into
    // all function invocations in call
    //
    // FIXME (allevato): I think the use of "this" here for the globals causes
    // problems when calling functions from within a method after an async
    // continuation... not sure how to fix it yet. Here's a snippet that fails:
    //
    // class Foo:
    //   def ask(self):
    //     self.x = input("Enter a number: ")
    //
    //   def lastValue(self):
    //     return int(self.x)
    //
    // foo = Foo()
    // foo.ask()
    //
    // while foo.lastValue() != 0:
    //   print foo.lastValue() * foo.lastValue()
    //   foo.ask()
    //
    this.u.varDeclsCode += "var $frm=Sk._frameEnter(" + entryBlock + ");";
    this.u.varDeclsCode += "var $ctx=$frm.ctx,$exc=$ctx.$exc||[],$loc=" + locals + cells + ",$gbl=$ctx.$gbl||this;"
      + "$ctx.$exc=$exc; " + (hasCell ? "$ctx.$cell=$cell; " : "") + "$ctx.$gbl=$gbl; $ctx.$loc=$loc;"
    for (var i = 0; i < funcArgs.length; ++i)
    {
      this.u.varDeclsCode += "$ctx." + funcArgs[i] + "=" + "$ctx." + funcArgs[i] + "||" + funcArgs[i] + ";";
    }

    //
    // copy all parameters that are also cells into the cells dict. this is so
    // they can be accessed correctly by nested scopes.
    //
    for (var i = 0; args && i < args.args.length; ++i)
    {
        var id = args.args[i].id;
        if (this.isCell(id))
            this.u.varDeclsCode += "$cell." + id.v + "=" + id.v + ";";
    }

    //
    // initialize default arguments. we store the values of the defaults to
    // this code object as .$defaults just below after we exit this scope.
    //
    if (defaults.length > 0)
    {
        // defaults have to be "right justified" so if there's less defaults
        // than args we offset to make them match up (we don't need another
        // correlation in the ast)
        var offset = args.args.length - defaults.length;
        for (var i = 0; i < defaults.length; ++i)
        {
            var argname = this.nameop(args.args[i + offset].id, Param);
            
            if (isGenerator)
            {
              this.u.varDeclsCode += "if($ctx.$loc." + argname +
                "===undefined)$ctx.$loc." + argname + "=" +
                scopename + ".$defaults[" + i + "];";
            }
            else
            {
              this.u.varDeclsCode += "if(" + argname + "===undefined)$ctx." +
                argname + "=" + scopename + ".$defaults[" + i + "];";
            }
        }
    }

    //
    // initialize vararg, if any
    //
    if (vararg)
    {
        var start = funcArgs.length;
        this.u.varDeclsCode += "$ctx." + vararg.v + "=new Sk.builtins['tuple'](Array.prototype.slice.call(arguments," + start + ")); /*vararg*/";
    }

    //
    // initialize kwarg, if any
    //
    if (kwarg)
    {
        this.u.varDeclsCode += "$ctx." + kwarg.v + "=new Sk.builtins['dict']($kwa);";
    }

    //
    // finally, set up the block switch that the jump code expects
    //
    this.u.switchCode += "while(true){switch($frm.blk){";
    this.u.suffixCode = "}break;}});";
    this.u.suffixCode += "var " + scopename + "=" + cachedscope + ";";

    //
    // jump back to the handler so it can do the main actual work of the
    // function
    //
    callback.call(this, scopename);

    //
    // get a list of all the argument names (used to attach to the code
    // object, and also to allow us to declare only locals that aren't also
    // parameters).
    var argnames;
    if (args && args.args.length > 0)
    {
        var argnamesarr = [];
        for (var i = 0; i < args.args.length; ++i)
            argnamesarr.push(args.args[i].id.v);

        argnames = argnamesarr.join("', '");
        // store to unit so we know what local variables not to declare
        this.u.argnames = argnamesarr;
    }

    //
    // and exit the code object scope
    //
    this.exitScope();

    //
    // attach the default values we evaluated at the beginning to the code
    // object so that it can get at them to set any arguments that are left
    // unset.
    //
    if (defaults.length > 0)
        out(scopename, ".$defaults=[", defaults.join(','), "];");


    //
    // attach co_varnames (only the argument names) for keyword argument
    // binding.
    //
    if (argnames)
    {
        out(scopename, ".co_varnames=['", argnames, "'];");
    }

    //
    // attach flags
    //
    if (kwarg)
    {
        out(scopename, ".co_kwargs=1;");
    }

    //
    // build either a 'function' or 'generator'. the function is just a simple
    // constructor call. the generator is more complicated. it needs to make a
    // new generator every time it's called, so the thing that's returned is
    // actually a function that makes the generator (and passes arguments to
    // the function onwards to the generator). this should probably actually
    // be a function object, rather than a js function like it is now. we also
    // have to build the argument names to pass to the generator because it
    // needs to store all locals into itself so that they're maintained across
    // yields.
    //
    // todo; possibly this should be outside?
    // 
    var frees = "";
    if (hasFree)
    {
        frees = ",$cell";
        // if the scope we're in where we're defining this one has free
        // vars, they may also be cell vars, so we pass those to the
        // closure too.
        var containingHasFree = this.u.ste.hasFree;
        if (containingHasFree)
            frees += ",$free";
    }
    if (isGenerator)
        if (args && args.args.length > 0)
            return this._gr("gener", "(function(){var $origargs=Array.prototype.slice.call(arguments);return new Sk.builtins['generator'](", scopename, ",$gbl,$origargs", frees, ");})");
        else
            return this._gr("gener", "(function(){return new Sk.builtins['generator'](", scopename, ",$gbl,[]", frees, ");})");
    else
        return this._gr("funcobj", "new Sk.builtins['function'](", scopename, ",$gbl", frees ,")");
};

Compiler.prototype.cfunction = function(s)
{
    goog.asserts.assert(s instanceof FunctionDef);
    var funcorgen = this.buildcodeobj(s, s.name, s.decorator_list, s.args, function(scopename)
            {
                this.vseqstmt(s.body);
                out("Sk._frameLeave();return null;"); // if we fall off the bottom, we want the ret to be None
            });
    this.nameop(s.name, Store, funcorgen);
};

Compiler.prototype.clambda = function(e)
{
    goog.asserts.assert(e instanceof Lambda);
    var func = this.buildcodeobj(e, new Sk.builtin.str("<lambda>"), null, e.args, function(scopename)
            {
                var val = this.vexpr(e.body);
                out("Sk._frameLeave();return ", val, ";");
            });
    return func;
};

Compiler.prototype.cifexp = function(e)
{
    var next = this.newBlock('next of ifexp');
    var end = this.newBlock('end of ifexp');
    var ret = this._gr('res', 'null');

    var test = this.vexpr(e.test);
    this._jumpfalse(test, next);

    out(ret, '=', this.vexpr(e.body), ';');
    this._jump(end);

    this.setBlock(next);
    out(ret, '=', this.vexpr(e.orelse), ';');
    this._jump(end);

    this.setBlock(end);
    return ret;
};

Compiler.prototype.cgenexpgen = function(generators, genIndex, elt)
{
    var start = this.newBlock('start for ' + genIndex);
    var skip = this.newBlock('skip for ' + genIndex);
    var ifCleanup = this.newBlock('if cleanup for ' + genIndex);
    var end = this.newBlock('end for ' + genIndex);

    var ge = generators[genIndex];

    var iter;
    if (genIndex === 0)
    {
        // the outer most iterator is evaluated in the scope outside so we
        // have to evaluate it outside and store it into the generator as a
        // local, which we retrieve here.
        iter = "$loc.$iter0";
    }
    else
    {
        var toiter = this.vexpr(ge.iter);
        iter = "$loc." + this.gensym("iter");
        out(iter, "=", "Sk.abstr.iter(", toiter, ");");
    }
    this._jump(start);
    this.setBlock(start);

    // load targets
    var nexti = this._gr('next', "Sk.abstr.iternext(", iter, ")");
    this._jumpundef(nexti, end); // todo; this should be handled by StopIteration
    var target = this.vexpr(ge.target, nexti);

    var n = ge.ifs.length;
    for (var i = 0; i < n; ++i)
    {
        var ifres = this.vexpr(ge.ifs[i]);
        this._jumpfalse(ifres, start);
    }

    if (++genIndex < generators.length)
    {
        this.cgenexpgen(generators, genIndex, elt);
    }

    if (genIndex >= generators.length)
    {
        var velt = this.vexpr(elt);
        out("Sk._frameLeave();return [", skip, "/*resume*/,", velt, "/*ret*/];");
        this.setBlock(skip);
    }

    this._jump(start);

    this.setBlock(end);

    if (genIndex === 1)
        out("Sk._frameLeave();return null;");
};

Compiler.prototype.cgenexp = function(e)
{
    var gen = this.buildcodeobj(e, new Sk.builtin.str("<genexpr>"), null, null, function(scopename)
            {
                this.cgenexpgen(e.generators, 0, e.elt);
            });

    // call the generator maker to get the generator. this is kind of dumb,
    // but the code builder builds a wrapper that makes generators for normal
    // function generators, so we just do it outside (even just new'ing it
    // inline would be fine).
    var gener = this._gr("gener", gen, "()");
    // stuff the outermost iterator into the generator after evaluating it
    // outside of the function. it's retrieved by the fixed name above.
    out(gener, ".gi$locals.$iter0=Sk.abstr.iter(", this.vexpr(e.generators[0].iter), ");");
    return gener;
};



Compiler.prototype.cclass = function(s)
{
    goog.asserts.assert(s instanceof ClassDef);
    var decos = s.decorator_list;

    // decorators and bases need to be eval'd out here
    //this.vseqexpr(decos);
    
    var bases = this.vseqexpr(s.bases);

    var scopename = this.enterScope(s.name, s, s.lineno);
    var entryBlock = this.newBlock('class entry');

    var cachedscope = "$moddata.scopes['" + scopename + "']";

    // modified by allevato
    this.u.prefixCode = cachedscope + "=" + cachedscope + "||(function $" + s.name.v + "$class_outer($globals,$locals,$rest){" +
      "var $gbl=$outergbl=$globals,$loc=$outerloc=$locals;";
    this.u.switchCode += "return(function " + s.name.v + "(){";
    
    this.u.switchCode += "var $frm=Sk._frameEnter(" + entryBlock + ");" +
      "var $ctx=$frm.ctx,$exc=$ctx.$exc||[],$gbl=$ctx.$gbl||$globals,$loc=$ctx.$loc||$locals;" +
      "$ctx.$exc=$exc;$ctx.$gbl=$gbl;$ctx.$loc=$loc;" +
      "while(true){switch($frm.blk){\n";
    this.u.suffixCode = "};Sk._frameLeave();break;}}).apply(null,$rest);});";
    this.u.suffixCode += "var " + scopename + "=" + cachedscope + ";";

    this.u.private_ = s.name;
    
    this.cbody(s.body);
    out("break;");

    // build class

    // apply decorators

    this.exitScope();

    // added by allevato
    var beforebuildclass = this.newBlock('before build class');
    this._jump(beforebuildclass, true);
    this.setBlock(beforebuildclass);

    // todo; metaclass
    var wrapped = this._gr("built", "Sk.misceval.buildClass($gbl,", scopename, ",", s.name['$r']().v, ",[", bases, "])");

    // store our new class under the right name
    this.nameop(s.name, Store, wrapped);

    // added by allevato
    var afterbuildclass = this.newBlock('after build class');
    this._jump(afterbuildclass);
    this.setBlock(afterbuildclass);
};

Compiler.prototype.ccontinue = function(s)
{
    if (this.u.continueBlocks.length === 0)
        throw new SyntaxError("'continue' outside loop");
    // todo; continue out of exception blocks
    this._jump(this.u.continueBlocks[this.u.continueBlocks.length - 1]);
};

/**
 * compiles a statement
 */
Compiler.prototype.vstmt = function(s)
{
    this.u.lineno = s.lineno;
    this.u.linenoSet = false;

    this.annotateSource(s);

    switch (s.constructor)
    {
        case FunctionDef:
            this.cfunction(s);
            break;
        case ClassDef:
            this.cclass(s);
            break;
        case Return_:
            if (this.u.ste.blockType !== FunctionBlock)
                throw new SyntaxError("'return' outside function");
            if (s.value)
                out("Sk._frameLeave();return ", this.vexpr(s.value), ";");
            else
                out("Sk._frameLeave();return null;");
            break;
        case Delete_:
            this.vseqexpr(s.targets);
            break;
        case Assign:
            var n = s.targets.length;
            var val = this.vexpr(s.value);
            for (var i = 0; i < n; ++i)
                this.vexpr(s.targets[i], val);
            break;
        case AugAssign:
            return this.caugassign(s);
        case Print:
            this.cprint(s);
            break;
        case For_:
            return this.cfor(s);
        case While_:
            return this.cwhile(s);
        case If_:
            return this.cif(s);
        case Raise:
            return this.craise(s);
        case TryExcept:
            return this.ctryexcept(s);
        case TryFinally:
            return this.ctryfinally(s);
        case Assert:
            return this.cassert(s);
        case Import_:
            return this.cimport(s);
        case ImportFrom:
            return this.cfromimport(s);
        case Global:
            break;
        case Expr:
            this.vexpr(s.value);
            break;
        case Pass:
            break;
        case Break_:
            if (this.u.breakBlocks.length === 0)
                throw new SyntaxError("'break' outside loop");
            this._jump(this.u.breakBlocks[this.u.breakBlocks.length - 1]);
            break;
        case Continue_:
            this.ccontinue(s);
            break;
        default:
            goog.asserts.fail("unhandled case in vstmt");
    }
};

Compiler.prototype.vseqstmt = function(stmts)
{
    for (var i = 0; i < stmts.length; ++i) this.vstmt(stmts[i]);
};

var OP_FAST = 0;
var OP_GLOBAL = 1;
var OP_DEREF = 2;
var OP_NAME = 3;
var D_NAMES = 0;
var D_FREEVARS = 1;
var D_CELLVARS = 2;

Compiler.prototype.isCell = function(name)
{
    var mangled = mangleName(this.u.private_, name).v;
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    if (scope === CELL)
        return true;
    return false;
};

/**
 * @param {Sk.builtin.str} name
 * @param {Object} ctx
 * @param {string=} dataToStore
 */
Compiler.prototype.nameop = function(name, ctx, dataToStore)
{
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "__debug__")
        this.error("can not assign to __debug__");
    if ((ctx === Store || ctx === AugStore || ctx === Del) && name.v === "None")
        this.error("can not assign to None");

    if (name.v === "None") return "null";
    if (name.v === "True") return "true";
    if (name.v === "False") return "false";

    var mangled = mangleName(this.u.private_, name).v;
    var op = 0;
    var optype = OP_NAME;
    var scope = this.u.ste.getScope(mangled);
    var dict = null;
    switch (scope)
    {
        case FREE:
            dict = "$free";
            optype = OP_DEREF;
            break;
        case CELL:
            dict = "$cell";
            optype = OP_DEREF;
            break;
        case LOCAL:
            // can't do FAST in generators or at module/class scope
            // removed by allevato; nested functions need to be stored in $ctx
            // so that they can be called after async continuation
            //if (this.u.ste.blockType === FunctionBlock && !this.u.ste.generator)
            //    optype = OP_FAST;
            break;
        case GLOBAL_IMPLICIT:
            if (this.u.ste.blockType === FunctionBlock)
                optype = OP_GLOBAL;
            break;
        case GLOBAL_EXPLICIT:
            optype = OP_GLOBAL;
        default:
            break;
    }

    // have to do this after looking it up in the scope
    mangled = fixReservedWords(mangled);

    //print("mangled", mangled);
    // TODO TODO TODO todo; import * at global scope failing here
    goog.asserts.assert(scope || name.v.charAt(1) === '_');

    // in generator or at module scope, we need to store to $loc, rather that
    // to actual JS stack variables.
    var mangledNoPre = mangled;
    if (this.u.ste.generator || this.u.ste.blockType !== FunctionBlock)
        mangled = "$loc." + mangled;
    else if (optype === OP_FAST || optype === OP_NAME)
        this.u.localnames.push(mangled);

    switch (optype)
    {
        case OP_FAST:
            switch (ctx)
            {
                case Load:
                case Param:
                    return mangled;
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_NAME:
            // Added by allevato
            mangled = "$ctx." + mangled;
            switch (ctx)
            {
                case Load:
                    var v = "$ctx." + this.gensym('loadname');
                    // can't be || for loc.x = 0 or null
                    out(v, "=", mangled, "!==undefined?",mangled,":Sk.misceval.loadname('",mangledNoPre,"',$gbl);");
                    return v;
                case Store:
                    out(mangled, "=", dataToStore, ";");
                    break;
                case Del:
                    out("delete ", mangled, ";");
                    break;
                case Param:
                    return mangledNoPre;
                default:
                    goog.asserts.fail("unhandled");
            }
            break;
        case OP_GLOBAL:
            switch (ctx)
            {
                case Load:
                    return this._gr("loadgbl", "Sk.misceval.loadname('", mangledNoPre, "',$gbl)");
                case Store:
                    out("$gbl.", mangledNoPre, "=", dataToStore, ';');
                    break;
                case Del:
                    out("delete $gbl.", mangledNoPre);
                    break;
                default:
                    goog.asserts.fail("unhandled case in name op_global");
            }
            break;
        case OP_DEREF:
            switch (ctx)
            {
                case Load:
                    return dict + "." + mangledNoPre;
                case Store:
                    out(dict, ".", mangledNoPre, "=", dataToStore, ";");
                    break;
                case Param:
                    return mangledNoPre;
                default:
                    goog.asserts.fail("unhandled case in name op_deref");
            }
            break;
        default:
            goog.asserts.fail("unhandled case");
    }
};

Compiler.prototype.enterScope = function(name, key, lineno)
{
    var u = new CompilerUnit();
    u.ste = this.st.getStsForAst(key);
    u.name = name;
    u.firstlineno = lineno;

    this.stack.push(this.u);
    this.allUnits.push(u);
    var scopeName = this.gensym('scope');
    u.scopename = scopeName;

    this.u = u;
    this.u.activateScope();

    this.nestlevel++;

    return scopeName;
};

Compiler.prototype.exitScope = function()
{
    var prev = this.u;
    this.nestlevel--;
    if (this.stack.length - 1 >= 0)
        this.u = this.stack.pop();
    else
        this.u = null;
    if (this.u)
        this.u.activateScope();

    if (prev.name.v !== "<module>") // todo; hacky
        out(prev.scopename, ".co_name=new Sk.builtins['str'](", prev.name['$r']().v, ");");
};

Compiler.prototype.cbody = function(stmts)
{
    for (var i = 0; i < stmts.length; ++i)
        this.vstmt(stmts[i]);
};

Compiler.prototype.cprint = function(s)
{
    goog.asserts.assert(s instanceof Print);
    var dest = 'null';
    if (s.dest)
        dest = this.vexpr(s.dest);

    var n = s.values.length;
    // todo; dest disabled
    for (var i = 0; i < n; ++i)
        out('Sk.misceval.print_(', /*dest, ',',*/ "new Sk.builtins['str'](", this.vexpr(s.values[i]), ').v);');
    if (s.nl)
        out('Sk.misceval.print_(', /*dest, ',*/ '"\\n");');
};

Compiler.prototype.cmod = function(mod)
{
    //print("-----");
    //print(Sk.astDump(mod));
    var modf = this.enterScope(new Sk.builtin.str("<module>"), mod, 0);
    var cachedscope = "$moddata.scopes['" + modf + "']";

    var entryBlock = this.newBlock('module entry');
    // modified by allevato
    this.u.prefixCode = cachedscope + "=" + cachedscope + "||(function($modname){";
    this.u.varDeclsCode = "var $frm=Sk._frameEnter(" + entryBlock + ");" +
      "var $ctx=$frm.ctx,$exc=$ctx.$exc||[],$gbl=$ctx.$gbl||{},$loc=$ctx.$loc||$gbl; $gbl.__name__=$modname;" +
      "$ctx.$exc=$exc;$ctx.$gbl=$gbl;$ctx.$loc=$loc;";
    this.u.switchCode = "while(true){switch($frm.blk){\n";
    this.u.suffixCode = "}}});";
    this.u.suffixCode += "var " + modf + "=" + cachedscope + ";";

    switch (mod.constructor)
    {
        case Module:
            this.cbody(mod.body);
            out("Sk._frameLeave();return $loc;");
            break;
        default:
            goog.asserts.fail("todo; unhandled case in compilerMod");
    }
    this.exitScope();

    this.result.push(this.outputAllUnits());
    return modf;
};

/**
 * @param {string} source the code
 * @param {string} filename where it came from
 * @param {string} mode one of 'exec', 'eval', or 'single'
 */
Sk.compile = function(source, filename, mode)
{
    //print("FILE:", filename);
    var cst = Sk.parse(filename, source);
    var ast = Sk.astFromParse(cst, filename);
    var st = Sk.symboltable(ast, filename);
    var c = new Compiler(filename, st, 0, source); // todo; CO_xxx
    var funcname = c.cmod(ast);
    var ret = c.result.join('');
    return {
        funcname: funcname,
        code: ret
    };
};


/**
 * @constructor
 * @param {Object=} future
 */
function SuspendExecution(future)
{
  this.future = future;
}

/**
 * Have a function call this to "suspend" the program so that you
 * can interactively provide the return value (like "input") or do
 * something else asynchronous without hanging the browser (like an
 * HTTP request).
 * 
 * This works as follows. Imagine that you have an input function
 * (like Sk.input) that you want to implement asynchronously by
 * displaying a text field in the browser window. In order to wait
 * for the user to type a response, program execution must be
 * suspended temporarily. So you could write Sk.input like this:
 *
 * Sk.input = function(prompt) {
 *   return Sk.future(function(continueWith) {
 *     // add #textfield to the DOM
 *     $('#textfield').change(function() {
 *       continueWith($('#textfield').val());
 *     });
 *   });
 * };
 *
 * The process:
 * 1. Surround the *entire body* of the asynchronous function in
 *    the call to Sk.future, because it will be invoked twice (once
 *    when it is initially called, to preserve the stack state and
 *    yield, and then a second time when the continueWith callback
 *    is invoked to resume execution), and you don't want to do
 *    anything that causes side effects.
 * 2. Sk.future takes a single parameter -- the function that will
 *    be executed to start the asynchronous process (in this case,
 *    add a text field to the DOM and hook up event listeners).
 * 3. The function that you give to Sk.future itself takes a single
 *    parameter, which is a handle to a function (continueWith)
 *    that you must call to provide the return value of the future.
 *    Once this is called, execution will resume.
 * 4. Once resumed, the Sk.future function will return the value
 *    that was passed to continueWith.
 *
 * @param perform the function that
 *    performs the actions that will return a value in the future
 */
Sk.future = function(perform)
{
  if (Sk._futureResult !== undefined)
  {
    var result = Sk._futureResult;
    delete Sk._futureResult;
    return result;
  }
  else
  {
    Sk._preservedFrames = Sk._frames;
    Sk._frameRestoreIndex = 0;
    Sk._frames = [];

    throw new SuspendExecution(perform);
  }
};

/**
 * Halt execution of the program until Sk.resume() is called. This is a
 * low-level primitive; most users who need to suspend execution (for
 * example, to wait for an asynchronous HTTP load to finish or to allow
 * interactive input) should use the higher-level Sk.future() instead.
 */
Sk.yield = function(force)
{
  var currentTime = new Date().getTime();

  if (!Sk._lastYieldTime
    || (currentTime - Sk._lastYieldTime > Sk.suspendInterval))
  {
    Sk._lastYieldTime = currentTime;

    if (!Sk._preservedFrames ||
      Sk._preservedFrames.length < Sk._frames.length)
    {
      Sk._preservedFrames = Sk._frames;
      Sk._frameRestoreIndex = 0;
      Sk._frames = [];

      throw new SuspendExecution();
    }
    else
    {
      delete Sk._preservedFrames;
      delete Sk._frameRestoreIndex;
    }
  }
};

/**
 * Resumes execution after Sk.yield(). This is a low-level primitive;
 * clients using Sk.future() should communicate their result to the
 * continueWith callback that gets passed into their future function.
 *
 * @param {Object=} result the optional result
 */
Sk.resume = function(result)
{
  Sk._initingObjectsIndex = 0;
  Sk._futureResult = result;

  var moddata = Sk._moduleStack[Sk._moduleStack.length - 1];
  return moddata.code(moddata);
};

Sk._hasFrameToRestore = function()
{
  return Sk._preservedFrames &&
    Sk._frameRestoreIndex < Sk._preservedFrames.length;
};

Sk._frameEnter = function(entryBlock)
{
  var frm;

  if (Sk._hasFrameToRestore())
  {
    frm = Sk._preservedFrames[Sk._frameRestoreIndex++];
  }
  else
  {
    frm = { ctx: {}, blk: entryBlock };
  }

  Sk._frames.push(frm);

  return frm;
};

Sk._frameLeave = function()
{
  Sk._frames.pop();
};

/**
 * Executes a Python module that has been translated into Javascript.
 *
 * @param code a JS function that executes the code in the module
 * @return the locals dictionary for the module
 */
Sk._execModule = function(code)
{
  var moduleData = {
    scopes: {},
    code: code
  };

  Sk._moduleStack.push(moduleData);
  var result = code(moduleData);
  Sk._moduleStack.pop();

  return result;
};

Sk._createOrRetrieveObject = function(self, initializer)
{
  if (Sk._initingObjects[Sk._initingObjectsIndex] !== undefined)
  {
    self = Sk._initingObjects[Sk._initingObjectsIndex++];
  }
  else
  {
    initializer.call(self);
    Sk._initingObjects.push(self);
    Sk._initingObjectsIndex++;
  }

  return self;
};

Sk._finishCreatingObject = function()
{
  Sk._initingObjects.pop();
  Sk._initingObjectsIndex--;
};

goog.exportSymbol("Sk.compile", Sk.compile);
goog.exportSymbol("Sk.future", Sk.future);
goog.exportSymbol("Sk.yield", Sk.yield);
goog.exportSymbol("Sk.resume", Sk.resume);
goog.exportSymbol("Sk._hasFrameToRestore", Sk._hasFrameToRestore);
goog.exportSymbol("Sk._frameEnter", Sk._frameEnter);
goog.exportSymbol("Sk._frameLeave", Sk._frameLeave);
goog.exportSymbol("Sk._execModule", Sk._execModule);
goog.exportSymbol("Sk._createOrRetrieveObject", Sk._createOrRetrieveObject);
goog.exportSymbol("Sk._finishCreatingObject", Sk._finishCreatingObject);
goog.exportSymbol("SuspendExecution", SuspendExecution);
// this is stored into sys specially, rather than created by sys
Sk.sysmodules = new Sk.builtin.dict([]);
Sk.realsyspath = undefined;

/**
 * @param {string} name to look for
 * @param {string} ext extension to use (.py or .js)
 * @param {boolean=} failok will throw if not true
 */
Sk.importSearchPathForName = function(name, ext, failok)
{
    var L = Sk.realsyspath;
    for (var it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        var nameAsPath = name.replace(/\./g, "/");
        var fns = [
            i.v + "/" + nameAsPath + ext,                 // module
            i.v + "/" + nameAsPath + "/__init__" + ext    // package
                ];

        for (var j = 0; j < fns.length; ++j)
        {
            var fn = fns[j];
            //Sk.debugout("  import search, trying", fn);
            try {
                // todo; lame, this is the only way we have to test existence right now
                Sk.read(fn);
                //Sk.debugout("import search, found at", name, "type", ext, "at", fn);
                return fn;
            } catch (e) {};
        }
    }
   
    if (!failok)
        throw new Sk.builtin.ImportError("No module named " + name);
    //Sk.debugout("import search, nothing found, but failure was ok");
};

Sk.doOneTimeInitialization = function()
{
    // can't fill these out when making the type because tuple/dict aren't
    // defined yet.
    Sk.builtin.type.basesStr_ = new Sk.builtin.str("__bases__");
    Sk.builtin.type.mroStr_ = new Sk.builtin.str("__mro__");
    Sk.builtin.object['$d'] = new Sk.builtin.dict([]);
    Sk.builtin.object['$d'].mp$ass_subscript(Sk.builtin.type.basesStr_, new Sk.builtin.tuple([]));
    Sk.builtin.object['$d'].mp$ass_subscript(Sk.builtin.type.mroStr_, new Sk.builtin.tuple([Sk.builtin.object]));
};

/**
 * currently only pull once from Sk.syspath. User might want to change
 * from js or from py.
 */
Sk.importSetUpPath = function()
{
    if (!Sk.realsyspath)
    {
        var paths = [
            new Sk.builtin.str("src/builtin"),
            new Sk.builtin.str("src/lib"),
            new Sk.builtin.str(".")
        ];
        for (var i = 0; i < Sk.syspath.length; ++i)
            paths.push(new Sk.builtin.str(Sk.syspath[i]));
        Sk.realsyspath = new Sk.builtin.list(paths);

        Sk.doOneTimeInitialization();

    }
};

if (COMPILED)
{
    var js_beautify = function(x) { return x; };
}

/**
 * @param {string} name name of module to import
 * @param {boolean=} dumpJS whether to output the generated js code
 * @param {string=} modname what to call the module after it's imported if
 * it's to be renamed (i.e. __main__)
 * @param {string=} suppliedPyBody use as the body of the text for the module
 * rather than Sk.read'ing it.
 */
Sk.importModuleInternal_ = function(name, dumpJS, modname, suppliedPyBody)
{
    //dumpJS = true;
    Sk.importSetUpPath();

    // if no module name override, supplied, use default name
    if (modname === undefined) modname = name;

    var toReturn = null;
    var modNameSplit = modname.split(".");
    var parentModName;

    // if leaf is already in sys.modules, early out
    var prev = Sk.sysmodules.mp$subscript(modname);
    if (prev !== undefined)
    {
        // if we're a dotted module, return the top level, otherwise ourselves
        if (modNameSplit.length > 1)
            return Sk.sysmodules.mp$subscript(modNameSplit[0]);
        else
            return prev;
    }

    if (modNameSplit.length > 1)
    {
        // if we're a module inside a package (i.e. a.b.c), then we'll need to return the
        // top-level package ('a'). recurse upwards on our parent, importing
        // all parent packages. so, here we're importing 'a.b', which will in
        // turn import 'a', and then return 'a' eventually.
        parentModName = modNameSplit.slice(0, modNameSplit.length - 1).join(".");
        toReturn = Sk.importModuleInternal_(parentModName, dumpJS);
    }

    // otherwise:
    // - create module object
    // - add module object to sys.modules
    // - compile source to (function(){...});
    // - run module and set the module locals returned to the module __dict__
    var module = new Sk.builtin.module();
    Sk.sysmodules.mp$ass_subscript(name, module);
    var filename, co, googClosure;

    if (suppliedPyBody)
    {
        filename = name + ".py";
        co = Sk.compile(suppliedPyBody, filename, "exec");
    }
    else
    {
        // if we have it as a builtin (i.e. already in JS) module then load that.
        var builtinfn = Sk.importSearchPathForName(name, ".js", true);
        if (builtinfn)
        {
            filename = builtinfn;
            co = { funcname: "$builtinmodule", code: Sk.read(filename) };
        }
        else
        {
            filename = Sk.importSearchPathForName(name, ".py");
            co = Sk.compile(Sk.read(filename), filename, "exec");
        }
    }

    var finalcode = co.code;

    // removed by allevato
	// if (Sk.dateSet == null || !Sk.dateSet) {
	// 	finalcode = 'Sk.execStart = new Date();\n' + co.code;
	// 	Sk.dateSet = true;
	// }

    var namestr = "new Sk.builtin.str('" + modname + "')";

    finalcode += "\nreturn " + co.funcname + "(" + namestr + ");";

    // added by allevato: Each module needs to run in its own JS scope
    // because the $scopeN variables and Sk._scopes[] array will be reused
    // by the compiler. This function also pushes modules onto a module
    // stack as they are executed, so that yield/resume always continues in
    // the correct module as code is being loaded and executed.
    finalcode = "Sk._execModule(function($moddata) {\n" + finalcode + "\n});\n";

    //if (!COMPILED)
    {
        if (dumpJS)
        {
            var withLineNumbers = function(code)
            {
                var beaut = js_beautify(finalcode);
                var lines = beaut.split("\n");
                for (var i = 1; i <= lines.length; ++i)
                {
                    var width = ("" + i).length;
                    var pad = "";
                    for (var j = width; j < 5; ++j) pad += " ";
                    lines[i - 1] = "/* " + pad + i + " */ " + lines[i - 1];
                }
                return lines.join("\n");
            };
            finalcode = withLineNumbers(finalcode);
            Sk.debugout(finalcode);
        }
    }

    module.$js = finalcode; // todo; only in DEBUG?

    var modlocs = goog.global.eval(finalcode);

    // pass in __name__ so the module can set it (so that the code can access
    // it), but also set it after we're done so that builtins don't have to
    // remember to do it.
    if (!modlocs['__name__'])
        modlocs['__name__'] = new Sk.builtin.str(modname);

    module['$d'] = modlocs;

    if (toReturn)
    {
        // if we were a dotted name, then we want to return the top-most
        // package. we store ourselves into our parent as an attribute
        var parentModule = Sk.sysmodules.mp$subscript(parentModName);
        parentModule.tp$setattr(modNameSplit[modNameSplit.length - 1], module);
        //print("import returning parent module, modname", modname, "__name__", toReturn.tp$getattr("__name__").v);
        return toReturn;
    }

    //print("name", name, "modname", modname, "returning leaf");
    // otherwise we return the actual module that we just imported
    return module;
};

/**
 * @param {string} name the module name
 * @param {boolean=} dumpJS print out the js code after compilation for debugging
 */
Sk.importModule = function(name, dumpJS)
{
    return Sk.importModuleInternal_(name, dumpJS);
};

Sk.importMain = function(name, dumpJS)
{
    // Added by allevato
    Sk.reset();

	Sk.dateSet = false;
	Sk.filesLoaded = false
	//	Added to reset imports
	Sk.sysmodules = new Sk.builtin.dict([]);
	Sk.realsyspath = undefined;

    return Sk.importModuleInternal_(name, dumpJS, "__main__");
};

Sk.importMainWithBody = function(name, dumpJS, body)
{
    // Added by allevato
    Sk.reset();

	Sk.dateSet = false;
	Sk.filesLoaded = false
	//	Added to reset imports
	Sk.sysmodules = new Sk.builtin.dict([]);
	Sk.realsyspath = undefined;
    
    return Sk.importModuleInternal_(name, dumpJS, "__main__", body);
};

Sk.builtin.__import__ = function(name, globals, locals, fromlist)
{
    var ret = Sk.importModuleInternal_(name);
    if (!fromlist || fromlist.length === 0)
        return ret;
    // if there's a fromlist we want to return the actual module, not the
    // toplevel namespace
    ret = Sk.sysmodules.mp$subscript(name);
    goog.asserts.assert(ret);
    return ret;
};

goog.exportSymbol("Sk.importMain", Sk.importMain);
goog.exportSymbol("Sk.importMainWithBody", Sk.importMainWithBody);
goog.exportSymbol("Sk.builtin.__import__", Sk.builtin.__import__);// Note: the hacky names on int, long, float have to correspond with the
// uniquization that the compiler does for words that are reserved in
// Javascript. This is a bit hokey.
Sk.builtins = {
'abs': Sk.builtin.abs,
//'all': Sk.builtin.all, // Added by allevato
//'any': Sk.builtin.any, // Added by allevato
//'ascii': Sk.builtin.ascii, // Added by allevato
//'bin': Sk.builtin.bin, // Added by allevato
//'bool': Sk.builtin.bool, // Added by allevato
//'bytearray': Sk.builtin.bytearray, // Added by allevato
//'bytes': Sk.builtin.bytes, // Added by allevato
'chr': Sk.builtin.chr,
//'classmethod': Sk.builtin.classmethod, // Added by allevato
//'compile': Sk.builtin.compile, // Added by allevato
//'complex': Sk.builtin.complex, // Added by allevato
//'delattr': Sk.builtin.delattr, // Added by allevato
'dict': Sk.builtin.dict,
'dir': Sk.builtin.dir,
//'divmod': Sk.builtin.divmod, // Added by allevato
//'enumerate': Sk.builtin.enumerate, // Added by allevato
//'eval': Sk.builtin.eval, // Added by allevato
//'exec': Sk.builtin.exec, // Added by allevato
'fabs': Sk.builtin.abs, //  Added by RNL
//'filter': Sk.builtin.filter, // Added by allevato
'float_$rw$': Sk.builtin.float_,
//'format': Sk.builtin.format, // Added by allevato
//'frozenset': Sk.builtin.frozenset, // Added by allevato
'getattr': Sk.builtin.getattr,
'globals': Sk.builtin.globals, // Added by allevato
//'hasattr': Sk.builtin.hasattr, // Added by allevato
'hash': Sk.builtin.hash,
//'help': Sk.builtin.help, // Added by allevato
//'hex': Sk.builtin.hex, // Added by allevato
//'id': Sk.builtin.id, // Added by allevato
'input': Sk.builtin.input,
'int_$rw$': Sk.builtin.int_,
'isinstance': Sk.builtin.isinstance,
//'issubclass': Sk.builtin.issubclass, // Added by allevato
//'iter': Sk.builtin.iter, // Added by allevato
'len': Sk.builtin.len,
'list': Sk.builtin.list,
'locals': Sk.builtin.locals, // Added by allevato
//'map': Sk.builtin.map, // Added by allevato
'max': Sk.builtin.max,
//'memoryview': Sk.builtin.memoryview, // Added by allevato
'min': Sk.builtin.min,
//'next': Sk.builtin.next, // Added by allevato
'object': Sk.builtin.object,
//'oct': Sk.builtin.oct, // Added by allevato
'open': Sk.builtin.open,
'ord': Sk.builtin.ord,
//'pow': Sk.builtin.pow, // Added by allevato
//'property': Sk.builtin.property, // Added by allevato
'range': Sk.builtin.range,
'repr': Sk.builtin.repr,
//'reversed': Sk.builtin.reversed, // Added by allevato
'round': Sk.builtin.round, //  Added by allevato
'set': Sk.builtin.set,
//'setattr': Sk.builtin.setattr, // Added by allevato
'slice': Sk.builtin.slice,
//'sorted': Sk.builtin.sorted, // Added by allevato
//'staticmethod': Sk.builtin.staticmethod, // Added by allevato
'str': Sk.builtin.str,
'sum': Sk.builtin.sum,
//'super': Sk.builtin.super, // Added by allevato
'tuple': Sk.builtin.tuple,
'type': Sk.builtin.type,
//'vars': Sk.builtin.vars, // Added by allevato
//'zip': Sk.builtin.zip, // Added by allevato

'AttributeError': Sk.builtin.AttributeError,
'ValueError': Sk.builtin.ValueError,

'file': Sk.builtin.file,
'function': Sk.builtin.func,
'generator': Sk.builtin.generator,
'long_$rw$': Sk.builtin.lng,
'method': Sk.builtin.method,
/*'read': Sk.builtin.read,*/
'jseval': Sk.builtin.jseval,
'jsmillis': Sk.builtin.jsmillis,
'long_div_mode': Sk.builtin.lng.longDivideMode
};
goog.exportSymbol("Sk.builtins", Sk.builtins);
