function PreRunChecklist() {
  'use strict';
  
  var self = this;
  self.name = "PRE-RUN CHECKLIST";
  
  // inherits Common.
  Common.apply(self, arguments);

//video cameras

self.cameraId_0 = ko.observable(-1);
self.resetMessage_0 = ko.observable("RESET FEED 1");

self.cameraId_1 = ko.observable(-1);
self.resetMessage_1 = ko.observable("RESET FEED 2");

self.cameraId_2 = ko.observable(-1);
self.resetMessage_2 = ko.observable("RESET FEED 3");


  self.videoUrl_0 = ko.computed(function() {
    if(self.currentPage() === self.name){
       if(self.cameraId_0()===undefined){self.cameraId_0(0);}
    self.cameraId_0.valueHasMutated();
    }
    else{
    self.cameraId_0(-1);
    self.cameraId_0.valueHasMutated();
    }
    if (self.cameraId_0() >= 0) {
      
      return self.videoUrl[self.cameraId_0()];
    }
    return "";
  });


self.videoUrl_1 = ko.computed(function() {
    if(self.currentPage() === self.name){
    if(self.cameraId_1()===undefined){self.cameraId_1(1);}
    self.cameraId_1.valueHasMutated();
    }
    else{
    self.cameraId_1(-1);
    self.cameraId_1.valueHasMutated();
    }
    if (self.cameraId_1() >= 0) {
      
      return self.videoUrl[self.cameraId_1()];
    }
    return "";
  });


self.videoUrl_2 = ko.computed(function() {
    if(self.currentPage() === self.name){

    if(self.cameraId_2()===undefined){self.cameraId_2(2);}
    self.cameraId_2.valueHasMutated();
    }
    else{
    self.cameraId_2(-1);
    self.cameraId_2.valueHasMutated();
    }
    if (self.cameraId_2() >= 0) {
      
      return self.videoUrl[self.cameraId_2()];
    }
    return "";
  });


 self.postRender = function() {
     if(self.currentPage() === self.name){
  	self.cameraId_0(0);
  	self.cameraId_0.valueHasMutated();
  	self.cameraId_1(1);
  	self.cameraId_1.valueHasMutated();
  	self.cameraId_2(2);
  	self.cameraId_2.valueHasMutated();
     }

  }



self.resetVideo_0 = function() {
    var id = 0;
    if(self.currentPage()===self.name){
    self.disableVideo(id);
    return Elixys.doApiCall("/video_reset", {video_reset : {"camera_id": id}}, function(){setTimeout(self.enableVideo,1500,id);});

    }

  };

self.resetVideo_1 = function() {
    var id = 1;
    if(self.currentPage()===self.name){
    self.disableVideo(id);
    return Elixys.doApiCall("/video_reset", {video_reset : {"camera_id": id}}, function(){setTimeout(self.enableVideo,1500,id);});

    }

  };


self.resetVideo_2 = function() {

    var id = 2;
    if(self.currentPage()===self.name){
    self.disableVideo(id);
    return Elixys.doApiCall("/video_reset", {video_reset : {"camera_id": id}}, function(){setTimeout(self.enableVideo,1500,id);});
    }

  };


self.disableVideo = function(id){


   if(id===0){
      self.cameraId_0(-1);
      self.cameraId_0.valueHasMutated();
      self.resetMessage_0("RESETTING...");
   }

   if(id===1){

      self.cameraId_1(-1);
      self.cameraId_1.valueHasMutated();
      self.resetMessage_1("RESETTING...");
   }


   if(id===2){
      
      self.cameraId_2(-1);
      self.cameraId_2.valueHasMutated();
      self.resetMessage_2("RESETTING...");
   }
};

self.enableVideo = function(id){


  if(id===0){
      self.cameraId_0(0);
      self.cameraId_0.valueHasMutated();
      self.resetMessage_0("RESET FEED 1");
   }

   if(id===1){
      self.cameraId_1(1);
      self.cameraId_1.valueHasMutated();
      self.resetMessage_1("RESET FEED 2");
   }


   if(id===2){

      self.cameraId_2(2);
      self.cameraId_2.valueHasMutated();
      self.resetMessage_2("RESET FEED 3");
   }
};


//end video cameras
  
  self.processCassettes = function(cassettes, operations, startingOperation) {
    var reagentsResult = [];
    var cassettesResult = [];
    cassettes.forEach(function(cassette, cassetteIndex) {
      var hasReagents = false;
      cassette.reagents.forEach(function(reagent, reagentIndex) {
        var name = reagent.name();
        var description = reagent.description();
        if(name && name !== "") {
          reagentsResult.push(new Reagent(name, cassetteIndex+1, reagentIndex+1, description));
          hasReagents = true;
        }
      });
      if( hasReagents ) {
        cassettesResult.push(new Cassette(cassetteIndex+1, cassette));
      }
    });
    self.reagents(reagentsResult);
    self.cassettes(cassettesResult);
    self.operations = operations;
    self.startingOperation = startingOperation;
    self.currentPage(self.name);
    Elixys.sequence(function(fail) {
      var sequenceid = self.currentSequence().sequenceid;
      return [
        function() {
          Elixys.showNotificationPopup("Loading...");
          return Elixys.doApiCall("/get_last_logged_checklist", {
            get_last_logged_checklist: {
              parentsequenceid: sequenceid
            }
          });
        },
        function(payload) {
          if( payload.error ) {
            return fail(payload.error);
          }
          else {
            return payload.get_last_logged_checklist;
          }
        },
        function(old_checklist) {
          if( old_checklist.error ) {
            // Error here means we don't have a previous checklist, just return to continue.
            return;
          }
          else {
            self.reagents().forEach(function(reagent) {
              var reg = old_checklist["cassette" + reagent.cassette].reagents[reagent.position-1];
              reagent.description(reg.description);
              reagent.lotNumber(reg.lotnumber);
            });
          }
        },
        function() {
          return Elixys.doApiCall("/add_checklist", {
            add_checklist: {
              parentsequenceid: sequenceid
            }
          });
        },
        function(payload) {
          if( payload.error ) {
            return fail(payload.error);
          }
          else {
            return payload.add_checklist;
          }
        },
        function(checklist) {
          self.checklist = checklist;
          Elixys.hideNotificationPopup();
        }
      ];
    }).fail(function(error) {
      if( typeof error === "string" ) {
        Elixys.showNotificationPopup("Error: " + error, {
          showCloseButton: true
        });
      }
      else {
        Elixys.showNotificationPopup("An error has occurred.", {
          showCloseButton: true
        });
      }
    });
  };
  
  self.reagents = ko.observableArray([]);
  self.cassettes = ko.observableArray([]);
  self.operations = [];
  self.checklist = {};
  self.startingOperation = undefined; // Will be set from the edit sequence screen
  
  function Reagent(name, cassette, position, description) {
    var self = this;
    self.name = name;
    self.cassette = cassette;
    self.position = position;
    self.lotNumber = ko.observable("");
    self.description = ko.observable(description);
    self.checked = ko.observable(false);
    self.markedInvalid = ko.observable(false);
  }
  
  function Cassette(number, details) {
    var self = this;
    self.number = number;
    self.details = details;
    self.lotNumber = ko.observable("");
    self.checked = ko.observable("");
    self.markedInvalid = ko.observable(false);
  }
  
  function Checkbox() {
    var self = this;
    self.checked = ko.observable(false);
    self.markedInvalid = ko.observable(false);
  }
  
  self.visible = ko.computed(function () {
    return self.currentPage() === self.name;
  });
  self.visible.subscribe(function(newValue) {
    if( newValue ) {
      self.runName("");
      self.runDescription("");
      self.steps.forEach(function(checkbox) {
        checkbox.checked(false);
      });
      // Clear invalid fields
      self.runNameInvalid(false);
      self.reagents().forEach(function(reagent) {
        reagent.markedInvalid(false);
      });
      self.cassettes().forEach(function(cassette) {
        cassette.markedInvalid(false);
      });
      self.steps.forEach(function(checkbox) {
        checkbox.markedInvalid(false);
      });
    }
  });
  self.visible.subscribe(function(newValue) {
    if( newValue ) {
      $("div.pre-run-checklist").scrollTop(0);
    }
  }, null, "beforeChange");
  
  function createChecklist() {
    var sequenceid = self.currentSequence().sequenceid;
    Elixys.doApiCall("/add_checklist", {
      "add_checklist": {
        "parentsequenceid": sequenceid
      }
    }, function( result ) {
      self.checklist = result["add_checklist"];
    });
  }
  
  // Fields for section 1
  self.runName = ko.observable("");
  self.runNameInvalid = ko.observable(false);
  self.runDescription = ko.observable("");
  
  // Steps for section 4
  self.steps = [
    new Checkbox(),
    new Checkbox(),
    new Checkbox(),
    new Checkbox(),
    new Checkbox(),
    new Checkbox()
  ];
  
  // Buttons
  self.back = function() {
    self.currentPage(Elixys.viewModels.editSequence.name);
  };
  
  self.continueButton = function() {
    var invalid = false;
    // Check fields
    if( self.runName() === "" ) {
      self.runNameInvalid(true);
      invalid = true;
    }
    self.reagents().forEach(function(reagent) {
      if( reagent.checked() === false ) {
        reagent.markedInvalid(true);
        invalid = true;
      }
    });
    self.cassettes().forEach(function(cassette) {
      if( cassette.checked() === false ) {
        cassette.markedInvalid(true);
        invalid = true;
      }
    });
    self.steps.forEach(function(checkbox) {
      if( checkbox.checked() === false ) {
        checkbox.markedInvalid(true);
        invalid = true;
      }
    });
    // Validation errors
    if( invalid === true ) {
      Elixys.showNotificationPopup("Please ensure that a run name has been provided and that all checkboxes have been checked.",
        { showCloseButton: true });
    }
    // Prompt user to continue
    else {
      Elixys.showNotificationPopup("Begin running this sequence?", {
        confirmCallback: function() {
          // Stall slightly so the popup can get closed before we reopen it
          window.setTimeout(function() {
            Elixys.sequence(function(fail) {
              return [
                function() {
                  Elixys.showNotificationPopup("Starting run...");
                  self.reagents().forEach(function(reagent) {
                    var reg = self.checklist["cassette" + reagent.cassette].reagents[reagent.position-1];
                    reg.name = reagent.name || "";
                    reg.description = reagent.description();
                    reg.lotnumber = reagent.lotNumber() || 0;
                  });
                  self.checklist.runname = self.runName();
                  self.checklist.rundescription = self.runDescription();
                  self.checklist.valid = true;
                  return Elixys.doApiCall("/save_checklist", {
                    save_checklist: self.checklist
                  });
                }, function(payload) {
                  var result = payload["save_checklist"];
                  if( result.error ) {
                    return fail(result.error);
                  }
                  else {
                    return result;
                  }
                }, function() {
                  return Elixys.viewModels.running.startRun(self.currentSequence(), self.operations, self.startingOperation, self.checklist);
                }
              ];
            }).fail(function(error) {
              var errorString;
              if( typeof error === "string" ) {
                errorString = "Error starting run: " + error;
              }
              else {
                errorString = "Error starting run.";
              }
              Elixys.showNotificationPopup(errorString, {
                showCloseButton: true
              });
            });
          }, 10);
        },
        confirmText: "Run"
      });
    }
  };
  
  self.selectAll = function() {
    self.reagents().forEach(function(reagent) {
      reagent.checked(true);
    });
    self.cassettes().forEach(function(cassette) {
      cassette.checked(true);
    });
    self.steps.forEach(function(checkbox) {
      checkbox.checked(true);
    });
  };
  
  self.clearAll = function() {
    self.runName("");
    self.runDescription("");
    self.reagents().forEach(function(reagent) {
      reagent.checked(false);
      reagent.lotNumber("");
      reagent.description("");
    });
    self.cassettes().forEach(function(cassette) {
      cassette.lotNumber("");
      cassette.checked(false);
    });
    self.steps.forEach(function(checkbox) {
      checkbox.checked(false);
    });
  };
  
}
