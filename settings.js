const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const utils = Me.imports.utils;

const Properties = {
  nWorkspaces: function() {
    return GObject.param_spec_int("nWorkspaces", "", "",
                                  1, 9, 9,
                                  GObject.ParamFlags.READWRITE |
                                  GObject.ParamFlags.CONSTRUCT);
  }
};

const Settings = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "TiledSettings"),
  Extends: GObject.Object,

  Properties: {
    nWorkSpaces: Properties.nWorkspaces()
  },

  _init: function() {
    this.parent();

    this._settings = utils.getSettings("org.gnome.shell.extensions.tiled");
    this._settings.bind("n-workspaces", this, "nWorkspaces", Gio.SettingsBindFlags.DEFAULT);
  },

  disable: function() {
  },

  bind: function(prop, target) {
    this.bind_property(prop, target, prop, GObject.BindingFlags.DEFAULT | GObject.BindingFlags.SYNC_CREATE);
  }
});

let settings = null;

function get() {
  if (!settings) {
    settings = new Settings();
  }

  return settings;
}

function disable() {
  if (settings) {
    settings.disable();
    settings = null;
  }
}

(function(exports) {
  exports.Properties = Properties;
  exports.Settings = Settings;
  exports.get = get;
  exports.disable = disable;
})(typeof exports === "undefined" ? {} : exports);
