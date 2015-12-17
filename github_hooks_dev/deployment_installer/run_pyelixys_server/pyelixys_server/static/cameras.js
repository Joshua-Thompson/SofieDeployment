function CameraCtrl(){
  'use strict';
  var self = this;
  Common.apply(self, arguments);

  self.videoUrl_0 = self.videoUrl[0];
  self.videoUrl_1 = self.videoUrl[1];
  self.videoUrl_2 = self.videoUrl[2];

  self.hideCameras = function(){
    for(var i = 0; i < 3; i++){
      $("#camera" + i).hide();
    }
  }

  self.showCamera = function(cameraId){
    $("#camera" + cameraId).show();
  }

  self.hideCamera = function(cameraId){
    $("#camera" + cameraId).hide();
  }

  self.setCameraPosition = function(cameraId, left, y){
    self.showCamera(cameraId);
    $("#camera" + cameraId).css("top", y).css("left", left);
  }

  self.camera0_position = ko.computed(function() {
    return self.camera0_position();
  });

  self.camera1_position = ko.computed(function() {
    return self.camera1_position();
  });

  self.camera2_position = ko.computed(function() {
    return self.camera2_position();
  });


  /*
  function Camera(){
    self.url = url;
    self.setPosition(left, top){

    }
  }
  */
}
