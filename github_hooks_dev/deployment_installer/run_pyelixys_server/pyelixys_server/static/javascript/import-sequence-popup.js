function ImportSequencePopup() {
  'use strict';
  
  var self = this;
  
  // inherits Common.
  Common.apply(self, arguments);
  
  self.visible = ko.observable(false);
  self.name = ko.observable("");
  self.description = ko.observable("");
  self.currentImportName = ko.observable("");
  self.import_file_valid = ko.observable(false);
  self.sequence_data = undefined;
  self.notBusy = ko.observable(true);
  self.titleText = ko.observable("");
  self.buttonText = ko.observable("");
  self.validateImport = ko.observable();
  self.importFile = ko.observable();
  
  self.enabled = ko.computed(function() {
    return self.notBusy() && self.name() !== "" && self.import_file_valid();
  });

  function defaultHandler() {};

  self.closeCallback = defaultHandler;

  self.file = function(){
    var file_input = window.document.getElementById("import-sequence-input");
    var seq_file = file_input.files[0];
    return seq_file;
  }
  
  self.create = function() {
    self.notBusy(false);
    self.buttonText("Importing...");
    self.importFile()(self);
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
      self.clear();
    };
  }
  
  self.popup = function(options) {
    self.loadDefaults();

    if( typeof options.close === "function" ) {
      self.closeCallback = options.close;
    }

    if( options.titleText ) {
      self.titleText(options.titleText);
    }

    if( options.buttonText ) {
      self.buttonText(options.buttonText);
    }

    if( options.importFile && typeof options.importFile === "function"){
      self.importFile(options.importFile);
    }

    if( options.validateImport && typeof options.validateImport == "function"){
      self.validateImport( options.validateImport );
    }

    self.visible(true);
  };

  self.loadDefaults = function(){
    self.closeCallback = defaultHandler;
    self.titleText("Import Sequence");
    self.buttonText("Import");

    self.importFile(function(){
      console.log("The importFile function must be defined by the developer");
    });
    self.validateImport(function(){
    console.log("The validateImport function must be defined by the developer");
    console.log( "Within the function you must set the \"currentImportName\", \"name\", " +
                 "and may validate/invalidate \"import_file_valid\"");

    });

    self.name("");
    self.description("");
    self.notBusy(true);
  }

  self.clear = function(){
    self.name("");
    self.description("");
    var file_input = window.document.getElementById("import-sequence-input");
    file_input.type = "text";
    file_input.type = "file";
    self.notBusy(true);
  }
}
