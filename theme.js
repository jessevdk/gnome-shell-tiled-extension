const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Theme = {
  _theme: null,

  enable: function() {
    let settings = new Gio.Settings({
      schema_id: "org.gnome.desktop.interface"
    });

    this._theme = settings.get_string("gtk-theme");

    // Left over from before, make sure to revert back to some default when
    // disabled again
    if (this._theme === "Tiled") {
      this._theme = "Adwaita";
      return;
    }

    let themes = this._find(this._theme);

    if (themes === null) {
      // Do not install custom theme, nothing to base on...
      this._theme = null;
    } else {
      this._install(themes);
    }
  },

  disable: function() {
    if (this._theme === null) {
      return;
    }

    this._setTheme(this._theme);
    this._theme = null;
  },

  _install: function(base) {
    let d = GLib.build_filenamev([GLib.get_home_dir(), ".local", "share", "themes", "Tiled"]);
    let themef = GLib.build_filenamev([d, "gtk-3.0", "gtk.css"]);

    GLib.mkdir_with_parents(GLib.path_get_dirname(themef), parseInt("0755", 8));

    let css = "" +
      "@import url('" + base.gtk3 + "');\n" +
      ".window-frame, .window-frame:backdrop {\n" +
      "  border-style: none;\n" +
      "  border: 0;\n" +
      "  box-shadow: 0 0 0 black;\n" +
      "}\n" +
      ".window-frame, .window-frame:backdrop, .titlebar {\n" +
      "  border-radius: 0;\n" +
      "}\n";

    try {
      GLib.file_set_contents(themef, css);
    } catch (e) {
      log("Failed to install theme", e);
      this._theme = null;
      return;
    }

    // Do gtk2 also
    themef = GLib.build_filenamev([GLib.get_home_dir(), ".themes", "Tiled", "gtk-2.0", "gtkrc"]);
    GLib.mkdir_with_parents(GLib.path_get_dirname(themef), parseInt("0755", 8));

    try {
      GLib.file_set_contents(themef, "include \"" + base.gtk2 + "\"\n");
    } catch (e) {
      log("Failed to install theme2", e);
      this._theme = null;
      return;
    }

    // And the metacity theme...
    themef = GLib.build_filenamev([d, "metacity-1", "metacity-theme-3.xml"]);
    GLib.mkdir_with_parents(GLib.path_get_dirname(themef), parseInt("0755", 8));

    try {
      let metacity = String(GLib.file_get_contents(base.metacity)[1]);

      // unset rounded window borders
      metacity = metacity.replace(/(rounded_(top|bottom)_(left|right))="[0-9]+"/g, "$1=\"false\"");
      metacity = metacity.replace(/<include name="rounded_hilight" \/>/g, "<include name=\"hilight\" />");
      metacity = metacity.replace(/^.*draw_ops="rounded_border_.*$/gm, "");

      GLib.file_set_contents(themef, metacity);
    } catch (e) {
      log("Failed to install metacity theme", e.message, e.stack);
      this._theme = null;
      return;
    }

    this._setTheme("Tiled");
  },

  _setTheme: function(name) {
    let settings = new Gio.Settings({
      schema_id: "org.gnome.desktop.wm.preferences"
    });

    settings.set_string("theme", name);
    
    settings = new Gio.Settings({
      schema_id: "org.gnome.desktop.interface"
    });

    settings.set_string("gtk-theme", name);
  },

  _find: function(name) {
    let dirs = this._searchDirs();

    for (let i = 0; i < dirs.length; i++) {
      let d = dirs[i];
      let f3 = Gio.file_new_for_path(GLib.build_filenamev([d, name, "gtk-3.0", "gtk.css"]));
      let f2 = Gio.file_new_for_path(GLib.build_filenamev([d, name, "gtk-2.0", "gtkrc"]));
      let meta = Gio.file_new_for_path(GLib.build_filenamev([d, name, "metacity-1", "metacity-theme-3.xml"]));

      try {
        if (f2.query_exists(null) && f3.query_exists(null) && meta.query_exists(null)) {
          if (name === "Adwaita") {
            f3 = "resource:///org/gtk/libgtk/theme/Adwaita/gtk-contained.css";
          } else {
            f3 = f3.get_path();
          }

          f2 = f2.get_path();
          meta = meta.get_path();

          return {
            gtk2: f2,
            gtk3: f3,
            metacity: meta
          };
        }
      } catch (e) {
      }
    }

    return null;
  },

  _searchDirs: function() {
    let dirs = [
      GLib.build_filenamev([GLib.get_home_dir(), ".themes"]),
    ];

    let sdirs = GLib.get_system_data_dirs();

    for (let i = 0; i < sdirs.length; i++) {
      dirs.push(GLib.build_filenamev([sdirs[i], "themes"]));
    }

    return dirs;
  }
};

(function(exports) {
  exports.Theme = Theme;
})(typeof exports === "undefined" ? {} : exports);