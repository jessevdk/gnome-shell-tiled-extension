const Meta = imports.gi.Meta;
const Lang = imports.lang;

const Schemes = {
  Vertical: {
    layout: function(area, c, nwindows) {
      let ret = [];

      function rowWise(n, x, w, isMaster) {
        let y = area.y;

        for (let i = 0; i < n; i++) {
          let nrem = n - i;
          let h = Math.round((area.height - (y - area.y)) / nrem - (c.spacing * (nrem - 1)));

          ret.push({
            frame: {
              x: x,
              y: y,
              width: w,
              height: h
            },
            master: isMaster
          });

          y += h + c.spacing;
        }
      }

      let w1 = Math.round(c.masters.size - c.spacing);
      let n1 = Math.min(c.masters.n, nwindows);
      let x1 = area.x;

      if (c.masters.n >= nwindows) {
        w1 = area.width;
      }

      rowWise(n1, x1, w1, true);

      let w2 = area.width - w1 - c.spacing;
      let n2 = nwindows - c.masters.n;
      let x2 = w1 + c.spacing;

      rowWise(n2, x2, w2, false);
      return ret;
    },

    init: function(area) {
      return {
        masters: {
          n: 1,
          size: area.width / 2,
        },
        spacing: 1
      };
    }
  },

  Horizontal: {
    _swap: function(rect) {
      return {
        x: rect.y,
        y: rect.x,
        width: rect.height,
        height: rect.width
      };
    },

    layout: function(area, c, nwindows) {
      let ret = Schemes.Vertical(this._swap(area), c, nwindows);

      return ret.map(Lang.bind(this, function(item) {
        item.frame = this._swap(item.frame);
        return item;
      }));
    },

    init: function(area) {
      return {
        masters: {
          n: 1,
          size: area.height / 2
        },
        spacing: 1
      };
    }
  },

  Float: {
    layout: function(area, c, windows) {
      return windows.map(function() {
        return {floating: true};
      });
    },

    init: function() {
      return {};
    }
  }
};

const tilingWindowTypes = [
  Meta.WindowType.NORMAL
];

function windowTypeCanTile(type) {
  return tilingWindowTypes.indexOf(type) !== -1;
}

(function(exports) {
  exports.Schemes = Schemes;
  exports.windowTypeCanTile = windowTypeCanTile;
})(typeof exports === "undefined" ? {} : exports);
