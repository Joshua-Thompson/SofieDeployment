function reduce(lst, initial, fn){
    var l = lst.length;
    var i = 0;
    var result = initial;
    while(i<l){
        result = fn(result, lst[i], i);
        i++;
    }
    return result;
};
function map(lst, fn){
    var l = lst.length;
    var i = 0;
    while(i<l){
        lst[i] = fn(lst[i], i);
        i++;
    }
    return lst;
};
function forEach(lst, fn){
    var l = lst.length;
    var i = 0;
    while(i<l){
        fn(lst[i], i);
        i++;
    }
};
var EndpointAliasMap = {
    "sequences" : "http://chartershall.techempower.com:5000/get_sequences"
};

function SideBarOption(name, clss){
    var self = this;
    self.name = name;
    self.imageClass = "image-container "+clss;
}
function SideBarNavigator(navigate, logOut, confirmLoggedIn) {
    var self = this;
    self.options = [
        new SideBarOption("SEQUENCES", "sequences"),
        new SideBarOption("LOGS", "logs"),
//        new SideBarOption("ADMIN", "admin"),
        new SideBarOption("RUNNING", "running"),
        new SideBarOption("LOG OUT", "logout")
    ];
    self.executeAction = function(v){
        var name = v.name;
        if(name=="LOG OUT"){
            logOut();
        }else if(confirmLoggedIn()){
            navigate(name)
        }else{
            alert("You have been automatically logged out");
            logOut();
        }
    };
}
function Task(name, origin, idClass, classModifiers){
    var self = this;
    self.name = name;
    self.origin = origin;
    self.idClass = idClass;
    self.classModifiers = classModifiers;
    self.selected = ko.observable(false);
    self.draggable = ko.observable(false);
    self.deleteable = ko.observable(false);
    self.cloneable = ko.observable(false);
    self.scrolling = ko.observable(false);
    self.hidden = ko.observable(false);

    self.toggleSelected = function(){
        self.selected(!self.selected());
    };
    self.toggleDraggable = function(){
        self.draggable(!self.draggable());
    };
    self.toggleDeleteable = function(){
        self.deleteable(!self.deleteable());
    };
    self.toggleDeletable = function(){
        self.deleteable(!self.deleteable());
    };
    self.toggleCloneable = function(){
        self.cloneable(!self.cloneable());
    };
    self.toggleScrolling = function(){
        self.scrolling(!self.scrolling());
    };
    self.toggleHidden = function(){
        self.hidden(!self.hidden());
    };
    self.clss = ko.computed(function(){
        var value = "task "+ self.classModifiers + (self.selected() ? " selected": "");
        return value;
    });
    self.imageClss = function(){
        var value = self.idClass+' image-container';
        return value;
    };
    self.toggleSelectedOption = function(){
        self.toggleSelected();
        self.draggable(self.selected());
        self.deleteable(self.selected());
    };
    self.visibility = function(){
        var result = (self.hidden() ? "hidden" : "visible");
        return result;
    };
    self.task = function(){
        return self;
    };
};
var TaskOrigins = {
    options: "options",
    selectedTasks: "selectedTasks",
    placeHolderTask: "placeholder"
};
function StaticTaskOption(name, clss){
    var task = new Task(name, TaskOrigins.options, clss," box drag");
    task.toggleDraggable();
    task.toggleCloneable();
    return task;
};
function SelectedTaskOption(task){
    return new Task(task.name, TaskOrigins.selectedTasks, task.idClass, " box dropped");
};
function PlaceHolderTask(){
    var task = new Task("", TaskOrigins.placeHolderTask, "", " box dropped placeholder")
    task.toggleHidden();
    return task;
};

