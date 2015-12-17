function ElixysManual() {
  'use strict';

  var self = this;
  self.name = 'ELIXYS MANUAL';
  self.__default_manual = "/elixys_manual#zoom=100";
  self.src = ko.observable("");
  Common.apply(self, arguments);

  self.visible = ko.pureComputed(function(){
    return self.currentPage() == self.name;
  });

  self.isSidebarVisible.subscribe(function(open){
    self.width( self.getWidth(open) );
  });

  self.returnToSequence = function(){
    if( self.canReturnToSequence() ){
      self.currentPage("EDIT SEQUENCE");
    }
  }

  self.canReturnToSequence = function(){
    return self.currentSequence() != null && self.currentSequence().sequenceid != undefined;
  }

  self.getWidth = function(open){
    if( open ){
      return "95%;";
    }
    else{
      return "102%;";
    }
  }

  self.width = ko.observable( self.getWidth(false) );

  self.view = function( src ){
    self.currentPage(self.name);

    var docContainer = document.getElementById("manual-pdf");
    if( src ){
      docContainer.src = "/static/please-wait.html";
      setTimeout(function(){
        docContainer.src = src;
      }, 100);
    }
    else{
      docContainer.src = self.__default_manual;
    }
  }

}