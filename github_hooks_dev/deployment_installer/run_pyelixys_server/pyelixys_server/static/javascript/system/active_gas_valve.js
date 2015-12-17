function ActiveGasValve(monitor, id){
    var self = this;
    self.monitor = monitor;
    self.id = id;
    self.valveIndex;
    self.canChangeState = ko.observable(true);

    self.on = function(){
        var cal = {};
        cal.name = "active_gas";
        cal.select_type = "control";
        cal.parameters = {"state": false};
        self.calibrate(cal);
    }

    self.off = function(){
        var cal = {};
        cal.name = "active_gas";
        cal.select_type = "control";
        cal.parameters = {"state": true};
        self.calibrate(cal);
    }

    self.state = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var monitor = self.monitor.state.valves();
            if( !self.valveIndex ){
                self.valveIndex = self.findIndex(monitor, "F18/Isotope Valve");
            }

            if(self.valveIndex){
                return monitor[self.valveIndex].value ? "Off" : "On";
            }
        }
        return "Off";
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }

    self.findIndex = function(monitorArray,name){
        for(var i=0; i < monitorArray.length; i++){
            var mon = monitorArray[i];

            if(mon.name == name){
                return i;
            }
        }
        return null;
    }
}