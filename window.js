const Lang = imports.lang;
const GObject = imports.gi.GObject;
const Meta = imports.gi.Meta;
const GLib = imports.gi.GLib;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const utils = Me.imports.utils;
const ext = Me.imports.ext;
const Signals = utils.Signals;

const Window = new Lang.Class({
  Name: utils.uniqueTypeName(GObject.Object, "TiledWindow"),
  Extends: GObject.Object,

  Properties: {
    focussed: GObject.param_spec_boolean("focussed", "", "", false, GObject.ParamFlags.READWRITE),
    attention: GObject.param_spec_string("attention", "", "", "", GObject.ParamFlags.READABLE)
  },

  Signals: {
    drag_moving: { param_types: [] }
  },

  _init: function(metaWindow) {
    this.parent();

    this.metaWindow = metaWindow;
    this.frame = null;
    this._timeoutMoveResizeId = 0;
    this.screen = null;
    this.workspace = null;

    let actor = this.metaWindow.get_compositor_private();

    if (actor !== null) {
      this._no_shadow = actor.no_shadow;
      actor.no_shadow = true;
    } else {
      this._no_shadow = false;
    }

    this._wasMinimized = this.metaWindow.minimized;
    this._mapped = true;
    this._positionSize = null;

    this._windowSignals = Signals.connect(this.metaWindow, this, {
      "position-changed": this._positionSizeChanged,
      "size-changed": this._positionSizeChanged,
      "focus": this._focusChanged,
      "notify::urgent": this._updateAttention,
      "notify::demands-attention": this._updateAttention
    });

    this._nMoveResizeCorrections = 0;

    this.layout = {};

    this._updateAttention();
  },

  _updateAttention: function() {
    let attention = "";

    if (this.metaWindow.urgent) {
      attention = "urgent";
    } else if (this.metaWindow.demands_attention) {
      attention = "demands";
    }

    if (this.attention !== attention) {
      this.attention = attention;
      this.notify("attention");
    }
  },

  _positionSizeChanged: function() {
    if (this.frame === null || this._nMoveResizeCorrections > 5) {
      if (this._timeoutMoveResizeId) {
        GLib.source_remove(this._timeoutMoveResizeId);
      }

      // Set a timeout to break set/reset loops
      this._timeoutMoveResizeId = GLib.timeout_add(GLib.PRIORITY_HIGH, 1, Lang.bind(this, function() {
        this._timeoutMoveResizeId = 0;
        this._nMoveResizeCorrections = 0;
        this._positionSizeChanged();
      }));

      this._nMoveResizeCorrections = 0;
      return;
    }

    let fr = this.metaWindow.get_frame_rect();

    if (fr.width !== this.frame.width ||
        fr.height !== this.frame.height ||
        fr.x !== this.frame.x ||
        fr.y !== this.frame.y) {

      let moving = (global.display.get_grab_op() === Meta.GrabOp.MOVING);

      if ((fr.x !== this.frame.x || fr.y !== this.frame.y) && moving) {
        this.emit("drag-moving");
      }

      this.moveResize(this.frame);
      this._nMoveResizeCorrections++;
    } else {
      // Reset nMoveResizeCorrections after some timeout
      if (this._timeoutMoveResizeId === 0) {
        this._timeoutMoveResizeId = GLib.timeout_add(GLib.PRIORITY_HIGH, 20, Lang.bind(this, function() {
          this._timeoutMoveResizeId = 0;
          this._nMoveResizeCorrections = 0;
        }));
      }
    }
  },

  _focusChanged: function() {
    this.notify("focussed");
  },

  get title() {
    return this.metaWindow.title;
  },

  get focussed() {
    return this.metaWindow.has_focus();
  },

  set focussed(val) {
    if (val) {
      this.focus();
    }
  },

  focus: function(timestamp) {
    this.metaWindow.focus(timestamp || 0);
  },

  disable: function() {
    if (this.metaWindow === null) {
      return;
    }

    if (this._timeoutMoveResizeId !== 0) {
      this._timeoutMoveResizeId = 0;
      GLib.source_remove(this._timeoutMoveResizeId);
    }

    this._windowSignals.disconnect();
    this._windowSignals = null;

    this.map();
    this.restore();

    let actor = this.metaWindow.get_compositor_private();
    actor.no_shadow = this._no_shadow;

    this.metaWindow._tiledWindow = null;
    this.metaWindow = null;
  },

  map: function() {
    if (this._mapped) {
      return;
    }

    this._mapped = true;

    if (!this._wasMinimized) {
      this.metaWindow.unminimize();
    }
  },

  moveResize: function(p) {
    if (this._positionSize === null) {
      this.save();
    }

    let rect = new Meta.Rectangle({
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height
    });

    this.frame = rect;
    let r = this.metaWindow.frame_rect_to_client_rect(rect);

    this.metaWindow.unmaximize(Meta.MaximizeFlags.BOTH);
    ext.set_size_constraints(this.metaWindow, r.width, r.height, r.width, r.height);
    this.metaWindow.move_resize_frame(true, p.x, p.y, p.width, p.height);
  },

  unmap: function() {
    if (!this._mapped) {
      return;
    }

    this._wasMinimized = this.metaWindow.minimized;
    this.metaWindow.minimize();

    this._mapped = false;
  },

  save: function() {
    this._positionSize = this.metaWindow.get_frame_rect();
    this._constraints = ext.store_size_constraints(this.metaWindow);
  },

  restore: function() {
    if (this._positionSize && this.metaWindow) {
      this.moveResize(this._positionSize);
      ext.restore_size_constraints(this.metaWindow, this._constraints);
      this._positionSize = null;
    }

    this.frame = null;
  }
});

Window.wrapped = function(metaWindow) {
  return metaWindow._tiledWindow;
};

Window.wrap = function(metaWindow) {
  let w = Window.wrapped(metaWindow);

  if (w) {
    return w;
  }

  w = new Window(metaWindow);
  metaWindow._tiledWindow = w;

  return w;
};
