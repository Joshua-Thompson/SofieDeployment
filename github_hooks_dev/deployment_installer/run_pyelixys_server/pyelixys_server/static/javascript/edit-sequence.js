function EditSequence() {
  'use strict';

  var self = this;

  // inherits Common.
  Common.apply(self, arguments);

  //dictionary of selected reagents and the task they belong to (prevent task from using already selected reagent)
  self.selectedReagents = ko.observable({});
  self.operationOrders = ko.observable({});

  for(var i = 0; i<=35; i++){self.selectedReagents()[i]={"task":undefined, "selected":false};}
function trimTime(time) {
    var hour = parseInt(time.substring(0,2));
    var minute = time.substring(3,5);
    var sec = time.substring(6,8);
    var ampm;
    if( hour >= 12 ) {
      ampm = "pm";
    }
    else {
      ampm = "am";
    }
    if( hour > 12 ) {
      hour = hour - 12;
    }
    else if( hour === 0 ) {
      hour = 12;
    }
    return hour + ":" + minute + ":" + sec + ampm;
  }


  //get status logs
  self.statusLogs = ko.observableArray();
  self.getStatusLogs = function(){
          var result = Elixys.doApiCall('/get_status_logs', {
              'get_status_logs': {
                'sequenceid': self.currentSequence().sequenceid
              }
            },
            function(result){
              var data = result["get_status_logs"];
              data.forEach(function(status_log) {
                status_log.operation_status.time = trimTime(status_log.operation_status.time);
              });

              self.statusLogs(data);
            }

          );

  }
  //update operation order numbers for labeling on edit page
  function updateOperationOrders(){
  //populate order of operations
          self.dragDropManager.taskSequence().map(function(task, ix) {
            self.operationOrders()[ix] = {"order":ix + 1};
            self.dragDropManager.taskSequence()[ix].order(ix+1);

        })
  }

  function getComponents(sequenceId) {
    return Elixys.sequence(function(fail) {
      return [
        function() {
          return Elixys.doApiCall('/get_components', {
            'get_components': {
              'sequenceid': sequenceId
            }
          });
        },
        function(result) {
          self.currentComponents(result['get_components']);
          return self.populateComponents(result['get_components']);
        },
        function(cassettes, components) {
          self.cassettes(cassettes);
          self.dragDropManager.taskSequence(components);
          //populate selected reagents list
          //clear first
          for(var i = 0; i<=35; i++){self.selectedReagents()[i]={"task":undefined, "selected":false};}

          //populate order of operations
          updateOperationOrders();

          //look for components with reagentpos values
          for(var i in self.dragDropManager.taskSequence()){

            if(self.dragDropManager.taskSequence()[i].data.reagentpos!==undefined){

                var pos = parseInt(self.dragDropManager.taskSequence()[i].data.reagentpos());
                if(pos >=0){
                self.selectedReagents()[pos]["task"] = self.dragDropManager.taskSequence()[i];
                self.selectedReagents()[pos]["selected"] = true;
                }


            }
          }


          self.deleteList = [];
          self.dirty(false);
          self.dragDropManager.selectedOptionsDrag.dragActions.arrowsRequired();
          // Keep the same Operation selected, if possible.
          self.dragDropManager.toggleSelectedOptionById(self.previouslySelectedTaskId);
        }
      ];
    }).fail(function() {
      Elixys.triggerConnectionErrorPopup(getComponents);
    });
  }
  // This is called for loaded Tasks
  self.populateComponents = function(components) {
    var details,
        i,
        component,
        cassettes = [],
        components,
        rawTasks = [],
        tasks = [];
    for (i = 0; i < components.length; i++) {
      component = components[i];
      details = component.details;

      // cassette
      if (component.componenttype === 'CASSETTE') {
        component.reagents.sort(Elixys.objectComparator('position'));
        cassettes[details.reactor] = new Cassette(component);
      }
      // tasks
      else {
        rawTasks.push(component);
      }
    }
    
    rawTasks.sort(Elixys.objectComparator("order"));
    // Need to set cassettes in order to be able to reference them for reagent observables.
    self.cassettes(cassettes);
    
    components = rawTasks.map(function(component) {
      var fields = componentTypeMap[component.componenttype];
      if( fields !== undefined ) {
        var loadedTask = new Task(
          fields.name,
          component.componentid,
          "selectedTasks",
          fields.className,
          " box dropped",
          fields.templateName,
          component.componenttype,
          Elixys.makeObservable(component.details, setDirty),
          fields.pressure,
          fields.validators
        );
        return loadedTask;
      }
    });
    
    // We use a deferred to "return" multiple values
    return $.Deferred().resolve(cassettes, components);
  };
  
  self.dirty = ko.observable(false);
  
  var _navigationDirty = Elixys.navigationDirty();
  Elixys.navigationDirty(
    ko.computed({
      read: function() {
        return self.dirty() || _navigationDirty();
      },
      write: function(value) {
        if( value === false ) {
          self.dirty(false);
          _navigationDirty(false);
        }
      }
    })
  );

  function setDirty() {
    if( self.currentPage() === self.name ) {
      self.dirty(true);
    }
  }
  function reagentValidator(reagentPos){
      return ko.pureComputed(function(){
        if( reagentPos ){
          var position = reagentPos();
          var inRange = rangeValidator(position, 0, 35);
          if( !inRange ) return false;

          var cassetteIndex = parseInt( position / 12 );
          var reagentIndex = parseInt( position % 12 );

          if( !(cassetteIndex >= 0 && cassetteIndex <= 2) ) return false;

          var cassette = Elixys.viewModels.editSequence.cassettes()[cassetteIndex];
          if( cassette ){
            var reagent = Elixys.viewModels.editSequence.cassettes()[cassetteIndex].reagents[reagentIndex];
            return reagent && reagent.name && reagent.name() != "";
          }
          return false;
        }
        return false;
      })
  }
  function rangeValidator(target, min, max) {
    return ko.pureComputed(function() {
      var value = target();
      return value >= min && value <= max;
    });
  }

  function stringLengthValidator(target, max) {
    return ko.pureComputed(function() {
      var value = target();
      return value == null || value.length <= max;
    });
  }
  
  function optionValidator(target, options) {
    return ko.pureComputed(function() {
      var value = target();
      for( var i = 0; i < options.length; i++ ) {
        if( value === options[i] ) {
          return true;
        }
      }
      return false;
    });
  }

  self.viewInstructionOptions = function(){
    if( self.hasInstructions() ){
      Elixys.showTwoButtonPopup({
        titleText: "Instruction Options",
        btnAText: "View",
        btnAClick: function(popup){
          popup.close();
          self.getInstructions();
        },
        btnBText: "Overwrite",
        btnBClick: function(popup){
          popup.close();
          self.openAttachmentDialog();
        }
      });
    }
    else{
      self.openAttachmentDialog();
    }
  }

  var componentTypeMap = {
    ADD: {
      name: "ADD REAGENT",
      className: "add-operation",
      templateName: "add-template",
      pressure: function(data) {
        return data.deliverypressure;
      },
      validators: function(data) {
        var stirmode_valid = optionValidator(data.stirmode, ["after operation", "during operation"]);
        var stir_valid = rangeValidator(data.stir, 0, 1);
        var stirmodeValidator = ko.pureComputed(function() {
          var mode_valid = stirmode_valid();
          if( data.stir() === 1 ) {
            return mode_valid;
          }
          else {
            return true;
          }
        });
        return {
          deliveryposition_valid: rangeValidator(data.deliveryposition, 0, 1),
          deliverypressure_valid: rangeValidator(data.deliverypressure, 0, 30),
          deliverytime_valid: rangeValidator(data.deliverytime, 0, 3599),
          durationofstir_valid: rangeValidator(data.durationofstir, 0, 3599),
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          reagentpos_valid: reagentValidator(data.reagentpos),
          stir_valid: ko.pureComputed(function() {
            return stir_valid() && stirmodeValidator();
          }),
          stirmode_valid: stirmodeValidator,
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    EVAPORATE: {
      name: "EVAPORATE",
      className: "evaporate-operation",
      templateName: "evaporate-template",
      pressure: function(data) {
        return data.evaporationpressure;
      },
      validators: function(data) {
        var durationofstir_valid = rangeValidator(data.durationofstir, 0, 3599);
        var stirdelay_valid = rangeValidator(data.stirdelay, 0, 3599);
        var stir_valid = rangeValidator(data.stir, 0, 1);
        var stirdelayValidator = ko.pureComputed(function() {
          var delay_valid = stirdelay_valid();
          var duration = data.evaporationduration();
          var delay = data.stirdelay();
          if( data.stir() === 1 ) {
            return delay_valid && delay <= duration;
          }
          else {
            return true;
          }
        });
        var durationofstirValidator = ko.pureComputed(function() {
          var duration_valid = durationofstir_valid();
          var delay_valid = stirdelay_valid();
          var duration = data.evaporationduration();
          var delay = data.stirdelay();
          var stirduration = data.durationofstir();
          if( data.stir() === 1 ) {
            return duration_valid && delay_valid && stirduration <= duration - delay;
          }
          else {
            return true;
          }
        });
        return {
          coolduration_valid: rangeValidator(data.coolduration, 0, 3599),
          durationofstir_valid: durationofstirValidator,
          evaporationduration_valid: rangeValidator(data.evaporationduration, 0, 3599),
          evaporationpressure_valid: rangeValidator(data.evaporationpressure, 0, 30),
          evaporationtemperature_valid: rangeValidator(data.evaporationtemperature, 0, 180),
          finaltemperature_valid: rangeValidator(data.finaltemperature, 0, 180),
          pressure_valid: rangeValidator(data.pressure, 0, 30),
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          stir_valid: ko.pureComputed(function() {
            return stir_valid() && stirdelayValidator() && durationofstirValidator();
          }),
          stirdelay_valid: stirdelayValidator,
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    TRANSFER: {
      name: "TRANSFER",
      className: "transfer-operation",
      templateName: "transfer-template",
      pressure: function(data) {
        return data.pressure;
      },
      validators: function(data) {
        var destination_valid = optionValidator(data.destination, ["reactor", "collection vial", "hplc"]);
        var reagentpos_valid = rangeValidator(data.hplc.reagentpos, 0, 35);
        var deliveryposition_valid = rangeValidator(data.deliveryposition, 0, 1);
        var deliverypressure_valid = rangeValidator(data.hplc.deliverypressure, 0, 30);
        var deliverytime_valid = rangeValidator(data.hplc.deliverytime, 0, 3599);
        var isHplc = ko.pureComputed(function() { return data.destination() === "hplc"; });
        var isReactor = ko.pureComputed(function(){ return data.destination().startsWith("reactor"); });
        var reagentposValidator = ko.pureComputed(function() {
          var posValid = reagentpos_valid();
          if( isHplc() ) {
            return posValid;
          }
          else {
            return true;
          }
        });
        var deliverypositionValidator = ko.pureComputed(function() {
          var posValid = deliveryposition_valid();
          if( isHplc() ) {
            return posValid;
          }
          else {
            return true;
          }
        });
        var deliverypressureValidator = ko.pureComputed(function() {
          var pressureValid = deliverypressure_valid();
          if( isHplc() ) {
            return pressureValid;
          }
          else {
            return true;
          }
        });
        var deliverytimeValidator = ko.pureComputed(function() {
          var timeValid = deliverytime_valid();
          if( isHplc() ) {
            return timeValid;
          }
          else {
            return true;
          }
        });
        var destinationValidator = ko.pureComputed(function() {
          var destination = data.destination();
          var mode = data.mode()
          var destinationValid = destination_valid();
          var sourcereactor = data.sourcereactor();
          var targetreactor = data.targetreactor();
          var reagentValid = reagentposValidator();
          var delPosValid = deliverypositionValidator();
          var delPresValid = deliverypressureValidator();
          var delTimeValid = deliverytimeValidator();
          if( destinationValid ) {
            if( destination === "reactor" ) {

              return (sourcereactor !== targetreactor);
            }
            else if( destination === "hplc" ) {
              return reagentValid && delPosValid && delPresValid && delTimeValid;
            }
            else {
              return true;
            }
          }
          else {
            return false;
          }
        });
        var modeValidator = ko.pureComputed(function(){
          var allOptions = ["trap", "elute", "out"];
          var valid = optionValidator(data.mode, allOptions)();
          if( isHplc() ){
            valid &= data.mode() != "trap";
          }
          else if( isReactor() ){
            valid &= data.mode() != "out";
          }
          return valid;
        });
        var stir_valid = rangeValidator(data.stir, 0, 1);
        var targetreactorValid = rangeValidator(data.targetreactor, 0, 2);
        return {
          deliveryposition_valid: deliverypositionValidator,
          destination_valid: destinationValidator,
          deliverypressure_valid: deliverypressureValidator,
          deliverytime_valid: deliverytimeValidator,
          reagentpos_valid: reagentposValidator,
          mode_valid: modeValidator,
          pressure_valid: rangeValidator(data.pressure, 0, 30),
          sourcereactor_valid: rangeValidator(data.sourcereactor, 0, 2),
          stir_valid: ko.pureComputed(function() {
            var stir = data.stir();
            return stir_valid();
          }),
          targetreactor_valid: ko.pureComputed(function() {
            var targetValid = targetreactorValid();
            return data.destination() !== "reactor" || targetValid;
          }),
          transferduration_valid: rangeValidator(data.transferduration, 0, 3599),
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    REACT: {
      name: "REACT",
      className: "react-operation",
      templateName: "react-template",
      validators: function(data) {
        var stir_valid = rangeValidator(data.stir, 0, 1);
        var stirdelay_valid = rangeValidator(data.stirdelay, 0, 3599);
        var durationofstir_valid = rangeValidator(data.durationofstir, 0, 3599);
        var stirdelayValid = ko.pureComputed(function() {
          var duration = data.reactionduration();
          var stirdelay = data.stirdelay();
          var stirdelayValid = stirdelay_valid();
          if( stir_valid() && data.stir() === 1 ) {
            return stirdelayValid && stirdelay <= duration;
          }
          else {
            return true;
          }
        });
        var stirdurationValid = ko.pureComputed(function() {
          var duration = data.reactionduration();
          var stirdelay = data.stirdelay();
          var stirduration = data.durationofstir();
          var stirdelayValid = stirdelay_valid();
          var stirdurationValid = durationofstir_valid();
          if( stir_valid() && data.stir() === 1 ) {
            return stirdelayValid && stirdurationValid && stirduration <= duration - stirdelay;
          }
          else {
            return true;
          }
        });
        return {
          coolduration_valid: rangeValidator(data.coolduration, 0, 3599),
          coolingdelay_valid: rangeValidator(data.coolingdelay, 0, 3599),
          durationofstir_valid: stirdurationValid,
          finaltemperature_valid: rangeValidator(data.finaltemperature, 30, 180),
          reactionduration_valid: rangeValidator(data.reactionduration, 0, 3599),
          reactiontemperature_valid: rangeValidator(data.reactiontemperature, 30, 180),
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          sealposition_valid: rangeValidator(data.sealposition, 0, 1),
          stir_valid: ko.pureComputed(function() {
            return stir_valid() && stirdelayValid() && stirdurationValid();
          }),
          stirdelay_valid: stirdelayValid,
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    PROMPT: {
      name: "PROMPT",
      className: "prompt-operation",
      templateName: "prompt-template",
      validators: function(data) {
        return {
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    TRAPISOTOPE: {
      name: "TRAP ISOTOPE",
      className: "trap-operation",
      templateName: "trapisotope-template",
      pressure: function(data) {
        return data.trappressure;
      },
      validators: function(data) {
        return {
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          activitysource_valid: optionValidator(data.activitysource, ["external", "internal"]),
          trappressure_valid: function(){

                if(data.activitysource()==='external'){
                    data.trappressure(0);
                }
                return rangeValidator(data.trappressure, 0, 30)
                },
          traptime_valid: rangeValidator(data.traptime, 0, 3599),
          cyclotronflag_valid: rangeValidator(data.cyclotronflag, 0, 1),
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    ELUTEISOTOPE: {
      name: "ELUTE ISOTOPE",
      className: "elute-operation",
      templateName: "eluteisotope-template",
      pressure: function(data) {
        return data.elutepressure;
      },
      validators: function(data) {
        return {
          elutepressure_valid: rangeValidator(data.elutepressure, 0, 30),
          elutetime_valid: rangeValidator(data.elutetime, 0, 3599),
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          reagentpos_valid: reagentValidator(data.reagentpos),
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    MOVE: {
      name: "MOVE REACTOR",
      className: "move-operation",
      templateName: "move-template",
      validators: function(data) {
        return {
          position_valid: optionValidator(data.position, ["access vial"]),
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    },
    EXTERNALADD: {
      name: "EXTERNAL ADD",
      className: "externaladd-operation",
      templateName: "externaladd-template",
      validators: function(data) {
        return {
          reactor_valid: rangeValidator(data.reactor, 0, 2),
          reagentname_valid: ko.pureComputed(function() {
            return data.reagentname() !== "";
          }),
          message_valid: stringLengthValidator(data.message, 1024)
        };
      }
    }
  };
  
  self.deleteList = [];
  
  function deleteComponent(task) {
    self.deleteList.push(task);
  }

  self.name = 'EDIT SEQUENCE';
  self.cassettesVisible = ko.observable(true);
  self.operationsVisible = ko.observable(false);
  self.activeTemplate = ko.observable('cassettes-template');
  self.cassettes = ko.observableArray();
  self.currentCassetteReagent = ko.observable(-1);
  var cassettes = self.cassettes;
  self.currentCassette = ko.observable(0);
  self.dragDropManager = new DragDropManager(self.selectedReagents);
  self.previouslySelectedTaskId = -1; // Track selected Operation across Saves

  self.optionRows = [[
    new StaticTaskOption("ADD", {
      deliveryposition: 0,
      deliverypressure: 3,
      deliverytime: 15,
      durationofstir: 0,
      message: "",
      reactor: -1,
      reagentpos: -1,
      stir: 0,
      stirmode: "during operation",
      stirspeed: 500
    }),
    new StaticTaskOption("EVAPORATE", {
      coolduration: 0,
      durationofstir: 0,
      evaporationduration: 0,
      evaporationpressure: 0,
      evaporationtemperature: 35,
      finaltemperature: 35,
      message: "",
      pressure: 5,
      reactor: -1,
      stir: 1,
      stirdelay: 0,
      stirspeed: 500
    }),
    new StaticTaskOption("TRANSFER", {
      deliveryposition: 0,
      destination: "Select",
      hplc: {
        mode: "manual",
        deliveryposition: 0,
        deliverypressure: 0,
        deliverytime: 15,
        reagentpos: 0
      },
      message: "",
      mode: "",
      pressure: 0,
      sourcereactor: -1,
      stir: 1,
      stirspeedsource: 500,
      stirspeedtarget: 500,
      targetreactor: -1,
      transferduration: 0
    }),
    new StaticTaskOption("REACT", {
      coolduration: 0,
      coolingdelay: 0,
      durationofstir: 0,
      finaltemperature: 35,
      message: "",
      reactionduration: 0,
      reactiontemperature: 35,
      reactor: -1,
      sealposition: 0,
      stir: 1,
      stirdelay: 0,
      stirspeed: 500
    }),
    new StaticTaskOption("PROMPT", {
      message: "",
      waitduration: 0
    }),
    new StaticTaskOption("TRAPISOTOPE", {
      reactor: -1,
      activitysource: "internal",
      trappressure: 0,
      traptime: 0,
      message: "",
      cyclotronflag: 0 // Not currently used
    }),
    new StaticTaskOption("ELUTEISOTOPE", {
      elutepressure: 0,
      elutetime: 0,
      message: "",
      reactor: -1,
      reagentpos: -1
    }),
    new StaticTaskOption("MOVE", {
      message: "",
      position: "access vial",
      reactor: -1
    }),
    new StaticTaskOption("EXTERNALADD", {
      message: "",
      reactor: -1,
      reagentname: ""
    })
  ]];

  var reagentPopupInitialized = false;
  self.visible = ko.computed(function () {
    return self.currentPage() === self.name;
  });
  self.visible.subscribe(function(newValue) {
    if (newValue) {
      getComponents(self.currentSequence().sequenceid).done(function() {
        var operations = self.dragDropManager.taskSequence();
        if( operations.length > 0 ) {
          operations[0].toggleSelected();
        }
      });
      self.currentCassette(0);
      self.activeTemplate("operations-template");
      if( !reagentPopupInitialized ) {
        ko.applyBindings(self.reagentPopup, $("#reagent-popup")[0]);

        reagentPopupInitialized = true;
      }
    }
    else {
      self.previouslySelectedTaskId = -1;
      self.dragDropManager.unselectAll();
      self.dragDropManager.taskSequence([]);
      self.dirty(false);
    }
  });

  self.readOnly = ko.computed(function() {
    var sequence = self.currentSequence();
    if( sequence && sequence.type && sequence.type !== "Logged" ) {
      return false;
    }
    else {
      return true;
    }
  });

  self.sequenceExportIP = ko.computed(function() {
    var sequence = self.currentSequence();
    var sequence_export_ip = "";
    if( sequence ){
      var sequenceid = sequence.sequenceid;
      var elixysip = self.elixysIP(); //currently is ... 'http://192.168.100.101:5000'
      sequence_export_ip = elixysip + "/export_sequence?sequenceid=" + sequenceid;
    }
    return sequence_export_ip;
  });
  
  self.run = function() {
    if (self.dirty()) {
      return;
    }
    var operations = self.dragDropManager.taskSequence();
    for( var i = 0; i < operations.length; i++ ) {
      if( !operations[i].isValid() ) {
        Elixys.showNotificationPopup("Please ensure that there are no validation errors in this sequence's operations.", {
          showCloseButton: true
        });
        return;
      }
    }
    Elixys.viewModels.preRunChecklist.processCassettes(self.cassettes(), operations, operations[0]);
  };
  
  self.runFromSelected = function() {
    if (self.dirty()) {
      return;
    }
    var operations = self.dragDropManager.taskSequence();
    var selected = self.dragDropManager.selectedTask();
    if( selected ) {
      for( var i = 0; i < operations.length; i++ ) {
        if( !operations[i].isValid() ) {
          Elixys.showNotificationPopup("Please ensure that there are no validation errors in this sequence's operations.", {
            showCloseButton: true
          });
          return;
        }
      }
      Elixys.viewModels.preRunChecklist.processCassettes(self.cassettes(), operations, selected);
    }
    else {
      Elixys.showNotificationPopup("There is no operation currently selected.", {
        showCloseButton: true
      });
    }
  };
    
  function grabCassetteData(cassette) {
    return {
      componentid: cassette.componentid,
      componenttype: cassette.componenttype,
      details: Elixys.unmakeObservable(cassette.details),
      note: cassette.note,
      order: cassette.order,
      reagents: Elixys.unmakeObservableArray(cassette.reagents),
      sequenceid: cassette.sequenceid,
      type: cassette.type,
      validationerror: cassette.validationerror
    };
  }

  
  self.save = function() {
    if( !self.dirty() ) {
      return;
    }
    var previouslySelectedTask = self.dragDropManager.selectedTask();
    if (previouslySelectedTask) {
      // Record selected operation to restore after Save
      self.previouslySelectedTaskId = previouslySelectedTask.id;
    }

    var sequence = self.currentSequence();
    var cassettes = self.cassettes();
    var sequenceAndComponents = {
      sequence: sequence,
      components: [
        grabCassetteData(cassettes[0]),
        grabCassetteData(cassettes[1]),
        grabCassetteData(cassettes[2])
      ].concat(
        self.dragDropManager.taskSequence().map(function(task, ix) {
          return {
            componentid: task.id || "none",
            componenttype: task.taskType,
            note: "",
            order: ix + 1,
            sequenceid: sequence.sequenceid,
            type: "component",
            validationerror: "",
            details: Elixys.unmakeObservable(task.data)
          };
        })
      )
    };
    
    Elixys.sequence(function(fail) {
      return [
        function() {
          Elixys.showNotificationPopup("Saving...");
          return Elixys.doApiCall("/save_sequence_and_components", {
            "save_sequence_and_components": sequenceAndComponents
          });
        }, function(payload) {
          var result = payload["save_sequence_and_components"];
          if( result.error ) {
            return fail(result.error);
          }
          else {
            return result;
          }
        }, function(result) {
          return getComponents(sequence.sequenceid);
        }, function() {
          self.dirty(false);
        }
      ];
    }).fail(function(error) {
      if( typeof error === "string" ) {
        console.log("Error saving: " + error);
      }
      else {
        console.log(error);
      }
      Elixys.showNotificationPopup("There was an error while saving.", {
        showCloseButton: true
      });
    }).done(function() {
      Elixys.hideNotificationPopup();
    });
  };
  
  function updateCassettes(cassettes, components) {
    var result = [];
    cassettes.forEach(function(cassette, ix) {
      for( var i = 0; i < components.length; i++ ) {
        if( components[i].componenttype === "CASSETTE" && components[i].details.reactor === ix ) {
          for( var j = 0; j < 12; j++ ) {
            components[i].reagents[j].name = cassette.reagents[j].name();
          }
          result.push(components[i]);
          break;
        }
      }
    });
    return result;
  }
  
  self.saveAs = function() {
    Elixys.showNewSequencePopup({
      titleText: "Copy Sequence",
      buttonText: "Copy",
      create: function(name, description) {
        return Elixys.sequence(function(fail) {
          return [
            function() {
              return Elixys.doApiCall("/copy_sequence_and_components", {
                copy_sequence_and_components: {
                  sequenceid: self.currentSequence().sequenceid,
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
                self.currentSequence(result.sequence);
                self.currentPage("EDIT SEQUENCE");
                return result;
              }
            }, function(result) {
              // Update the copied sequence
              var sequence = result.sequence;
              var cassettes = updateCassettes(self.cassettes(), result.components);
              return Elixys.doApiCall("/save_sequence_and_components", {
                save_sequence_and_components: {
                  sequence: sequence,
                  components: [
                    cassettes[0],
                    cassettes[1],
                    cassettes[2]
                  ].concat(
                    self.dragDropManager.taskSequence().map(function(task, ix) {
                      return {
                        // We need to regenerate the components because between
                        // adding, deleting, and moving we have no idea which of the
                        // original components correspond to the copied versions
                        componentid: "none",
                        componenttype: task.taskType,
                        note: "",
                        order: ix + 1,
                        sequenceid: sequence.sequenceid,
                        type: "component",
                        validationerror: "",
                        details: Elixys.unmakeObservable(task.data)
                      };
                    })
                  )
                }
              });
            }, function(result) {
              console.log("Updated copy");
              console.log(result);
              self.dirty(false);
              return result;
            },
            function(result) {
          self.currentComponents(result['save_sequence_and_components']['components']);
          return self.populateComponents(result['save_sequence_and_components']['components']);
        },
        function(cassettes, components) {
          self.cassettes(cassettes);
          self.dragDropManager.taskSequence(components);
          //populate selected reagents list
          //clear first
          for(var i = 0; i<=35; i++){self.selectedReagents()[i]={"task":undefined, "selected":false};}

          //populate order of operations
          updateOperationOrders();

          //look for components with reagentpos values
          for(var i in self.dragDropManager.taskSequence()){

            if(self.dragDropManager.taskSequence()[i].data.reagentpos!==undefined){

                var pos = parseInt(self.dragDropManager.taskSequence()[i].data.reagentpos());
                if(pos >=0){
                self.selectedReagents()[pos]["task"] = self.dragDropManager.taskSequence()[i];
                self.selectedReagents()[pos]["selected"] = true;
                }


            }
          }


          self.deleteList = [];
          self.dirty(false);
          self.dragDropManager.selectedOptionsDrag.dragActions.arrowsRequired();
          // Keep the same Operation selected, if possible.
          self.dragDropManager.toggleSelectedOptionById(self.previouslySelectedTaskId);
        }
          ];
        })
      }
    });
  };
  
  self.revert = function() {
    if( !self.dirty() ) {
      return;
    }

    Elixys.showNotificationPopup("Are you sure you wish to revert your changes since the last save?", {
      confirmCallback: function() {
        getComponents(self.currentSequence().sequenceid);
      },
      cancelCallback: function() {
        // Dismisses the dialog.
      }
    });
  };



  function Cassette(cassetteData) {
    'use strict';

    var self = this;
    self.componentid = cassetteData.componentid,
    self.order = cassetteData.order,
    self.sequenceid = cassetteData.sequenceid,
    self.type = cassetteData.type || 'component',
    self.validationerror = cassetteData.validationerror || 0,
    self.componenttype = cassetteData.componenttype || 'CASSETTE',
    self.note = cassetteData.note || '',
    self.reagents = Elixys.makeObservableArray(cassetteData.reagents, setDirty);
    self.details = Elixys.makeObservable(cassetteData.details, setDirty);
  }

  function Reagent(reagentData) {
    'use strict';

    var self = this;
    self.reagentid = reagentData.reagentId;
    self.position = reagentData.position;
    self.name = ko.observable(reagentData.name);
    self.description = reagentData.description || '';
  }

  function Arrow(){
    var self = this;
    self.visible = ko.observable(false);
    self.markup;
  };

  function TaskPane(ref){
    var self = this;
    self.scrollWidth = function(){
      var total = (7>ref.taskSequence().length) ? 7*100 : ref.taskSequence().length*100;
      return total + 'px';
    };
    self.scrollHeight = function(){
      return "120px";
    };
    self.rightArrow = new Arrow();
    self.leftArrow = new Arrow();
  };


  self.selectCassetteReagent = function(reagent_num){
    self.currentCassetteReagent(reagent_num);
    self.currentCassetteReagent.valueHasMutated();
  }

  self.reagentPopup = new function() {
    'use strict';
    
    var popup = this;
    
    // inherits Common.
    Common.apply(popup, arguments);
    
    popup.visible = ko.observable(false);
    popup.currentCassette = ko.observable(0);
    popup.currentCassetteReagent = self.currentCassetteReagent;
    popup.selectedReagents = self.selectedReagents;
    popup.cassettes = self.cassettes;
    popup.target = ko.observable();
    popup.current_task = ko.observable();

    popup.close = function() {
      popup.visible(false);
    };
    
    popup.show = function(target,current_task) {
      popup.selectedReagents.valueHasMutated();
      popup.target(target);
      popup.current_task(current_task);

      var reagentpos = popup.current_task().data.reagentpos();

      var cassette_num = Math.max(parseInt(reagentpos / 12), 0);
      var pos = reagentpos - (cassette_num*12);
      self.currentCassetteReagent(pos);
      self.currentCassetteReagent.valueHasMutated();
      popup.currentCassette(cassette_num);
      popup.visible(true);

    };




    popup.select = function(pos) {
      var currentCassette = popup.currentCassette();
      var abs_pos = pos + (currentCassette * 12);
      self.currentCassetteReagent(pos);
      self.currentCassetteReagent.valueHasMutated();

      var text = popup.cassettes()[currentCassette].reagents[pos].name().trimRight();

       //user not allowed to select reagent without name
      if(text.length === 0){
        return ;
      }


      if(self.selectedReagents()[abs_pos]["selected"]){

            if(self.selectedReagents()[abs_pos]["task"]!== popup.current_task()){
            return;
            }
            else{
            self.selectedReagents()[abs_pos]["task"]=undefined;
            self.selectedReagents()[abs_pos]["selected"]=false;
            abs_pos = -1; //clear reagent selection

            }
        }

      else{
        self.selectedReagents()[abs_pos]={"task": popup.current_task(), "selected": true};

      for(var key in self.selectedReagents()){
         if(key!=abs_pos){

           if(self.selectedReagents()[key]["task"] === popup.current_task()){
               self.selectedReagents()[key]["task"] = undefined; //clear previous reagent from current task
               self.selectedReagents()[key]["selected"]=false;
                }

            }
        }
       }

      //ok
      self.selectedReagents.valueHasMutated();
      popup.target()(abs_pos);
      //popup.visible(true);
      self.dirty(true);
    };
  };

  function withReagent(target,current_task) {
    var valid = ko.pureComputed(function() {
      return target() !== -1;
    });
    var cassette = ko.pureComputed(function() {
      return Math.max(parseInt(target() / 12) + 1, 1);
    });
    var reagent = ko.pureComputed(function() {
      return Math.max((target() % 12) + 1, 1);
    });
    return {
      name: ko.pureComputed(function() {
        if( !valid() ) {
          return "REAGENT";
        }
        else {
          return cassettes()[cassette() - 1].reagents[reagent() - 1].name();
        }
      }),
      cassette: cassette,
      reagent: reagent,
      target: target,
      valid: valid,
      showReagentPopup: function() {
        self.reagentPopup.show(target,current_task);
      }
    };
  }

  self.withReagent = withReagent;
  function displayReagent(target) {
    return ko.pureComputed(function() {
      var pos = target();
      if( pos >= 0 && pos <= 35 ) {
        return cassettes()[parseInt(pos / 12)].reagents[pos % 12].name();
      }
      else {
        return "";
      }
    });
  }

  function DragDropManager(selectedReagents){
    var self = this;
    self.restoreLocation = -1;
    //The task currently being dragged
    self.draggedTask = ko.observable(null);
    //The current action to be taken when drag ends
    self.dropAction = ko.observableArray(["restore"]);
    self.dropElement = ko.observableArray([null]);
    self.deleteArea = new DeleteArea(self);
    self.addTaskArea = new AddTaskArea(self);

    self.selectedReagents = selectedReagents;

    self.selectedOptionsDrag = new SelectedOptionsDrag(self);
    self.staticOptionsDrag = new StaticOptionsDrag(self);

    self.taskSequence = ko.observableArray([]);
    self.taskSequence.subscribe(setDirty);
    self.selectedTask = ko.pureComputed(function(){
      var task = Elixys.reduce(self.taskSequence(), null, function(accume, current, index){
        return (current.selected() ? current : accume);
      });
      return task;
    });
    self.taskPane = new TaskPane(self);
    self.unselectAll = function(){
      Elixys.forEach(self.taskSequence(), function(current, index){
        if(current.selected()){
          current.toggleSelectedOption();
        }
      });
    };
    self.toggleSelectedOption = function(task){
      var currently = task != null ? task.selected() : false;
      self.unselectAll();
      if(!currently && task != null){
        task.toggleSelectedOption();
      }
    };
    self.toggleSelectedOptionById = function(id){
      var task = Elixys.reduce(self.taskSequence(), null, function(accume, current, index){
        return (current.id == id ? current : accume);
      });
      self.toggleSelectedOption(task);
    };
    self.selectedTaskExists = function(){
      return (self.selectedTask()!=null);
    };
    self.deleteTask = function(){
      var task = self.selectedTask();

      //remove task for selected reagents dictionary
      if(task!=null){

        if(task.data.reagentpos!==undefined){

                var pos = parseInt(task.data.reagentpos());
                if(pos >=0){
                self.selectedReagents()[pos]["task"] = undefined;
                self.selectedReagents()[pos]["selected"] = false;
                }
        }
        self.selectedOptionsDrag.dragActions.taskActions.DeleteTask(task);

      }
    };
  }


  function Task(name, id, origin, idClass, classModifiers, templateName, taskType, data, pressureSelector, validatorsFn) {
    'use strict';

    var self = this;
    self.dataWithValidators = {};
    self.name = name;
    self.id = id;
    self.origin = origin;
    self.idClass = idClass;
    self.classModifiers = classModifiers;
    self.templateName = templateName;
    self.taskType = taskType;
    self.data = data;

    if( self.name == 'TRANSFER' ){
      self.availableModes = function(){
        var allModes = [];
        if( self.data.destination() !== "hplc" ){
          allModes.push( {'label': 'Trap', 'value': 'trap', 'id': 'transfer-mode-trap'} );
        }
        allModes.push( {'label':'Elute', 'value': 'elute', 'id': 'transfer-mode-elute'} );

        if( self.data.destination() === "hplc" || self.data.destination() === "collection vial"){
          allModes.push( {'label': 'Out', 'value': 'out', 'id': 'transfer-mode-out'} );
        }

        return allModes;
     }
     self.isStirable = ko.pureComputed(function(){
       return self.data.destination() !== "hplc";
     });
     if( typeof self.data.destination === "function"){ // When the StaticTask is generated; data.destination is
       self.data.destination.subscribe(function(newVal){
        if( newVal == 'hplc'){
          self.data.stir(0);
        }
       });
       if( validatorsFn ){
          if( typeof self.data.hplc.starttransferimmediatly == "undefined" ){
            self.data.hplc.starttransferimmediatly = ko.observable(false);
            self.data.hplc.starttransferimmediatly.subscribe(setDirty);
          }
          self.data.hplc.mode.subscribe(function(newVal){
            self.data.hplc.starttransferimmediatly(newVal == "automatic");
          });
       }
     }
    }
    else if( self.name == "PROMPT" ){

      if( validatorsFn ){
        if( typeof self.data.waitduration == "undefined" ){
          self.data.waitduration = ko.observable(0);
          self.data.waitduration.subscribe( setDirty );// This should be happening in the controller, not the model
        }
      }

      self.waitForUserToContinue = ko.observable( typeof self.data.waitduration == "function" && self.data.waitduration() == 0 );
      self.waitForUserToContinue.subscribe(function(val){
        if( val ){
          self.data.waitduration(0);
        }
        else{
          self.data.waitduration(1);
        }
      });
    }
    else if( self.name == "EVAPORATE" ){

      if( typeof self.data.evaporationduration == "function"){
        self.data.evaporationduration.subscribe(function(val){
          self.data.durationofstir(val-self.data.stirdelay());
        });
      }
    }
    else if( self.name == "REACT" ){
      if( typeof self.data.reactionduration == "function"){
        self.data.reactionduration.subscribe(function(val){
          self.data.durationofstir(val-self.data.stirdelay());
        });
      }
    }

    if( typeof pressureSelector === "function" ) {
      self.pressure = pressureSelector(data);
    }
    else {
      self.pressure = ko.pureComputed(function() { return 0; });
    }
    self.pressureSelector = pressureSelector;

    self.selected = ko.observable(false);
    self.deleteable = ko.observable(false);
    self.cloneable = ko.observable(false);
    self.scrolling = ko.observable(false);
    self.hidden = ko.observable(false);
    self.finished = ko.observable(false);

    self.toggleSelected = function(){
      self.selected(!self.selected());
    };
    self.toggleDeleteable = function(){
      self.deleteable(!self.deleteable());
    };
    self.toggleDeletable = function(){
      self.deleteable(!self.deleteable());
    };
    self.toggleCloneable = function(){
      self.cloneable(!self.cloneable());
    };
    self.toggleScrolling = function(){
      self.scrolling(!self.scrolling());
    };
    self.toggleHidden = function(){
      self.hidden(!self.hidden());
    };
    self.toggleFinished = function() {
      self.finished(!self.finished());
    }

    self.className = ko.computed(function(){
      var modifiers = "";
      if( self.finished() ) {
        modifiers = " finished";
      }
      else if( self.selected() ) {
        modifiers = " selected";
      }
      return "task "+ self.classModifiers + modifiers;
    });

    self.imageClass = ko.computed(function(){
      var idClass;
      if( self.finished() ) {
        idClass = self.idClass + "-finished";
      }
      else if( self.selected() ) {
        idClass = self.idClass + "-selected";
      }
      else if( self.origin === "selectedTasks" ) {
        idClass = self.idClass + "-dropped";
      }
      else {
        idClass = self.idClass;
      }
      return idClass + " image-container";
    });

    self.toggleSelectedOption = function(){
      self.toggleSelected();
      self.deleteable(self.selected());
      self.mouseDown();
    };

    self.mouseDown = function(){
      self.isDraggable = false;
      if( self.selected() ){
        setTimeout( function(){
          self.isDraggable = self.selected();
        }, 150);
      }
    }

    self.mouseUp = function(){
      self.isDraggable = false;
    }

    self.visibility = function(){
      var result = (self.hidden() ? "hidden" : "visible");
      return result;
    };

    self.task = function(){
      return self;
    };

    self.order = ko.observable(0); //todo-josh: make dynamic
    self.reagent = "";
    if( data ) {

      if( typeof data.reagentname === "function" ) {
        self.reagent = data.reagentname;
      }
      else if( data.hplc && typeof data.hplc.reagent === "function" ) {
        self.reagent = displayReagent(data.hplc.reagent);
      }
      else if( typeof data.reagentpos === "function" ) {
        self.reagent = displayReagent(data.reagentpos);

        //add task and reagentpos to global dict
      }
    }



    if( validatorsFn ) {
      var validators = validatorsFn(data);
      self.isValid = ko.pureComputed(function() {
        for( var key in validators ) {
          if( !validators[key]() ) {
            return false;
          }
        }
        return true;
      });

      for( var key in data ) {
        self.dataWithValidators[key] = data[key];
      }
      for( var key in validators ) {
        self.dataWithValidators[key] = validators[key];
      }
    }
    else {
      self.isValid = ko.pureComputed(function() { return true; });
      self.dataWithValidators = self.data;
    }

    // For tasks with reagent components
    self.withReagent = withReagent;

  }

  var TaskOrigins = {
    options: "options",
    selectedTasks: "selectedTasks",
    placeHolderTask: "placeholder"
  };

  // This is called for the default Task types.
  function StaticTaskOption(taskType, data){
    var fields = componentTypeMap[taskType];
    if( fields !== undefined ) {
      var task = new Task(fields.name, 0, "options", fields.className, "box drag", fields.templateName, taskType, data, fields.pressure);
      task.toggleCloneable();
      return task;
    }
  };

  // This is called when an Item is Dragged onto the timeline.
  function SelectedTaskOption(task){
    var fields = componentTypeMap[task.taskType];
    if( fields !== undefined ) {
      return new Task(task.name,
        task.id,
        "selectedTasks",
        task.idClass,
        "box dropped",
        task.templateName,
        task.taskType,
        Elixys.makeObservable(task.data, setDirty),
        task.pressureSelector,
        fields.validators);
    }
  };

  function PlaceHolderTask(){
    var task = new Task("", 0, "placeholder", "", "box dropped placeholder");
    task.toggleHidden();
    return task;
  };

  /*
    DeleteArea and AddTaskArea are used by the ko.bindingHandlers.droppable custom binding
    their function is to update what action needs to be executed when drag ends.
  */
  function DropAreaActions(ref, action){
      var self = this;
      self.droppedIn = false;
      self.action = action;
      self.initialize = function(element){
          ref.dropAction.remove(self.action);
          ref.dropElement.remove(element);
          self.droppedIn = false;
      };
      self.start = function(element){
          ref.dropAction.push(self.action);
          ref.dropElement.push(element);
      };
      self.end = function(element){
          if(!self.droppedIn) {
            ref.dropAction.remove(self.action);
            ref.dropElement.remove(element);
          }
      };
      self.drop = function(element){
          self.droppedIn = true;
      };
  };
  function DeleteArea(ref){
      var self = this;
      self.dropAreaActions = new DropAreaActions(ref, "delete");
      self.className = ko.observable("");
      self.initialize = function(element){
          self.dropAreaActions.initialize(element);
      };
      self.start = function(element){
          if(ref.draggedTask().deleteable()){
              self.className("hilight");
          }
          self.dropAreaActions.start(element);
      };
      self.end = function(element){
          self.className("");
          self.dropAreaActions.end(element);
      };
      self.drop = function(element){
          self.dropAreaActions.drop(element);
      };
  };
  function AddTaskArea(ref){
      var self = this;
      self.dropAreaActions = new DropAreaActions(ref, "add");
      self.initialize = function(element){
          self.dropAreaActions.initialize(element);
      };
      self.start = function(element){
          self.dropAreaActions.start(element);
      };
      self.end = function(element){
          var draggedTask = ref.draggedTask();
          self.dropAreaActions.end(element);
      };
      self.drop = function(element){
          self.dropAreaActions.drop(element);
      };
  };
  function ListOperations(){
      var self = this;
      self.InjectIntoList = function(content, val, injectPoint){
          var updated = [];
          if(injectPoint>=content.length){
              content.push(val);
              updated = content;
          }else{
              updated = Elixys.reduce(content, [], function(accume, current, index){
                  if(index==injectPoint) accume.push(val);
                  accume.push(current);
                  return accume;
              });
          }
          return updated;
      };
      self.OverWriteValue = function(lst, value, insertPoint){
          lst[insertPoint] = value;
          return lst;
      };
      self.FindIndex = function(lst, evaluator){
          var index = Elixys.reduce(lst, -1, function(accume, current, index){
              return (evaluator(current) ? index : accume);
          });
          return index;
      };
  };
  function TaskActions(ref){
      var self = this;
      self.listOperations = new ListOperations();
      self.GetNewSelectedTaskOption = function(task){
          var newtask = new SelectedTaskOption(task);
          if(task.origin === "selectedTasks") {
              newtask.toggleSelectedOption();
          }
          return newtask;
      };
      self.FindPlaceHolder = function(){
          var lst = ref.taskSequence();
          return self.listOperations.FindIndex(lst, function(n){return (n.origin === "placeholder");});
      };
      self.RemoveTask = function(task){
          ref.taskSequence.remove(task);
      };
      self.RemovePlaceHolder = function(){
          var i = self.FindPlaceHolder();
          var contents = ref.taskSequence();
          if(i!=-1){
              self.RemoveTask(contents[i]);
          }
      };
      self.DeleteTask = function(task){
      //remove task from selected reagents
        if(task.data.reagentpos!==undefined){

                var pos = parseInt(task.data.reagentpos());
                if(pos >=0){
                ref.selectedReagents()[pos]["task"] = undefined;
                ref.selectedReagents()[pos]["selected"] = false;
                }
            }

          deleteComponent(task);
          self.RemoveTask(task);
          self.RemovePlaceHolder();

          //removed operation so update orders
          updateOperationOrders();
      };
      self.RestoreTask = function(task){
          self.MoveTaskTo(task, ref.restoreLocation);
          //restored operation so update orders
          updateOperationOrders();
      };
      self.AddTask = function(task){
          var contents = ref.taskSequence();
          var i = self.FindPlaceHolder();
          var newtask = self.GetNewSelectedTaskOption(task);
          ref.unselectAll();
          newtask.toggleSelected();
          if( i === -1 ) {
            ref.taskSequence.push(newtask);
          }
          else {
            ref.taskSequence(self.listOperations.OverWriteValue(contents, newtask, i));
          }
            //added new operation so update orders
          updateOperationOrders();
      };
      self.InjectTask = function(task, index){
          ref.taskSequence(self.listOperations.InjectIntoList(ref.taskSequence(), task, index));
      };
      self.MoveTaskTo = function(task, index) {
        var oldIndex = ref.taskSequence.indexOf(task);
        var newIndex = index;
        if(oldIndex !== -1 && newIndex !== oldIndex && newIndex != -1) {
          var array = ref.taskSequence();
          array.splice(oldIndex, 1);
          array.splice(newIndex, 0, task);
          ref.taskSequence(array);
        }
        //moved operation so update orders
          updateOperationOrders();
      }
  };
  function DragActions(ref){
      var self = this;
      self.taskActions = new TaskActions(ref);
      self.scrollIntervalFunction;

      self.DragEnd = function(dd){
          $( dd.proxy ).remove();
          self.stopScrolling();
          var l = ref.dropAction().length;
          var action = ref.dropAction()[l-1];
          var task = ref.draggedTask();
          if( task !== null ) {
            if( task.origin === "selectedTasks" ) {
              if( action === "delete" ) {
                self.taskActions.DeleteTask(task);
              }
              else if( action === "restore") {
                self.taskActions.RestoreTask(task);
              }
            }
            else if( action === "add" ) {
              self.taskActions.AddTask(task, self.taskActions.FindPlaceHolder());
            }
          }
          ref.draggedTask(null);
      };
      self.ReplaceWithPlaceHolder = function(task){
          var content = Elixys.map(ref.taskSequence(), function(current, index){
              return ((current==task) ? new PlaceHolderTask() : current);
          });
          ref.restoreLocation = self.taskActions.FindPlaceHolder();
          ref.taskSequence(content);
      };
      self.slideTimeline = function( xDirection ){
        var dropContainer = document.getElementById("timelineContainer");
        if( !self.scrollIntervalFunction ){
          self.scrollIntervalFunction = setInterval(function(){
            dropContainer.scrollLeft += xDirection;
          }, 100);
        }
      };
      self.stopScrolling = function(){
        clearInterval(self.scrollIntervalFunction);
        self.scrollIntervalFunction = null;
      };
      self.slideTimelineIfNecessary = function(dd){
        var xCoord = dd.startX + dd.deltaX;
        var rightArrow = ref.taskPane.rightArrow;
        var leftArrow = ref.taskPane.leftArrow;
        var rightArrowX = rightArrow.markup.getBoundingClientRect().left;
        if( xCoord > rightArrowX && rightArrowX > 0){
          self.slideTimeline( 20 );// Slide Left
        }
        else if( xCoord < leftArrow.markup.getBoundingClientRect().right && leftArrow.visible ){
          self.slideTimeline( -20 );// Slide Right
        }
        else{
          self.stopScrolling();
        }
      }
      self.GetScrollElement = function(){
          var dropElements = ref.dropElement();
          return $(dropElements[dropElements.length-1]);
      };
      self.FindInjectionPoint = function(element, dd){
          var w = $(element).outerWidth();
          var scrollElement = $("div.drop-container");
          /*
            relativePosition is how far horizontally the current drag element is from the left edge of the scroll area
          */
          var relativePosition = dd.offsetX - scrollElement.offset().left + scrollElement.scrollLeft();
          /*
            position is the insertion point for the new element, the insertion point is calculated as follows:

            the insertion point is the number of whole widths the current drag element is from the left edge of the scroll area
            plus one if the remainder of the division is greater than one half the element width
          */
          return parseInt(relativePosition/w)+(((relativePosition%w)>(w/2)) ? 1:0);
      };
      self.AddPlaceHolder = function(element, dd){
          var position = self.FindInjectionPoint(element, dd);
          var list = ref.taskSequence;
          var l = list().length;
          var emptyTask = Elixys.reduce(list(), null, function(accume, current, index){
              return ((current.origin==TaskOrigins.placeHolderTask) ? current : accume);
          });
          if(emptyTask==null){
              emptyTask = new PlaceHolderTask();
          }else{
              //remove the emptyTask already in the list and update the content array and length
              list.remove(emptyTask);
          }
          self.taskActions.InjectTask(emptyTask, position);
      };
      self.arrowsRequired = function(){
          //var scrollElement = self.GetScrollElement();
          var scrollElement = $(".drop-container");
          var left = false;
          var right = false;
          if(scrollElement!=null) {
              var l = scrollElement.outerWidth();
              var innerL = scrollElement.children().outerWidth();
              var offset = scrollElement.scrollLeft();
              right = innerL>l+offset;
              left = scrollElement.scrollLeft()>0;
          };
          ref.taskPane.leftArrow.visible(left);
          ref.taskPane.rightArrow.visible(right);
      };
      self.UpdatePlaceHolder = function(element, dd){
          var da = ref.dropAction();
          var action = da[da.length-1];
          if(action=="add"){
              self.AddPlaceHolder(element, dd);
          }else if(action=="restore"){
              self.taskActions.RemovePlaceHolder();
          }
          self.arrowsRequired();
      };
  };
  function StaticOptionsDrag(ref){
      var self = this;
      self.dragActions = new DragActions(ref);
      self.updateDraggedTask = function(task){
          ref.draggedTask(task);
      };
      self.start = function(element, task){
          self.updateDraggedTask(task);
          return $(element)
              .clone()
              .css({
                  position: "absolute"
              })
              .addClass("dragging")
              .appendTo("body");
      };
      self.drag = function(element, task, dd){
          $( dd.proxy ).css({
              top: dd.offsetY,
              left: dd.offsetX
          });
          self.dragActions.UpdatePlaceHolder(element, dd);
          self.dragActions.slideTimelineIfNecessary( dd );
      };
      self.end = function(element, task, dd){
          self.dragActions.DragEnd(dd);
          self.dragActions.arrowsRequired();
      };

  };
  function SelectedOptionsDrag(ref){
      var self = this;
      self.dragActions = new DragActions(ref);
      self.initialScroll = 0;
      self.initialOffset = 0;
      self.scrollElement = null;
      self.updateDraggedTask = function(task){
          ref.draggedTask(task);
      };

      self.start = function(element, task, dd){
          var result = false;
          self.updateDraggedTask(task);
          //grab a reference to the container and current scroll offset value real fast
          self.scrollElement = $(element).parent().parent();
          self.initialScroll = self.scrollElement.scrollLeft();
          if(task == ref.selectedTask() && task.isDraggable ){
              result = $(element)
                  .clone()
                  .css({
                      position: "absolute"
                  })
                  .addClass("dragging")
                  .appendTo("body");
              task.hidden(true);
          }else{
              //if not draggable should be scrolling
              task.toggleScrolling();
              //make sure the task being used to manipulate scrolling is not deleteable
              if(task.deleteable()) task.toggleDeleteable();
              self.initialOffset = dd.offsetX;
              result = $(element);
          }
          return result;
      };
      self.drag = function(element, task, dd){

          if(task.scrolling()){
              self.scrollElement.scrollLeft(self.initialScroll+self.initialOffset-dd.offsetX);
              self.dragActions.arrowsRequired();
          }else{
              // Update position in list

              var position = self.dragActions.FindInjectionPoint(dd.proxy, dd);
              self.dragActions.slideTimelineIfNecessary( dd );
              self.dragActions.taskActions.MoveTaskTo(task, position);
              $( dd.proxy ).css({
                  top: dd.offsetY,
                  left: dd.offsetX
              });
          }
      };
      self.end = function(element, task, dd){
          task.isDraggable = false;
          if(task.scrolling()) {
            task.toggleScrolling();
          }
          else {
            self.dragActions.DragEnd(dd);
            task.hidden(false);
          }
          self.dragActions.arrowsRequired();

          if( !task.selected() ){
            var tasks = ref.taskSequence();
            for( var i = 0; i < tasks.length; i++){ // ensure all other tasks have been deselected.
              var loopingTask = tasks[i];
              loopingTask.selected( task === loopingTask );
            }
          }
      };
  };
  self.currentPage.subscribe(function(newVal){
    self.recentlyAttached(false);
  });
  self.recentlyAttached = ko.observable(false);
  self.hasInstructions = ko.pureComputed(function(){
    return self.currentSequence() && ( self.currentSequence().hasinstructions || self.recentlyAttached() );
  });



  self.getInstructions = function(){
    var sequenceid = self.currentSequence().sequenceid;
    Elixys.viewModels.elixysManual.view( "/instructions?sequenceid=" + sequenceid );
  }

  self.postRender = function() {
    //ToDo: make the drag drop manager allow user drag only after pressing for 1 sec or more
    var touch_element = window.document.getElementById("drag-drop-menu");
    self.dragDropManager.taskPane.rightArrow.markup =  document.getElementById( 'rightArrowPointer' );
    self.dragDropManager.taskPane.leftArrow.markup = document.getElementById( 'leftArrowPointer' );

    touch_element.oncontextmenu = function(event){
        event.preventDefault();
        event.stopPropagation();
        return false;
    };
  }


  self.openAttachmentDialog = function(){
    Elixys.showImportSequencePopup({
      titleText: "Attach Instructions",
      importFile: function(importCtrl){
        var attachment = importCtrl.file();
        if( attachment ){
          var reader = new FileReader();
          reader.onload = (function(fileName) {
              return function(evt){
                var sequenceid = self.currentSequence().sequenceid;
                var binaryData = evt.target.result;
                Elixys.doApiCall("/add_attachment", {"add_attachment":{"sequenceid":sequenceid, "attachment": btoa(binaryData), "filename": fileName}}, function(success){

                  self.currentSequence().hasinstructions = true;
                  self.recentlyAttached(true);
                  importCtrl.notBusy(true);
                  importCtrl.buttonText("Import");
                  importCtrl.close();
                },
                function(err){
                  console.log( err );
                  importCtrl.notBusy(true);
                  importCtrl.buttonText("Import");
                  Elixys.showNotificationPopup("There was an error importing the attachment.", {
                    showCloseButton: true
                  });
                });
            }
          })(attachment.name);
        }
        reader.readAsBinaryString(attachment);
      },
      validateImport: function(importCtrl){
        if( importCtrl && importCtrl.file() && importCtrl.file().name ){
          importCtrl.name( importCtrl.file().name );
          importCtrl.notBusy(true);
          importCtrl.import_file_valid(true);
          importCtrl.import_file_valid.valueHasMutated();
        }
      }
    });
  }
}
