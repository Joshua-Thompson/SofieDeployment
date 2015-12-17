function PressureRegulatorsCalibrations(pressureRegs){
    var self = this;
    self.pressureRegulators = pressureRegs;

    self.calibratePressureState = ko.observable("calibrate");
    self.canCalibratePressure = ko.observable(true);
    self.calibratePressureReadIn = ko.observable(0);
    self.calibratePressureInstructions = ko.observable("Please Wait");
    self.calibrationMonitor = undefined;
    self.calibratingRegulator = ko.observable("");
    self.displayCalibrate = ko.pureComputed(function(){
        return self.calibratePressureState() != "calibrate";
    });
    self.pressureCalibrateBtnText = ko.pureComputed(function(){
        var btnText = "";
        switch(self.calibratePressureState()){
            case "calibrate":
                btnText = "CALIBRATE";
                break;
            case "calibrating":
                btnText = "CONTINUE";
                break;
            default:
                btnText = "Not Defined";
                break;
        }
        return btnText;
    });

    self.pressure_abort = function(){
        var cal = {};
        cal.name = "pressure_regulators";
        cal.select_type = "control";
        cal.parameters = {control_type: "abort"};
        calibrate(cal);
    }

    self.calibratePressureRegulators = function(){
        switch(self.calibratePressureState()){
            case "calibrate":
                self.calibratePressureState("calibrating");
                var cal = {};
                cal.name = "pressure_regulators";
                cal.select_type = "control";
                cal.parameters = {control_type: "calibrate"};
                calibrate(cal);
                self.calibrationMonitor = setInterval(function(){
                    var cal = {};
                    cal.name = "pressure_regulators";
                    cal.select_type = "control";
                    cal.parameters = {"control_type": "poll"}
                    calibrate(cal, function(resp){
                        if( resp.calibrate.is_calibrating ){
                            self.calibratePressureState("calibrating");
                            self.calibratePressureInstructions(resp.calibrate.message);
                            self.calibratingRegulator(resp.calibrate.calibrating_regulator)
                        }
                        else{
                            self.calibratePressureState("calibrate");
                        }
                    });
                }, 1000);
                break;
            case "calibrating":
                self.calibratePressureState("calibrating");
                var cal = {};
                cal.name = "pressure_regulators";
                cal.select_type = "control";
                cal.parameters = {control_type: "calibrate", response: self.calibratePressureReadIn()};
                calibrate(cal);
                break;
            default:
                self.calibratePressureState("calibrate");
                console.log("Not a valid calibration step");
        }
    }

    function calibrate(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}