var Elixys = (function ($, window) {
  'use strict';
   
  var viewModels = {},
      doApiCall = function (request, data, success, error) {
        return $.ajax({
          url: request,
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          type: 'POST',
          data: JSON.stringify(data),
          success: success,
          error: error
        });
      };


  function setSections(anchor, pages, after) {
    var page = pages.splice(0,1)[0];
    $.get(page, function(data) {
      anchor.append(data);
      if(pages.length === 0) {
        after();
      }
      else {
        setSections(anchor, pages, after);
      }
    });
  }

  // TODO: For a release, set this to a specific version number. For
  // dev, leave as Date.now().
  var version = Date.now();//"0.0.1";

  /**
   * The html document needs to be assembled before applying the knockout bindings
   */
  function loadTemplates(anchor, after){
    setSections(anchor, [
      "static/templates/system/camera.html?v=" + version,
      "static/templates/system/mixer.html?v=" + version,
      "static/templates/system/heater.html?v=" + version,
      "static/templates/system/heater-client-control.html?v=" + version,
      "static/templates/system/heater-readout.html?v=" + version,
      "static/templates/system/vacuum_pump.html?v=" + version,
      "static/templates/system/coolant_pump.html?v=" + version,
      "static/templates/system/pressure_regulator.html?v=" + version,
      "static/templates/system/hplc.html?v=" + version,
      "static/templates/system/stopcock.html?v=" + version,
      "static/templates/system/reactor.html?v=" + version,
      "static/templates/system/cassette.html?v=" + version,
      "static/templates/system/radiation_sensor.html?v=" + version,
      "static/templates/system/inert_gas_valve.html?v=" + version,
      /* Calibration Templates */
      "static/templates/calibration/video-calibrate.html?v=" + version,
      "static/templates/calibration/fluid-gas-calibrate-client.html?v=" + version,
      "static/templates/calibration/radiation-calibrate.html?v=" + version,
      "static/templates/calibration/heat-calibrate-client.html?v=" + version,
      "static/templates/calibration/reactors-calibrate.html?v=" + version,
      "static/templates/calibration/reagents-calibrate.html?v=" + version,

      "static/templates/login.html?v=" + version,
      "static/templates/topHeader.html?v=" + version,
      "static/templates/sequences.html?v=" + version,
      "static/templates/elixys-manual.html?v=" + version,
      "static/templates/system.html?v=" + version,
      "static/templates/editSequence.html?v=" + version,
      "static/templates/cassettes.html?v=" + version,
      "static/templates/operations.html?v=" + version,
      "static/templates/statusLogs.html?v=" + version,
      "static/templates/logs.html?v=" + version,
      "static/templates/running.html?v=" + version,
      "static/templates/sidebarNavigation.html?v=" + version,
      "static/templates/connectionError.html?v=" + version,
      "static/templates/notificationPopup.html?v=" + version,
      "static/templates/newSequencePopup.html?v=" + version,
      "static/templates/twoButtonPopup.html?v=" + version,
      "static/templates/importSequencePopup.html?v=" + version,
      "static/templates/blank.html?v=" + version,
      "static/templates/pre-run-checklist.html?v=" + version,
      "static/templates/templatedPopup.html?v=" + version,
      /* Edit sequence */
      "static/templates/editSequence/reagent-popup.html?v=" + version,
      "static/templates/editSequence/add.html?v=" + version,
      "static/templates/editSequence/add-stir-popup.html?v=" + version,
      "static/templates/editSequence/evaporate.html?v=" + version,
      "static/templates/editSequence/evaporate-stir-popup.html?v=" + version,
      "static/templates/editSequence/transfer.html?v=" + version,
      "static/templates/editSequence/transfer-stir-popup.html?v=" + version,
      "static/templates/editSequence/transfer-destination-popup.html?v=" + version,
      "static/templates/editSequence/react.html?v=" + version,
      "static/templates/editSequence/react-stir-popup.html?v=" + version,
      "static/templates/editSequence/prompt.html?v=" + version,
      "static/templates/editSequence/trapisotope.html?v=" + version,
      "static/templates/editSequence/eluteisotope.html?v=" + version,
      "static/templates/editSequence/move.html?v=" + version,
      "static/templates/editSequence/move-position-popup.html?v=" + version,
      "static/templates/editSequence/externaladd.html?v=" + version,
      /* Running */
      "static/templates/running/add.html?v=" + version,
      "static/templates/running/evaporate.html?v=" + version,
      "static/templates/running/transfer.html?v=" + version,
      "static/templates/running/react.html?v=" + version,
      "static/templates/running/prompt.html?v=" + version,
      "static/templates/running/trapisotope.html?v=" + version,
      "static/templates/running/eluteisotope.html?v=" + version,
      "static/templates/running/move.html?v=" + version,
      "static/templates/running/externaladd.html?v=" + version,
      /* Running parameters */
      "static/templates/runningParameters/add.html?v=" + version,
      "static/templates/runningParameters/evaporate.html?v=" + version,
      "static/templates/runningParameters/transfer.html?v=" + version,
      "static/templates/runningParameters/react.html?v=" + version,
      "static/templates/runningParameters/prompt.html?v=" + version,
      "static/templates/runningParameters/trap.html?v=" + version,
      "static/templates/runningParameters/elute.html?v=" + version,
      "static/templates/runningParameters/move.html?v=" + version,
      "static/templates/runningParameters/externaladd.html?v=" + version
    ], after);
  }

  function initializeCustomBindings() {
    ko.bindingHandlers.sidebarToggle = {
      init: function(element, valueAccessor, allBindings) {
        var offset = allBindings.get("initialOffset") || 0;
        $(element).css({ left: offset });
      },
      update: function(element, valueAccessor, allBindings) {
        var sidebarVisible = ko.unwrap(valueAccessor());
        var offset = allBindings.get("initialOffset") || 0;
		if( sidebarVisible ) {
			var toolbarWidth = 100;
            $(element).animate({ left: offset + toolbarWidth });
        }
        else {
		    var toolbarWidth = offset;
            $(element).animate({ left: toolbarWidth });
        }
      }
    };

    ko.bindingHandlers.draggable = {
      init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        $(element).drag("start", function (ev, dd) {
          return valueAccessor().start(element, viewModel, dd);
        }).drag(function (ev, dd){
          valueAccessor().drag(element, viewModel, dd);
        }).drag("end", function (ev, dd){
          valueAccessor().end(element, viewModel, dd);
        });
      }
    };

    ko.bindingHandlers.droppable = {
      init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        $(element).drop("init", function (ev, dd) {
          valueAccessor().initialize(element);
        }).drop("start", function (ev, dd) {
          valueAccessor().start(element);
        }).drop("end", function (ev, dd) {
          valueAccessor().end(element);
        }).drop(function (ev, dd) {
          valueAccessor().drop(element);
        });
      }
    };
    
    ko.bindingHandlers.dblclick = {
      init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        var valueUnwrapped = ko.unwrap(value);
        $(element).dblclick(function() {
          valueUnwrapped(viewModel);
        });
      }
    };

    ko.bindingHandlers.numeric = {
      init: function (element, valueAccessor) {
        $(element).on("keydown", function (event) {
          // Allow: backspace, delete, tab, escape, and enter
          if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
              // Allow: Ctrl+A
              (event.keyCode == 65 && event.ctrlKey === true) ||
              // Allow: . ,
              (event.keyCode == 188 || event.keyCode == 190 || event.keyCode == 110) ||
              // Allow: home, end, left, right
              (event.keyCode >= 35 && event.keyCode <= 39)) {
            // let it happen, don't do anything
            return;
          }
          else {
            // Ensure that it is a number and stop the keypress
            if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105)) {
              event.preventDefault();
            }
          }
        });
      }
    };
  }
  
  function initializeComponent(name, constr, url) {
    $.get(url, function(template) {
      ko.components.register(name, {
        viewModel: constr,
        template: template
      });
    });
  }
  
  function numericInput(params) {
    var self = this;
    self.value = params.value;
    self.max = params.max || 9999;
    self.min = params.min || 0;
    self.maxlength = params.maxlength || 3;
    self.step = params.step || 1;
    self.fixed = params.fixed;
    self.input = ko.observable(self.value());
    self.input.subscribe(function(newValue) {
      if( !isNaN(newValue) ) {
        self.value(parseFloat(newValue));
      }
    });
    self.canIncrement = ko.pureComputed(function() {
      return ko.unwrap(self.enable) && self.value() < ko.unwrap(self.max);
    });
    self.increment = function() {
      var newValue = self.value() + self.step;
      if( self.fixed ){
        newValue = newValue.toFixed(self.fixed);
      }
      self.value(newValue);
      self.input(newValue);
    };
    self.canDecrement = ko.pureComputed(function() {
      return ko.unwrap(self.enable) && self.value() > ko.unwrap(self.min);
    });
    self.decrement = function() {
      var newValue = self.value() - self.step;
      if( self.fixed ){
        newValue = newValue.toFixed(self.fixed);
      }
      self.value(newValue);
      self.input(newValue);
    };
    if( params.enable ) {
      self.enable = params.enable;
    }
    else {
      self.enable = true;
    }
  }

  function toggleStir(params){
      var self = this;
      self.currentMotorSpeed = params.currentMotorSpeed;
      self.enabled = params.enabled;
      self.reactor = params.reactor;
      self.setStirState = function( reactor, current_motor_speed ){
        if( self.enabled() ){
          var state = current_motor_speed == 0;
          Elixys.doApiCall("/set_stir_state",
                       {"set_stir_state": {'reactor' : reactor.toUpperCase(), 'state' : state}},
                       function(result){
                       },
                       function(error){
                         console.log( 'An error occured while attempting to stir');
                         console.log( error );
                       });
        }
      }
  }
  
  function timerInput(params) {
    var self = this;
    var target = params.value;
    var initial = parseInt(target() || 0);
    var min = params.min || 0;
    var max = params.max || 3599; // 59:59
    if( params.enable ) {
      self.enable = params.enable;
    }
    else {
      self.enable = true;
    }
    
    var secondObs = ko.observable(initial % 60);
    self.second = ko.computed({
      read: function() {
        var value = parseInt(target()) % 60;
        if( value < 10 ) {
          return "0" + value;
        }
        else {
          return value;
        }
      },
      write: function(value) {
        secondObs(isNaN(value) ? 0 : value);
      }
    });
    
    var minuteObs = ko.observable(parseInt(initial / 60));
    self.minute = ko.computed({
      read: function() {
        var value = parseInt(target() / 60);
        if( value < 10 ) {
          return "0" + value;
        }
        else {
          return value;
        }
      },
      write: function(value) {
        minuteObs(isNaN(value) ? 0 : value);
      }
    });
    
    var time = ko.pureComputed(function() {
      var minute = parseInt(minuteObs());
      var second = parseInt(secondObs());
      return (isNaN(minute) ? 0 : minute * 60) + (isNaN(second) ? 0 : second);
    });
    time.subscribe(function(newValue) {
      target(newValue);
    });
    self.canIncrement = ko.pureComputed(function() {
      return ko.unwrap(self.enable) && target() < ko.unwrap(max);
    });
    self.increment = function() {
      var newValue = target() + 1;
      target(newValue);
    };
    self.canDecrement = ko.pureComputed(function() {
      return ko.unwrap(self.enable) && target() > ko.unwrap(min);
    });
    self.decrement = function() {
      var newValue = target() - 1;
      target(newValue);
    };
    
    self.dispose = function() {
      self.second.dispose();
      self.minute.dispose();
    };
  }
  
  /**
   * Elixys initialization.
   */
  function init() {


    // view models.
    viewModels.connectionError = new ConnectionError();
    viewModels.login = new Login();
    viewModels.logs = new Logs();
    viewModels.sidebarNavigation = new SidebarNavigation();
    viewModels.sequences = new Sequences();
    viewModels.system = new System();
    viewModels.running = new Running();
    viewModels.editSequence = new EditSequence();
    viewModels.notificationPopup = new NotificationPopup();
    viewModels.newSequencePopup = new NewSequencePopup();
    viewModels.importSequencePopup = new ImportSequencePopup();
    viewModels.preRunChecklist = new PreRunChecklist();
    viewModels.templatedPopup = new TemplatedPopup();
    viewModels.elixysManual = new ElixysManual();
    viewModels.twoButtonPopup = new TwoButtonPopup();

    loadTemplates($('#templates'), function () {
      // apply custom ko bindings.
      initializeCustomBindings();

      ko.applyBindings(viewModels.connectionError, $('#connection-error')[0]);
      ko.applyBindings(viewModels.login, $('#login')[0]);
      ko.applyBindings(viewModels.logs, $('#logs')[0]);
      ko.applyBindings(viewModels.sidebarNavigation, $('#sidebar-navigation')[0]);
      ko.applyBindings(viewModels.sequences, $('#sequences')[0]);
      ko.applyBindings(viewModels.system, $('#system')[0]);
      ko.applyBindings(viewModels.running, $('#running')[0]);
      ko.applyBindings(viewModels.editSequence, $('#edit-sequence')[0]);
      ko.applyBindings(viewModels.notificationPopup, $('#notification-popup')[0]);
      ko.applyBindings(viewModels.newSequencePopup, $('#new-sequence-popup')[0]);
      ko.applyBindings(viewModels.importSequencePopup, $('#import-sequence-popup')[0]);
      ko.applyBindings(viewModels.preRunChecklist, $('#pre-run-checklist')[0]);
      ko.applyBindings(viewModels.templatedPopup, $('#templated-popup')[0]);
      ko.applyBindings(viewModels.elixysManual, $("#elixys-manual")[0]);
      ko.applyBindings(viewModels.twoButtonPopup, $("#two-button-popup")[0]);
      $('.date-picker').datepicker({
        autoclose: true
      });
    });
    
    // Load components
    initializeComponent("numeric-input", numericInput, "static/templates/numeric-input.html?v=" + version);
    initializeComponent("timer-input", timerInput, "static/templates/timer-input.html?v=" + version);
    initializeComponent("toggle-stir", toggleStir, "static/templates/runningParameters/toggleStir.html?v=" + version);

    // iOS web app fix
    if( window.navigator.standalone === true ) {
      ko.applyBindings({ isIOS: true }, $('#status-bar')[0]);
    }

    // Activate FastClick
    var attachFastClick = Origami.fastclick;
    attachFastClick(document.body);
  }

  function logOut() {
    Elixys.doApiCall("/logout", null, function(success){}, function(error){});
    viewModels.login.isLoggedIn(false);
    viewModels.login.currentPage('');
    viewModels.login.isSidebarVisible(false);
    reloadPage();
  }

  function viewManual(){
    viewModels.elixysManual.view();
  }

