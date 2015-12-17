function CalibrateLiquidSensor(monitor){
    var self = this;
    Common.apply(self, arguments);
    self.monitor = monitor;
    self.liquid_calibration_message = ko.observable(" ");
    self.liquid_calibration_status = ko.observable("CALIBRATE");


    self.calibrateLiquidSensor = function(){
        var cal_parameters = {};
        cal_parameters.name = "liquid_sensors";
        cal_parameters.select_type = "save";
        cal_parameters.parameters = {};
        cal_parameters.parameters.sensor_number = self.liquidSensorNumber();

        if(self.liquid_calibration_status()=="CALIBRATE"){
            self.liquid_calibration_message("Remove tube");
            self.liquid_calibration_status("SAVE NO TUBE");
            return;
        }
        else if(self.liquid_calibration_status()=="SAVE NO TUBE"){
            self.liquid_calibration_message("Add tubing");
            self.liquid_calibration_status("SAVE TUBE ONLY");
            cal_parameters.parameters.parameter = "no_tube_present_counts";
        }
        else if(self.liquid_calibration_status()=="SAVE TUBE ONLY"){
            self.liquid_calibration_message("Add liquid to tube");
            self.liquid_calibration_status("SAVE LIQUID");
            cal_parameters.parameters.parameter = "no_liquid_present_counts";
        }
        else if(self.liquid_calibration_status()=="SAVE LIQUID"){
            self.liquid_calibration_message("Calibration Complete");
            self.liquid_calibration_status("CALIBRATE");
            cal_parameters.parameters.parameter = "liquid_present_counts";
        }
       calibrate(cal_parameters);
    }

    self.cancel = function(){
        self.liquid_calibration_status("CALIBRATE");
        self.liquid_calibration_message(" ");
    }

    function calibrate(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}