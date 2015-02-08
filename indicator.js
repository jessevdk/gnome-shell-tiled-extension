const Lang = imports.lang;
const GObject = imports.gi.GObject;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const utils = Me.imports.utils;
const Screen = Me.imports.screen.Screen;
const Signals = utils.Signals;

const Indicator = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "Indicator"),
  Extends: GObject.Object,

  Properties: {
    screen: GObject.param_spec_object("screen", "", "",
                                      Screen,
                                      GObject.ParamFlags.READWRITE)
  },

  _init: function(monitor) {
    this.parent();

    this._box = new St.BoxLayout({
      style_class: "tiler-indicator-box"
    });

    this._screen = null;
    this._monitor = monitor;

    this._button = new PanelMenu.Button(0.0, "TilerIndicator");
    this._button.actor.add_actor(this._box);
    this._button.actor.track_hover = false;

    this._labels = [];
    this._workspaces = [];

    Main.panel.addToStatusArea("tiler-indicator", this._button);
  },

  disable: function() {
    this._screen = null;

    this._button.destroy();

    this._button = null;
    this._box = null;

    this._labels = [];
  },

  _clear: function() {
    for (let i = 0; i < this._labels.length; i++) {
      this._box.remove_actor(this._labels[i]);
    }

    this._labels = [];

    for (let i = 0; i < this._workspaces.length; i++) {
      this._workspaces[i].signals.disconnect();
    }

    this._workspaces = [];
  },

  set screen(val) {
    if (this._screen === val) {
      return;
    }

    if (this._screen !== null) {
      this._screenHandlers.disconnect();
      this._screenHandlers = null;
    }

    this._screen = val;
    this._currentWorkspace = null;

    this._clear();

    if (this._screen !== null) {
      this._screenHandlers = Signals.connect(this._screen, this, {
        "notify::nWorkspaces": this._onNotifyScreenNWorkspaces,
        "notify::currentWorkspace": this._onNotifyCurrentWorkspace
      });

      this._onNotifyScreenNWorkspaces();
      this._onNotifyCurrentWorkspace();
    }
  },

  get screen() {
    return this._screen;
  },

  _workspaceUpdateWindows: function(workspace) {
    let i = this._screen.workspaces.indexOf(workspace);

    if (i === -1 || !this._labels[i]) {
      return;
    }

    let n = workspace.windows.length;

    if (n > 0) {
      this._labels[i].add_style_class_name("has-windows");
    } else {
      this._labels[i].remove_style_class_name("has-windows");
    }
  },

  _updateAttention: function(workspace) {
    let i = this._screen.workspaces.indexOf(workspace);

    if (i === -1 || !this._labels[i]) {
      return;
    }

    if (workspace.attention !== "") {
      this._labels[i].add_style_class_name("needs-attention");
    } else {
      this._labels[i].remove_style_class_name("needs-attention");
    }
  },

  _onNotifyScreenNWorkspaces: function() {
    let n = this._screen.nWorkspaces;

    this._clear();

    for (let i = 0; i < n; i++) {
      let lbl = new St.Button({
        label: String(i + 1),
        track_hover: true,
        can_focus: true,
        reactive: true,
        style_class: "tiler-indicator-label"
      });

      lbl.show();

      lbl.connect("clicked", (function(ws) {
        return Lang.bind(this, function() {
          this._screen.currentWorkspace = this._screen.workspaces[ws];
        });
      }).call(this, i));

      let ws = this._screen.workspaces[i];

      this._workspaces.push({
        workspace: ws,
        signals: Signals.connect(ws, this, {
          "window-added": this._workspaceUpdateWindows,
          "window-removed": this._workspaceUpdateWindows,
          "notify::attention": this._updateAttention
        })
      });

      this._box.add_actor(lbl);
      this._labels.push(lbl);

      this._workspaceUpdateWindows(ws);
      this._updateAttention();
    }
  },

  _onNotifyCurrentWorkspace: function() {
    let ws = this._screen.currentWorkspace;

    if (this._currentWorkspace !== null) {
      this._labels[this._currentWorkspace.index].remove_style_pseudo_class("current");
    }

    this._currentWorkspace = ws;

    if (ws !== null && ws.index < this._labels.length) {
      this._labels[ws.index].add_style_pseudo_class("current");
    }
  }
});

(function(exports) {
  exports.Indicator = Indicator;
})(typeof exports === "undefined" ? {} : exports);
