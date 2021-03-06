var CellView = Backbone.View.extend({
    tagName: "li",
    initialize: function () {
        this.model.on('change', this.render, this);
    },
    render: function () {
        this.$el.html(this.model.get("value"));
        return this;
    }
});

var PointerView = Backbone.View.extend({
    el: "div.pointer",
    initialize: function (options) {
        this.model.on("change", this.render, this);
        this.interpreter = options.interpreter;
    },
    render: function () {
        this.$el.animate({
            "margin-left": this.model.get("index") * this.$el.width()
        }, 30);
        return this;
    }
});

var TapeView = Backbone.View.extend({
    el: ".tape",
    initialize: function (options) {
        this.pointer = options.pointer;
        this.interpreter = options.interpreter;
    },
    render: function () {
        _.forEach(this.model.models, function (model) {
            this.$el.append((new CellView({
                model: model
            })).render().el);
        }, this);

        new PointerView({
            model: this.pointer,
            interpreter: this.interpreter
        }).render();

        return this;
    }
});


var InterpreterView = Backbone.View.extend({
    delay: 30,
    el: "#interpreter",
    initialize: function (options) {
        this.pointer = options.pointer;
        this.tape = options.tape;
        this.editor = options.editor;
    },
    events: {
        "click #run": "run",
        "click #pause": "pause",
        "click #continue": "loop",
        "click #stop": "stop",
        "change #input": "receiveInput",
        "change #delay": "changeDelay"
    },
    render: function () {
	    this.input  = this.$el.find("#input");
        this.output = this.$el.find("#output");
        this.preview = this.$el.find("#preview");
        this.buttons = new ButtonSwitchView({
            el: this.el
        }).render();
        new TapeView({
            model: this.tape,
            pointer: this.pointer,
            interpreter: this
        }).render();
        this.preview.hide();
    },
    showPreview: function () {
        this.preview.show();
        this.editor.hide();
    },
    showEditor: function () {
        this.preview.hide();
        this.editor.show();
    },
    run: function () {
        this.reset();
        this.preview.empty();
        this.output.empty();
        this.input.val("");
        this.interpreter = new Interpreter(
            this.editor.val(),
            this.tape,
            this.pointer,
            this.out.bind(this),
            this.awaitInput.bind(this),
            this.instruction.bind(this));
        this.loop();
        this.showPreview();
    },
    out: function (cell) {
        this.output.append(cell.char());
    },
    awaitInput: function (cell) {
        this.input.parent().show();
        this.pause();
        this.inputTarget = cell;
    },
    receiveInput: function () {
        this.inputTarget.put(this.input.val());
        this.input.parent().hide();
        this.input.val("");
        this.loop();
    },
    removeCaret: function () {
        this.editor
            .find("span.caret")
            .contents()
            .unwrap();
    },
    instruction: function(index) {
        this.removeCaret();

        var source = this.editor.val(),
            caret = $("<span>")
            .addClass("caret")
            .html(source.charAt(index));

        this.preview
            .empty()
            .append(source.substr(0, index))
            .append(caret)
            .append(source.substr(index + 1));
    },
    loop: function () {
        this.interval = setInterval(function () {
            try {
                this.interpreter.next();
            } catch (e) {
                clearInterval(this.interval);
                this.buttons.stop();
                this.showEditor();
            }
        }.bind(this), this.delay);
    },
    pause: function () {
        clearInterval(this.interval);
    },
    reset: function () {
        this.pointer.set("index", 0);
        _(this.tape.models).forEach(function (model) {
            model.set("value", 0);
        }, this);
    },
    stop: function () {
        this.pause();
        this.reset();
        this.buttons.stop();
        this.showEditor();
    },
    changeDelay: function () {
        this.pause();
        this.delay = $("#delay").val();
        this.loop();
    }
});


var ButtonSwitchView = Backbone.View.extend({
    events: {
        "click #run": "run",
        "click #stop": "stop",
        "click #pause": "pause",
        "click #continue": "loop",
        "keyup #source": "stop"
    },
    run: function () {
        this.$el.find("#run").hide();
        this.$el.find("#stop, #pause").show();
        return false;
    },
    stop: function () {
        this.$el.find("#stop, #pause, #continue").hide();
        this.$el.find("#run").show();
        return false;
    },
    pause: function () {
        this.$el.find("#pause").hide();
        this.$el.find("#continue").show();
        return false;
    },
    loop: function () {
        this.$el.find("#continue").hide();
        this.$el.find("#pause").show();
        return false;
    }
});
