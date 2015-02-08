const Main = imports.ui.main;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Theme = Me.imports.theme.Theme;
const MonkeyPatch = Me.imports.monkeyPatch.MonkeyPatch;
const Signals = Me.imports.utils.Signals;
const Window = Me.imports.window.Window;
const Screen = Me.imports.screen.Screen;
const Indicator = Me.imports.indicator.Indicator;
const Tiling = Me.imports.tiling;
const utils = Me.imports.utils;
const Settings = Me.imports.settings;
const KeyBindings = Me.imports.keyBindings.KeyBindings;

let Extension = {
  init: function() {
  },

  enable: function() {
    MonkeyPatch.enable();
    Theme.enable();

    this._indicators = [];

    let prim = global.screen.get_primary_monitor();

    for (let i = 0; i < global.screen.get_n_monitors(); i++) {
      if (i === prim) {
        this._indicators.push(new Indicator(prim));
      } else {
        this._indicators.push(null);
      }
    }

    // Create screens on all workspaces, for all monitors
    for (let i = 0; i < global.screen.get_n_workspaces(); i++) {
      this._onWorkspaceAdded(global.screen, global.screen.get_workspace_by_index(i));
    }

    // Monitor workspace-added, workspace-removed and monitors-changed
    this._screenHandlers = Signals.connect(global.screen, this, {
      "workspace-added": this._onWorkspaceAdded,
      "workspace-removed": this._onWorkspaceRemoved,
      "workspace-switched": this._onWorkspaceSwitched,
      "monitors-changed": this._onMonitorsChanged,
      "window-entered-monitor": this._onWindowEnteredMonitor,
      "workareas-changed": this._onWorkAreasChanged
    });

    this._keyBindings = new KeyBindings(this);
  },

  disable: function() {
    Theme.disable();
    MonkeyPatch.disable();

    this._screenHandlers.disconnect();
    this._keyBindings.disable();

    Settings.disable();

    // Remove wrappers for all windows
    for (let actor of global.get_window_actors()) {
      let meta = actor.get_meta_window();

      let w = Window.wrapped(meta);

      if (w) {
        w.disable();
      }
    }

    for (let screen of Screen.screens) {
      screen.disable();
    }

    for (let indicator of this._indicators) {
      if (indicator) {
        indicator.disable();
      }
    }

    this._indicators = [];
  },

  _onWorkspaceAdded: function(screen, ws) {
    for (let i = 0; i < global.screen.get_n_monitors(); i++) {
      let s = new Screen(ws, i);

      if (ws === global.screen.get_active_workspace()) {
        if (this._indicators[i]) {
          this._indicators[i].screen = s;
        }
      }
    }
  },

  _onWorkspaceRemoved: function(screen, ws) {
    for (let s of Screen.screens) {
      if (s.shellWorkspace === ws) {
        s.disable();
      }
    }
  },

  _onWorkspaceSwitched: function() {
    let ws = global.screen.get_active_workspace();

    for (let s of Screen.screens) {
      if (s.shellWorkspace === ws) {
        if (this._indicators[s.monitor]) {
          this._indicators[s.monitor].screen = s;
        }
      }
    }
  },

  _onMonitorsChanged: function(screen) {
    // TODO: complete tear-down and re-build
  },

  _onWorkAreasChanged: function(screen) {
    let ws = global.screen.get_active_workspace();

    for (let s of Screen.screens) {
      if (s.shellWorkspace === ws) {
        s.currentWorkspace.layout();
      }
    }
  },

  _onWindowEnteredMonitor: function(screen, monitor, window) {
    // TODO: move window to corresponding virtual workspace
    //log(window);
    //utils.delayForActor(window, Lang.bind(this, function(w, actor) {
    //}));
  }
};

/* jshint unused:false */
function init() {
  try {
    Extension.init();
  } catch (e) {
    log(e.message, e.stack);
  }
}

function enable() {
  try {
    Extension.enable();
  } catch (e) {
    log(e.message, e.stack);
  }
}

function disable() {
  try {
    Extension.disable();
  } catch (e) {
    log(e.message, e.stack);
  }
}
