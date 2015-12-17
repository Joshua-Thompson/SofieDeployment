function Reactor(reactorId, monitor, heatOnChange){
    var self = this;
    self.reactorId = reactorId;
    self.monitor = monitor;
    self.camera = new Camera({cameraId: self.reactorId});
    self.mixer = new Mixer(self.reactorId, null, self.monitor);
    self.upIndex;
    self.downIndex;
    self.linearActuatorId;
    self.heaters = [];
	self.allHeaters = [];
    self.stopcocks = [];
    self.ctrlMode = ko.observable("command");

    self.isInPosition = ko.observable(true);

    self.selectedPosition = ko.observable("");

    var numHeaters = 3;
    for(var h = 0; h < numHeaters; h++){
        var heaterId = self.reactorId*numHeaters + h;
        var heater = new Heater(heaterId,self.reactorId,self.monitor, "THERMO " + (h + 1) + ": ");
        self.heaters.push(heater);
    }
    self.heater = new ReactorHeater(self.heaters, self.reactorId, "MASTER TEMP: ", heatOnChange);
    self.allHeaters.push(self.heater);
    self.allHeaters = self.allHeaters.concat(self.heaters);

    var numStopCocks = 3;
    for(var s = 0; s < numStopCocks; s++){
        var stopcock = new Stopcock(self.reactorId,s,self.monitor);
        self.stopcocks.push(stopcock);
    }

    self.lift = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        cal.parameters = {"reactor": self.reactorId, "control_type": "lift"};
        self.calibrate(cal);
    }

    self.brakeRelease = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        cal.parameters = {"reactor": self.reactorId, "control_type": "brake_release"};
        self.calibrate(cal);
    }

    self.lower = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        cal.parameters = {"reactor": self.reactorId, "control_type": "lower"};
        self.calibrate(cal);
    }

    self.home = function(){
        self.selectedPosition("home");
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        cal.parameters = {"reactor": self.reactorId, "control_type": "home"};
        self.calibrate(cal);
    }

    self.movePosition = function(posName){
        self.selectedPosition(posName);
        self.isInPosition(false);
        if( self.ctrlMode() == "command" ){
            var cal = {};
            cal.name = "reactors";
            cal.select_type = "control";
            cal.parameters = {"reactor": self.reactorId, "control_type": "move_position", "position": posName};
            self.calibrate(cal);

            self.polling = setInterval(function(){
                var cal = {};
                cal.name = "reactors";
                cal.select_type = "control";
                cal.parameters = {control_type: "poll"};
                self.calibrate(cal, function(res){
                    if( res.calibrate == true){
                        self.isInPosition(true);
                        clearInterval(self.polling);
                    }
                });
            }, 500);
        }
    }

    self.moveAdd = function(){
        self.movePosition("add");
    }

    self.moveTransfer = function(){
        self.movePosition("transfer");
    }

    self.moveReact0 = function(){
        self.movePosition("react0");
    }

    self.moveReact1 = function(){
        self.movePosition("react1");
    }

    self.moveEvap = function(){
        self.movePosition("evaporate");
    }

    self.moveInstall = function(){
        self.movePosition("install");
    }

    self.move_coord = function(x){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control";
        cal.parameters = {"reactor": self.reactorId, "control_type": "move_coord", "x": x};
        self.calibrate(cal);
    }

    self.isUp = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var digitalInputs = self.monitor.state.digitalInputs();
            if( digitalInputs ){
                if( self.upIndex == null ){
                    self.upIndex = self.findIndex(digitalInputs, "Reactor" + self.reactorId + " Up Sensor");
                }

                if( self.upIndex != null && digitalInputs.length-1 >= self.upIndex){
                    return digitalInputs[self.upIndex].value;
                }
            }
        }
    });

    self.isDown = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var digitalInputs = self.monitor.state.digitalInputs();
            if( digitalInputs ){
                if( self.downIndex == null ){
                    self.downIndex = self.findIndex(digitalInputs, "Reactor" + self.reactorId + " Down Sensor");
                }

                if( self.downIndex != null && digitalInputs.length - 1 >= self.downIndex){
                    return digitalInputs[self.downIndex].value;
                }
            }
        }

    });

    self.position = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var linearActuators = self.monitor.state.linearActuators();
            if( linearActuators){
                if( self.linearActuatorId == null ){
                    self.linearActuatorId = self.findIndex(linearActuators, "Reactor" + self.reactorId + " Axis");
                }

                if( self.linearActuatorId != null && linearActuators.length -1 >= self.linearActuatorId){
                    return linearActuators[self.linearActuatorId].value;
                }
            }
        }
    });

    self.findIndex = function(monitorArray,name){
        for(var i=0; i < monitorArray.length; i++){
            var mon = monitorArray[i];

            if(mon.name == name)
                return i;
        }
        return null;
    }

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}