/*
 * voxel.js — a small isometric voxel renderer written for this site.
 *
 * There is no WebGL and no dependency here: every scene is drawn with 2D canvas
 * paths in a 2:1 axonometric projection. The trick that keeps it cheap is that
 * static geometry is rasterised once into an offscreen buffer, in back-to-front
 * order, and every animation frame only blits that buffer and draws the handful
 * of things that actually move. A full terrain scene costs one drawImage plus a
 * few dozen paths per frame instead of a few thousand.
 *
 * Scenes:
 *   'world'  — a terrain chunk that streams in column by column, back to front,
 *              the way a client receives chunks from a server.
 *   'karts'  — a closed circuit with voxel karts running a lap on it.
 *   'ambient'— a slow drift of cubes used behind the hero copy.
 */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------------- maths */

  // 2:1 isometric projection. One voxel is TILE wide, TILE/2 tall on screen,
  // and CUBE_H pixels of vertical rise per unit of world height.
  function projector(tile) {
    var halfW = tile / 2;
    var halfH = tile / 4;
    var rise = tile / 2;
    return {
      halfW: halfW,
      halfH: halfH,
      rise: rise,
      // x runs to the lower-right, z to the lower-left, y is up.
      x: function (x, z) { return (x - z) * halfW; },
      y: function (x, z, y) { return (x + z) * halfH - y * rise; },
      depth: function (x, z, y) { return x + z + y * 0.001; }
    };
  }

  // Deterministic value noise: same seed always yields the same landscape, so a
  // scene can be re-rendered on resize without the terrain jumping around.
  function makeNoise(seed) {
    var s = seed >>> 0;
    function hash(x, y) {
      var h = x * 374761393 + y * 668265263 + s * 2147483647;
      h = (h ^ (h >> 13)) >>> 0;
      h = (h * 1274126177) >>> 0;
      return (h & 0xffff) / 0xffff;
    }
    function smooth(t) { return t * t * (3 - 2 * t); }
    return function (x, y) {
      var xi = Math.floor(x), yi = Math.floor(y);
      var xf = smooth(x - xi), yf = smooth(y - yi);
      var a = hash(xi, yi), b = hash(xi + 1, yi);
      var c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return (a * (1 - xf) + b * xf) * (1 - yf) + (c * (1 - xf) + d * xf) * yf;
    };
  }

  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (amount >= 0) {
      r += (255 - r) * amount; g += (255 - g) * amount; b += (255 - b) * amount;
    } else {
      r *= 1 + amount; g *= 1 + amount; b *= 1 + amount;
    }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }

  // A cube is three faces: the lit top, a darker left wall and a darker-still
  // right wall. Keeping the ratios fixed is what makes the light read as one sun.
  var FACE_TOP = 0.10, FACE_LEFT = -0.30, FACE_RIGHT = -0.52;

  /* ------------------------------------------------------------- drawing */

  function faceTop(ctx, p, sx, sy) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + p.halfW, sy + p.halfH);
    ctx.lineTo(sx, sy + p.halfH * 2);
    ctx.lineTo(sx - p.halfW, sy + p.halfH);
    ctx.closePath();
    ctx.fill();
  }

  // A prism is a column of voxels drawn as one shape: the top face plus two
  // side walls running `height` units down. Terrain is almost entirely prisms,
  // which is why a 24x24 chunk stays cheap.
  function prism(ctx, p, sx, sy, height, color, bands) {
    var drop = height * p.rise;

    ctx.fillStyle = shade(color, FACE_TOP);
    faceTop(ctx, p, sx, sy);

    ctx.fillStyle = shade(color, FACE_LEFT);
    ctx.beginPath();
    ctx.moveTo(sx - p.halfW, sy + p.halfH);
    ctx.lineTo(sx, sy + p.halfH * 2);
    ctx.lineTo(sx, sy + p.halfH * 2 + drop);
    ctx.lineTo(sx - p.halfW, sy + p.halfH + drop);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shade(color, FACE_RIGHT);
    ctx.beginPath();
    ctx.moveTo(sx + p.halfW, sy + p.halfH);
    ctx.lineTo(sx, sy + p.halfH * 2);
    ctx.lineTo(sx, sy + p.halfH * 2 + drop);
    ctx.lineTo(sx + p.halfW, sy + p.halfH + drop);
    ctx.closePath();
    ctx.fill();

    // Strata: a thin band of subsoil under the surface, then bedrock, so a cut
    // face reads as layered ground rather than a solid extruded colour.
    if (bands && drop > p.rise * 0.9) {
      var bandDepth = Math.min(drop, p.rise * 0.85);
      ctx.fillStyle = shade(bands, FACE_LEFT);
      ctx.beginPath();
      ctx.moveTo(sx - p.halfW, sy + p.halfH);
      ctx.lineTo(sx, sy + p.halfH * 2);
      ctx.lineTo(sx, sy + p.halfH * 2 + bandDepth);
      ctx.lineTo(sx - p.halfW, sy + p.halfH + bandDepth);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(bands, FACE_RIGHT);
      ctx.beginPath();
      ctx.moveTo(sx + p.halfW, sy + p.halfH);
      ctx.lineTo(sx, sy + p.halfH * 2);
      ctx.lineTo(sx, sy + p.halfH * 2 + bandDepth);
      ctx.lineTo(sx + p.halfW, sy + p.halfH + bandDepth);
      ctx.closePath();
      ctx.fill();
    }
  }

  function cube(ctx, p, sx, sy, color, alpha) {
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    prism(ctx, p, sx, sy, 1, color, null);
    if (alpha !== undefined) ctx.globalAlpha = 1;
  }

  /* ------------------------------------------------------------ scene: world */

  var WORLD_PALETTE = {
    grass: '#4f9a63',
    grassDeep: '#3d7c4f',
    dirt: '#6a4a35',
    stone: '#59616f',
    sand: '#c2ac78',
    water: '#245f92',
    trunk: '#4e3626',
    leaf: '#3d8450',
    leafDeep: '#336f43',
    snow: '#d7e0ea'
  };

  function buildWorld(size, seed) {
    var noise = makeNoise(seed);
    var columns = [];
    var sea = 2;

    // Sample the field first, then run one box blur over it. Without the blur
    // the edge falloff leaves single-tile spits that render as pillars hanging
    // off the side of the island.
    var field = new Float32Array(size * size);
    for (var fx = 0; fx < size; fx++) {
      for (var fz = 0; fz < size; fz++) {
        var v = noise(fx / 7.5, fz / 7.5) * 0.65 + noise(fx / 3.1, fz / 3.1) * 0.35;
        var e = Math.min(fx, fz, size - 1 - fx, size - 1 - fz);
        v -= Math.max(0, 2.6 - e) * 0.17;
        field[fx * size + fz] = v;
      }
    }
    var smoothed = new Float32Array(size * size);
    for (var bx = 0; bx < size; bx++) {
      for (var bz = 0; bz < size; bz++) {
        var sum = 0, count = 0;
        for (var dx = -1; dx <= 1; dx++) {
          for (var dz = -1; dz <= 1; dz++) {
            var nx = bx + dx, nz = bz + dz;
            if (nx < 0 || nz < 0 || nx >= size || nz >= size) continue;
            sum += field[nx * size + nz];
            count++;
          }
        }
        smoothed[bx * size + bz] = sum / count;
      }
    }

    for (var x = 0; x < size; x++) {
      for (var z = 0; z < size; z++) {
        var n = smoothed[x * size + z];
        var edge = Math.min(x, z, size - 1 - x, size - 1 - z);
        var h = Math.round(n * 7);
        var color, band = WORLD_PALETTE.stone, water = false;
        if (h <= sea) { h = sea; color = WORLD_PALETTE.water; water = true; }
        else if (h === sea + 1) { color = WORLD_PALETTE.sand; band = WORLD_PALETTE.sand; }
        else if (h >= 6) { color = WORLD_PALETTE.snow; band = WORLD_PALETTE.stone; }
        else { color = h > 4 ? WORLD_PALETTE.grassDeep : WORLD_PALETTE.grass; band = WORLD_PALETTE.dirt; }

        var tree = null;
        // Keep trees off the chunk border: a canopy that runs past the edge
        // gives away that this is a slab rather than a piece of a world.
        if (!water && h > sea + 1 && h < 6 && edge > 2) {
          var r = noise(x * 3.7 + 11, z * 3.7 + 7);
          if (r > 0.86) tree = 2 + Math.round(r);
        }
        columns.push({ x: x, z: z, h: h, color: color, band: band, water: water, tree: tree });
      }
    }
    // Back-to-front paint order. Streaming in this order also happens to look
    // like a world resolving toward the camera.
    columns.sort(function (a, b) { return (a.x + a.z) - (b.x + b.z); });
    return columns;
  }

  // Project the whole scene at unit scale to get its true bounding box, then
  // pick the tile size and origin that centre it in the canvas. Guessing these
  // left large dead margins at some viewport sizes.
  function fit(columns, w, h, margin) {
    var u = projector(1);
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var i = 0; i < columns.length; i++) {
      var c = columns[i];
      var top = c.h + (c.tree ? c.tree + 2 : 0);
      var sx = u.x(c.x, c.z);
      var sy = u.y(c.x, c.z, top);
      var bottom = u.y(c.x, c.z, c.h) + (c.h + 2) * u.rise + u.halfH * 2;
      if (sx - u.halfW < minX) minX = sx - u.halfW;
      if (sx + u.halfW > maxX) maxX = sx + u.halfW;
      if (sy < minY) minY = sy;
      if (bottom > maxY) maxY = bottom;
    }
    var usable = margin === undefined ? 0.94 : margin;
    var tile = Math.min((w * usable) / (maxX - minX), (h * usable) / (maxY - minY));
    return {
      tile: tile,
      ox: w / 2 - ((minX + maxX) / 2) * tile,
      oy: h / 2 - ((minY + maxY) / 2) * tile
    };
  }

  function drawColumn(ctx, p, c, ox, oy) {
    var sx = ox + p.x(c.x, c.z);
    var sy = oy + p.y(c.x, c.z, c.h);
    prism(ctx, p, sx, sy, c.h + 2, c.color, c.band);
    if (c.tree) {
      // Trunk, then a canopy: a ring of four leaf blocks around the trunk and
      // two stacked on top. Drawn back-to-front within the tree itself.
      prism(ctx, p, sx, oy + p.y(c.x, c.z, c.h + c.tree), c.tree - 1, WORLD_PALETTE.trunk, null);
      var base = c.h + c.tree;
      var ring = [[-1, 0], [0, -1], [1, 0], [0, 1]];
      ring.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
      for (var i = 0; i < ring.length; i++) {
        var dx = ring[i][0], dz = ring[i][1];
        cube(ctx, p, ox + p.x(c.x + dx, c.z + dz), oy + p.y(c.x + dx, c.z + dz, base),
          WORLD_PALETTE.leafDeep);
      }
      cube(ctx, p, sx, oy + p.y(c.x, c.z, base), WORLD_PALETTE.leaf);
      cube(ctx, p, sx, oy + p.y(c.x, c.z, base + 1), WORLD_PALETTE.leaf);
    }
  }

  /* ------------------------------------------------------------ scene: karts */

  var KART_COLORS = ['#e8574c', '#4cc4e8', '#f2c14e', '#9b6cf0'];

  var TRACK_PAD = 2;
  var TRACK_ROAD = 4;

  function buildTrack(size) {
    // A rounded rectangle of road tiles laid on a grass plate.
    var tiles = [];
    var deco = makeNoise(90210);
    var pad = TRACK_PAD;
    var inner = pad + TRACK_ROAD;
    for (var x = 0; x < size; x++) {
      for (var z = 0; z < size; z++) {
        var onOuter = x >= pad && x < size - pad && z >= pad && z < size - pad;
        var onInner = x >= inner && x < size - inner && z >= inner && z < size - inner;
        var road = onOuter && !onInner;
        var color = road ? '#3a3f4b' : (onInner ? '#3f7f4f' : '#356b3d');
        // Start/finish grid, laid across the full width of the near straight.
        if (road && z >= size - inner && x >= size / 2 - 1 && x < size / 2 + 1) {
          color = ((x + z) % 2 === 0) ? '#e9edf2' : '#22262e';
        } else if (road) {
          // Faint lane markings on the inside kerb.
          var kerb = (x === inner - 1 || x === size - inner || z === inner - 1 || z === size - inner);
          if (kerb && ((x + z) % 2 === 0)) color = '#8d4a48';
        }
        var tile = { x: x, z: z, h: 1, color: color, band: '#262a33', road: road };
        if (!road) {
          // Sparse trees on the apron and in the infield, so the circuit sits
          // in a place rather than floating on a green rectangle.
          var rr = deco(x * 5.3 + 3, z * 5.3 + 9);
          if (rr > 0.88) { tile.tree = 2; tile.h = 1; }
        }
        tiles.push(tile);
      }
    }
    tiles.sort(function (a, b) { return (a.x + a.z) - (b.x + b.z); });
    return tiles;
  }

  // Parametric lap around the rounded rectangle, in world coordinates.
  function trackPoint(t, size) {
    var radius = (size / 2 - TRACK_PAD) - TRACK_ROAD / 2;
    var a = radius, b = radius;
    var cx = (size - 1) / 2, cz = (size - 1) / 2;
    // Squircle: rounder than a rectangle, squarer than an ellipse.
    var ang = t * Math.PI * 2;
    var cs = Math.cos(ang), sn = Math.sin(ang);
    var k = 0.62;
    var px = cx + a * Math.sign(cs) * Math.pow(Math.abs(cs), k);
    var pz = cz + b * Math.sign(sn) * Math.pow(Math.abs(sn), k);
    return { x: px, z: pz };
  }

  // Blend a hex colour toward white and return hex, so the result can be fed
  // back into shade() (which only parses hex).
  function lightenHex(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * amount);
    var g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * amount);
    var b = Math.round((n & 255) + (255 - (n & 255)) * amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function drawKart(ctx, p, ox, oy, wx, wz, color, lean) {
    var sx = ox + p.x(wx, wz);
    var sy = oy + p.y(wx, wz, 1) + lean;
    // The kart is drawn in its own smaller projection so it sits at roughly
    // two thirds of a track tile.
    var q = projector(p.halfW * 1.85);

    // Contact shadow first, so the kart reads as resting on the road.
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#05070b';
    faceTop(ctx, q, sx, sy + q.rise * 0.16);
    ctx.globalAlpha = 1;

    // Chassis, then a lighter cabin block set back and up.
    prism(ctx, q, sx, sy - q.rise * 0.45, 0.55, color, null);
    prism(ctx, q, sx, sy - q.rise * 1.05, 0.35, lightenHex(color, 0.28), null);
    ctx.restore();
  }

  /* ------------------------------------------------------------ the engine */

  var reduceMotion = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function Scene(canvas, kind, options) {
    this.canvas = canvas;
    this.kind = kind;
    this.opts = options || {};
    this.ctx = canvas.getContext('2d');
    this.buffer = document.createElement('canvas');
    this.bufferCtx = this.buffer.getContext('2d');
    this.running = false;
    this.visible = false;
    this.t = 0;
    this.streamed = 0;
    this.seed = this.opts.seed || 1337;
    this.last = 0;
    this.frame = null;
    this.resize();
  }

  Scene.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(rect.width));
    var h = Math.max(1, Math.round(rect.height));
    if (!w || !h) return;
    // Cap the device pixel ratio: past 2x the extra fill rate buys nothing the
    // eye can see on a chunky voxel scene.
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.w = w; this.h = h; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.buffer.width = this.canvas.width;
    this.buffer.height = this.canvas.height;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.build();
  };

  Scene.prototype.build = function () {
    var w = this.w, h = this.h;
    if (this.kind === 'world') {
      this.size = w < 420 ? 16 : 22;
      this.columns = buildWorld(this.size, this.seed);
      var wf = fit(this.columns, w, h, 0.95);
      this.p = projector(wf.tile);
      this.ox = wf.ox;
      this.oy = wf.oy;
      this.streamed = 0;
      this.bufferCtx.clearRect(0, 0, w, h);
    } else if (this.kind === 'karts') {
      this.size = w < 420 ? 14 : 18;
      this.tiles = buildTrack(this.size);
      var kf = fit(this.tiles, w, h, 0.95);
      this.p = projector(kf.tile);
      this.ox = kf.ox;
      this.oy = kf.oy;
      this.streamed = 0;
      this.bufferCtx.clearRect(0, 0, w, h);
      this.karts = KART_COLORS.map(function (c, i) {
        // Spread them around the lap and give each a slightly different pace so
        // the pack keeps rearranging instead of orbiting in lockstep.
        return { color: c, t: i * 0.19, speed: 0.9 + i * 0.06 };
      });
    } else {
      this.p = projector(Math.max(18, Math.min(w, h) / 12));
      this.motes = [];
      var count = w < 600 ? 14 : 26;
      var noise = makeNoise(this.seed);
      for (var i = 0; i < count; i++) {
        this.motes.push({
          x: noise(i, 1) * w,
          y: noise(i, 2) * h,
          s: 0.35 + noise(i, 3) * 0.9,
          drift: 6 + noise(i, 4) * 16,
          phase: noise(i, 5) * Math.PI * 2,
          alpha: 0.05 + noise(i, 6) * 0.14
        });
      }
    }
  };

  // Terrain and track are painted into the buffer once, incrementally, so the
  // per-frame cost stays at one blit plus the moving parts.
  Scene.prototype.stream = function (dt) {
    var list = this.kind === 'world' ? this.columns : this.tiles;
    if (!list) return;
    if (this.streamed >= list.length) return;
    var perSecond = list.length / 1.6;
    var target = reduceMotion.matches
      ? list.length
      : Math.min(list.length, this.streamed + perSecond * dt);
    var ctx = this.bufferCtx;
    for (var i = Math.floor(this.streamed); i < Math.floor(target); i++) {
      var item = list[i];
      drawColumn(ctx, this.p, item, this.ox, this.oy);
    }
    this.streamed = target;
  };

  Scene.prototype.draw = function (dt) {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.clearRect(0, 0, w, h);

    if (this.kind === 'ambient') {
      for (var i = 0; i < this.motes.length; i++) {
        var m = this.motes[i];
        var y = m.y + Math.sin(this.t * 0.35 + m.phase) * m.drift;
        var x = m.x + Math.cos(this.t * 0.22 + m.phase) * m.drift * 0.6;
        var pp = projector(this.p.halfW * 2 * m.s);
        ctx.globalAlpha = m.alpha;
        cube(ctx, pp, x, y, i % 3 === 0 ? '#7c5cff' : '#39d6c3');
        ctx.globalAlpha = 1;
      }
      return;
    }

    this.stream(dt);
    ctx.drawImage(this.buffer, 0, 0, this.buffer.width, this.buffer.height, 0, 0, w, h);

    var done = this.streamed >= (this.kind === 'world' ? this.columns.length : this.tiles.length);

    if (this.kind === 'world' && done) {
      // Packets travelling toward the chunk: a nod to a client pulling world
      // state off a socket rather than generating it locally.
      var lanes = 3;
      for (var k = 0; k < lanes; k++) {
        var prog = (this.t * 0.34 + k / lanes) % 1;
        var px = this.ox - this.size * this.p.halfW * 0.62 + prog * this.size * this.p.halfW * 1.24;
        var py = this.oy - this.p.rise * 3.4 + Math.sin(prog * Math.PI) * -this.p.rise * 1.1
          + prog * this.size * this.p.halfH * 0.5;
        ctx.globalAlpha = Math.sin(prog * Math.PI) * 0.85;
        cube(ctx, projector(this.p.halfW * 0.85), px, py, k % 2 ? '#39d6c3' : '#7c5cff');
        ctx.globalAlpha = 1;
      }
    }

    if (this.kind === 'karts' && done) {
      var self = this;
      var ordered = this.karts.slice().sort(function (a, b) {
        var pa = trackPoint(a.t, self.size), pb = trackPoint(b.t, self.size);
        return (pa.x + pa.z) - (pb.x + pb.z);
      });
      for (var j = 0; j < ordered.length; j++) {
        var kart = ordered[j];
        var pt = trackPoint(kart.t, this.size);
        var bob = Math.sin(this.t * 6 + j) * this.p.rise * 0.06;
        drawKart(ctx, this.p, this.ox, this.oy, pt.x, pt.z, kart.color, bob);
      }
    }
  };

  Scene.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0.016;
    this.last = now;
    this.t += dt;
    if (this.karts && !reduceMotion.matches) {
      for (var i = 0; i < this.karts.length; i++) {
        var k = this.karts[i];
        k.t = (k.t + k.speed * dt * 0.075) % 1;
      }
    }
    this.draw(dt);
    this.frame = global.requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    if (reduceMotion.matches) {
      // One static, fully-resolved frame. No loop, no motion.
      this.draw(1);
      this.draw(1);
      this.running = false;
      return;
    }
    this.frame = global.requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.stop = function () {
    this.running = false;
    if (this.frame) global.cancelAnimationFrame(this.frame);
    this.frame = null;
  };

  /* --------------------------------------------------------------- mounting */

  var scenes = [];

  function mount(canvas) {
    var kind = canvas.getAttribute('data-voxel');
    var seed = parseInt(canvas.getAttribute('data-seed') || '0', 10) || 1337;
    var scene = new Scene(canvas, kind, { seed: seed });
    scenes.push(scene);

    if ('IntersectionObserver' in global) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          scene.visible = e.isIntersecting;
          if (e.isIntersecting) scene.start();
          else scene.stop();
        });
      }, { rootMargin: '120px' });
      io.observe(canvas);
    } else {
      scene.visible = true;
      scene.start();
    }
    return scene;
  }

  function init() {
    var nodes = document.querySelectorAll('[data-voxel]');
    for (var i = 0; i < nodes.length; i++) mount(nodes[i]);

    var resizeTimer;
    global.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        scenes.forEach(function (s) {
          s.resize();
          if (!s.running && s.visible) s.start();
        });
      }, 180);
    });

    // Never burn a frame on a tab nobody is looking at.
    document.addEventListener('visibilitychange', function () {
      scenes.forEach(function (s) {
        if (document.hidden) s.stop();
        else if (s.visible) s.start();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.VoxelScenes = { scenes: scenes, mount: mount };
})(window);
