function HPLC(monitor){
    var self = this;
    self.monitor = monitor;

    self.load = function(){
        cal = {}
        cal.name = "hplc";
        cal.select_type = "control";
        cal.parameters = {"control_type": "load"};
        self.calibrate(cal);
    }

    self.inject = function(){
        cal = {}
        cal.name = "hplc";
        cal.select_type = "control";
        cal.parameters = {"control_type": "inject"};
        self.calibrate(cal);
    }

    self.position = ko.pureComputed(function(){
        var position = "NA";
        if( self.monitor && self.monitor.state ){
            position = self.monitor.state.hplc().position;
        }
        return position;
    });

    self.inInjectMode = ko.pureComputed(function(){
        return self.position() == "inject"
    });

    self.inLoadMode = ko.pureComputed(function(){
        return self.position() == "load";
    });

    self.calibrate = function(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}