PressureRegulator = function(name, id, monitor){
  var self = this;
  self.name = name;
  self.monitor = monitor;
  self.id = id;
  self.psiRequested = ko.observable(0);
  self.psiRequested.subscribe(function(newVal){
    var maxPressure = self.maxPressure();
    if( newVal > maxPressure ){
        self.psiRequested(maxPressure);
    }
    else{
        self.setPoint(newVal);
    }
  });
  self.canChangePressure = ko.observable(true);

  self.setPoint = function(psi){
    console.log("Setting Pressure to " + psi );
    var cal = {};
    cal.name = "pressure_regulators";
    cal.select_type = "control";
    cal.parameters = {pressure: self.psiRequested(), id: self.id};
    self.calibrate(cal);
  }

  self.psi = ko.pureComputed(function(){
    if(self.monitor && self.monitor.state ){
      var pressureRegs = self.monitor.state.pressureRegulators();
      if( pressureRegs.length > self.id ){
        return pressureRegs[self.id].value;
      }
    }
    return 0;
  });
  
  self.maxPressure = function(){
    if( self.id == 0 ){
      return 30;
    }
    else{
      return 60;
    }
  }


  self.calibrate = function(cal_parameters, handleResponse) {
      return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                              parameters: cal_parameters.parameters}}, handleResponse);
  }
}