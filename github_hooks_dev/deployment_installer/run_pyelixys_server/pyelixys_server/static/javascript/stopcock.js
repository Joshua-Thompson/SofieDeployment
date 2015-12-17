function Stopcock(reactor, index, monitor){
    var self = this;
    self.stopcockIndex = index;
    self.reactor = reactor;
    self.monitor = monitor;
    self.counterClockwiseId;
    self.clockwiseId;
    self.clockwiseName = "Reactor" + self.reactor + " Stopcock" + self.stopcockIndex + " CW Valve";
    self.counterClockwiseName = "Reactor" + self.reactor + " Stopcock" + self.stopcockIndex + " CCW Valve";
    self.name = self.stopcockIndex + 1;

    self.turnClockwise = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control"
        cal.parameters = {"control_type" : "stopcock", "reactor": self.reactor,
                          "stopcock": self.stopcockIndex, "position": "clockwise"};
        self.calibrate(cal);
    }

    self.turnCounterClockwise = function(){
        var cal = {};
        cal.name = "reactors";
        cal.select_type = "control"
        cal.parameters = {"control_type" : "stopcock", "reactor": self.reactor,
                          "stopcock": self.stopcockIndex, "position": "counterclockwise"};
        self.calibrate(cal);
    }

    self.isClockwise = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var valves = self.monitor.state.valves();
            if( valves ){
                if( !(self.clockwiseId || self.clockwiseId == 0) ){
                    self.clockwiseId = self.findIndexClockWise(valves);
                }

                if(self.clockwiseId || self.clockwiseId == 0 )
                    return valves[self.clockwiseId].value;
            }
        }
        return false;
    });

    self.isCounterClockwise = ko.pureComputed(function(){
        if( self.monitor && self.monitor.state ){
            var valves = self.monitor.state.valves();
            if( valves ){
                if( !(self.counterClockwiseId || self.counterClockwiseId == 0)){
                    self.counterClockwiseId = self.findIndexCounterClockWise(valves);
                }
                if( self.counterClockwiseId || self.counterClockwiseId == 0 )
                    return valves[self.counterClockwiseId].value;
            }
        }
        return false;
    });

    self.state = ko.pureComputed(function(){
        if( self.isClockwise() ){
            return true;
        }
        else if( self.isCounterClockwise() ){
            return false;
        }
        else{
            return false;
        }
    });

    self.findIndexClockWise = function(valves){
        for(var i=0; i < valves.length; i++){
            var valve = valves[i];

            if(valve.name == self.clockwiseName){
                return i;
            }
        }
        return null;
    }

    self.findIndexCounterClockWise = function(valves){
        for(var i=0; i < valves.length; i++){
            var valve = valves[i];
            if( valve.name == self.counterClockwiseName ){
                return i;
            }
        }
        return null;
    }

    self.calibrate = function(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}