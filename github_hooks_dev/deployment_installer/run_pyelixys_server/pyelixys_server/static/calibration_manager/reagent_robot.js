function ReagentRobotCalibration(reagentRobot){
    var self = this;
    self.reagentRobot = reagentRobot;
    self.selectedPosition = ko.observable();
    self.selectPosition = function(pos){
        self.selectedPosition(pos);
    }
    self.isCalibrating = ko.observable(false);

    self.doCalibrate = function(){
       self.isCalibrating(true);
    }

    self.cancel = function(){
       self.isCalibrating(false);
    }

    self.save = function(){
       var cal = {};
       cal.name = "reagent_robot";
       cal.select_type = "save";
       cal.parameters = {"reactor": reactor.reactorId, "position": reactor.selectedPosition(),
                         "x": self.reagentRobot.x(), "y": self.reagentRobot.y()};
       self.calibrate(cal);
       self.isCalibrating(false);
    }

    self.calibrate = function(cal_parameters, handleResponse) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, handleResponse);
    }
}