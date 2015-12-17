function Heater(heaterId, reactorId, monitor, name){
    var self = this;
    self.requestedTemp = ko.observable(25);
    self.monitor = monitor;
    //self.name = "R" + (reactorId + 1) + " H" + (heaterId + 1);
	self.name =  name;
    self.heaterId = heaterId;
    self.reactorId = reactorId;
    self.id = "R" + self.reactorId + "H" + self.heaterId;
    self.canChangeHeat = ko.observable(true);

    self.on = function(){
        cal = {};
        cal.name = "temperature_controllers";
        cal.select_type = "control";
        cal.parameters = {control_type: "turn_on", heater: heaterId};
        self.calibrate(cal);
    }
    self.off = function(){
        cal = {};
        cal.name = "temperature_controllers";
        cal.select_type = "control";
        cal.parameters = {control_type: "turn_off", heater: heaterId};
        self.calibrate(cal);
    }

    self.isOn = ko.computed(function(){
        if( self.monitor && self.monitor.state ){
            var heaters = self.monitor.state.heaters();
            if( heaters.length > self.heaterId ){
                return heaters[self.heaterId].value;
            }
        }
        return false;
    });
    self.state = ko.pureComputed(function(){
        return self.isOn() ? "On" : "Off";
    });

    self.currentTemperature = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var heaters = self.monitor.state.thermocouples();
            if( heaters.length > self.heaterId ){
                return heaters[self.heaterId].value;
            }
        }
        return false;
    });
    self.requestedTemp.subscribe(function(newVal){
        cal = {};
        cal.name = "temperature_controllers";
        cal.select_type = "control";
        cal.parameters = {control_type: "heat", heater: heaterId, temperature: newVal};
        self.calibrate(cal);
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}