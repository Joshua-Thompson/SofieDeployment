function NewSequencePopup() {
  'use strict';
  
  var self = this;
  
  // inherits Common.
  Common.apply(self, arguments);
  
  self.visible = ko.observable(false);
  self.name = ko.observable("");
  self.description = ko.observable("");
  self.notBusy = ko.observable(true);
  self.titleText = ko.observable("");
  self.buttonText = ko.observable("");
  
  self.enabled = ko.computed(function() {
    return self.notBusy() && self.name() !== "" && self.description() !== "";
  });
  
  function defaultHandler() {};
  self.createCallback = defaultHandler;
  self.closeCallback = defaultHandler;
  
  self.create = function() {
    self.notBusy(false);
    self.buttonText("Creating...");
    var result = self.createCallback(self.name(), self.description());
    // Can defer
    if( result && typeof result.then === "function" ) {
      result.then(cleanup);
      result.fail(function(error) {
        if( typeof error === "string" ) {
          self.buttonText("Create");
          Elixys.showNotificationPopup("Error: " + error, {
            showCloseButton: true
          });
        }
        else {
          self.buttonText("Create");
          Elixys.showNotificationPopup("There was an error saving the sequence.", {
            showCloseButton: true
          });
        }
        self.notBusy(true);
      });
    }
    else {
      cleanup();
    }
    
    function cleanup() {
      self.visible(false);
      clear();
    }
  };
  
  self.close = function() {
    if( self.notBusy() ) {
      var result = self.closeCallback();
      // Can defer
      if( result && typeof result.then === "function" ) {
        result.then(cleanup);
      }
      else {
        cleanup();
      }
    }
      
    function cleanup() {
      self.visible(false);
      clear();
    };
  }
  
  self.popup = function(options) {
    if( typeof options.create === "function" ) {
      self.createCallback = options.create;
    }
    else {
      self.createCallback = defaultHandler;
    }
    if( typeof options.close === "function" ) {
      self.closeCallback = options.close;
    }
    else {
      self.closeCallback = defaultHandler;
    }
    if( options.titleText ) {
      self.titleText(options.titleText);
    }
    else {
      self.titleText("New Sequence");
    }
    if( options.buttonText ) {
      self.buttonText(options.buttonText);
    }
    else {
      self.buttonText("Create");
    }
    self.visible(true);
  };
  
  function clear() {
    self.name("");
    self.description("");
    self.notBusy(true);
  }
}
