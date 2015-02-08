const Lang = imports.lang;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const Signals = {
  connect: function(source, target, signals) {
    let ret = {
      source: source,
      signals: {},

      disconnect: function() {
        if (!this.source) {
          return;
        }

        for (let k in this.signals) {
          this.source.disconnect(this.signals[k]);
        }

        this.signals = null;
        this.source = null;
      }
    };

    for (let name in signals) {
      ret.signals[name] = source.connect(name, Lang.bind(target, signals[name]));
    }

    return ret;
  }
};

function log() {
  let args = Array.prototype.slice.call(arguments);
  let caller = log.caller;

  let msg = "[tiled] ";

  if (caller) {
    msg += caller.name + ": ";
  }

  for (let i = 0; i < args.length; i++) {
    let s;
    let val = args[i];

    try {
      s = JSON.stringify(val);
    } catch (e) {
      s = String(val);
    }

    if (i !== 0) {
      msg += " ";
    }

    msg += s;
  }

  global.log(msg);
}

function uniqueTypeName(parent, name) {
  let i = 1;

  let names = GObject.type_children(parent).map(function(t) { return GObject.type_name(t); });
  let uname = name;

  while (names.indexOf("Gjs_" + uname) !== -1) {
    uname = name + i;
    i++;
  }

  return uname;
}

function delayForActor(window, cb) {
  let actor = window.get_compositor_private();

  if (actor !== null) {
    cb(window, actor);
  } else {
    GLib.timeout_add(GLib.PRIORITY_HIGH, 1, function() {
      cb(window, window.get_compositor_private());
      return false;
    });
  }
}

let source = null;

function getSettings(schema) {
  if (source === null) {
    let dir = Me.dir.get_child("schemas");
    let parent = Gio.SettingsSchemaSource.get_default();
    source = Gio.SettingsSchemaSource.new_from_directory(dir.get_path(), parent, false);
  }

  return new Gio.Settings({ settings_schema: source.lookup(schema, true) });
}

(function(exports) {
  exports.Signals = Signals;
  exports.log = log;
  exports.uniqueTypeName = uniqueTypeName;
  exports.delayForActor = delayForActor;
  exports.getSettings = getSettings;
})(typeof exports === "undefined" ? {} : exports);
