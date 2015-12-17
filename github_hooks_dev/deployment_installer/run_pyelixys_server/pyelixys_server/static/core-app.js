function CoreApp() {
  'use strict';

  var self = this;

  // view models.
  self.login = new Login();
  self.sidebarNavigation = new sidebarNavigation();

  self.isLoggedIn = function () {
    return self.login.loggedIn();
  };

  self.toggleSidebar = function () {
    self.sidebarNavigation.sidebarVisible(!self.sidebarNavigation.sidebarVisible());
  };
}
