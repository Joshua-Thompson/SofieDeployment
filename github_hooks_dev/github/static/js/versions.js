function initVersions(versions){
    versions.download = function(release){
        var anchor = $("<a>");
        var url = "/versions/download?url=" + encodeURIComponent(release.zipball_url);
        anchor.attr('href', url);
        anchor[0].click();
    }
}

$(function(){
    initVersions(versions);
    //ko.applyBindings(versions);
});