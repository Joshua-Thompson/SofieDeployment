function ReactorHeater(heaters, reactorId, name, heatOnChange){
    var self = this;
    self.id = reactorId;
    self.reactorId = reactorId;
    self.heaters = heaters;
    self.name = name;
    self.heatOnChange = heatOnChange ? heatOnChange : false;
    self.requestedTemp = ko.observable(25);
    self.isOn = ko.computed(function(){
        for(var i=0; i < self.heaters.length; i++){
            if( self.heaters[i].isOn() )
                return true;
        }
        return false;
    })
    self.requestedState = ko.observable(false);
    self.canChangeHeat = ko.observable(true);
    self.canChangeHeat.subscribe(function(newVal){
        if( newVal ){
            if( self.heatTimer ) { clearInterval( self.heatTimer ); }
        }
    });

    self.setTemperature = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        if( self.heatOnChange ){
            cal.parameters = {reactor: self.reactorId, control_type: "heat", temp: self.requestedTemp(),
                              state: self.requestedState()}
        }
        else{
            cal.parameters = {reactor: self.reactorId, control_type: "heat", temp: self.requestedTemp(),
                              state: self.requestedState(), time: self.heatDuration()}
            if( self.requestedState() ){
                self.monitorCanHeat = setInterval(function(){
                                          var cal = {};
                                          cal.name = "reactors";
                                          cal.select_type = "control";
                                          cal.parameters = {reactor: self.reactorId, control_type: "heat", temp: self.requestedTemp(),
                                                            state: self.requestedState(), query: true};
                                          self.calibrate(cal, function(res){
                                              
                                              res = res.calibrate;
                                              self.canChangeHeat(!res.timed_heating);
                                              if( self.canChangeHeat() ){
                                                  clearInterval(self.monitorCanHeat);
                                              }
                                          });
                                      }, 1000);
            }
            else if( self.monitorCanHeat ){
                clearInterval(self.monitorCanHeat);
                self.canChangeHeat(true);
            }
    
        }

        self.calibrate(cal);
    }

    self.requestedTemp.subscribe(function(newVal){
        if( self.heatOnChange ){
            if( newVal < self.currentTemperature() ){
                self.requestedState(false);
                if( self.tempDrop ){
                    self.tempDrop.dispose();
                }
                self.tempDrop = self.currentTemperature.subscribe(function(newVal){
                    if(newVal < self.requestedTemp()){
                        self.requestedState(true);
                        self.setTemperature();
                        self.tempDrop.dispose();
                    }
                });
            }
            else{
                self.requestedState(true);
            }
            self.setTemperature();
        }
    });

    self.off = function(){
        self.requestedState(false);
        self.setTemperature();
        if( self.heatTimer ){
            clearInterval( self.heatTimer );
        }
        
    }

    self.on = function(){
        self.requestedState(true);
        self.setTemperature();
        if( !self.heatOnChange ){
            self.heatTimer = setInterval(function(){
                if( self.heatDuration() > 0 ){
                    self.heatDuration(self.heatDuration() - 1);
                }
                else{
                    clearInterval( self.heatTimer );
                }
            }, 1000);
        }
    }

    self.state = ko.pureComputed(function(){
        return self.isOn() ? "On" : "Off";
    });

    self.heatDuration = ko.observable(0);

    self.currentTemperature = ko.pureComputed(function(){
        var summedTemps = 0;
        for(var i=0; i < self.heaters.length; i++){
            summedTemps+=self.heaters[i].currentTemperature();
        }
        return summedTemps/self.heaters.length;
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}