/*
  DeleteArea and AddTaskArea are used by the ko.bindingHandlers.droppable custom binding
  their function is to update what action needs to be executed when drag ends.
*/
function DropAreaActions(ref, action){
    var self = this;
    self.droppedIn = false;
    self.action = action;
    self.initialize = function(element){
        ref.dropAction.remove(self.action);
        ref.dropElement.remove(element);
        self.droppedIn = false;
    };
    self.start = function(element){
        ref.dropAction.push(self.action);
        ref.dropElement.push(element);
    };
    self.end = function(element){
        if(!self.droppedIn) {
            ref.dropAction.remove(self.action);
            ref.dropElement.remove(element);
        }
    };
    self.drop = function(element){
        self.droppedIn = true;
    };
};
function DeleteArea(ref){
    var self = this;
    self.dropAreaActions = new DropAreaActions(ref, "delete");
    self.clss = ko.observable("");
    self.initialize = function(element){
        self.dropAreaActions.initialize(element);
    };
    self.start = function(element){
        if(ref.draggedTask().deleteable()){
            self.clss("hilight");
        }
        self.dropAreaActions.start(element);
    };
    self.end = function(element){
        self.clss("");
        self.dropAreaActions.end(element);
    };
    self.drop = function(element){
        self.dropAreaActions.drop(element);
    };
};
function AddTaskArea(ref){
    var self = this;
    self.dropAreaActions = new DropAreaActions(ref, "add");
    self.initialize = function(element){
        self.dropAreaActions.initialize(element);
    };
    self.start = function(element){
        self.dropAreaActions.start(element);
    };
    self.end = function(element){
        var draggedTask = ref.draggedTask();
        self.dropAreaActions.end(element);
    };
    self.drop = function(element){
        self.dropAreaActions.drop(element);
    };
};
function ListOperations(){
    var self = this;
    self.InjectIntoList = function(content, val, injectPoint){
        var updated = [];
        if(injectPoint>=content.length){
            content.push(val);
            updated = content;
        }else{
            updated = reduce(content, [], function(accume, current, index){
                if(index==injectPoint) accume.push(val);
                accume.push(current);
                return accume;
            });
        }
        return updated;
    };
    self.OverWriteValue = function(lst, value, insertPoint){
        lst[insertPoint] = value;
        return lst;
    };
    self.FindIndex = function(lst, evaluator){
        var index = reduce(lst, -1, function(accume, current, index){
            return (evaluator(current) ? index : accume);
        });
        return index;
    };
};
function TaskActions(ref){
    var self = this;
    self.listOperations = new ListOperations();
    self.GetNewSelectedTaskOption = function(task){
        var newtask = new SelectedTaskOption(task);
        if(task.origin==TaskOrigins.selectedTasks) {
            newtask.toggleSelectedOption();
        }
        return newtask;
    };
    self.FindPlaceHolder = function(){
        var lst = ref.taskSequence();
        return self.listOperations.FindIndex(lst, function(n){return (n.origin==TaskOrigins.placeHolderTask);});
    };
    self.RemoveTask = function(task){
        ref.taskSequence.remove(task);
    };
    self.RemovePlaceHolder = function(){
        var i = self.FindPlaceHolder();
        var contents = ref.taskSequence();
        if(i!=-1){
            self.RemoveTask(contents[i]);
        }
    };
    self.DeleteTask = function(task){
        self.RemoveTask(task);
        self.RemovePlaceHolder();
    };
    self.RestoreTask = function(task){
        self.RemoveTask(task);
        ref.taskSequence(self.listOperations.InjectIntoList(ref.taskSequence(), task, ref.restoreLocation));
    };
    self.AddTask = function(task){
        var contents = ref.taskSequence();
        var i = self.FindPlaceHolder();
        var newtask = self.GetNewSelectedTaskOption(task);
        if(i==-1) ref.taskSequence.push(newtask);
        else ref.taskSequence(self.listOperations.OverWriteValue(contents, newtask, i));
    };
    self.ReorderTask = function(task){
        self.RemoveTask(task);
        var i = self.FindPlaceHolder();
        var newtask = getNewSelectedTaskOption(task);
        if(i==-1) ref.taskSequence.push(newtask);
        self.OverWriteTask(task, i);
        self.RemovePlaceHolder();
    };
    self.InjectTask = function(task, index){
        ref.taskSequence(self.listOperations.InjectIntoList(ref.taskSequence(), task, index));
    };
};
function DragActions(ref){
    var self = this;
    self.taskActions = new TaskActions(ref);
    self.DragEnd = function(dd){
        $( dd.proxy ).remove();
        var l = ref.dropAction().length;
        var action = ref.dropAction()[l-1];
        var task = ref.draggedTask();
        if(task!=null){
            if(action=="delete" && task.origin==TaskOrigins.selectedTasks){
                self.taskActions.DeleteTask(task);
            }else if(action=="restore" && task.origin==TaskOrigins.selectedTasks){
                self.taskActions.RestoreTask(task);
            }else if(action=="add"){
                if(task.origin==TaskOrigins.selectedTasks){
                    self.taskActions.AddTask(task, self.taskActions.FindPlaceHolder());
                }else{
                    self.taskActions.AddTask(task, self.taskActions.FindPlaceHolder());
                }
            }
        }
        ref.draggedTask(null);
    };
    self.ReplaceWithPlaceHolder= function(task){
        var content = map(ref.taskSequence(), function(current, index){
            return ((current==task) ? new PlaceHolderTask() : current);
        });
        ref.restoreLocation = self.taskActions.FindPlaceHolder();
        ref.taskSequence(content);
    };
    self.GetScrollElement = function(){
        var dropElements = ref.dropElement();
        return $(dropElements[dropElements.length-1]);
    };
    self.FindInjectionPoint = function(element, dd){
        var w = $(element).outerWidth();
        var scrollElement = self.GetScrollElement();
        /*
          relativePosition is how far horizontally the current drag element is from the left edge of the scroll area
        */
        var relativePosition = dd.offsetX - scrollElement.offset().left + scrollElement.scrollLeft();
        /*
          position is the insertion point for the new element, the insertion point is calculated as follows:

          the insertion point is the number of whole widths the current drag element is from the left edge of the scroll area
          plus one if the remainder of the division is greater than one half the element width
        */
        return parseInt(relativePosition/w)+(((relativePosition%w)>(w/2)) ? 1:0);
    };
    self.AddPlaceHolder = function(element, dd){
        var position = self.FindInjectionPoint(element, dd);
        var list = ref.taskSequence;
        var l = list().length;
        var emptyTask = reduce(list(), null, function(accume, current, index){
            return ((current.origin==TaskOrigins.placeHolderTask) ? current : accume);
        });
        if(emptyTask==null){
            emptyTask = new PlaceHolderTask();
        }else{
            //remove the emptyTask already in the list and update the content array and length
            list.remove(emptyTask);
        }
        self.taskActions.InjectTask(emptyTask, position);
    };
    self.arrowsRequired = function(){
        var scrollElement = self.GetScrollElement();
        var left = false;
        var right = false;
        if(scrollElement!=null) {
            var l = scrollElement.outerWidth();
            var innerL = scrollElement.children().outerWidth();
            var offset = scrollElement.scrollLeft();
            right = innerL>l+offset;
            left = scrollElement.scrollLeft()>0;
        };
        ref.taskPane.leftArrow.visible(left);
        ref.taskPane.rightArrow.visible(right);
    };
    self.UpdatePlaceHolder = function(element, dd){
        var da = ref.dropAction();
        var action = da[da.length-1];
        if(action=="add"){
            self.AddPlaceHolder(element, dd);
        }else if(action=="restore"){
            self.taskActions.RemovePlaceHolder();
        }
        self.arrowsRequired();
    };
};
function StaticOptionsDrag(ref){
    var self = this;
    self.dragActions = new DragActions(ref);
    self.updateDraggedTask = function(task){
        ref.draggedTask(task);
    };
    self.start = function(element, task){
        self.updateDraggedTask(task);
        return $(element)
            .clone()
            .css({
                opacity: 0.75,
                position: "absolute"
            })
            .addClass("dragging")
            .appendTo("body");
    };
    self.drag = function(element, task, dd){
        $( dd.proxy ).css({
            top: dd.offsetY,
            left: dd.offsetX
        });
        self.dragActions.UpdatePlaceHolder(element, dd);
    };
    self.end = function(element, task, dd){
        self.dragActions.DragEnd(dd);
        self.dragActions.arrowsRequired();
    }
};
function SelectedOptionsDrag(ref){
    var self = this;

    self.dragActions = new DragActions(ref);
    self.initialScroll = 0;
    self.initialOffset = 0;
    self.scrollElement = null;
    self.updateDraggedTask = function(task){
        ref.draggedTask(task);
    };
    self.start = function(element, task, dd){
        var result = false;
        self.updateDraggedTask(task);
        //grab a reference to the container and current scroll offset value real fast
        self.scrollElement = $(element).parent().parent();
        self.initialScroll = self.scrollElement.scrollLeft();
        if(task.draggable()){
            result = $(element)
                .css({
                    opacity: 0.75,
                    position: "absolute"
                })
                .addClass("dragging")
                .appendTo("body");
            self.dragActions.ReplaceWithPlaceHolder(task);
        }else{
            //if not draggable should be scrolling
            task.toggleScrolling();
            //make sure the task being used to manipulate scrolling is not deleteable
            if(task.deleteable()) task.toggleDeleteable();
            self.initialOffset = dd.offsetX;
            result = $(element);
        }
        return result;
    };
    self.drag = function(element, task, dd){
        if(task.scrolling()){
            self.scrollElement.scrollLeft(self.initialScroll+self.initialOffset-dd.offsetX);
            self.dragActions.arrowsRequired();
        }else{
            self.dragActions.UpdatePlaceHolder(element, dd);
            $( dd.proxy ).css({
                top: dd.offsetY,
                left: dd.offsetX
            });
        }
    };
    self.end = function(element, task, dd){
        if(task.scrolling()) task.toggleScrolling();
        else {
            self.dragActions.DragEnd(dd);
        }
        self.dragActions.arrowsRequired();
    };
};
function SequenceListScroller(){
    var self = this;
    self.scrollElement = null;
    self.initialScroll = 0;
    self.initialOffset = 0;
    self.start = function(element, task, dd){
        var result = false;
        self.scrollElement = $(element).parent().parent();
        self.initialScroll = self.scrollElement.scrollTop();
        self.initialOffset = dd.offsetY;
        return $(element);
    };
    self.drag = function(element, task, dd){
        self.scrollElement.scrollTop(self.initialScroll+self.initialOffset-dd.offsetY);
    };
    self.end = function(element, task, dd){
    };
};

