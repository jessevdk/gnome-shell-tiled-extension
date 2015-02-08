const Me = imports.misc.extensionUtils.getCurrentExtension();
const GIRepository = imports.gi.GIRepository;
const GLib = imports.gi.GLib;

const path = GLib.build_filenamev([Me.path, "libext"]);

GIRepository.Repository.prepend_search_path(path);
GIRepository.Repository.prepend_library_path(path);

const Ext = imports.gi.TiledExt;

function set_size_constraints(window, minWidth, minHeight, maxWidth, maxHeight) {
  Ext.set_size_constraints(window, minWidth, minHeight, maxWidth, maxHeight);
}

function store_size_constraints(window) {
  return Ext.store_size_constraints(window);
}

function restore_size_constraints(window, constraints) {
  Ext.restore_size_constraints(window, constraints);
}

(function(exports) {
  exports.set_size_constraints = set_size_constraints;
  exports.store_size_constraints = store_size_constraints;
  exports.restore_size_constraints = restore_size_constraints;
})(typeof exports === "undefined" ? {} : exports);