self.initializeStatusInterval = undefined; //will be defined when system initialize started
self.shutdownStatusInterval = undefined; //will be defined when shutdown started

  function initialize(){
	Elixys.showNotificationPopup("Start System Initialize",
		        {
		        confirmCallback: function(){
		        Elixys.hideNotificationPopup();
		        var result = Elixys.doApiCall("/initialize_system",
		        {
		        initialize_system: {

		        }
		        },function(result){
		            var message = result["initialize_system"];
		            if(message !="ok"){
                    var error_message = message["error"];
                    showNotificationPopup(error_message, {showCloseButton: true});
                    }
                    else{
                    self.initializeStatusInterval = window.setInterval(pollInitializeStatus, 1000);
                    }
		            });

		        }
		        ,
                confirmText: "Yes",
                cancelCallback: function() {},
                cancelText: "No"
                }
                );
  }


 function pollInitializeStatus() {
        var result = Elixys.doApiCall("/initialize_system",
        {
        initialize_system: {
            query: true
            }
        },
        function(result){
		            var initialize_state = result["initialize_system"];
                    var fail_status = initialize_state["fail"];
                    var running_status = initialize_state["running"];
                    var status = initialize_state["message"];
                    if(fail_status===true){
                        window.clearInterval(self.initializeStatusInterval);
                        showNotificationPopup(status, {showCloseButton: true});

                    }
                    else{
                        if(running_status===false){
                            window.clearInterval(self.initializeStatusInterval);
                            showNotificationPopup("System Initialize Complete", {showCloseButton: true});
                        }

                    }

		            });
  }

