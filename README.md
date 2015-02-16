AngularJs Fluent Validation Api
=========================

About: 
AngularJs/Javascript version of C# Fluent Validation Api
http://fluentvalidation.codeplex.com/wikipage?title=Validators&referringTitle=Documentation

Sample: http://jsfiddle.net/f7B3r/68/
--

Create a module
--
```javascript
var mod = angular.module('sampleMod', ['ngFluentValidation']);
```


Create your models
--
```javascript
mod.factory('models', function(){
    var models = {};
    models.Student = function(){
        this.Name = null;
        this.Age = null;
        this.IsFullTime = true;
        this.NumberOfCredits = 0;
        this.Addresses = [];
        
    };
    
    models.Address = function(){        
        this.AddressLine = null;
        this.Zipcode = null;
    };
    
    return models;
});
```


Create your validators
--
```javascript
mod.factory('studentValidator', function(validator, addressValidator){
    var studentValidator = s = new validator();
    
    s.ruleFor('Name').notEmpty();
    s.ruleFor('Name').length(3);
    s.ruleFor('Age').greaterThan(17);
    
    s.ruleFor('Addresses').setCollectionValidator(addressValidator).withMessage('Invalid Addresses');
    
    s.ruleFor('NumberOfCredits').greaterThanOrEqual(12).when(studentIsEnrolledFullTime);
    s.ruleFor('NumberOfCredits').lessThanOrEqual(18);
    
    function studentIsEnrolledFullTime(student){
        return student.IsFullTime;
    }
    
    return studentValidator;
});

mod.factory('addressValidator', function(validator){
    var addressValidator = s = new validator();
    
    s.ruleFor('AddressLine').notEmpty();
    s.ruleFor('Zipcode').length(5);
    
    
    return addressValidator;
});
```

Using your validators
--
```javascript
mod.controller('mainController', function(models, studentValidator, $scope){
    var vm = this;
    
    vm.valResult = {};
    
    vm.newStudent = new models.Student();
    
    vm.addAddress = function(){
        vm.newStudent.Addresses.push(new models.Address());
    }
   
    vm.save = function(){
        var unregisterValidatorWatch =         
            $scope.$watch(function(){return vm.newStudent;},
                         function(){                          
                             vm.valResult = studentValidator.validate(vm.newStudent); 
                             if(vm.newStudent.$isValid)
                                 unregisterValidatorWatch();
                         }, true);
                     
    }
});
```




