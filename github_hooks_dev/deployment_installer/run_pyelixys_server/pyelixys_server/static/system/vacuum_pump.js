function VacuumPump(monitor){
    var self = this;
    self.monitor = monitor;
    self.id = "vacuum-pump";
    self.canChangeState = ko.observable(true);

    self.on = function(){
        var cal = {};
        cal.name = "vacuum_pump";
        cal.select_type = "control";
        cal.parameters = {state: true};
        self.calibrate(cal);
    }

    self.off = function(){
        var cal = {};
        cal.name = "vacuum_pump";
        cal.select_type = "control";
        cal.parameters = {state: false};
        self.calibrate(cal);
    }

    self.state = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var pump = self.monitor.state.vacuumPump();
            if( pump ){
                return pump.value > 0 ? "On" : "Off";
            }
        }
        return "Off";
    });

    self.pressure = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var pressure = self.monitor.state.smcInterface();
            if( pressure.length > 0 ){
                return pressure[0].value;
            }
        }
        return 0;
    });
    
    self.mmHg = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var pressure = self.monitor.state.smcInterface();
            if( pressure.length > 0 ){
                return pressure[0].mmHg;
            }
        }
        return 0;
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}