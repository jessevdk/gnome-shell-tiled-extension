const Lang = imports.lang;
const Main = imports.ui.main;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const utils = Me.imports.utils;
const Screen = Me.imports.screen.Screen;
const Window = Me.imports.window.Window;

const KeyBindings = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "TiledKeyBindings"),
  Extends: GObject.Object,

  _init: function(extension) {
    this.parent();

    this.extension = extension;

    this._settings = utils.getSettings("org.gnome.shell.extensions.tiled.key-bindings");
    this._registerKeybindings();
  },

  disable: function() {
    this._unregisterKeybindings();
    this.extension = null;
  },

  _registerKeybindings: function() {
    let prefix = "tiled_";

    for (let key of this._settings.list_keys()) {
      let handler = key.replace(/-/g, "_");

      if (handler.indexOf(prefix) === 0) {
        handler = handler.slice(prefix.length);
      }

      let flags = Meta.KeyBindingFlags.NONE;

      if (!handler.match(/(activate_workspace)/)) {
        flags = Meta.KeyBindingFlags.PER_WINDOW;
      }

      Main.wm.addKeybinding(key, this._settings, flags, Shell.KeyBindingMode.NORMAL, Lang.bind(this, this["handle_" + handler]));
    }
  },

  _unregisterKeybindings: function() {
    for (let key of this._settings.list_keys()) {
      Main.wm.removeKeybinding(key);
    }
  },

  _currentWorkspace: function() {
    let s = Screen.getAtPointer();

    if (s) {
      return s.currentWorkspace;
    }

    return null;
  },

  handle_close: function(display, screen, window, event, binding) {
    window.delete(event.time);
  },

  handle_swap_master: function(display, screen, window, event, binding) {
    let ws = this._currentWorkspace();

    if (!ws || ws.focusWindows.length === 0) {
      return;
    }

    let w = ws.focusWindows[0];

    if (w.layout.floating) {
      return;
    }

    for (let i = 1; i < ws.focusWindows.length; i++) {
      let wo = ws.focusWindows[i];

      if (wo.layout.master !== w.layout.master && !wo.layout.floating) {
        ws.swap(w, wo);

        // Set a timeout to focus the originally focussed window, to override
        // the focus update for window under the cursor
        GLib.timeout_add(GLib.PRIORITY_HIGH, 50, function() {
          w.focus();
        });

        break;
      }
    }
  },

  handle_increase_master_size: function(display, screen, window, event, binding) {
    let w = Window.wrap(window);

    w.workspace.config.masters.size += 10;
    w.workspace.layout();
  },

  handle_decrease_master_size: function(display, screen, window, event, binding) {
    let w = Window.wrap(window);

    w.workspace.config.masters.size -= 10;
    w.workspace.layout();
  },

  handle_activate_workspace: function(display, screen, window, event, binding, index) {
    let s = Screen.getAtPointer();

    if (s) {
      index = index - 1;

      if (index >= 0 && index < s.nWorkspaces) {
        s.currentWorkspace = s.workspaces[index];
      }
    }
  },

  handle_move_to_workspace: function(display, screen, window, event, binding, index) {
    let w = Window.wrap(window);
    let ws = w.screen.workspaces[index - 1];

    w.workspace.removeWindow(w);
    ws.addWindow(w);
  },

  handle_activate_workspace_1: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 1);
  },

  handle_activate_workspace_2: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 2);
  },

  handle_activate_workspace_3: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 3);
  },

  handle_activate_workspace_4: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 4);
  },

  handle_activate_workspace_5: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 5);
  },

  handle_activate_workspace_6: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 6);
  },

  handle_activate_workspace_7: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 7);
  },

  handle_activate_workspace_8: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 8);
  },

  handle_activate_workspace_9: function(display, screen, window, event, binding) {
    this.handle_activate_workspace(display, screen, window, event, binding, 9);
  },

  handle_move_to_workspace_1: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 1);
  },

  handle_move_to_workspace_2: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 2);
  },

  handle_move_to_workspace_3: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 3);
  },

  handle_move_to_workspace_4: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 4);
  },

  handle_move_to_workspace_5: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 5);
  },

  handle_move_to_workspace_6: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 6);
  },

  handle_move_to_workspace_7: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 7);
  },

  handle_move_to_workspace_8: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 8);
  },

  handle_move_to_workspace_9: function(display, screen, window, event, binding) {
    this.handle_move_to_workspace(display, screen, window, event, binding, 9);
  },
});


(function(exports) {
  exports.KeyBindings = KeyBindings;
})(typeof exports === "undefined" ? {} : exports);
