function initBranches(branches){
    for( var i=0; i < branches.length; i++ ){
        var branch = branches[i];
        branch.download = function(self){
            var anchor = $("<a>");
            var url = "/github/branches/download?ref=" + encodeURIComponent(self.ref);
            anchor.attr('href', url);
            anchor[0].click();
        }
    }
    return branches;
}

function loadBranches(){
    var url = "/github/branches";
    var promise = $.ajax({url: url,
                          headers:{'Accept': 'json'}
    });
    return promise;
}
