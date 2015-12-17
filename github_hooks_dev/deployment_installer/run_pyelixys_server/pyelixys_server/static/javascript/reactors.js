function ReactorCalibrations(reactors, pneumaticPressure){
    var self = this;
     self.reactors = reactors;
     self.isCalibrating = ko.observable(false);
     self.reactorToCalIndex = ko.observable(0);
     self.pneumaticPressure = pneumaticPressure;
     self.reactorToCal = ko.pureComputed(function(){
        return self.reactors[parseInt(self.reactorToCalIndex())];
     });

     self.doCalibrate = function(){
        self.pneumaticPressure.setPoint(0);//User will be manually moving the reactor up/down/forward/back

        for(var i = 0; i < self.reactors.length; i++){
            var reactor = self.reactors[i];
            reactor.brakeRelease();
            reactor.ctrlMode("edit");
        }
        self.isCalibrating(true);
     }

     self.cancel = function(){
        for(var i = 0; i < self.reactors.length; i++ ){
            self.reactors[i].ctrlMode("command");
        }
        self.isCalibrating(false);
     }
     
     self.reactorCalibrating = ko.pureComputed(function(){
        if( self.isCalibrating() ){
            return self.reactors[self.reactorToCalIndex()];
        }
        return null;
     });

     self.save = function(){
        if(self.isCalibrating()){
           var reactor = self.reactorCalibrating();
           if( reactor.selectedPosition() !== null ){
               var cal = {};
               var position = reactor.selectedPosition();
               cal.name = "reactors";
               cal.select_type = "save";
               cal.parameters = {"reactor": reactor.reactorId, "position": position};
               self.calibrate(cal);
           }
        }
     }

     self.doneCalibrating = function(){
        for( var i = 0; i < self.reactors.length; i++ ){
            reactors[i].ctrlMode("command");
        }
        self.isCalibrating(false);
     }

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}