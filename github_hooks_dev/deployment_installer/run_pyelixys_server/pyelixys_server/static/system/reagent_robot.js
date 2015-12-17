function ReagentRobot(monitor, cassettes){
    var self = this;
    self.gripper = new Gripper(monitor);
    self.gasTransfer = new GasTransfer(monitor);
    self.cassettes = cassettes;
    self.monitor = monitor;
    self.selectedOperation = ko.observable();

    self.selectedReagent = ko.observable();

    self.xIndex;
    self.yIndex;

    self.brakeRelease = function(){
        var cal = {};
        cal.name = "reagent_robot";
        cal.select_type = "control";
        cal.parameters = {control_type: "brake_release"};
        self.calibrate(cal);
    }

    self.x = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var actuators = self.monitor.state.linearActuators();
            if( self.xIndex == null ){
                self.xIndex = self.findIndex(actuators, "Reagent Robot X Axis");
            }

            if( self.xIndex != null ){
                return actuators[self.xIndex].value;
            }
            return 0;
        }
    });

    self.y = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var actuators = self.monitor.state.linearActuators();
            if( self.yIndex == null ){
                self.yIndex = self.findIndex(actuators, "Reagent Robot Y Axis");
            }

            if( self.yIndex != null ){
                return actuators[self.yIndex].value;
            }
            return 0;
        }
    });

    self.moveToOperation = function(pos, reactor){
        self.selectedReagent(null);
        self.selectedOperation(null);
        var cal = {};
        cal.name = "reagent_robot"
        cal.select_type = "control";
        cal.parameters = {control_type: "move_position", position: pos, reactor: reactor};
        self.calibrate(cal, function(res){
            self.polling = setInterval(function(){
                var cal = {};
                cal.name = "reagent_robot";
                cal.select_type = "control";
                cal.parameters = {control_type: "poll"};
                self.calibrate(cal, function(res){
                    if( res.calibrate == true){
                        self.selectedOperation({reactor: reactor, position: pos});
                        clearInterval(self.polling);
                    }
                });
            }, 500);
        });
    }

    self.moveToReagent = function(reagent){
        self.selectedOperation(null);
        self.selectedReagent(null);
        var cal = {};
        cal.name = "reagent_robot";
        cal.select_type = "control";
        cal.parameters = {control_type: "move_coord", x: reagent.x(), y: reagent.y()};
        self.calibrate(cal, function(res){
            self.polling = setInterval(function(){
                var cal = {};
                cal.name = "reagent_robot";
                cal.select_type = "control";
                cal.parameters = {control_type: "poll"};
                self.calibrate(cal, function(res){
                    if( res.calibrate == true){
                        self.selectedReagent(reagent);
                        clearInterval(self.polling);
                    }
                });
            }, 500);
        });

    }

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }

    self.findIndex = function(monitorArray,name){
        for(var i=0; i < monitorArray.length; i++){
            var mon = monitorArray[i];

            if(mon.name == name)
                return i;
        }
        return null;
    }
}

function Gripper(monitor){
    var self = this;
    self.monitor = monitor;
    self.isUpIndex;
    self.isDownIndex;
    self.isOpenIndex;
    self.isDownIndex;
    self.open = function(){
        var cal = {};
        cal.name = "gripper";
        cal.select_type = "control";
        cal.parameters = {control_type: "open"};
        self.calibrate(cal);
    }

    self.close = function(){
        var cal = {};
        cal.name = "gripper";
        cal.select_type = "control";
        cal.parameters = {control_type: "close"};
        self.calibrate(cal);
    }

    self.lift = function(){
        var cal = {};
        cal.name = "gripper";
        cal.select_type = "control";
        cal.parameters = {control_type: "lift"};
        self.calibrate(cal);
    }

    self.lower = function(){
        var cal = {};
        cal.name = "gripper";
        cal.select_type = "control";
        cal.parameters = {control_type: "lower"};
        self.calibrate(cal);
    }


    self.isOpen = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var mon = self.monitor.state.digitalInputs();
            if( self.isOpenIndex == null){
                self.isOpenIndex = self.findIndex(mon, "Gripper Open Sensor");
            }

            if( self.isOpenIndex != null ){
                return mon[self.isOpenIndex].value;
            }
            return false;
        }
    });

    self.isClosed = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var mon = self.monitor.state.digitalInputs();
            if( self.isClosedIndex == null){
                self.isClosedIndex = self.findIndex(mon, "Gripper Close Sensor");
            }

            if( self.isOpenIndex != null ){
                return mon[self.isClosedIndex].value;
            }
            return false;
        }
    });

    self.isUp = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var mon = self.monitor.state.digitalInputs();
            if( self.isUpIndex == null){
                self.isUpIndex = self.findIndex(mon, "Gripper Up Sensor");
            }

            if( self.isOpenIndex != null ){
                return mon[self.isUpIndex].value;
            }
            return false;
        }
    });

    self.isDown = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var mon = self.monitor.state.digitalInputs();
            if( self.isDownIndex == null){
                self.isDownIndex = self.findIndex(mon, "Gripper Down Sensor");
            }

            if( self.isOpenIndex != null ){
                return mon[self.isDownIndex].value;
            }
            return false;
        }
    });

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }

    self.findIndex = function(monitorArray,name){
        for(var i=0; i < monitorArray.length; i++){
            var mon = monitorArray[i];

            if(mon.name == name)
                return i;
        }
        return null;
    }
}

function GasTransfer(monitor){
    var self = this;
    self.monitor = monitor;
    self.isUpIndex;
    self.isDownIndex;
    self.isTransferringIndex;

    self.isUp = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var inputs = self.monitor.state.valves();
            if( self.isUpIndex == null ){
                self.isUpIndex = self.findIndex(inputs, "Gas Transfer Up Valve");
            }

            if( self.isUpIndex != null ){
                return inputs[self.isUpIndex].value;
            }
        }
        return false;
    });

    self.isDown = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var inputs = self.monitor.state.valves();
            if( self.isDownIndex == null ){
                self.isDownIndex = self.findIndex(inputs, "Gas Transfer Down Valve");
            }

            if( self.isDownIndex != null ){
                return inputs[self.isDownIndex].value;
            }
        }
        return false;
    });

    self.isTransferring = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var inputs = self.monitor.state.valves();
            if( self.isTransferringIndex == null ){
                self.isTransferringIndex = self.findIndex(inputs, "Gas Transfer Transfer Valve");
            }

            if( self.isTransferringIndex != null ){
                return inputs[self.isTransferringIndex].value;
            }
        }
        return false;
    });

    self.lift = function(){
        var cal = {};
        cal.name = "gas_transfer";
        cal.select_type = "control";
        cal.parameters = {control_type: "lift"};
        self.calibrate(cal);
    }

    self.lower = function(){
        var cal = {};
        cal.name = "gas_transfer";
        cal.select_type = "control";
        cal.parameters = {control_type: "lower"};
        self.calibrate(cal);
    }

    self.startTransfer = function(){
        var cal = {};
        cal.name = "gas_transfer";
        cal.select_type = "control";
        cal.parameters = {control_type: "start_transfer"};
        self.calibrate(cal);
    }

    self.stopTransfer = function(){
        var cal = {};
        cal.name = "gas_transfer";
        cal.select_type = "control";
        cal.parameters = {control_type: "stop_transfer"};
        self.calibrate(cal);
    }

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