function unlock_robots(){
	Elixys.showNotificationPopup("Unlock Reagent and Reactor Robots",
		        {
		        confirmCallback: function(){
		        Elixys.hideNotificationPopup();
		        Elixys.doApiCall("/unlock_robots",{},function(result){
		            var message = result["unlock_robots"];
		            if(message !="ok"){
                    var error_message = message["error"];
                    showNotificationPopup(error_message, {showCloseButton: true});
		            }
		            });

		        }
		        ,
                confirmText: "Yes",
                cancelCallback: function() {},
                cancelText: "No"
                });
  }


  function power(){
	Elixys.showNotificationPopup("Shutdown Elixys",
		        {
		        confirmCallback: function(){
		        Elixys.hideNotificationPopup();
		        Elixys.doApiCall("/system_shutdown",{},function(result){
		            var message = result["system_shutdown"];
		            if(message !="ok"){
                    var error_message = message["error"];
                    showNotificationPopup(error_message, {showCloseButton: true});
		            }
		            else{

		                //wait 20 seconds before telling user it's ok to turn off hardware
		                var complete_message = "System Shutdown Complete - Turn Off Hardware";
		                window.setTimeout(shutdownStatus, 25000, complete_message);

		                var status_message = "System Shutting Down - Do Not Turn Off Hardware Till Complete (May take 20-30 seconds)";
		                window.setTimeout(shutdownStatus, 100, status_message);


		            }
		            });

		        }
		        ,
                confirmText: "Yes",
                cancelCallback: function() {},
                cancelText: "No"
                });
  }

  function shutdownStatus(status_message){
        showNotificationPopup(status_message, {showCloseButton: true});
  }



  function reloadPage() {
    window.onbeforeunload = undefined;
    window.location.reload();
  }

  function triggerConnectionErrorPopup(retry) {
    var connectionError = viewModels.connectionError;
    connectionError.setRetry(retry);
    connectionError.visible(true);
  }

  function positionNotificationPopup() {
    var $notification = $('.notification-popup-box');
    $notification.css('height', 'auto').css({
      'top': '50%',
      'margin-top': '-' + ($notification.outerHeight() / 2) + 'px'
    });
  }

  function showNotificationPopup(message, options) {
    var notification = viewModels.notificationPopup;
    notification.message(message);
    notification.options(options || {});
    notification.visible(true);
    positionNotificationPopup();
  }

  function hideNotificationPopup() {
    var notification = viewModels.notificationPopup;
    notification.visible(false);
  }
  
  function showNotYetImplementedPopup() {
    showNotificationPopup("Not yet implemented", {showCloseButton: true});
  }
  
  function showNewSequencePopup(options) {
    viewModels.newSequencePopup.popup(options);
  }

  function showTwoButtonPopup(options){
    viewModels.twoButtonPopup.popup(options);
  }

  function showImportSequencePopup(options) {
    viewModels.importSequencePopup.popup(options);
  }
  
  function showTemplatedPopup(template, data, extraClass) {
    viewModels.templatedPopup.show(template, data, extraClass);
  }
  
  function hideTemplatedPopup() {
    viewModels.templatedPopup.visible(false);
  }
  
  var navigationDirty = ko.observable(
    ko.computed({
      read: function() { return false; },
      write: function() {}
    })
  );

  /**
   * Expects the fieldName to be an integer (or can be parsed to an integer).
   * @param {Object} fieldName name of a integer field.
   */
  function objectComparator(fieldName) {
    return function (obj1, obj2) {
      var int1 = parseInt(obj1[fieldName]),
          int2 = parseInt(obj2[fieldName]);
      if (int1 < int2) {
        return -1;
      }
      if (int1 > int2) {
        return 1;
      }
      return 0;
    };
  }

  function reduce(lst, initial, fn){
    var l = lst.length;
    var i = 0;
    var result = initial;
    while(i<l){
        result = fn(result, lst[i], i);
        i++;
    }
    return result;
  }

  function map(lst, fn){
    var l = lst.length;
    var i = 0;
    while(i<l){
        lst[i] = fn(lst[i], i);
        i++;
    }
    return lst;
  }

  function forEach(lst, fn){
    var l = lst.length;
    var i = 0;
    while(i<l){
        fn(lst[i], i);
        i++;
    }
  }
  
  function makeObservable(obj, fun) {
    if( fun !== undefined ) {
      return mkObsWithFun(obj);
    }
    else {
      return mkObs(obj);
    }
    
    function mkObsWithFun(obj) {
      var result;
      if( obj instanceof Array ) {
        result = [];
      }
      else {
        result = {};
      }
      for( var prop in obj ) {
        if( typeof obj[prop] === "object" ) {
          result[prop] = mkObsWithFun(obj[prop]);
        }
        else {
          result[prop] = ko.observable(obj[prop]);
          result[prop].subscribe(fun);
        }
      }
      return result;
    }
    
    function mkObs(obj) {
      var result;
      if( obj instanceof Array ) {
        result = [];
      }
      else {
        result = {};
      }
      for( var prop in obj ) {
        if( typeof obj[prop] === "object" ) {
          result[prop] = mkObs(obj[prop]);
        }
        else {
          result[prop] = ko.observable(obj[prop]);
        }
      }
      return result;
    }
  }
  
  function makeObservableArray(arr, fun) {
    return arr.map(function(val) {
      return makeObservable(val, fun);
    });
  }
  
  function unmakeObservable(obj) {
    var result;
    if( obj instanceof Array ) {
      result = [];
    }
    else {
      result = {};
    }
    for( var prop in obj ) {
      if( typeof obj[prop] === "function" ) {
        result[prop] = obj[prop]();
      }
      else if( typeof obj[prop] === "object" ) {
        result[prop] = unmakeObservable(obj[prop]);
      }
      else {
        result[prop] = obj[prop];
      }
    }
    return result;
  }
  
  function unmakeObservableArray(arr) {
    return arr.map(function(val) {
      if( typeof val === "object" ) {
        return unmakeObservable(val);
      }
      else if( typeof val === "function" ) {
        return val();
      }
      else {
        return val;
      }
    });
  }
  
  function incWithMax(target, max) {
    var value = parseFloat(target());
    if( value < max ) {
      target(value + 1);
    }
  }

  function incNumber(target){
  var value = parseFloat(target());
  return value + 1;
  }
  
  function decWithMin(target, min) {
    var value = parseFloat(target());
    if( value > min ) {
      target(value-1);
    }
  }
  
  function timeDisplay(target) {
    var value = target();
    var min = parseInt(value / 60);
    var sec = value % 60;
    if( min < 10 ) {
      min = "0" + min;
    }
    if( sec < 10 ) {
      sec = "0" + sec;
    }
    return min + ":" + sec;
  }
  
  function numberFormatter(target) {
    return {
      target: target,
      number: ko.computed({
        read: target,
        write: function( value ) {
          target(isNaN(value) ? 0 : value);
        }
      })
    };
  }
  
  function timeFormatter(target) {
    var second, minute;
    var initial = target();
    var minuteObs = ko.observable(parseInt(parseInt(initial) / 60));
    var secondObs = ko.observable(parseInt(initial) % 60);
    minute = ko.computed({
      read: function() {
        var value = parseInt(target() / 60);
        if( value < 10 ) {
          return "0" + value;
        }
        else {
          return value;
        }
      },
      write: function(value) {
        minuteObs(isNaN(value) ? 0 : value);
      }
    });
    second = ko.computed({
      read: function() {
        var value = parseInt(target() % 60);
        if( value < 10 ) {
          return "0" + value;
        }
        else {
          return value;
        }
      },
      write: function(value) {
        secondObs(isNaN(value) ? 0 : value);
      }
    });
    var time = ko.pureComputed(function() {
      var minute = parseInt(minuteObs());
      var second = parseInt(secondObs());
      return (isNaN(minute) ? 0 : minute * 60) + (isNaN(second) ? 0 : second);
    });
    time.subscribe(function(newValue) {
      target(newValue);
    });
    return {
      target: target,
      minute: minute,
      second: second
    };
  }
  
  // Only used by transfer
  function withDestination(destination, targetreactor, reagent) {
    return {
      destination: ko.pureComputed(function() {
        var dest = destination();
        if( dest === "reactor" ) {
          return "reactor" + targetreactor();
        }
        else {
          return dest;
        }
      }),
      selectReactor: function(reactor) {
        targetreactor(reactor);
        destination("reactor");
        reagent(0);
        //Elixys.hideTemplatedPopup();
      },
      selectCollectionVial: function() {
        targetreactor(0);
        destination("collection vial");
        reagent(0);
        //Elixys.hideTemplatedPopup();
      },
      selectHplc: function() {
        targetreactor(0);
	destination("hplc");
        reagent(0);
        //Elixys.hideTemplatedPopup();
	
	
      }
    };
  };
  
  function playVideo(data, event) {
    event.target.play();
  }
  
  function truncate(target, limit) {
    var text = ko.unwrap(target);
    if( text.length > limit ) {
      return text.substring(0, limit-3) + "...";
    }
    else {
      return text;
    }
  }
  
  /*
   * For chaining AJAX calls, takes a function that takes the fail continuation
   * and returns a list of functions that take the result of the previous call
   * and returns either a deferred or a regular value.
   * The returned value for sequence will be a deferred.
   */
  function sequence(fn) {
    var dfd = $.Deferred();
    var i = 0;
    var fns = fn(fail);
    executeStep();
    
    function fail() {
      dfd.reject.apply(this, arguments);
    }
    
    function executeStep() {
      if( dfd.state() !== "rejected" ) {
        if( i < fns.length ) {
          var pending = fns[i].apply(this, arguments);
          i++;
          // Check for deferred
          if( typeof pending === "object" && typeof pending.done === "function" && typeof pending.fail === "function" ) {
            pending.done(executeStep).fail(fail);
          }
          else {
            executeStep(pending);
          }
        }
        else {
          dfd.resolve.apply(this, arguments);
        }
      }
    }
    
    return dfd;
  }

  return {
    init: init,
    viewModels: viewModels,
    doApiCall: doApiCall,
    initialize: initialize,
    unlock_robots: unlock_robots,
    power: power,
    logOut: logOut,
    reloadPage: reloadPage,
    triggerConnectionErrorPopup: triggerConnectionErrorPopup,
    showNotificationPopup: showNotificationPopup,
    hideNotificationPopup: hideNotificationPopup,
    showNotYetImplementedPopup: showNotYetImplementedPopup,
    showNewSequencePopup: showNewSequencePopup,
    showImportSequencePopup: showImportSequencePopup,
    showTemplatedPopup: showTemplatedPopup,
    hideTemplatedPopup: hideTemplatedPopup,
    navigationDirty: navigationDirty,
    viewManual: viewManual,
    objectComparator: objectComparator,
    reduce: reduce,
    map: map,
    forEach: forEach,
    makeObservable: makeObservable,
    makeObservableArray: makeObservableArray,
    unmakeObservable: unmakeObservable,
    unmakeObservableArray: unmakeObservableArray,
    incNumber: incNumber,
    incWithMax: incWithMax,
    decWithMin: decWithMin,
    timeDisplay: timeDisplay,
    numberFormatter: numberFormatter,
    timeFormatter: timeFormatter,
    withDestination: withDestination,
    playVideo: playVideo,
    truncate: truncate,
    sequence: sequence,
    showTwoButtonPopup: showTwoButtonPopup
  };
}(jQuery, window));
