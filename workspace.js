const Lang = imports.lang;
const GObject = imports.gi.GObject;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Tiling = Me.imports.tiling;
const utils = Me.imports.utils;
const Signals = utils.Signals;
const Window = Me.imports.window.Window;
const Screen = Me.imports.window.Screen;

// A workspace represents a single tiled workspace inside a screen. This is
// not the same as a shell workspace since shell workspaces are not independent
// per screen/monitor. A tiled workspace is a colleciton of windows with a
// layout provided by a tiling scheme.
const Workspace = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "TiledWorkspace"),
  Extends: GObject.Object,

  Signals: {
    "window-added": { param_types: [Window] },
    "window-removed": { param_types: [Window] }
  },

  Properties: {
    attention: GObject.param_spec_string("attention", "", "", "", GObject.ParamFlags.READABLE)
  },

  _init: function(screen, index) {
    this.parent();

    this.index = index;
    this.screen = screen;
    this.tiling = Tiling.Schemes.Vertical;

    this.windows = [];
    this.focusWindows = [];

    this._didLayout = false;

    this.config = this.tiling.init(this.screen.workArea);
  },

  _updateAttention: function() {
    let attention = "";

    for (let i = 0; i < this.windows.length; i++) {
      let w = this.windows[i];

      if (w.attention === "urgent") {
        attention = "urgent";
        break;
      }

      if (w.attention !== "") {
        attention = w.attention;
      }
    }

    if (this.attention !== attention) {
      this.attention = attention;
      this.notify("attention");
    }
  },

  _layoutWindow: function(window, layout) {
    window.layout = layout;

    if (layout.frame) {
      window.moveResize(layout.frame);
    }
  },

  layout: function() {
    if (this.screen.currentWorkspace !== this) {
      return;
    }

    let area = this.screen.workArea;

    this.config.masters.size = Math.min(Math.max(this.config.masters.size, 0.1 * area.width), area.width * 0.9);

    let l = this.tiling.layout(this.screen.workArea,
                               this.config,
                               this.windows.length);

    if (!l) {
      return;
    }

    for (let i = 0; i < this.windows.length; i++) {
      this._layoutWindow(this.windows[i], l[i]);
    }
  },

  swap: function(w1, w2) {
    let i1 = this.windows.indexOf(w1);
    let i2 = this.windows.indexOf(w2);

    if (i1 === -1 || i2 === -1) {
      return;
    }

    this.windows[i1] = w2;
    this.windows[i2] = w1;

    let l1 = w1.layout;
    let l2 = w2.layout;

    this._layoutWindow(w1, l2);
    this._layoutWindow(w2, l1);
  },

  activate: function() {
    for (let w of this.windows) {
      w.map();
    }

    this.layout();
  },

  deactivate: function() {
    for (let w of this.windows) {
      w.unmap();
    }
  },

  disable: function() {
    this.windows = [];
    this.screen = null;
  },

  _windowFocussed: function(window) {
    if (!window.focussed) {
      return;
    }

    let i = this.focusWindows.indexOf(window);

    if (i !== -1) {
      this.focusWindows.splice(i, 1);
    }

    this.focusWindows.unshift(window);
  },

  windowDragMoving: function(window) {
    let [x, y, mod] = global.get_pointer();

    for (let i = 0; i < this.windows.length; i++) {
      let w = this.windows[i];
      let frame = w.layout.frame;

      if (!frame) {
        continue;
      }

      if (x >= frame.x && x <= frame.x + frame.width &&
          y >= frame.y && y <= frame.y + frame.height)
      {
        if (window === w) {
          return;
        }

        this.swap(window, w);
        break;
      }
    }
  },

  addWindow: function(window) {
    window.save();

    this.windows.push(window);

    if (window.focussed) {
      this.focusWindows.unshift(window);
    } else {
      this.focusWindows.push(window);
    }

    window._workspaceSignals = Signals.connect(window, this, {
      "notify::focussed": this._windowFocussed,
      "notify::attention": this._updateAttention
    });

    window.workspace = this;

    if (this.screen.currentWorkspace === this) {
      window.map();
    }

    this.layout();
    this._updateAttention();

    this.emit("window-added", window);
  },

  removeWindow: function(window) {
    let i = this.windows.indexOf(window);

    if (i !== -1) {
      this.windows.splice(i, 1);

      let fi = this.focusWindows.indexOf(window);

      if (fi !== -1) {
        this.focusWindows.splice(fi, 1);
      }

      if (window.workspace === this) {
        window._workspaceSignals.disconnect();

        window._workspaceSignals = null;
        window.workspace = null;
      }

      if (this.screen.currentWorkspace === this) {
        window.unmap();
      }

      this.layout();
      this._updateAttention();

      this.emit("window-removed", window);
    }
  }
});

(function(exports) {
  exports.Workspace = Workspace;
})(typeof exports === "undefined" ? {} : exports);
