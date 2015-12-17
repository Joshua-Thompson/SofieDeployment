/**
 * Sequences view model.
 */
function Sequences() {
  'use strict';

  var self = this,
      getSequences = function () {
        return Elixys.doApiCall('/get_sequences', {
          'get_sequences': {
            'userid': 0
          }
        }, function (result) {
          var sequences = result["get_sequences"];
          sequences.sort(function(a, b) {
            var aName = a.details.name.toLowerCase();
            var bName = b.details.name.toLowerCase();
            if( aName > bName ) {
              return 1;
            }
            else if( aName < bName ) {
              return -1;
            }
            else {
              return 0;
            }
          });
          self.sequences(sequences);
        }, function () {
          console.log('error');
          Elixys.triggerConnectionErrorPopup(getSequences);
        });
      };
  var getComponents = function(sequenceId) {
    return Elixys.sequence(function(fail) {
      return [
        function() {
          Elixys.showNotificationPopup("Loading...");
          return Elixys.doApiCall("/get_components", {
            get_components: {
              sequenceid: sequenceId
            }
          });
        },
        function(payload) {
          if( payload.error ) {
            return fail(payload.error);
          }
          else {
            return payload.get_components;
          }
        },
        function(result) {
          self.currentComponents(result);
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
        Elixys.showNotificationPopup("Error loading sequence operations.", {
          showCloseButton: true
        });
      }
    });
  };
  var getSequenceAndComponents = function(sequenceId) {
    return Elixys.doApiCall('/get_sequence_and_components', {
      'get_sequence_and_components': {
        'sequenceid': sequenceId
      }
    }, function(result) {
      var result2 = result['get_sequence_and_components'];
      self.currentSequence(result2['sequence']);
      self.currentComponents(result2['components']);
    }, function() {
      console.log('error');
    });
  };
  // For debugging purposes only
  var getComponentStructure = function(componentType) {
    return Elixys.doApiCall('/get_structure', {
      'get_structure': {
        'type': 'component',
        'componenttype': componentType
      }
    }, function(result) {
      console.log(result['get_structure']);
    }, function() {
      console.log('error');
    });
  };

  // inherits Common.
  Common.apply(self, arguments);

  self.export_sequence = function(sequence){
    var link = document.createElement("a");
    link.href = "/export_sequence?sequenceid=" + sequence.sequenceid;
    link.click();
  }

  self.name = 'SEQUENCES';
  self.sequences = ko.observableArray();
  self.sequenceListScroller = new SequenceListScroller();

  // Filters
  self.sequencesFiltered = ko.computed(function() {
    var filterStr = self.filterName();
    var filterDateStart = Date.parse(self.filterDateStart());
    var filterDateEnd = Date.parse(self.filterDateEnd());
    if ((filterStr != null && filterStr.length > 0) ||
        (!isNaN(filterDateStart) || !isNaN(filterDateEnd))) {
      filterStr = filterStr.toLowerCase();
      return ko.utils.arrayFilter(self.sequences(), function(seq) {
        return ((seq.details.name != null && seq.details.name.toLowerCase().indexOf(filterStr) != -1)
                || (seq.details.comment != null && seq.details.comment.toLowerCase().indexOf(filterStr) != -1))
          && (isNaN(filterDateStart) || (!isNaN(Date.parse(seq.date)) && filterDateStart <= Date.parse(seq.date)))
          && (isNaN(filterDateEnd) || (!isNaN(Date.parse(seq.date)) && filterDateEnd >= Date.parse(seq.date)));
      });
    }
    return self.sequences();
  });

  self.visible = ko.computed(function () {
    return self.currentPage() === self.name;
  });
  self.visible.subscribe(function () {
    if (self.visible()) {
      Elixys.showNotificationPopup('Loading...');
      getSequences().complete(function () {
        Elixys.hideNotificationPopup();
      });
    }
  });

  self.newSequence = function () {
    Elixys.showNewSequencePopup({
      create: function(name, description) {
        return Elixys.sequence(function(fail) {
          return [
            function() {
              return Elixys.doApiCall("/add_sequence_and_cassettes", {
                add_sequence_and_cassettes: {
                  userid: 1,
                  details: {
                    name: name,
                    comment: description,
                    valid: 0
                  }
                }
              })
            },
            function(payload) {
              var result = payload["add_sequence_and_cassettes"];
              if( result.error ) {
                fail(result.error);
              }
              else {
                self.currentSequence(result.sequence);
                self.currentPage("EDIT SEQUENCE");
              }
            }
          ];
        });
      }
    });
  };

  self.importSequence = function () {
    Elixys.showImportSequencePopup({
      validateImport: function(importCtrl){
        var file_object = importCtrl.file();
        if(file_object !== undefined){
            var seq_import_pattern = /[.](sequence|zip)/g; //regex
            var sequence_index = file_object.name.search(seq_import_pattern);

            if(sequence_index>1){
                var seq_name = file_object.name.substring(0, sequence_index);
                importCtrl.currentImportName(seq_name);
                importCtrl.name(importCtrl.currentImportName());
                importCtrl.import_file_valid(true);
                importCtrl.import_file_valid.valueHasMutated();
            }
            else{
               importCtrl.currentImportName("Invalid file type");
               importCtrl.currentImportName.valueHasMutated();
               importCtrl.import_file_valid(false);
            }
        }
        else{
           importCtrl.import_file_valid(false);
        }
      },
      importFile: function(importCtrl){
        var seq_file = importCtrl.file();
        importCtrl.import_name = seq_file.name;
        var file_reader = new FileReader();
        file_reader.onload = function(e) {
          var result = e.target.result;
          var fileType = seq_file.name.search(/[.](zip)/g) > 0 ? "zip" : "sequence";
            Elixys.doApiCall("/import_sequence", { import_sequence: {"sequence_data": btoa(e.target.result), "import_name": importCtrl.name(), "file_type": fileType} },
              function(res){
                var result = res["import_sequence"];
                if( result.error ) {
                  var error = result.error;
                  if( typeof error === "string" ) {
                    importCtrl.buttonText("Import");
                    Elixys.showNotificationPopup("Error: " + error, {
                      showCloseButton: true
                    });
                  }
                  else {
                    importCtrl.buttonText("Import");
                    Elixys.showNotificationPopup("There was an error importing the sequence.", {
                      showCloseButton: true
                    });
                  }
                  importCtrl.notBusy(true);
                }
                else {
                  importCtrl.notBusy(true);
                  importCtrl.buttonText("Import");
                  importCtrl.close();
                  self.currentSequence(result.sequence);
                  self.currentPage("EDIT SEQUENCE");
                }
              },
              function(err){
                importCtrl.notBusy(true);
                importCtrl.buttonText("Import");
                Elixys.showNotificationPopup("There was an error importing the sequence.", {
                  showCloseButton: true
                });
              }
            );
        };
        file_reader.readAsBinaryString(seq_file);
      }
    });
  };

  self.editSequence = function (sequence) {
    self.currentSequence(sequence);
    self.currentPage('EDIT SEQUENCE');
    getComponents(sequence['sequenceid']);
  };

  self.copySequence = function (sequence) {
    Elixys.showNewSequencePopup({
      titleText: "Copy Sequence",
      buttonText: "Copy",
      create: function(name, description) {
        return Elixys.sequence(function(fail) {
          return [
            function() {
              return Elixys.doApiCall("/copy_sequence_and_components", {
                copy_sequence_and_components: {
                  sequenceid: sequence.sequenceid,
                  name: name,
                  comment: description
                }
              });
            },
            function(payload) {
              var result = payload["copy_sequence_and_components"];
              if( result.error ) {
                fail(result.error);
              }
              else {
                self.currentSequence(result.sequence);
                self.currentPage("EDIT SEQUENCE");
              }
            }
          ];
        });
      }
    });
  };

  self.deleteSequence = function (sequence) {
    Elixys.showNotificationPopup("Are you sure you wish to delete sequence \"" + sequence.details.name + "\"?", {
      confirmCallback: function() {
        window.setTimeout(function() {
          Elixys.showNotificationPopup("Deleting...");
          return Elixys.doApiCall("/delete_sequence", {
            delete_sequence: {
              sequenceid: sequence.sequenceid
            }
          }, function(result) {
            // Refresh sequence list
            Elixys.showNotificationPopup('Loading...');
            return getSequences().complete(function () {
              Elixys.hideNotificationPopup();
              if( self.currentSequence() && self.currentSequence().sequenceid == sequence.sequenceid ){
                self.currentSequence(null);
              }
            });
          });
        }, 0);
      },
      cancelCallback: function() {
        // Just dismisses the dialog.
      }
    });
  };
  
  self.trimDate = function(target) {
    return target.substring(0, 6) + target.substring(8);
  };

  self.postRender = function() {
    $("#input-date-start").clearSearch();
    $("#input-date-end").clearSearch();
    $("#sequence-search-button").clearSearch();
  }

}

function Reagent(position, description, name) {
  'use strict';

  var self = this;
  self.position = position;
  self.description = description;
  self.name = name;
}

function SequenceListScroller(){
    var self = this;
    self.scrollElement = null;
    self.initialScroll = 0;
    self.initialOffset = 0;
    self.start = function(element, task, dd){
        var result = false;
        self.scrollElement = $(element).parent().parent();
        self.initialScroll = self.scrollElement.scrollTop();
        self.initialOffset = dd.offsetY;
        return $(element);
    };
    self.drag = function(element, task, dd){
        self.scrollElement.scrollTop(self.initialScroll+self.initialOffset-dd.offsetY);
    };
    self.end = function(element, task, dd){
    };
}