function Arrow(){
    var self = this;
    self.visible = ko.observable(false);
};
function TaskPane(ref){
    var self = this;
    self.scrollWidth = function(){
        var total = (7>ref.taskSequence().length) ? 7*120 : ref.taskSequence().length*120;
        return total + 'px';
    };
    self.scrollHeight = function(){
        return "120px";
    };
    self.rightArrow = new Arrow();
    self.leftArrow = new Arrow();
};
function DragDropManager(){
    var self = this;
    self.restoreLocation = -1;
//The task currently being dragged
    self.draggedTask = ko.observable(null);
//The current action to be taken when drag ends
    self.dropAction = ko.observableArray(["restore"]);
    self.dropElement = ko.observableArray([null]);
    self.deleteArea = new DeleteArea(self);
    self.addTaskArea = new AddTaskArea(self);

    self.selectedOptionsDrag = new SelectedOptionsDrag(self);
    self.staticOptionsDrag = new StaticOptionsDrag(self);

    self.taskSequence = ko.observableArray([]);
    self.selectedTask = ko.computed(function(){
        var task = reduce(self.taskSequence(), null, function(accume, current, index){
            return ((current.selected()) ? current : accume);
        });
        var draggedTask = self.draggedTask();
        if(task==null){
            if(draggedTask!=null && draggedTask.selected()){
                task = draggedTask;
            }
        }
        return task;
    });
    self.taskPane = new TaskPane(self);
    self.unselectAll = function(){
        forEach(self.taskSequence(), function(current, index){
            if(current.selected()){
                current.toggleSelectedOption();
            }
        });
    };
    self.toggleSelectedOption = function(task){
        var currently = task.selected();
        self.unselectAll();
        if(!currently){
            task.toggleSelectedOption();
        }
    };
    self.selectedTaskExists = function(){
        return (self.selectedTask()!=null);
    };
    self.deleteTask = function(){
        var task = reduce(self.taskSequence(), null, function(accume, current, index){
            return ((current.selected()) ? current : accume);
        });
        if(task!=null){
            self.selectedOptionsDrag.dragActions.DeleteTask(task);
        }
    };
};
function SequenceEditPage(){
    var self = this;
    self.optionRows = [[
        new StaticTaskOption("ADD REAGENT", "add-operation"),
        new StaticTaskOption("EVAPORATE", "evaporate-operation"),
        new StaticTaskOption("TRANSFER", "transfer-operation"),
        new StaticTaskOption("REACT", "react-operation")
    ],[
        new StaticTaskOption("PROMPT", "prompt-operation"),
        new StaticTaskOption("TRAP ISOTOPE", "trap-operation"),
        new StaticTaskOption("ELUTE ISOTOPE", "elute-operation"),
        new StaticTaskOption("MOVE REACTOR", "move-operation"),
        new StaticTaskOption("EXTERNAL ADD", "externaladd-operation")
    ]];
    self.dragDropManager = new DragDropManager();
}
function SequenceListPage(){
    var self = this;
    self.sequences = ko.observable();
    self.sequenceListScroller = new SequenceListScroller();
    self.loadSequences = function(){
        $.ajax({
          url: EndpointAliasMap["sequences"],
          dataType: 'json',
          contentType: "application/json; charset=utf-8",
          type: 'POST',
          data: JSON.stringify({
            "get_sequences": {
              "userid": 1
            }
          }),
          success: function(result){
            console.log(result);
            self.sequences(result["get_sequences"]);
          },
          error: function () {
            Elixys.triggerConnectionErrorPopup(self.loadSequences);
          }
        });
    };
    self.startDateFilter = ko.observable("mm/dd/yyyy");
    self.endDateFilter = ko.observable("mm/dd/yyyy");
}
function SequencePage(){
    var self = this;
    self.navigation = ko.observable();
    self.navigationOptions = ["sequence-list", "sequence-edit"];
    self.sequenceListPage = new SequenceListPage();
    self.sequenceEditPage = new SequenceEditPage();
    self.sequencePageNavigate = ko.computed(function(sequence){
        if(self.navigation()==self.navigationOptions[0]){
            self.sequenceListPage.loadSequences();
        }else if(self.navigation()==self.navigationOptions[1]){
            console.log(sequence);
            //sequenceEditPage = new SequenceEditPage();
        }
    });
    self.newSequence = function(){
        self.navigation(self.navigationOptions[1]);
    };
    self.editSequence = function(sequence){
        self.navigation(self.navigationOptions[1]);
    };
    self.copySequence = function(sequence){
        self.navigation(self.navigationOptions[1]);
    };
}
function LoginPage() {
    var self = this;
    self.username = ko.observable("user");
    self.loggedInStatus = function(){
        var un = self.username();
        return true;
    };
}
// Overall viewmodel for this screen, along with initial state
function CoreApp() {
    var self = this;
    self.loggedIn = ko.observable(false);
    self.loginPage = new LoginPage();
    self.sequencePage = new SequencePage();
    self.navigation = ko.observable("SEQUENCES");
    self.sideBarVisible = ko.observable(false);

    self.confirmLoggedIn = function(){
        return self.loginPage.loggedInStatus();
    };
    self.logIn = function(){
        if(self.confirmLoggedIn()){
            self.loggedIn(true);
            self.sequencePage.navigation("sequence-list");
        }else{
            alert("User name and password required to login");
        }
    };
    self.logOut = function(v){
        self.loginPage.reset();
        self.loggedIn(false);
        self.sideBarVisible(false);
    };
    self.updateNavigation = function(v){
        self.navigation(v);
    };
    self.toggleSideBar = function(){
        self.sideBarVisible(!self.sideBarVisible());
    };
    self.sideBar = new SideBarNavigator(self.updateNavigation, self.logOut, self.confirmLoggedIn);
}

