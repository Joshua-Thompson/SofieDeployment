function CalibrateCameras(cameras){
    var self = this;
    self.cameras = cameras;
    self.cameraPositionChanged = ko.observable(false);

    for(var i = 0; i < cameras.length; i++){
        var cam = cameras[i];
        cam.position.subscribe(function(newVal){
            self.cameraPositionChanged(true);
        });
        for(var j = 0; j < cam.options.length; j++ ){
            cam.options[j].subscribe(function(newVal){
                self.cameraPositionChanged(true);
            });
        }
    }

    self.calibrateCameraPositions = function(){
        if( self.cameraPositionChanged() ){
            var cal_parameters = {};
            cal_parameters.name = "cameras";
            cal_parameters.select_type = "save";
            cal_parameters.parameters = {};
            cal_parameters.parameters.camera_positions = {};

            for( var i = 0; i < self.cameras.length; i++){
                cal_parameters.parameters.camera_positions["camera" + i + "_position"] = self.cameras[i].pos_int();
            }
            calibrate(cal_parameters);
            self.cameraPositionChanged(false);
        }
    }

    function calibrate(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }
}