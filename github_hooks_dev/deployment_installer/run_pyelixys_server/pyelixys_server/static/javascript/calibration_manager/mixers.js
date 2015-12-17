function CalibrateMixers(mixers){
    var self = this;
    self.mixers = mixers;
    self.mixerCalibrationChanged = ko.observable(false);

    for( var i = 0; i < self.mixers.length; i++){
        var mixer = self.mixers[i];
        mixer.dutyCycle.subscribe(function(oldVal){
            if( oldVal ){
                self.mixerCalibrationChanged(true);
            }
        }, null, "beforeChange");
    }

    self.saveMixerCalibrations = function(){
        var cal_parameters = {};
        cal_parameters.name = "mixers";
        cal_parameters.select_type = "save";
        cal_parameters.parameters = {};
        var mixers = []
        for( var i = 0; i < self.mixers.length; i++ ){
            var mixer = self.mixers[i];
            mixers.push({
                reactor: mixer.reactorId,
                duty_cycle: mixer.dutyCycle()
            });
            mixer.defaultCycle = mixer.dutyCycle();
        }
        cal_parameters.parameters.mixers = mixers;
        calibrate(cal_parameters);
        self.mixerCalibrationChanged(false);
    }

    function calibrate(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}