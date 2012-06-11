$(document).ready(function () {
////////////////////////////////
// Namespacing
///////////////////////////////
    //To make our code cleaner and to avoid libraries from overwriting our code we do the following
    //We attach an object to the window to store our class definitions
    window.WireJSNamespace = {};
    //We attach an object to the window to store our app instance
    window.WireJSApp = {};
    //creating a shortcut to the object that stores our class definitions
    var Wire = window.WireJSNamespace;
    //creating a shortcut to the object that stores our app instance
    var wireApp = window.WireJSApp;

////////////////////////////////
// Routes
///////////////////////////////

    var AppRouter = Backbone.Router.extend({
        routes:{
            "screen/:screen_num":"screen"
        },

        screen:function (screen_num) {
            wireApp.appState.setCurrentScreenIndex(screen_num);
        }
    })


////////////////////////////////
// Models
///////////////////////////////

    //AppState will be used to keep track of what screen we are on
    var AppState = Backbone.Model.extend({

        getCurrentScreenIndex:function () {
            return parseInt(this.get('currentScreenIndex'));
        },
        setCurrentScreenIndex:function (value) {
            this.set('currentScreenIndex', parseInt(value));
        },
        getTotalNumOfScreens:function () {
            return this.get('totalNumOfScreens');
        },
        setTotalNumOfScreens:function (value) {
            this.set('totalNumOfScreens', value);
        }
    });
    wireApp.appState = new AppState({currentScreenIndex:0, totalNumOfScreens:0});


////////////////////////////////
// Views
///////////////////////////////

    /*
     This is the base view class we will be extending screens off of.
     It does the following:
     1. Reads the screeb-path attribute for the screen's div tag
     2. Loads the template source asynchronously
     3. Compiles the template asynchronously
     4. Renders the template asynchronously
     5. Injects rendered HTML code into div

     NOTE: This looks more complicated than it should because of JS's scoping issues/bad habits with async calls
     */
    Wire.ExternalContentView = Backbone.View.extend({
        contentURL:null,
        contentFileName:null,
        initExternalContent:function () {
            this.contentURL = $(this.el).attr('screen-path');
            if (this.contentURL) {
                this.loadAndRenderContent(this.contentURL);
            }
        },
        loadAndRenderContent:function (url) {

            this.contentFileName = url.split('/').pop().split('.').shift();
            $.ajax({
                url:url,
                method:'GET',
                success:this.ajaxCompleteHandlerFactory(this)
            });
        },
        ajaxCompleteHandlerFactory:function (view) {
            return function (data) {
                $(view.el).html(data);
                if (view.onContentRendered) {
                    view.onContentRendered();
                }
            };
        }
    })

    //Class for the main app view. Responsible for instantiating ScreenViews
    Wire.AppView = Backbone.View.extend({
        el:$('#appView'),
        model:wireApp.appState,
        events:{


        },
        initialize:function () {
            log('init appView')
            this.model.bind('change', this.render, this);
            var screenDivs = $(".screenView");
            for (var i = 0; i < screenDivs.length; i++) {
                new Wire.ScreenView({el:screenDivs[i]});
            }
        },
        render:function () {

        }
    });

    //Class for screen views.
    Wire.ScreenView = Wire.ExternalContentView.extend({
        model:wireApp.appState,
        initialize:function () {
            this.initExternalContent();
            log(this.el);

        },
        getScreenIndex:function () {
            return $(this.el).index();
        },
        onContentRendered:function () {
            this.model.bind('change:currentScreenIndex', this.render, this)
            var totalScreensNum = this.model.getTotalNumOfScreens() + 1;
            this.model.setTotalNumOfScreens(totalScreensNum);
            this.render();
        },
        render:function () {

            if (this.model.getCurrentScreenIndex() == this.getScreenIndex()) {
                $(this.el).removeClass('hidden');
            } else {
                $(this.el).addClass('hidden');

            }
        }
    })

////////////////////////////////
// Kick off
///////////////////////////////

    wireApp.AppView = new Wire.AppView;

    wireApp.router = new AppRouter();

    Backbone.history.start();
    log('app init')


////////////////////////////////
// Utility Functions/Misc Hacks
///////////////////////////////

    $('.notSelectable').click(disableSelection)
    $('.notSelectable').mousedown(disableSelection)
    $('.notSelectable').mouseup(disableSelection)

    function disableSelection(event) {
        var target = event.target;
        if (typeof target.onselectstart != "undefined") //IE route
            target.onselectstart = function () {
                return false
            }

        else if (typeof target.style.MozUserSelect != "undefined") //Firefox route
            target.style.MozUserSelect = "none"

        else //All other route (ie: Opera)
            target.onmousedown = function () {
                return false
            }


    }

    function log(message) {
        try {
            console.log(message);
        } catch (e) {

        }
    }

})
;
