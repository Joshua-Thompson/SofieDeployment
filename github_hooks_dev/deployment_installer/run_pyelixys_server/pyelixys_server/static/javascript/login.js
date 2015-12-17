function Login() {
  'use strict';

  var self = this;

  // inherits Common.
  self.updateComplete = ko.observable(true);
  Common.apply(self, arguments);



  self.logIn = function () {
    Elixys.doApiCall("/login", null, function(success){}, function(error){});
    self.isLoggedIn(true);
    self.currentPage('SEQUENCES');
  };


self.softwareUpdateAvailable = function(){
    var status = self.updateAvailable().status;

    return status;

    }

  self.showSoftwareUpdate = function(){
          var result = Elixys.doApiCall('/software_show_updates', {},
          function(result){
          var software_update = result["software_show_updates"];

          if(software_update.error != null){
          self.updateAvailable({"status":false});
          }

          else{
          self.updateAvailable({"status":true});

          }

          }

          );


        }

self.showSoftwareUpdate();

self.updateStatusInterval = undefined;

self.update_software = function(){
    if(self.updateComplete() === false){
    return ;
    }
    else{
    self.updateComplete(false);
    }
	Elixys.showNotificationPopup("Update Elixys Software?",
		        {
		        confirmCallback: function(){
		        //Elixys.hideNotificationPopup();

		        Elixys.doApiCall("/software_update",{software_update : {}},function(result){
		            Elixys.showNotificationPopup("Updating software - do no remove USB", {showCloseButton: true});
		            var message = result["software_update"];

		            if(message.error !== null){
                    var error_message = message.status_message;
                    self.updateComplete(true);
                    Elixys.showNotificationPopup(error_message, {showCloseButton: true});
		            }

		            else{

                    self.updateStatusInterval = window.setInterval(pollUpdateStatus, 1500);

                    }
		            });

		        }
		        ,
                confirmText: "Yes",
                cancelCallback: function() {self.updateComplete(true);},
                cancelText: "No"
                });

  }



  function pollUpdateStatus() {
        var result = Elixys.doApiCall("/software_update",
        {
        software_update: {
            query: true
            }
        },
        function(result){
		            var update_status = result["software_update"];
                    var running_status = update_status["running"];
                    var info = update_status["info"];
                    var status_message = update_status["status_message"];

                        if(running_status===false){
                            self.updateComplete(true);
                            window.clearInterval(self.updateStatusInterval);
                            Elixys.showNotificationPopup(status_message, {showCloseButton: true});
                        }
                        else{
                        self.updateComplete(false);
                        }


		            });
  }




}



