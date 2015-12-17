function TwoButtonPopup(){
  'use strict';

  var self = this;
  self.visible = ko.observable(false);
  self.titleText = ko.observable("");
  self.btnBText = ko.observable("");
  self.btnAText = ko.observable("");

  // inherits Common.
  Common.apply(self, arguments);

  self.popup = function(options) {
    self.loadDefaults();
    if(options.titleText){
      self.titleText(options.titleText);
    }
    if(options.btnAText){
      self.btnAText(options.btnAText);
    }
    if(options.btnBText){
      self.btnBText(options.btnBText);
    }
    if(options.btnAClick){
      self.btnAOperation = options.btnAClick;
    }
    if(options.btnBClick){
      self.btnBOperation = options.btnBClick;
    }
    self.sequence_id = options.sequence_id;
    self.visible(true);
  }

  self.close = function(){
    self.visible(false);
  }

  self.loadDefaults = function(){
    self.titleText("Export Sequence");
    self.btnAText("ELIXYS NETWORK");
    self.btnBText("COMPUTER");
    self.btnAOperation = self.exportToNetwork;
    self.btnBOperation = self.exportToComputer;
  }

  self.exportToNetwork = function(){
    $.ajax("/network/user", {
      method: "GET",
      success: function(res){
        if( res == "" ){
          Elixys.showNetworkLoginPopup({
            "signinSuccess": self.doExport
          });
        }
        else{
          self.doExport();
        }
        self.close();
      }
    });
  }
  
  self.doExport = function(popup){
    Elixys.doApiCall("/network/sequence/export", {"sequenceid": self.sequence_id}, function(res){
      console.log(res);
    },
    function(err){
      console.log( err );
    });
  }

  self.exportToComputer = function(popup){
    var link = document.createElement("a");
    link.href = "/export_sequence?sequenceid=" + self.sequence_id;
    link.click();
    self.close();
  }

  self.btnAClick = function(){
    self.btnAOperation(self);
  }

  self.btnBClick = function(){
    self.btnBOperation(self);
  }

}