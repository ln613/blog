var funcs = ['circle', 'rect', 'text', 'line'];
var ns = '';

function toObj(el) {
  var o = {};
  funcs.forEach(function (f) {
    o[f] = function (ps) {
      append(el, f, ps);
    }
  });
  [roundText, seg].forEach(function (f) {
    o[f.name] = f(o)
  });
  return o;
}

function append(p, c, ps) {
  var t = p.appendChild(document.createElementNS(ns, c));
  Object.keys(ps).forEach(function (k) {
    prop(t, k, ps[k]);
  });
  return t;
}

function prop(t, k, p) {
  if (k === 'text')
    t.appendChild(document.createTextNode(p));
  else
    t.setAttribute(k, p);
}

function svg(id, w, h, bg) {
  var el = document.getElementById(id);
  var t = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ns = t.namespaceURI;
  t.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  el.appendChild(t);
  var r = toObj(t);
  if (bg)
    r.rect({ x: 0, y: 0, width: w, height: h, fill: bg });
  return r;
}

function roundText(o) {
  return function (x, y, r, c1, t, fs, c2) {
    o.circle({ cx: x, cy: y, r: r, fill: c1 });
    o.text({
      x: x, y: y, fill: c2 || 'black', text: t || '',
      'text-anchor': 'middle', 'alignment-baseline': 'middle', 'font-size': fs || 20
    });
  }
}

function seg(o) {
  return function (x1, y1, x2, y2, t, c) {
    o.line({ x1: x1, y1: y1, x2: x2, y2: y2, 'stroke-width': t || 1, stroke: c || 'black' });
  }
}

function tree(t) {
  var w = 800, h = 500;
  var o = svg('tree', w, h);
  node(o, t, 0, w / 2, 50, 100);
}

function node(o, t, i, x, y, d) {
  if (i >= t.length || !t[i]) return;
  var c1 = 2 * i + 1, c2 = c1 + 1;
  if (c1 < t.length && t[c1])
    o.seg(x, y, x - d, y + d);
  if (c2 < t.length && t[c2])
    o.seg(x, y, x + d, y + d);
  o.roundText(x, y, 30, t[i] === 1 ? 'orange' : 'green');
  node(o, t, c1, x - d, y + d, d);
  node(o, t, c2, x + d, y + d, d);
}