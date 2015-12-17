function Camera(options){
    var self = this;
    Common.apply(self, arguments);
    var cameraPositions = [camera0_position, camera1_position, camera2_position];
    self.cameraId = ko.observable(options.cameraId);
    self.cameraName = self.cameraId() + 1;
    self.src = ko.observable(self.videoUrl[self.cameraId()]);
    self.right_max = 0;//px
    self.left_max = -230;//px

    self.resetText = ko.observable("");
    self.brightness = ko.observable(32768);
    self.contrast = ko.observable(27648);
    self.saturation = ko.observable(32768);
    self.hue = ko.observable(32768);
    self.chroma_agc = ko.observable(false);
    self.agc_crush = ko.observable(true);
    self.uv_ratio = ko.observable(50);
    self.options = [self.brightness, self.contrast, self.saturation,
                    self.hue, self.chroma_agc,self.agc_crush,self.uv_ratio];

    self.position = ko.observable(cameraPositions[self.cameraId()]);

    self.pos_int = ko.pureComputed(function(){
        return parseInt(self.position());
    });

    self.canIncreasePos = ko.pureComputed(function(){
        return self.pos_int() < self.right_max;
    });
    self.canDecreasePos = ko.pureComputed(function(){
        return self.pos_int() > self.left_max;
    });

    self.moveHorizontal = function(dx){
        var pos_int = self.pos_int();
        pos_int = pos_int + dx;
        self.position(pos_int + "px");
    }
    self.incPosition = function(){
        self.moveHorizontal(5);
    }
    self.decPosition = function(){
        self.moveHorizontal(-5);
    }
    self.resetVideo = function(){
        self.resetText("RESETTING...");
        Elixys.doApiCall("/video_reset", {video_reset : {"camera_id": self.cameraId()}}, function(res){
            self.setDefaultResetText();
        });
    }
    self.setDefaultResetText = function(){
        self.resetText("Reset Feed " + self.cameraName);
        self.src("");
        self.src(self.videoUrl[self.cameraId()]);
    }

    self.setDefaultResetText();

    self.doCalibrate = function(params){
        var cal = {};
        cal.name = "cameras";
        cal.select_type = "control";
        params["camera"] = self.cameraId();
        params["type"] = "set";
        cal.parameters = params;
        calibrate(cal);
    }

    self.loadDefaults = function(){
        var cal = {};
        var params = {};
        cal.name = "cameras";
        cal.select_type = "control";
        params["camera"] = self.cameraId();
        params["type"] = "query";
        cal.parameters = params;

        calibrate(cal, function(res){
            if( res.calibrate && res.calibrate != "ok"){
                res = JSON.parse(res.calibrate);
                self.brightness(res.brightness);
                self.contrast(res.contrast);
                self.saturation(res.saturation);
                self.hue(res.hue);
                self.chroma_agc(res.chroma_agc == 1 ? true : false);// = ko.observable(false);
                self.agc_crush(res.agc_crush == 1 ? true : false);// = ko.observable(true);
                self.uv_ratio(res.uv_ratio);// = ko.observable(50);
            }

            self.brightness.subscribe(function(newVal){
                self.doCalibrate({"option": "brightness", "value": newVal});
            });
            self.contrast.subscribe(function(newVal){
                self.doCalibrate({"option": "contrast", "value": newVal});
            });
            self.saturation.subscribe(function(newVal){
                self.doCalibrate({"option": "saturation", "value": newVal});
            });
            self.hue.subscribe(function(newVal){
                self.doCalibrate({"option": "hue", "value": newVal});
            });
            self.agc_crush.subscribe(function(newVal){
                self.doCalibrate({"option": "agc_crush", "value": newVal ? 1 : 0});
            });
            self.chroma_agc.subscribe(function(newVal){
                self.doCalibrate({"option": "chroma_agc", "value": newVal ? 1 : 0});
            });
            self.uv_ratio.subscribe(function(newVal){
                self.doCalibrate({"option": "uv_ratio", "value": newVal});
            });
        });
    }

    function calibrate(cal_parameters, calibrateResponseFn) {
        return Elixys.doApiCall("/calibrate", {calibrate: {name : cal_parameters.name, type: cal_parameters.select_type,
                                parameters: cal_parameters.parameters}}, calibrateResponseFn);
    }

    self.loadDefaults();
    self.setDefaultResetText();
}