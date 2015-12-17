function TemplatedPopup() {
  'use strict';
  
  var self = this;
  self.run_note = ko.observable(" ");
  self.visible = ko.observable(false);
  self.templateAndData = ko.observable({name: "blank-template", data: {}});
  self.extraClass = ko.observable("");
  
  self.close = function() {
    self.visible(false);
  };
  
  self.show = function(template, data, extraClass) {

    self.templateAndData({name: template, data: data});
    self.get_message();//get current run note
    if( extraClass ) {
      self.extraClass(extraClass);
    }
    else {
      self.extraClass("");
    }
    self.visible(true);
  };


  self.save_message = function(){

  saveMessage();
  self.visible(false);

  }

  function saveMessage() {
    //this function saves the message to the logged sequence component, not the original componet
    //though we are sending the original component id in the GUI, the server knows to save to the logged one
    var message = self.run_note()
    var componentid = self.templateAndData().data.id;

    if(componentid===null || componentid===undefined){return ;}

    return Elixys.doApiCall("/save_message", {save_message: {message: message, componentid:componentid}},
    function(result){
          var data = result["save_message"];
          var message = data["message"];
          self.run_note(message);
          self.run_note.valueHasMutated();
          }
    );

  }


   self.get_message = function(){
    getMessage();
   }

   function getMessage() {

    var componentid = self.templateAndData().data.id;
    if(componentid===null || componentid===undefined){return ;}
    return Elixys.doApiCall("/get_message", {get_message: {componentid:componentid}},
    function(result){
          var data = result["get_message"];
          var message = data["message"];
          self.run_note(message);
          self.run_note.valueHasMutated();
          }
    );

  }



}

