function SidebarNavigation() {
  'use strict';

  var self = this;
  var autoCloseTimeout = null;

  // inherits Common.
  Common.apply(self, arguments);
  
  self.options = [
    new SidebarOption("SEQUENCES", "sequences"),
    new SidebarOption("LOGS", "logs"),
    new SidebarOption("RUNNING", ko.pureComputed(function() {
      var isRunning = Elixys.viewModels.running.isRunning();
      if( isRunning ) {
        return "running";
      }
      else {
        return "running disabled";
      }
    })
    , function() {
      Elixys.viewModels.running.goToPage();
    }),
	
	new SidebarOption("SYSTEM", "system"),

	new SidebarOption("MANUAL", "elixys_manual", function(){
    Elixys.viewManual();
    }),
    new SidebarOption("LOG OUT", "logout", function() {
      Elixys.logOut();
    }),
		
  new SidebarOption("Power", "power",
      function() {
      Elixys.power();

		})

  ];

  self.executeAction = function (option) {
    // Automatically close the menu when a selection is made.
    self.isSidebarVisible(false);

    if (self.isLoggedIn()) {
      var dirty = Elixys.navigationDirty()();
      if( dirty ) {
        Elixys.showNotificationPopup("You have unsaved changes that will be lost if you navigate away. Continue?", {
          confirmCallback: function() {
            Elixys.navigationDirty()(false);
            option.action();
          },
          confirmText: "Continue"
        });
      }
      else {
        option.action();
      }
    }
    else {
      alert("You have been automatically logged out");
      Elixys.logOut();
    }
  };

  self.toggleSidebar = function() {
    var opening = !self.isSidebarVisible();
    self.isSidebarVisible(opening);
    // Auto-close the menu after 5 seconds.
    if (opening) {
      window.clearTimeout(autoCloseTimeout);
      autoCloseTimeout = window.setTimeout(function() {
          self.isSidebarVisible(false);
        }, 5000);
    } else {
      window.clearTimeout(autoCloseTimeout);
    }
  };

  self.isSystemPage = ko.pureComputed(function() {
        return self.currentPage() == "SYSTEM";
  });

  function SidebarOption(pageName, className, action) {
    'use strict';

    var optionSelf = this;

    optionSelf.pageName = pageName;

    if( typeof className === "string" ) {
      optionSelf.imageClass = ko.observable("image-container " + className);
    }
    else {
      optionSelf.imageClass = ko.pureComputed(function() {
        return "image-container " + className();
      });
    }
    
    if( action ) {
      optionSelf.action = action;
    }
    else {
      optionSelf.action = function() {
        self.currentPage(pageName);
      };
    }
  }
}
