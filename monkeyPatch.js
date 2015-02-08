const Main = imports.ui.main;

function override(obj, func, patch) {
  let orig = obj[func];

  obj[func] = function() {
    let args = Array.prototype.slice.apply(arguments);

    args.push(orig);
    return patch.apply(this, args);
  };

  return {
    object: obj,
    name: func,
    orig: orig
  };
}

let patched = [];

const MonkeyPatch = {
  enable: function() {
    patched = [
      override(Main.wm, "_shouldAnimateActor", function() { return false; })
    ];
  },

  disable: function() {
    for (let p of patched) {
      override(p.object, p.name, p.orig);
    }

    patched = [];
  }
};


(function(exports) {
  exports.MonkeyPatch = MonkeyPatch;
})(typeof exports === "undefined" ? {} : exports);
