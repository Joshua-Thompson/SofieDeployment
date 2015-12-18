function initVersions(versions){
    for( var i=0; i < versions.length; i++ ){
        var version = versions[i];
        version.download = function(self){
            var anchor = $("<a>");
            var url = "/github/versions/download?url=" + encodeURIComponent(self.zipball_url);
            anchor.attr('href', url);
            anchor[0].click();
        }
    }
    return versions;
}

function loadVersions(){
    var url = "/github/versions";
    var promise = $.ajax({url: url,
                          headers:{'Accept': 'json'}
    });
    return promise;
}
