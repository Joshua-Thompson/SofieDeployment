function CoolantPump(id, monitor){
    var self = this;
    self.monitor = monitor;
    self.id = id;
    self.name = "coolant_pump";
    self.canChangeState = ko.observable(true);

    self.on = function(){
        var cal = {};
        cal.name = "coolant_pump";
        cal.select_type = "control";
        cal.parameters = {"state": true};
        self.calibrate(cal);
    }

    self.off = function(){
        var cal = {};
        cal.name = "coolant_pump";
        cal.select_type = "control";
        cal.parameters = {"state": false};
        self.calibrate(cal);
    }

    self.state = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var coolantPump = self.monitor.state.coolantPump();
            if(coolantPump){
                return coolantPump.value ? "On" : "Off";
            }
        }
        return "Off";
    });

    self.calibrate = function(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}