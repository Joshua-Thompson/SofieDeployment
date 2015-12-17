/**
 * Connection error popup view model. 
 */
function ConnectionError() {
  'use strict';

  var self = this,
      retryCallback = function () {};

  // inherits Common.
  Common.apply(self, arguments);

  self.visible = ko.observable(false);
  self.showConnectionErrorMessage = ko.observable(true);
  self.showRefreshMessage = ko.observable(false);

  self.setRetry = function (retryFunction) {
    if (typeof retryFunction === 'function') {
      retryCallback = retryFunction;
    }
  };

  self.retry = function () {
    self.visible(false);
    retryCallback();
  };

  self.refresh = function () {
    self.showConnectionErrorMessage(false);
    self.showRefreshMessage(true);
  };

  self.refreshOk = function () {
    self.visible(false);
    Elixys.reloadPage();
  };

  self.refreshCancel = function () {
    self.showRefreshMessage(false);
    self.showConnectionErrorMessage(true);
  };
};
