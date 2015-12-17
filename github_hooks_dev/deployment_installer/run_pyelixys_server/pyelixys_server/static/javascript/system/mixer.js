function Mixer(reactorId, name, monitor){
    var self = this;
    Common.apply(self, arguments);
    self.reactorId = reactorId;
    self.monitor = monitor;
    self.dutyCycle = ko.observable();
    self.defaultCycle;
    self.doChangeSpeed = true;
    self.canChangeSpeed = ko.observable(true);
    $.get("/hardware_config?keys=Reactors,Reactor" + self.reactorId + ",mixer_nominal_duty_cycle", function(res){
        res = parseFloat(res);
        self.defaultCycle = res;
        self.dutyCycle(self.defaultCycle);
        self.dutyCycle.subscribe(self.changeMotorSpeed);
    });
    self.name = name || "Mixer " + (reactorId + 1);

    self.on = function(){
        self.setStirState(true, undefined, function(res){
            self.doChangeSpeed = false;
            self.dutyCycle(self.defaultCycle);
            self.doChangeSpeed = true;
        });
    }
    self.off = function(){
        self.setStirState(false);
    }
    self.state = ko.pureComputed(function(){
        return self.isStirring() ? "On" : "Off"
    });

    self.changeMotorSpeed = function(newSpeed){
        if( self.doChangeSpeed ){
            self.setStirState(self.isStirring(), newSpeed);
        }
    }

    self.setStirState = function(state, speed, handleResponse){
        console.log("Setting the stir state");
        var cal = {};
        cal.name = "mixers";
        cal.select_type = "control";
        cal.parameters = {reactor: self.reactorId, state: state, duty_cycle: speed};
        self.calibrate(cal, handleResponse);
    }

    self.isStirring = ko.pureComputed(function(){
        return self.currentMotorSpeed() > 0;
    });

    self.currentMotorSpeed = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var mixer = self.monitor.state.mixers()[self.reactorId];
            if( mixer ){
                return self.monitor.state.mixers()[self.reactorId].value;
            }
        }
        return 0;
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}