const Lang = imports.lang;
const GObject = imports.gi.GObject;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;
const Workspace = Me.imports.workspace.Workspace;
const Window = Me.imports.window.Window;
const utils = Me.imports.utils;
const Signals = utils.Signals;
const Tiling = Me.imports.tiling;

// A screen is the representation of a single screen (monitor) for a given
// shell workspace. Since we will manage our own workspaces (viewports) per
// shell workspace, we'll have one screen per monitor per shell workspace.
const Screen = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "TiledScreen"),
  Extends: GObject.Object,

  Properties: {
    nWorkspaces: Settings.Properties.nWorkspaces(),

    currentWorkspace: GObject.param_spec_object("currentWorkspace", "", "",
                                                Workspace,
                                                GObject.ParamFlags.READABLE)
  },

  _init: function(workspace, monitor) {
    this.parent();

    this.shellWorkspace = workspace;
    this.monitor = monitor;

    this._currentWorkspace = null;
    this.workspaces = [];
    this.windows = [];

    this._gatherWindows();

    this._handlers = Signals.connect(this.shellWorkspace, this, {
      "window-added": this._onWindowAdded,
      "window-removed": this._onWindowRemoved
    });

    this._nWorkspaces = 0;
    Settings.get().bind("nWorkspaces", this);

    Screen.screens.push(this);
  },

  get workArea() {
    return this.shellWorkspace.get_work_area_for_monitor(this.monitor);
  },

  _verifyMine: function(ws) {
    return ws.screen === this;
  },

  _gatherWindows: function() {
    let windows = this.shellWorkspace.list_windows();

    for (let w of windows) {
      this._onWindowAdded(this.shellWorkspace, w);
    }
  },

  _windowDragMoving: function(window) {
    let s = Screen.getAtPointer();

    if (s !== this) {
      return;
    }

    // Delegate back to workspace
    if (this._currentWorkspace) {
      this._currentWorkspace.windowDragMoving(window);
    }
  },

  _onWindowAdded: function(ws, window) {
    utils.delayForActor(window, Lang.bind(this, function(w, actor) {
      if (actor === null) {
        return;
      }

      if (!Tiling.windowTypeCanTile(w.window_type)) {
        return;
      }

      if (w.get_monitor() !== this.monitor || w.get_workspace() !== this.shellWorkspace) {
        return;
      }

      let wrapped = Window.wrap(w);

      if (this.windows.indexOf(wrapped) !== -1) {
        return;
      }

      this.windows.push(wrapped);
      wrapped.screen = this;

      if (this._currentWorkspace !== null) {
        this._currentWorkspace.addWindow(wrapped);
      }

      wrapped._screenSignals = Signals.connect(wrapped, this, {
        "drag-moving": this._windowDragMoving
      });
    }));
  },

  _onWindowRemoved: function(ws, window) {
    let w = Window.wrap(window);
    let i = this.windows.indexOf(w);

    if (i !== -1) {
      this.windows.splice(i, 1);

      if (w.screen === this) {
        w._screenSignals.disconnect();
        w._screenSignals = null;

        w.screen = null;
      }

      if (this._currentWorkspace !== null) {
        this._currentWorkspace.removeWindow(w);
      }
    }
  },

  // Properties
  get nWorkspaces() {
    return this._nWorkspaces;
  },

  set nWorkspaces(v) {
    if (this._nWorkspaces === v) {
      return;
    }

    this._nWorkspaces = v;

    // Set active workspace to last available if needed
    if (this.currentWorkspace !== null && this.currentWorkspace.index < v) {
      this.currentWorkspace = this.workspaces[v - 1];
    }

    // Remove workspaces if needed
    for (let ws of this.workspaces.slice(v)) {
      this.removeWorkspace(ws);
    }

    // Add empty workspaces
    for (let i = this.workspaces.length; i < v; i++) {
      this.addWorkspace();
    }

    this.notify("nWorkspaces");
  },

  get currentWorkspace() {
    return this._currentWorkspace;
  },

  set currentWorkspace(ws) {
    if ((ws !== null && !this._verifyMine(ws)) || this._currentWorkspace === ws) {
      return;
    }

    if (this._currentWorkspace !== null) {
      this._currentWorkspace.deactivate();
    }

    this._currentWorkspace = ws;

    if (ws !== null) {
      ws.activate();
    }

    this.notify("currentWorkspace");
  },

  // Public methods
  addWorkspace: function() {
    let ws = new Workspace(this, this.workspaces.length);

    this.workspaces.push(ws);

    if (this.currentWorkspace === null) {
      for (let w of this.windows) {
        ws.addWindow(w);
      }

      this.currentWorkspace = ws;
    }
  },

  removeWorkspace: function(ws) {
    if (!this._verifyMine(ws)) {
      return;
    }

    // Can't remove last workspace
    if (this.workspaces.length === 0) {
      return;
    }

    if (this.currentWorkspace === ws) {
      if (ws.index === 0) {
        this.currentWorkspace = this.workspaces[1];
      } else {
        this.currentWorkspace = this.workspaces[ws.index - 1];
      }
    }

    for (let w of ws.windows) {
      w.moveToWorkspace(this.currentWorkspace);
    }

    this.workspaces.splice(ws.index, 1);
  },

  disable: function() {
    for (let ws of this.workspaces) {
      ws.disable();
    }

    this.workspaces = [];
    this.currentWorkspace = null;

    for (let w of this.windows) {
      w.disable();
    }

    this._handlers.disconnect();

    let i = Screen.screens.indexOf(this);

    if (i !== -1) {
      Screen.screens.splice(i, 1);
    }
  }
});

Screen.screens = [];

Screen.getAtPointer = function() {
  let [x, y, mod] = global.get_pointer();

  let ws = global.screen.get_active_workspace();

  for (let s of Screen.screens) {
    if (s.shellWorkspace !== ws) {
      continue;
    }

    let geom = global.screen.get_monitor_geometry(s.monitor);

    if (x >= geom.x && x <= geom.x + geom.width &&
        y >= geom.y && y <= geom.y + geom.height) {
      return s;
    }
  }

  return null;
};

(function(exports) {
  exports.Screen = Screen;
})(typeof exports === "undefined" ? {} : exports);
