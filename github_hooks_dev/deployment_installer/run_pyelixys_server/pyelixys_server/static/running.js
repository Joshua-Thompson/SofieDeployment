/*
 * Running view model.
 */
function Running() {
  'use strict';
  
  var self = this;
  
  //inherits Common.
  Common.apply(self, arguments);
  
  self.name = "RUNNING";
  self.videoLeft = undefined;
  self.videoRight = undefined;
  self.isRunning = ko.observable(false);
  self.sequence = ko.observable();
  self.logged_sequence_id = ko.observable(); //this is the sequence id that is made by the server. It should copied not the original sequence
  self.elapsedTime = ko.observable(0);
  self.operations = ko.observableArray();
  self.currentOperationIndex = ko.observable(-1);
  self.timerOverridden = ko.observable(false); // The timer is currently being overridden
  self.timerOverrideReady = ko.observable(false); //only allow timer override when main operation duration starts
  self.continueRequired = ko.observable(false); //only allow continue button for external add when ready
  self.continueRequiredSet = ko.observable(false);
  self.timerWasOverridden = ko.observable(false); // The timer has, at some point, been overridden
  self.changingPressure = ko.observable(false);
  self.errorAlertSet = ko.observable(false); //User error alert window open, user has not pressed button yet
  self.hasTargetReactor = ko.observable(false);
  self.runningOperation = ko.observable(new RunningOperation());

  self.scrollWidth = ko.computed(function() {
    return self.operations().length * 100;
  });
  self.scrollLeft = ko.observable(0);
  
  self.leftArrowVisible = ko.computed(function() {
    return self.scrollLeft() > 0;
  });
  self.rightArrowVisible = ko.computed(function() {
    var containerWidth = $("#running-pane div.drop-container").width();
    // In case the container isn't visible yet
    if( containerWidth === 0 ) {
      containerWidth = 924;
    }
    var scrollWidth = self.scrollWidth();
    return scrollWidth > containerWidth && self.scrollLeft() + containerWidth < scrollWidth;
  });
  self.timeRemaining = ko.pureComputed(function(){
    return self.operationTimerSeconds() > 0;
  });

  //alternative to ko js video ip method
  self.startVideo = function(taskType, reactor, targetReactor){

      if(taskType===undefined){return ;}
      //stop video feeds from prev operation
      if(self.videoLeft !== null && self.videoLeft !== undefined){self.videoLeft.src = "";}
      if(self.videoRight !== null && self.videoRight !== undefined){self.videoRight.src = "";}

      //Get video elements on template page
      self.videoLeft = document.getElementById(taskType+"video-left");
      self.videoRight = document.getElementById(taskType+"video-right");

      //update video element source ip address to point to correct cameras
      if(self.videoLeft !== null){
        if(reactor >= 0){
        self.videoLeft.src = self.videoUrl[reactor];
        }
      }
      if(self.videoRight !== null){
        if(targetReactor >= 0){
        self.videoRight.src = self.videoUrl[targetReactor];
        }
      }

  }
  
  self.dragOperations = new (function() {
    var self1 = this;
    self1.scrollStart = 0;
    self1.offsetStart = 0;
    self1.start = function(element, task, dd) {
      self1.scrollStart = self.scrollLeft();
      self1.offsetStart = dd.offsetX;
    };
    self1.drag = function(element, task, dd) {
      var containerWidth = $("#running-pane div.drop-container").width();
      var scrollLeft = Math.min(Math.max(0, self1.scrollStart + self1.offsetStart - dd.offsetX), self.scrollWidth() - containerWidth);
      self.scrollLeft(scrollLeft);
      $("#running-pane div.drop-container").scrollLeft(scrollLeft);
    };
    self1.end = function(element, task, dd) {
    };
  })();
  
  self.getTemplateFromOperationType = (function() {
    var typeTemplateMap = {
      ADD: "running-add-template",
      EVAPORATE: "running-evaporate-template",
      TRANSFER: "running-transfer-template",
      REACT: "running-react-template",
      PROMPT: "running-prompt-template",
      TRAPISOTOPE: "running-trapisotope-template",
      ELUTEISOTOPE: "running-eluteisotope-template",
      MOVE: "running-move-template",
      EXTERNALADD: "running-externaladd-template"
    };
    
    return function(key) {
      return typeTemplateMap[key] || "blank-template";
    };
  })();
  
  self.showParameters = (function() {
    var parameterMap = {
      ADD: {
        template: "add-parameters-popup-template",
        extraClass: "add-parameter"
      },
      EVAPORATE: {
        template: "evaporate-parameters-popup-template",
        extraClass: "evaporate-parameter"
      },
      TRANSFER: {
        template: "transfer-parameters-popup-template",
        extraClass: "transfer-parameter"
      },
      REACT: {
        template: "react-parameters-popup-template",
        extraClass: "react-parameter"
      },
      PROMPT: {
        template: "prompt-parameters-popup-template",
        extraClass: "prompt-parameter"
      },
      TRAPISOTOPE: {
        template: "trap-parameters-popup-template",
        extraClass: "trap-parameter"
      },
      ELUTEISOTOPE: {
        template: "elute-parameters-popup-template",
        extraClass: "elute-parameter"
      },
      MOVE: {
        template: "move-parameters-popup-template",
        extraClass: "move-parameter"
      },
      EXTERNALADD: {
        template: "externaladd-parameters-popup-template",
        extraClass: "externaladd-parameter"
      }
    };
    
    return function(operation) {
      var fields = parameterMap[operation.taskType];
      if( fields ) {
        Elixys.showTemplatedPopup(fields.template, operation, fields.extraClass + " parameter-popup");
      }
    };
  })();
  
  self.visible = ko.computed(function() {
    return self.currentPage() === self.name;
  });


  self.cameraIdLeft = ko.observable(-1);
  self.cameraIdRight = ko.observable(-1);


  self.videoLabelLeft = ko.computed(function() {
    var camera = self.cameraIdLeft();
    if (camera >= 0) {
      return camera + 1;
    }
    return "";
  });

  self.videoUrlLeft = ko.computed(function() {
    if(self.currentPage()!==self.name){
       return "";
    }
    if(self.cameraIdLeft() < 0){
    	self.cameraIdLeft.valueHasMutated();
     }
    
    if (self.cameraIdLeft() >= 0) {
      self.cameraIdLeft.valueHasMutated();
      return self.videoUrl[self.cameraIdLeft()];
    }
    return "";
  });



  self.videoLeftPosition = ko.computed(function() {
    var position  = "-100px";

    if(self.cameraIdLeft() === 0){
        position = self.camera0_position();
    	return position;
     }

    if(self.cameraIdLeft() === 1){
        position = self.camera1_position();
    	return position;
     }

    if(self.cameraIdLeft() === 2){
        position = self.camera2_position();
    	return position;
     }


  });




  self.videoLabelRight = ko.computed(function() {
    var camera = self.cameraIdRight();
    if (camera >= 0) {
      return camera + 1;
    }
    return "";
  });

  self.videoUrlRight = ko.computed(function() {
    if(self.currentPage()!==self.name){
       return "";
    }

     if(self.cameraIdRight() < 0){
    	self.cameraIdRight.valueHasMutated();
     }
     
  
    if (self.cameraIdRight() >= 0 && self.cameraIdRight() !== self.cameraIdLeft()) {
      self.cameraIdRight.valueHasMutated();
      
      return self.videoUrl[self.cameraIdRight()];
    }
    return "";
  });


  self.videoRightPosition = ko.computed(function() {
    var position  = "-100px";

    if(self.cameraIdRight() === 0){
        position = self.camera0_position();
    	return position;
     }

    if(self.cameraIdRight() === 1){
        position = self.camera1_position();
    	return position;
     }

    if(self.cameraIdRight() === 2){
        position = self.camera2_position();
    	return position;
     }


  });

  self.reloadLeftVideo = function(){
     if(self.currentOperation()===undefined){return ;}
     var taskType = self.currentOperation().taskType;
      taskType = taskType.toLowerCase();
      self.videoLeft = document.getElementById(taskType+"video-left");
      var currentSrc = self.videoUrl[self.cameraIdLeft()];
      self.videoLeft.src = "";
      setTimeout(function(){self.videoLeft.src = currentSrc;},1000);

  }

  self.reloadRightVideo = function(){
    if(self.currentOperation()===undefined){return ;}
    var taskType = self.currentOperation().taskType;
      taskType = taskType.toLowerCase();
      self.videoRight = document.getElementById(taskType+"video-right");
      var currentSrc = self.videoUrl[self.cameraIdRight()];
      self.videoRight.src = "";
      setTimeout(function(){self.videoRight.src = currentSrc;},1000);

  }


  function disableVideo(){

    if(self.videoLeft !== null && self.videoLeft !== undefined){
       self.videoLeft.src = "";
    }

    if(self.videoRight !== null && self.videoRight !== undefined){
       self.videoRight.src = "";
    }

  }


  function abortSequence(callback) {
    return Elixys.doApiCall("/abort_sequence", {}, callback);
    self.abort_prompt = false;
  }


  function ignoreError() {
    setTimeout(self.disableErrorAlert,2000);
    return Elixys.doApiCall("/ignore_error", {ignore_error : {}}, function(){});
  }

  function retryRoutine() {
    setTimeout(self.disableErrorAlert,2000);
    return Elixys.doApiCall("/retry_routine", {retry_routine : {}}, function(){});

  }

  function acceptError() {
    setTimeout(self.disableErrorAlert,2000);
    return Elixys.doApiCall("/abort_sequence", {abort_sequence : {}}, function(){});

  }


  
  function overrideTimer(callback) {
    return Elixys.doApiCall("/override_timer", {
      sequenceid: self.sequence().sequenceid,
      componentid: self.currentOperation().id
    }, function(result) {
      callback(result["override_timer"]);
    });
  }


  //hplc position change inject
  self.changeHplcPosition_Inject = function() {
    return Elixys.doApiCall("/change_hplc_position", {
      change_hplc_position : {
      position: "inject"
      }
    },
    function(result){
      //do something
    });
  }

  //hplc position change load
  self.changeHplcPosition_Load = function() {
    return Elixys.doApiCall("/change_hplc_position", {
      change_hplc_position : {
      position: "load"
      }
    },
    function(result){
      //do something
    });
  }

  
  function continueSequence(callback) {
    return Elixys.doApiCall("/continue_sequence", {}, function(result) {
      callback(result["continue_sequence"]);
    });
  }
  
  self.startRun = function(sequence, operations, firstOperation, checklist) {
    return Elixys.sequence(function(fail) {
      return [
        function() {
          return Elixys.doApiCall("/run_sequence", {
            run_sequence: {
              sequenceid: sequence.sequenceid,
              runname: checklist.runname,
              componentid: firstOperation.id,
              checklistid: checklist.checklistid
            }
          });
        }, function(payload) {
          var result = payload["run_sequence"];
          if( result !== "ok" ) {
            return fail(result.error);
          }
          else {
            return result;
          }
        }, function() {
          self.currentOperationIndex(-1);
          self.sequence(sequence);
          self.operations(operations);
          self.elapsedTime(0);
          self.timerOverridden(false);
          self.timerWasOverridden(false);
          return pollStatus();
        }, function() {
          self.currentPage(self.name);
          self.statusInterval = window.setInterval(pollStatus, 1000);
          self.isRunning(true);
          Elixys.hideNotificationPopup();
        }
      ];
    });
  };
  
  self.overrideTimer = function() {
    self.timerOverridden(true);
    overrideTimer(function(result) {
      if( result === "ok" ) {
        self.timerOverridden(true);
        self.timerWasOverridden(true);
        self.runningOperation().notifyOverride();
      }
      else{
      self.timerOverridden(false);
      }
    });
  };


  
  self.continueSequence = function() {
    //quickly disable cont seq button so user does not try to press it again
    self.continueRequired(false);
    self.continueRequired.valueHasMutated();
    self.continueRequiredSet(true);
    self.continueRequiredSet.valueHasMutated();
    continueSequence(function(result) {
      if( result === "ok" ) {
        self.timerOverridden(false);
        self.runningOperation().notifyContinue();
      }

    });
  };
  
  self.changePressure = function(pressure) {
    Elixys.sequence(function(fail) {
      return [
        function() {
          self.changingPressure(true);
          return Elixys.doApiCall("/change_pressure", {
            change_pressure: {
              sequenceid: self.sequence().sequenceid,
              componentid: self.currentOperation().id,
              target_pressure: pressure
            }
          });
        }, function(payload) {
          var result = payload.change_pressure;
          if( result !== "ok" ) {
            return fail(result);
          }
        }
      ];
    }).fail(function(error) {
      if( typeof error === "string" ) {
        console.log("Error changing pressure: " + error);
      }
      else {
        console.log("Error changing pressure.");
        console.log(error);
      }
    }).always(function() {
      setTimeout(self.enableChangingPressure,750);
    });
  };


 self.enableChangingPressure = function(){
  self.changingPressure(false);
  self.changingPressure.valueHasMutated();
  }

  
  self.targetPressure = ko.pureComputed(function() {
    var operation = self.currentOperation();
    if( operation && operation.pressure ) {
      return operation.pressure();
    }
    else {
      return -1;
    }
  });
  
  self.incPressure = function() {
    var operation = self.currentOperation();
    var pressure = operation.pressure();
    if( pressure < 30 ) {
      operation.pressure(pressure + 0.5);
      self.changePressure(pressure + 0.5);
    }
  };
  
  self.incPressureEnabled = ko.pureComputed(function() {
    var operation = self.currentOperation();
    var pressure = operation.pressure();
    if( self.changingPressure() === false && pressure < 30 ) {
      return true;
    }
    else {
      return false;
    }
  });
  
  self.decPressure = function() {
    var operation = self.currentOperation();
    var pressure = operation.pressure();
    if( pressure > 0 ) {
      operation.pressure(pressure - 0.5);
      self.changePressure(pressure - 0.5);
    }
  };
  
  self.decPressureEnabled = ko.pureComputed(function() {
    var operation = self.currentOperation();
    var pressure = operation.pressure();
    if( self.changingPressure() === false && pressure > 0 ) {
      return true;
    }
    else {
      return false;
    }
  });

  self.toggleStirEnabled = ko.pureComputed(function(){
    return self.timerOverridden() || self.continueRequired();
  });

  self.setStirState = function( reactor, current_motor_speed ){
    var state = current_motor_speed == 0;
    Elixys.doApiCall("/set_stir_state",
                     {"set_stir_state": {'reactor' : reactor, 'state' : state}},
                     function(result){
                     },
                     function(error){
                       console.log( 'An error occured while attempting to stir');
                       console.log( error );
                     });
  }
  
  self.goToPage = function() {
    // If we're already running, then just navigate to the page
    if( self.isRunning() ) {
      self.currentPage(self.name);
    }
    else {
      Elixys.sequence(function(fail) {
        var status;
        return [
          function() {
            Elixys.showNotificationPopup("Loading...");
            return Elixys.doApiCall("/get_status", {});
          },
          function(payload) {
            var result = payload["get_status"];
            if( result.error ) {
              return fail(result.error);
            }
            else {
              status = result;
              return result;
            }
          },
          function(result) {
            var operation_status = result["operation_status"];
            if( operation_status.running ) {
              return Elixys.doApiCall("/get_sequence_and_components", {
                get_sequence_and_components: {
                  sequenceid: operation_status.sequenceid
                }
              });
            }
            else {
              return fail("No sequence is currently being run.");
            }
          },
          function(payload) {
            var result = payload["get_sequence_and_components"];
            if( result.error ) {
              return fail(result.error);
            }
            else {
              return result;
            }
          },
          function(result) {
            var sequence = result["sequence"];
            var components = result["components"];
            self.sequence(sequence);
            return Elixys.viewModels.editSequence.populateComponents(components);
          },
          function(cassettes, operations) {
            var currentOperation = status.operation_status.order - 1;
            // Mark operations we've already done as finished
            for( var i = 0; i < currentOperation; i++ ) {
              operations[i].toggleFinished();
            }
            self.currentOperationIndex(-1);
            self.operations(operations);
            self.elapsedTime(0);
            self.timerOverridden(false);
            self.timerWasOverridden(false);
            gotStatus(status);
            self.currentPage(self.name);
            self.statusInterval = window.setInterval(pollStatus, 1000);
            self.isRunning(true);
            Elixys.hideNotificationPopup();
          }
        ];
      }).fail(function(error) {
        if( typeof error === "string" ) {
          Elixys.showNotificationPopup(error, {
            showCloseButton: true
          });
        }
        else {
          Elixys.showNotificationPopup("There was an error trying to get the run status.", {
            showCloseButton: true
          });
        }
      });
    }
  };
  
  function pollStatus() {
    return Elixys.sequence(function(fail) {
      return [
        function() {
          return Elixys.doApiCall("/get_status", {});
        },
        function(payload) {
          var result = payload["get_status"];
          if( result.error ) {
            return fail(result.error);
          }
          else {
            return result;
          }
        },
        gotStatus
      ];
    });
  }
  self.prompt_if_disconnected = true;
  self.cbox_prompt_if_disconnected = true;
  function gotStatus(result) {
    var operation_status = result.operation_status;
    var system_status = result.system_status;
    var sequence_status = result.sequence_status;
    self.logged_sequence_id(operation_status['sequenceid']);

    if(operation_status.override_timer_ready === true){
      //ok to show timer override
      self.timerOverrideReady(true);
      self.timerOverrideReady.valueHasMutated()
      self.timerOverridden(false);
    }
    else{
      self.timerOverrideReady(false);
      self.timerOverrideReady.valueHasMutated()
    }
	
	if(operation_status.continue_sequence_required === true){
		self.continueRequired(true);
		//self.timerOverridden(true);
	}
	else{
		self.continueRequired(false);
	}

    if( operation_status.order  !== self.currentOperationIndex() + 1 ) {
      self.currentOperationIndex(operation_status.order - 1);
      self.newOperationStarted = true;
      self.continueRequiredSet(false); //reset
    }
    else{
      self.newOperationStarted = false;
    }
    if( sequence_status.sequence_running === false ) {
      self.currentOperationIndex(-1);
      window.clearInterval(self.statusInterval);
      self.statusInterval = undefined;
      if( self.timerWasOverridden() ) {
        saveCopy();
      }
      else {

        endRun();
      }
    }

    // Select correct reactors
    var data = self.currentOperationData();
    var taskType = undefined;
    if(self.currentOperation()!==undefined){
        taskType = self.currentOperation().taskType;
        taskType = taskType.toLowerCase();
    }

    var reactor = firstAvailable(data, ["reactor", "sourcereactor"]);
    var targetReactor = firstAvailable(data, ["targetreactor"]);
    var temperature = firstAvailable(data, ["evaporationtemperature", "reactiontemperature", "finaltemperature"]);
    if( self.timerOverridden() ) {
      //self.operationTimerSeconds(self.operationTimerSeconds() + 1);
      self.operationTimerSeconds(operation_status.time_remaining_sec);
    }
    else {

      self.operationTimerSeconds(operation_status.time_remaining_sec);
    }
    self.elapsedTime(parseInt(sequence_status.sequence_time_elapsed));
    // Readings from the server
    self.readings.pressure.current(system_status.pressure_regulators.pressure1);

    self.readings.operation_status.message(operation_status.message);

    self.readings.hplc.position(system_status.hplc.position);
    self.readings.hplc.fluid(system_status.hplc.fluid);
	self.readings.hplc.positionInject(system_status.hplc.position == "Inject");
	self.readings.hplc.positionLoad(system_status.hplc.position == "Load");
    if( reactor === 0 ) {
      self.readings.temperature.current(system_status.reactor_temperatures.reactor0);
      self.readings.activity1.reactor(system_status.radiation_activity.reactor0.activity1);
      self.readings.activity1.cartridgeA(system_status.radiation_activity.reactor0.cartridgeA);
      self.readings.activity1.cartridgeB(system_status.radiation_activity.reactor0.cartridgeB);
      self.readings.sourceMotor(system_status.motors.reactor0);
      self.cameraIdLeft (0);
      self.cameraIdLeft.valueHasMutated();
    }
    else if( reactor === 1 ) {
      self.readings.temperature.current(system_status.reactor_temperatures.reactor1);
      self.readings.activity1.reactor(system_status.radiation_activity.reactor1.activity1);
      self.readings.activity1.cartridgeA(system_status.radiation_activity.reactor1.cartridgeA);
      self.readings.activity1.cartridgeB(system_status.radiation_activity.reactor1.cartridgeB);
      self.readings.sourceMotor(system_status.motors.reactor1);
      self.cameraIdLeft(1);
      self.cameraIdLeft.valueHasMutated();
    }
    else if( reactor === 2 ) {
      self.readings.temperature.current(system_status.reactor_temperatures.reactor2);
      self.readings.activity1.reactor(system_status.radiation_activity.reactor2.activity1);
      self.readings.activity1.cartridgeA(system_status.radiation_activity.reactor2.cartridgeA);
      self.readings.activity1.cartridgeB(system_status.radiation_activity.reactor2.cartridgeB);
      self.cameraIdLeft(2);
      self.cameraIdLeft.valueHasMutated();
      self.readings.sourceMotor(system_status.motors.reactor2);
    }
    else {
      self.cameraIdLeft(-1);
      self.cameraIdLeft.valueHasMutated();
    }
    if( targetReactor === 0 ) {
      self.readings.activity2.reactor(system_status.radiation_activity.reactor0.activity1);
      self.readings.activity2.cartridgeA(system_status.radiation_activity.reactor0.cartridgeA);
      self.readings.activity2.cartridgeB(system_status.radiation_activity.reactor0.cartridgeB);
      self.readings.targetMotor(system_status.motors.reactor0);
      self.cameraIdRight(0);
      self.cameraIdLeft.valueHasMutated();

    }
    else if( targetReactor === 1 ) {
      self.readings.activity2.reactor(system_status.radiation_activity.reactor1.activity1);
      self.readings.activity2.cartridgeA(system_status.radiation_activity.reactor1.cartridgeA);
      self.readings.activity2.cartridgeB(system_status.radiation_activity.reactor1.cartridgeB);
      self.readings.targetMotor(system_status.motors.reactor1);
      self.cameraIdRight(1);
      self.cameraIdLeft.valueHasMutated();
    }
    else if( targetReactor === 2 ) {
      self.readings.activity2.reactor(system_status.radiation_activity.reactor2.activity1);
      self.readings.activity2.cartridgeA(system_status.radiation_activity.reactor2.cartridgeA);
      self.readings.activity2.cartridgeB(system_status.radiation_activity.reactor2.cartridgeB);
      self.readings.targetMotor(system_status.motors.reactor2);
      self.cameraIdRight(2);
      self.cameraIdLeft.valueHasMutated();
    }
    else {
      self.cameraIdRight(-1);
      self.cameraIdLeft.valueHasMutated();
    }
    var destination = data["destination"];
    self.readings.sourceReactor(reactor);
    self.readings.targetReactor(targetReactor);
    self.readings.hasTargetReactor(destination && destination.toUpperCase() == "REACTOR")
    self.hasTargetReactor(destination && destination.toUpperCase() == "REACTOR");

    if(self.newOperationStarted){
      self.timerOverridden(false);

      self.runningOperation().finishOperation();
      var lastOperation = self.runningOperation();

      self.runningOperation(new RunningOperation(self.currentOperation()));
      if(!lastOperation.operation && self.runningOperation().operation.name == "TRANSFER"){
        if(self.readings.operation_status.message() == "Waiting for user to inject/load"){
          self.runningOperation().notifyOverride();
        }
      }
      self.startVideo(taskType,reactor, targetReactor);
    }
    if(operation_status.user_prompt.status_code){
      self.runningOperation().setUserPrompt(operation_status.user_prompt);
    }
    else{
      self.runningOperation().setUserPrompt(null);
    }

    if(self.currentPage() !== self.name && self.cameras_disabled()){
       disableVideo();
       self.cameras_disabled(false);
    }

    if(self.currentPage() === self.name && self.cameras_enabled()){
       self.startVideo(taskType,reactor, targetReactor);
       self.cameras_enabled(false);
    }
    self.readings.temperature.target(operation_status.target_temperature);
    self.readings.pressure.target(self.targetPressure());
    self.readings.vacuum(system_status.vacuum_pump.pressure);

    //if error then show popup

    if( !system_status.synth_connection && self.prompt_if_disconnected && !self.abort_prompt){
      Elixys.showNotificationPopup("Synthesizer Board has been disconnected", {
        confirmText: "Reconnect",
        confirmCallback: function(){
          if(self.errorAlertSet()){
              setTimeout(self.errorAlert, 100);
          }
          else{
              Elixys.hideNotificationPopup();
          }
          self.prompt_if_disconnected = false;
          setTimeout(function(){
            self.prompt_if_disconnected = true;
          }, 30000);
        }
      });
    }

    if( !system_status.cbox_connection && self.cbox_prompt_if_disconnected && !self.abort_prompt){
      Elixys.showNotificationPopup("CBox has been disconnected", {
        confirmText: "Reconnect",
        confirmCallback: function(){
          if(self.errorAlertSet()){
              setTimeout(self.errorAlert, 100);
          }
          else{
              Elixys.hideNotificationPopup();
          }
          self.cbox_prompt_if_disconnected = false;
          setTimeout(function(){
            self.cbox_prompt_if_disconnected = true;
          }, 30000);
        }
      });
    }
    if( operation_status.error ){
        self.errorAlertSet(true);
        if( system_status.synth_connection && system_status.cbox_connection ){
            setTimeout(self.errorAlert, 100);
        }
    }
    else if(system_status.synth_connection && system_status.cbox_connection && !self.abort_prompt){
        Elixys.hideNotificationPopup();
    }

	
	if(self.readings.hplc.fluid() == "No Fluid") {
	    self.readings.hplc.fluid("No");
	} else {
	    self.readings.hplc.fluid("Yes");
	}
	
	if(self.readings.hplc.position() == "Load") {
	  self.readings.hplc.position_message("Hplc valve is in the load position");
	} else {
	  self.readings.hplc.position_message("Hplc valve is in the inject position");
	}
  }
  
  function firstAvailable(obj, fields) {
    for( var i = 0; i < fields.length; i++ ) {
      if( obj[fields[i]] !== undefined ) {
        return obj[fields[i]];
      }
    }
    return -1;
  }
  
  function saveCopy() {
    Elixys.showNewSequencePopup({
      titleText: "Copy Sequence",
      buttonText: "Copy",
      create: function(name, description) {
        return Elixys.sequence(function(fail) {
          return [
            function() {
              return Elixys.doApiCall("/copy_sequence_and_components", {
                copy_sequence_and_components: {
                  sequenceid: self.logged_sequence_id(),
                  name: name,
                  comment: description
                }
              });
            }, function(payload) {
              var result = payload["copy_sequence_and_components"];
              if( result.error ) {
                fail(result.error);
              }
              else {
                return result;
              }
            }
          ];
        }).always(endRun);
      },
      close: endRun
    });
  }
  self.abort_prompt = false;
  self.abortRun = function() {
    self.abort_prompt = true;
    Elixys.showNotificationPopup("Are you sure you want to abort \"" + self.sequenceName() + "\"?", {
      confirmCallback: function() {
        window.clearInterval(self.statusInterval);
        self.statusInterval = undefined;
        disableVideo();
        //Elixys.viewModels.cameraCtrl.hideCameras();
        abortSequence(saveCopy);
        self.abort_prompt = false;
      },
      confirmText: "Yes",
      cancelCallback: function() {self.abort_prompt=false;},
      cancelText: "No"
    });
  };


  //if operation status error message is true then show error

  self.errorAlert = function() {
    Elixys.showNotificationPopup(self.readings.operation_status.message(), {
      confirmCallback: function() {
        ignoreError();
      },
      confirmText: "Ignore",
      cancelCallback: function() {
          retryRoutine();
      },
      cancelText: "Retry",
      otherCallback: function(){
          acceptError();
      },
      otherText: "Abort",
      showOtherButton: true
    });

  };

  self.disableErrorAlert = function(){
    self.errorAlertSet(false);
    self.errorAlertSet.valueHasMutated();
  }
  
  function endRun() {
    disableVideo();
    Elixys.navigationDirty()(false); // If pressure is changed, that will set the dirty flag
    self.currentPage(Elixys.viewModels.logs.name);
    self.isRunning(false);
  }
  
  self.statusInterval = undefined; // Will be initialized when the run is started
 
  self.sequenceName = ko.computed(function() {
    var sequence = self.sequence();
    if( sequence && sequence.details ) {
      return sequence.details.name;
    }
    else {
      return "";
    }
  });

  self.activeTemplate = ko.pureComputed(function() {
    var operation = self.currentOperation();

    if( operation !== undefined ) {
      var template = self.getTemplateFromOperationType(operation.taskType);
      return template;
    }
    else {
      //Elixys.viewModels.cameraCtrl.hideCameras();
      return "blank-template";
    }
  });

  self.hasSequence = ko.computed(function() {
    return self.sequence() !== undefined;
  });
  
  function timeDisplay(target) {
    return function() {
      var time = Math.max(target(), 0);
      
      function asDigit(t) {
        var t2 = parseInt(t);
        if( t2 < 10 ) {
          return "0" + t2;
        }
        else {
          return t2.toString();
        }
      }
      
      var hours = asDigit((time/60)/60);
      var minutes = asDigit((time/60)%60);
      var seconds = asDigit(time%60);
      return hours + ":" + minutes + ":" + seconds;
    };
  }
  
  self.elapsedTimeDisplay = ko.computed(timeDisplay(self.elapsedTime));
  
  self.modeDisplay = function(mode) {
    if( mode === "elute" ) {
      return "Elute";
    }
    else if( mode === "trap" ) {
      return "Trap";
    }
    else {
      return "Out of System";
    }
  };
  
  self.currentOperationIndex = ko.observable(-1);
  
  self.currentOperation = ko.computed(function() {
    var index = self.currentOperationIndex();
    if( index !== -1 ) {
      return self.operations()[index];
    }
    else {
      return undefined;
    }
  });
  // Before change
  self.currentOperation.subscribe(function(operation) {
    if( operation !== undefined ) {
      operation.selected(false);
      operation.finished(true);
    }
  }, null, "beforeChange");
  // After change
  self.currentOperation.subscribe(function(operation) {
    if( operation !== undefined ) {
      operation.selected(true);
    }
  });
  
  self.currentOperationData = ko.computed(function() {
    var operation = self.currentOperation();
    if( operation !== undefined ) {
      if( operation.data !== undefined ) {
        return Elixys.unmakeObservable(operation.data);
      }
    }
    return {};
  });
  
  self.operationTimerSeconds = ko.observable(30);

  self.operationTimer = ko.computed(timeDisplay(self.operationTimerSeconds));
  
  self.readings = {
    operation_status: {
    message: displayText("status"),

    },
    hplc: {
    position: displayText("Inject"),
    position_message: displayText(""),
    fluid: displayText("No Fluid"),
	positionInject: displayBool(false),
	positionLoad: displayBool(false)
    },
    pressure: {
      current: displayRoundingDown(18, 1),
      target: displayRoundingDown(30, 1)
    },
    temperature: {
      current: displayRoundingDown(163, 0),
      target: displayRoundingDown(170, 0)
    },
    vacuum: displayRoundingDown(30, 1),
    activity1: {
      reactor: displayRoundingDown(36.82, 2),
      cartridgeA: displayRoundingDown(18.90, 2),
      cartridgeB: displayRoundingDown(22.42, 2)
    },
    activity2: {
      reactor: displayRoundingDown(36.82, 2),
      cartridgeA: displayRoundingDown(18.90, 2),
      cartridgeB: displayRoundingDown(22.42, 2)
    },
    sourceMotor: ko.observable(0),
    targetMotor: ko.observable(0),
    sourceReactor: ko.observable(0),
    targetReactor: ko.observable(0),
    hasTargetReactor: ko.observable(false)
  };

  self.reactorIdLeft = ko.computed(function() {
    var operation = self.currentOperation();
    if( operation !== undefined ) {
      if( operation.data !== undefined ) {
        return Elixys.unmakeObservable(operation.data);
      }
    }
    return {};
  });


  //true / false
  function displayBool(bool){
  return withDisplayFn(function(value) {
      if( value !== undefined ) {
        return value;
      }
      else {
        return false;
      }
    }, bool);
  }


  function displayText(text){
  return withDisplayFn(function(value) {
      if( value !== undefined ) {
        return value;
      }
      else {
        return "status";
      }
    }, text);
  }

  function displayRoundingDown(start, sigFigs) {
    return withDisplayFn(function(value) {
      if( value !== undefined ) {
        return value.toFixed(sigFigs);
      }
      else {
        return -1;
      }
    }, start);
  }
  
  function withDisplayFn(f, start) {
    var value = ko.observable(start);
    function readVal() {
      return f(value());
    }
    function writeVal(newValue) {
      value(newValue);
    }
    return ko.computed({
      read: readVal,
      write: writeVal
    });
  }

  function RunningOperation(operation){
    var self = this;
    this.operation = operation;
    this.showInjectLoad = ko.observable(false);
    this.pressureModifiable = ko.observable(false);
    this.userPrompt = ko.observable();

    this.finishOperation = function(){
    }

    this.setUserPrompt = function(prompt){
      this.userPrompt(prompt);
    }

    this.userResponse = function(response){
      var data = {status_code: self.userPrompt().status_code, response: response};
      $.ajax("/user_response", {
        method: "POST",
        data: JSON.stringify(data),
        contentType: "application/json",
        error: function(jqxhr, textStatus, errorThrown){
          console.log("error");
          console.log( jqxhr );
        },
        success: function(data, textStatus, jqxhr){
          self.userPrompt(null);
        }
      });
    }

    if( this.operation ){
      if( this.operation.name == "TRANSFER" ){
        this.notifyContinue = function(){
          var hplcManual = this.operation.data.destination() =='hplc' && this.operation.data.hplc.mode() == "manual"
          this.showInjectLoad(hplcManual);
          this.pressureModifiable(hplcManual);
        }

        this.notifyOverride = function(){
          this.showInjectLoad(this.operation.data.destination() =='hplc');
          this.pressureModifiable(true);
        }
      }
      else{
        this.notifyContinue = function(){

        }
        this.notifyOverride = function(){

        }
      }
    }
  }
}
