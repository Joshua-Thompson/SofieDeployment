function NotificationPopup() {
  'use strict';

  var self = this;

  // inherits Common.
  Common.apply(self, arguments);

  self.visible = ko.observable(false);
  self.message = ko.observable();
  self.options = ko.observable({});
  
  // Options

     //extra button (for operation error popup abort)
  self.showOtherButton = ko.computed(function() {
    var showOtherButton = self.options().showOtherButton;
    if( showOtherButton !== undefined ) {
      return showOtherButton;
    }
    else {
      return false;
    }
  });



  self.showCloseButton = ko.computed(function() {
    var showCloseButton = self.options().showCloseButton;
    if( showCloseButton !== undefined ) {
      return showCloseButton;
    }
    else {
      return false;
    }
  });


  //extra callback (for operation error abort)
  self.otherCallback = ko.computed(function() {
    return self.options().otherCallback;
  });


  self.confirmCallback = ko.computed(function() {
    return self.options().confirmCallback;
  });
  
  self.cancelCallback = ko.computed(function() {
    return self.options().cancelCallback;
  });


  //extra text (for operation error abort)
  self.otherText = ko.computed(function() {
    var otherText = self.options().otherText;
    if( otherText !== undefined ) {
      return otherText;
    }
    else {
      return "Other";
    }
  });


  
  self.confirmText = ko.computed(function() {
    var confirmText = self.options().confirmText;
    if( confirmText !== undefined ) {
      return confirmText;
    }
    else {
      return "Confirm";
    }
  });
  
  self.cancelText = ko.computed(function() {
    var cancelText = self.options().cancelText;
    if( cancelText !== undefined ) {
      return cancelText;
    }
    else {
      return "Cancel";
    }
  });


  //extra (for operation error abort)
  self.other = function() {
    var callback = self.otherCallback();
    if( callback ) {
      callback();
    }
    self.visible(false);
  };

  
  self.confirm = function() {
    var callback = self.confirmCallback();
    if( callback ) {
      callback();
    }
    self.visible(false);
  };
  
  self.close = function() {
    var callback = self.cancelCallback();
    if( callback ) {
      callback();
    }
    self.visible(false);
  }
};
