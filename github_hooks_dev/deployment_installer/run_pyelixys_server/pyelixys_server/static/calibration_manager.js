function initializeComponent(name, constr, url) {
  $.get(url, function(template) {
    ko.components.register(name, {
      viewModel: constr,
      template: template
    });
  });
}

ko.bindingHandlers.truncatedText = {
    update: function (element, valueAccessor, allBindingsAccessor) {

        var originalText = ko.utils.unwrapObservable(valueAccessor());
            // 10 is a default maximum length
        var length = ko.utils.unwrapObservable(allBindingsAccessor().maxTextLength) || 20;
        if( originalText ){
          var truncatedText = originalText.length > length ? originalText.substring(0, length) + "..." : originalText;
        }
        else{
          var truncatedText = "";
        }
        ko.bindingHandlers.text.update(element, function() {
          return truncatedText;
        });
    }
}

ko.subscribable.fn.subscribeChanged = function(callback) {
    var previousValue;
    this.subscribe(function(_previousValue) {
        previousValue = _previousValue;
    }, undefined, 'beforeChange');
    this.subscribe(function(latestValue) {
        callback(latestValue, previousValue );
    });
};

ko.bindingHandlers.numericText = {
    update: function (element, valueAccessor, allBindingsAccessor) {
        var rawValue = parseFloat( ko.utils.unwrapObservable(valueAccessor()) );
        var sigDigits = ko.utils.unwrapObservable(allBindingsAccessor().sigDigits) || null;
        var retVal = rawValue;

        if( sigDigits != null ){
          retVal = rawValue.toFixed(2);
        }
        // updating text binding handler to show truncatedText
        ko.bindingHandlers.text.update(element, function() {
            return retVal;
        });
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
function setSections(anchor, pages, after) {
  var page = pages.splice(0,1)[0];
  $.get(page, function(data) {
    window.x = anchor;
    anchor.append(data);
    if(pages.length === 0) {
      after();
    }
    else {
      setSections(anchor, pages, after);
    }
  });
}
var version = Date.now();

function loadTemplates(anchor, after){
  setSections(anchor, [
    "static/templates/notificationPopup.html?v=" + version,
    "static/templates/topHeader.html?v=" + version,
    "static/templates/cal_system.html?v=" + version,
    "static/templates/system/camera.html?v=" + version,
    "static/templates/system/mixer.html?v=" + version,
    "static/templates/system/heater.html?v=" + version,
    "static/templates/system/heater-control.html?v=" + version,
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
    "static/templates/calibration/fluid-gas-calibrate.html?v=" + version,
    "static/templates/calibration/radiation-calibrate.html?v=" + version,
    "static/templates/calibration/heat-calibrate.html?v=" + version,
    "static/templates/calibration/reactors-calibrate.html?v=" + version,
    "static/templates/calibration/reagents-calibrate.html?v=" + version
  ], after);
}

initializeComponent("numeric-input", numericInput, "static/templates/numeric-input.html?v=" + version);
initializeComponent("timer-input", timerInput, "static/templates/timer-input.html?v=" + version);

$(document).ready(function(){

  loadTemplates($('#templates'), function () {
      var system = new System();
      window.system = system;
      var notification = new NotificationPopup();
      Elixys.viewModels.notificationPopup = notification;
      ko.applyBindings(system, $('#system')[0]);
      ko.applyBindings(notification, $("#notification-popup")[0]);
      initializeCustomBindings();
      system.currentPage("SYSTEM");

      $('#sidebar-toggle').hide();
  });
});