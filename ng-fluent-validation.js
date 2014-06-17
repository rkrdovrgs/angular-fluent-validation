(function () {
    'use strict';

    var ngFluentValidation = angular.module('ngFluentValidation', []);

    var serviceId = 'validator';

    ngFluentValidation.factory(serviceId, [validator]);

    function validator() {
        // Define the functions and properties to reveal.

        //#region Dependencies
        function isFunction(functionToCheck) {
            var getType = {};
            return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
        }

        function isArrayNullOrEmpty(arr) {
            return arr == undefined || arr == null || arr.length == 0;
        };

        function isStringNullOrEmpty(str) {

            return str == undefined ||
                str == null ||
                str == "";
        };

        var regex = function () {

            var _isMatch = function (input, pattern, flags) {
                var patt = new RegExp(pattern, flags);
                //console.log(str, patt.test(str));
                return patt.test(input);
            };

            var _match = function (input, pattern, flags) {
                var patt = new RegExp(pattern, flags),
                    matches = patt.exec(input);
                if (matches != undefined && matches != null)
                    return matches[0];
            }

            return {

                isMatch: _isMatch,
                match: _match,
            }

        }();

        var queryable =  {
            From: function (collection) {
                


                var _Where = function (predicate) {
                    var result = [];
                    angular.forEach(collection, function (value, key) {
                        if (predicate(value, key))
                            result.push(value);
                    });

                    return queryable.From(result);

                };

                var _Select = function (selector) {

                    var result = [];
                    angular.forEach(collection, function (value, key) {
                        result.push(selector(value));
                    });

                    return queryable.From(result);

                };

                var _Count = function (predicate) {
                    if (predicate == undefined)
                        return collection.length;

                    var counter = 0;
                    angular.forEach(collection, function (value, key) {
                        if (predicate(value, key))
                            counter++;
                    });

                    return counter;
                };

                var _ToArray = function () {
                    return collection;
                };

                return {
                    Where: _Where,
                    Select: _Select,
                    Count: _Count,
                    ToArray: _ToArray
                };
            }
        };
        //#endregion

        function service() {

            var validations = [],
                objErrors = [];

            

            function execInternalValidator(x, validator) {
                if (x == null || x == undefined) return true;
                var validationResult = validator.validate(x);

                if (!validationResult.isValid) {
                    for (var i = 0; i < validationResult.errors.length; i++) {
                        objErrors.push(validationResult.errors[i]);
                    }
                }

                return validationResult.isValid;
            }

            this.ruleFor = function (propSelector) {
                var prop,
                    propName;

                if (isFunction(propSelector)) {
                    prop = propSelector;
                    var propMatch = regex.match(propSelector.toString(), 'return\\s([a-zA-Z_$][a-zA-Z0-9_$]*\\.?)+');
                    if (propMatch)
                        propMatch = propMatch.replace('return ', '').trim();
                    if (propMatch.indexOf('.') != -1)
                        propMatch = propMatch.substring(propMatch.indexOf('.') + 1);

                    propName = propMatch;
                }
                else {
                    propName = propSelector;
                    prop = function (x) {
                        return x[propSelector];
                    }
                }

                var validation = {
                    propSelector: prop,
                    propName: propName,
                };

                validations.push(validation);

                return {

                    must: function (validator) {
                        validation.validator = validator;
                        return {
                            withMessage: function (message) {
                                validation.message = propName ? message.replace('{propertyName}', propName) : message;
                            }
                        }
                    },

                    //as: function (alias) {
                    //    propName = alias;
                    //    return this;
                    //},

                    setValidator: function (validator) {
                        //TODO: Add the list of property errors to list of main object errors
                        var v = this.must(function (obj, x) { return execInternalValidator(x, validator) });
                        //v.withMessage("'{propertyName}' is invalid.");

                        return v;
                    },

                    setCollectionValidator: function (validator) {
                        //TODO: Add the list of collection errors to list of main object errors
                        var v = this.must(function (obj, collection) {
                            if (isArrayNullOrEmpty(collection)) return true;
                            return queryable.From(collection).Count(function (x) { return !execInternalValidator(x, validator) }) == 0;
                        });

                        //v.withMessage("'{propertyName}' has invalid items.");

                        return v;
                    },


                    //Built in validators
                    notNull: function () {

                        var v = this.must(function (obj, x) { return x != undefined && x != null });
                        v.withMessage("'{propertyName}' must not be null.");
                        return v;

                    },

                    notEmpty: function () {

                        var v = this.must(function (obj, x) {
                            if (x == undefined || x == null) return false;
                            if (angular.isNumber(x)) return x != 0;
                            if (angular.isArray(x)) return x.length > 0;
                            return x.trim() != '';
                        });
                        v.withMessage("'{propertyName}' must not be empty.");
                        return v;

                    },

                    notEqual: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }
                            return x !== val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must not be equal to '" + valueToCompare + "'.");

                        return v;

                    },

                    equal: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }
                            return x === val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must be equal to '" + valueToCompare + "'.");

                        return v;

                    },

                    length: function (min, max) {

                        var v = this.must(function (obj, x) {
                            var iMax = max || (x || '').length;
                            return !isStringNullOrEmpty(x) && x.length >= min && x.length <= iMax;
                        });
                        if (max == undefined)
                            v.withMessage("'{propertyName}' must be at least " + min + " characters.");
                        else
                            v.withMessage("'{propertyName}' must be between" + min + " and " + max + " characters.");
                        return v;

                    },

                    lessThan: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }
                            return x < val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must be less than '" + valueToCompare + "'.");

                        return v;

                    },

                    lessThanOrEqual: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }
                            return x <= val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must be less than or equal to '" + valueToCompare + "'.");

                        return v;

                    },

                    greaterThan: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }

                            return x > val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must be greater than '" + valueToCompare + "'.");

                        return v;

                    },

                    greaterThanOrEqual: function (valueToCompare) {

                        var v = this.must(function (obj, x) {
                            var val = valueToCompare;
                            if (isFunction(valueToCompare)) {
                                val = valueToCompare(obj);

                            }
                            return x >= val;
                        });

                        if (!isFunction(valueToCompare))
                            v.withMessage("'{propertyName}' must be greater than or equal to '" + valueToCompare + "'.");

                        return v;

                    },

                    matches: function (regexPattern, flags) {

                        var v = this.must(function (obj, x) { return x == undefined || x == null || regex.isMatch(x, regexPattern, flags) });


                        v.withMessage("'{propertyName}' is not in the correct format.");

                        return v;

                    },

                    emailAddress: function () {
                        var emailAddressPattern = '^[_A-Za-z0-9-\\+]+(\\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\\.[A-Za-z0-9]+)*(\\.[A-Za-z]{2,})$';
                        var v = this.must(function (obj, x) { return x != undefined && x != null && regex.isMatch(x, emailAddressPattern, 'i') });


                        v.withMessage("'{propertyName}' is not a valid email address.");

                        return v;

                    },
                }
            }

            this.isValid = function (obj) {
                return this.validate(obj).isValid;
            }

            this.validate = function (obj) {

                objErrors = [];

                var errors = queryable.From(validations)
                   .Where(function (x) {
                       var propValue = x.propSelector(obj);
                       return !x.validator(obj, propValue);
                   })
                   .Select(function (x) {
                       return {
                           errorMessage: x.message,
                           propertyName: x.propName
                       }
                   })
                   .ToArray();

                var isValid = isArrayNullOrEmpty(errors);

                var $errors = {
                    $all: objErrors
                };

                angular.forEach(errors, function (e) {
                    objErrors.push(e);
                    if (e.propertyName.indexOf('.') < 0) {
                        if ($errors[e.propertyName] == undefined)
                            $errors[e.propertyName] = [];
                        $errors[e.propertyName].push(e.errorMessage);
                    }
                    else {
                        var propNames = e.propertyName.split('.');
                        if ($errors[propNames[0]] == undefined)
                            $errors[propNames[0]] = {};
                        var propToEval = $errors[propNames[0]];
                        for (var i = 1; i < propNames.length; i++) {
                            if (propToEval[propNames[i]] == undefined && i + 1 != propNames.length)
                                propToEval[propNames[i]] = {};
                            if (i + 1 == propNames.length) {
                                if (propToEval[propNames[i]] == undefined)
                                    propToEval[propNames[i]] = [];
                                propToEval[propNames[i]].push(e.errorMessage);
                            }
                            propToEval = propToEval[propNames[i]];
                        }
                    }


                });



                obj.$errors = $errors;
                obj.$isValid = isValid;

                return {
                    errors: errors,
                    isValid: isValid
                }
            }
        }



        return service;

        //#region Internal Methods        

        //#endregion
    }

    ngFluentValidation.factory('$resource', ['$q', resourceOverride])

    function resourceOverride($q) {
        var $injector = angular.injector(['ngResource']),
            $resource = $injector.get('$resource');

        function resourceFactory(url, paramDefaults, actions, validator, T) {

            var r = $resource(url, paramDefaults, actions);
            if (validator != undefined)
                r.prototype.$validate = function () {
                    return validator.validate(this);
                }

            if (T != undefined)
                r.$getOrCreate = function (id) {
                    var d = $q.defer();
                    var t = new T();
                    var intId = parseInt(id);
                    if (intId && angular.isNumber(intId)) {
                        t = r.get({ id: id });
                    }
                    else {
                        t = new r(t);
                        t.$promise = d.promise;
                    }
                    d.resolve();

                    return t;
                }

            return r;
        }


        return resourceFactory;
    }


    ngFluentValidation.directive('ngValidationResult', ["$compile", directiveImp]);

    function directiveImp($compile) {
        return {
            restrict: 'A',
            scope: {},
            link: function (scope, element, attrs) {
                scope.$$errorMessage = function () {
                    var msg = scope.$parent.$eval(attrs.ngValidationResult);
                    if (msg) {
                        element.addClass('has-error');
                        return msg.join('\n');;
                    }
                    else
                        element.removeClass('has-error');

                }

                var sp = angular.element('<span class="validation-control-field"></span>');
                var icon = $compile(angular.element('<i class="glyphicon glyphicon-warning-sign validation-sign" '
                    + 'popover="{{ $$errorMessage() }}" '
                    + 'popover-placement="bottom" '
                    + 'popover-animation="false" '
                    + 'popover-trigger="mouseenter"></i>'))(scope);

                var fc = element.find('.control-field');

                fc.before(sp);
                sp.append(icon);
                sp.append(fc);


            }
        };
    }

})();

