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
 *   'paper'  — a cut-paper arena with two teams moving between cover.
 *   'rooms'  — yellow rooms joined by doorways, with a figure wandering them.
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

  /* ----------------------------------------------------------- the figures */

  // A person: a body block under a head block, drawn in their own projection so
  // the figure is just under a tile wide and half again as tall as the walls it
  // walks between — small enough to belong to the scene, large enough to read
  // as somebody rather than as scenery. Both the paper troopers and the
  // wanderer are this, with different colours.
  function drawFigure(ctx, p, ox, oy, wx, wz, ground, body, head, bob) {
    var sx = ox + p.x(wx, wz);
    var sy = oy + p.y(wx, wz, ground) + bob;
    // Body and head get their own projections: a single one makes two stacked
    // cubes, and two cubes read as cargo rather than as somebody standing.
    var qb = projector(p.halfW * 1.25);
    var qh = projector(p.halfW * 0.95);
    var shoulder = sy - qb.rise * 1.5;

    // Contact shadow first, so the figure reads as standing on the floor.
    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.fillStyle = '#05070b';
    faceTop(ctx, qb, sx, sy + qb.rise * 0.12);
    ctx.globalAlpha = 1;

    prism(ctx, qb, sx, shoulder, 1.5, body, null);
    prism(ctx, qh, sx, shoulder - qh.rise * 0.85, 0.85, head, null);
    ctx.restore();
  }

  /* ------------------------------------------------------------ scene: paper */

  var PAPER_PALETTE = {
    sheet:     '#efe4cb',
    sheetAlt:  '#e7d9bb',
    kraft:     '#d5b489',
    kraftDeep: '#bf9a6d',
    crease:    '#c0a883',
    red:       '#e0655a',
    blue:      '#59aee0'
  };

  var TEAM_COLORS = [PAPER_PALETTE.red, PAPER_PALETTE.blue, PAPER_PALETTE.red, PAPER_PALETTE.blue];

  function buildArena(size, seed) {
    var noise = makeNoise(seed);
    var tiles = [];
    var walkable = [];
    var height = [];

    for (var x = 0; x < size; x++) {
      for (var z = 0; z < size; z++) {
        var edge = Math.min(x, z, size - 1 - x, size - 1 - z);
        // Two spawns on opposite corners: this is a game with two sides, and
        // the scene should say so before anyone reads a word of the copy.
        var red = x > 0 && x < 3 && z > 0 && z < 3;
        var blue = x > size - 4 && x < size - 1 && z > size - 4 && z < size - 1;

        var h = 1;
        var band = PAPER_PALETTE.crease;
        var color = ((((x / 2) | 0) + ((z / 2) | 0)) % 2 === 0)
          ? PAPER_PALETTE.sheetAlt
          : PAPER_PALETTE.sheet;
        if (red) color = PAPER_PALETTE.red;
        if (blue) color = PAPER_PALETTE.blue;

        // Cardboard cover, kept off both spawns and off the border so the
        // arena keeps a walkable ring around the outside.
        var cover = false;
        if (!red && !blue && edge > 1 && noise(x / 2.6 + 5, z / 2.6 + 11) > 0.63) {
          h = 2 + Math.round(noise(x * 2.1, z * 2.1) * 0.9);
          color = h > 2 ? PAPER_PALETTE.kraftDeep : PAPER_PALETTE.kraft;
          band = PAPER_PALETTE.kraftDeep;
          cover = true;
        }

        walkable.push(!cover);
        height.push(h);
        tiles.push({ x: x, z: z, h: h, color: color, band: band, cover: cover });
      }
    }
    tiles.sort(function (a, b) { return (a.x + a.z) - (b.x + b.z); });
    return { tiles: tiles, walkable: walkable, height: height };
  }

  // Paper is cut, not moulded. Outlining the top face of every raised block
  // is what separates a stack of cardboard from a stack of stone.
  function drawPaperColumn(ctx, p, c, ox, oy) {
    var sx = ox + p.x(c.x, c.z);
    var sy = oy + p.y(c.x, c.z, c.h);
    prism(ctx, p, sx, sy, c.h + 2, c.color, c.band);
    if (!c.cover) return;
    ctx.strokeStyle = shade(c.color, -0.36);
    ctx.lineWidth = Math.max(1, p.halfW * 0.05);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + p.halfW, sy + p.halfH);
    ctx.lineTo(sx, sy + p.halfH * 2);
    ctx.lineTo(sx - p.halfW, sy + p.halfH);
    ctx.closePath();
    ctx.stroke();
  }

  // A paper plane crossing the arena: the one thing on screen that is folded
  // rather than stacked, and the quickest way to say what the game is made of.
  function drawPlane(ctx, p, ox, oy, wx, wz, lift, heading) {
    var gx = ox + p.x(wx, wz);
    var gy = oy + p.y(wx, wz, 1);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#05070b';
    faceTop(ctx, projector(p.halfW * 0.8), gx, gy);
    ctx.globalAlpha = 1;

    var s = p.halfW * 1.05;
    ctx.translate(gx, gy - lift * p.rise);
    ctx.rotate(heading);
    // Two triangles meeting at the fold: the near wing catches the light, the
    // far one sits in its shadow.
    ctx.fillStyle = PAPER_PALETTE.sheet;
    ctx.beginPath();
    ctx.moveTo(s * 1.6, 0);
    ctx.lineTo(-s, s * 0.8);
    ctx.lineTo(-s * 0.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = shade(PAPER_PALETTE.sheet, -0.26);
    ctx.beginPath();
    ctx.moveTo(s * 1.6, 0);
    ctx.lineTo(-s, -s * 0.8);
    ctx.lineTo(-s * 0.4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Somewhere open to walk to. Cover blocks are solid, so retry a few times
  // before settling for wherever we landed.
  function openSpot(noise, walkable, size, n) {
    for (var i = 0; i < 8; i++) {
      var x = 1 + Math.floor(noise(n * 2.7 + i * 13.1, 4.2) * (size - 2));
      var z = 1 + Math.floor(noise(n * 2.7 + i * 13.1, 9.6) * (size - 2));
      if (walkable[x * size + z]) return { x: x, z: z };
    }
    return { x: (size - 1) / 2, z: (size - 1) / 2 };
  }

  /* ------------------------------------------------------------ scene: rooms */

  var ROOMS_PALETTE = {
    wall:      '#cdb662',
    wallAlt:   '#c2aa57',
    wallDeep:  '#8d7a3c',
    carpet:    '#a68f4a',
    carpetAlt: '#9b8444',
    base:      '#786636',
    light:     '#f4e7ae'
  };

  function buildRooms(size, seed) {
    // Straight wall runs on a coarse lattice, then a doorway punched into every
    // span and the occasional span dropped outright so two rooms become a hall.
    // Long walls with gaps in them is what makes a floor read as rooms: a maze
    // carver gives corridors and scattered gaps give a field of pillars, and
    // the Backrooms are neither.
    var noise = makeNoise(seed);
    var solid = [];
    var lit = [];
    var lamps = [];
    var i, x, z;
    for (i = 0; i < size * size; i++) { solid.push(false); lit.push(false); }
    function at(a, b) { return a * size + b; }

    // The outer wall, so the plate ends in a room rather than in mid-air.
    for (i = 0; i < size; i++) {
      solid[at(i, 0)] = true;
      solid[at(i, size - 1)] = true;
      solid[at(0, i)] = true;
      solid[at(size - 1, i)] = true;
    }

    var step = 4;
    for (x = step; x < size - 1; x += step) {
      for (z = 1; z < size - 1; z++) solid[at(x, z)] = true;
    }
    for (z = step; z < size - 1; z += step) {
      for (x = 1; x < size - 1; x++) solid[at(x, z)] = true;
    }

    // Opening every span guarantees the whole floor stays connected, without
    // anyone having to go looking for a path afterwards.
    function openSpan(vertical, line, from) {
      var lo = from + 1;
      var hi = Math.min(from + step - 1, size - 2);
      if (lo > hi) return;
      var s;
      if (noise(line * 1.7 + 2, from * 1.7 + 3) > 0.76) {
        for (s = lo; s <= hi; s++) solid[vertical ? at(line, s) : at(s, line)] = false;
        return;
      }
      s = Math.min(hi, lo + Math.floor(noise(line * 2.9 + 7, from * 2.9) * (hi - lo + 1)));
      solid[vertical ? at(line, s) : at(s, line)] = false;
    }
    for (x = step; x < size - 1; x += step) {
      for (z = 0; z < size - 1; z += step) openSpan(true, x, z);
    }
    for (z = step; z < size - 1; z += step) {
      for (x = 0; x < size - 1; x += step) openSpan(false, z, x);
    }

    // One light at the centre of every room. The ceiling grid is the only thing
    // in this place that was ever laid out on purpose, so it should be the one
    // thing on the floor that is evenly spaced.
    var half = (step / 2) | 0;
    for (x = 0; x < size - 1; x += step) {
      for (z = 0; z < size - 1; z += step) {
        var cx = Math.min(x + half, size - 2);
        var cz = Math.min(z + half, size - 2);
        if (solid[at(cx, cz)]) continue;
        lit[at(cx, cz)] = true;
        lamps.push({ x: cx, z: cz, phase: lamps.length * 1.7 });
      }
    }

    var tiles = [];
    var open = [];
    for (x = 0; x < size; x++) {
      for (z = 0; z < size; z++) {
        var wall = solid[at(x, z)];
        open.push(!wall);
        tiles.push({
          x: x, z: z,
          // Walls stand one unit over the carpet: tall enough to read as rooms
          // from this angle, low enough that what is behind them is still there
          // to see.
          h: wall ? 2 : 1,
          color: wall
            ? ((x + z) % 2 === 0 ? ROOMS_PALETTE.wall : ROOMS_PALETTE.wallAlt)
            : (lit[at(x, z)]
              ? ROOMS_PALETTE.light
              : ((x + z) % 2 === 0 ? ROOMS_PALETTE.carpet : ROOMS_PALETTE.carpetAlt)),
          band: wall ? ROOMS_PALETTE.wallDeep : ROOMS_PALETTE.base
        });
      }
    }
    tiles.sort(function (a, b) { return (a.x + a.z) - (b.x + b.z); });
    return { tiles: tiles, open: open, lamps: lamps };
  }

  /* ------------------------------------------------------------ the engine */

  var reduceMotion = global.matchMedia
    ? global.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  // WCAG 2.2.2: animation that starts by itself and runs indefinitely needs a
  // way to stop it. When paused, scenes still draw their final resting frame.
  var paused = false;

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

  // Every grounded scene has the same shape: a plate of columns fitted to the
  // canvas, plus the painter that knows how to draw one column of it. Keeping
  // that in one place is what lets a new scene be a builder and a painter
  // rather than another branch of everything below.
  Scene.prototype.lay = function (list, painter) {
    this.plate = list;
    this.painter = painter;
    var f = fit(list, this.w, this.h, 0.95);
    this.p = projector(f.tile);
    this.ox = f.ox;
    this.oy = f.oy;
    this.streamed = 0;
    this.bufferCtx.clearRect(0, 0, this.w, this.h);
  };

  Scene.prototype.build = function () {
    var w = this.w, h = this.h;
    this.plate = null;
    this.karts = null;
    this.troopers = null;
    this.wanderer = null;

    if (this.kind === 'world') {
      this.size = w < 420 ? 16 : 22;
      this.lay(buildWorld(this.size, this.seed), drawColumn);

    } else if (this.kind === 'karts') {
      this.size = w < 420 ? 14 : 18;
      this.lay(buildTrack(this.size), drawColumn);
      this.karts = KART_COLORS.map(function (c, i) {
        // Spread them around the lap and give each a slightly different pace so
        // the pack keeps rearranging instead of orbiting in lockstep.
        return { color: c, t: i * 0.19, speed: 0.9 + i * 0.06 };
      });

    } else if (this.kind === 'paper') {
      this.size = w < 420 ? 13 : 17;
      var arena = buildArena(this.size, this.seed);
      this.lay(arena.tiles, drawPaperColumn);
      this.walkable = arena.walkable;
      this.ground = arena.height;
      this.spots = makeNoise(this.seed + 17);
      var spots = this.spots, walk = this.walkable, asize = this.size;
      this.troopers = TEAM_COLORS.map(function (c, i) {
        var home = openSpot(spots, walk, asize, i);
        var away = openSpot(spots, walk, asize, i + 40);
        return {
          color: c, step: i + 40, speed: 1.5 + i * 0.22,
          x: home.x, z: home.z, tx: away.x, tz: away.z
        };
      });
      this.plane = { t: 0.35 };

    } else if (this.kind === 'rooms') {
      // One more than a whole number of rooms, so the lattice lands a wall on
      // the far border instead of clipping the last room in half.
      this.size = w < 420 ? 13 : 21;
      var rooms = buildRooms(this.size, this.seed);
      this.lay(rooms.tiles, drawColumn);
      this.open = rooms.open;
      this.lamps = rooms.lamps;
      this.roomNoise = makeNoise(this.seed + 991);
      // Start the walk as close to the middle as an open tile allows, so the
      // figure is somewhere near the centre of the frame when the scene lands.
      var mid = (this.size - 1) / 2, best = Infinity, sx = 1, sz = 1;
      for (var rx = 1; rx < this.size - 1; rx++) {
        for (var rz = 1; rz < this.size - 1; rz++) {
          if (!rooms.open[rx * this.size + rz]) continue;
          var d = Math.abs(rx - mid) + Math.abs(rz - mid);
          if (d < best) { best = d; sx = rx; sz = rz; }
        }
      }
      this.wanderer = { px: sx, pz: sz, cx: sx, cz: sz, nx: sx, nz: sz, u: 1, step: 0 };

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

  // The plate is painted into the buffer once, incrementally, so the per-frame
  // cost stays at one blit plus whatever is moving on top of it.
  Scene.prototype.stream = function (dt) {
    var list = this.plate;
    if (!list) return;
    if (this.streamed >= list.length) return;
    var perSecond = list.length / 1.6;
    var target = reduceMotion.matches
      ? list.length
      : Math.min(list.length, this.streamed + perSecond * dt);
    var ctx = this.bufferCtx;
    for (var i = Math.floor(this.streamed); i < Math.floor(target); i++) {
      this.painter(ctx, this.p, list[i], this.ox, this.oy);
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

    var done = this.streamed >= this.plate.length;

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

    if (this.kind === 'paper' && done) {
      var pp = this.p;
      var team = this.troopers.slice().sort(function (a, b) {
        return (a.x + a.z) - (b.x + b.z);
      });
      for (var ti = 0; ti < team.length; ti++) {
        var tr = team[ti];
        // A path between two open spots can still cross a block of cover, so
        // read the ground height underneath: the trooper climbs it instead of
        // walking through it.
        var gx = Math.min(this.size - 1, Math.max(0, Math.round(tr.x)));
        var gz = Math.min(this.size - 1, Math.max(0, Math.round(tr.z)));
        drawFigure(ctx, pp, this.ox, this.oy, tr.x, tr.z, this.ground[gx * this.size + gz],
          tr.color, lightenHex(tr.color, 0.62),
          Math.sin(this.t * 8 + ti) * pp.rise * 0.05);
      }
      // A plane thrown corner to corner, with a pause at the end of the loop
      // so it reads as something someone threw rather than a looping belt.
      if (this.plane.t < 0.72) {
        // Along the diagonal where x rises as z falls: on screen that is a flat
        // left-to-right crossing, which is the one heading a folded plane reads
        // at from this angle.
        var u = this.plane.t / 0.72;
        var lo = 2, hi = this.size - 3;
        drawPlane(ctx, pp, this.ox, this.oy,
          lo + (hi - lo) * u, hi + (lo - hi) * u,
          1.2 + Math.sin(u * Math.PI) * 1.8, Math.sin(this.t * 2) * 0.08);
      }
    }

    if (this.kind === 'rooms' && done) {
      var rp = this.p;
      // Fluorescent tubes that never quite settle. A slow pulse with a fast
      // stutter over it is most of what makes a corridor uneasy.
      ctx.fillStyle = ROOMS_PALETTE.light;
      for (var li = 0; li < this.lamps.length; li++) {
        var lamp = this.lamps[li];
        var pulse = (0.5 + 0.5 * Math.sin(this.t * 2.1 + lamp.phase))
          * (0.6 + 0.4 * Math.sin(this.t * 11 + lamp.phase * 3));
        ctx.globalAlpha = 0.1 + pulse * 0.26;
        faceTop(ctx, rp, this.ox + rp.x(lamp.x, lamp.z), this.oy + rp.y(lamp.x, lamp.z, 1));
      }

      var wd = this.wanderer;
      var wx = wd.cx + (wd.nx - wd.cx) * wd.u;
      var wz = wd.cz + (wd.nz - wd.cz) * wd.u;

      // The pool of light the wanderer carries: the open tiles around it, then
      // a brighter diamond underfoot. It is also what keeps the figure findable
      // on the frames where a wall stands between it and the camera.
      var halo = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      ctx.globalAlpha = 0.12;
      for (var hi = 0; hi < halo.length; hi++) {
        var hx = wd.cx + halo[hi][0], hz = wd.cz + halo[hi][1];
        if (hx < 0 || hz < 0 || hx >= this.size || hz >= this.size) continue;
        if (!this.open[hx * this.size + hz]) continue;
        faceTop(ctx, rp, this.ox + rp.x(hx, hz), this.oy + rp.y(hx, hz, 1));
      }
      ctx.globalAlpha = 0.3;
      faceTop(ctx, rp, this.ox + rp.x(wx, wz), this.oy + rp.y(wx, wz, 1));
      ctx.globalAlpha = 1;

      drawFigure(ctx, rp, this.ox, this.oy, wx, wz, 1,
        '#332f26', ROOMS_PALETTE.light, Math.sin(this.t * 7) * rp.rise * 0.03);
    }
  };

  // Troopers cross the arena between open spots and choose a new one on
  // arrival. It is not AI and does not pretend to be: it is the smallest thing
  // that shows two teams using the same ground.
  Scene.prototype.advanceTroopers = function (dt) {
    for (var i = 0; i < this.troopers.length; i++) {
      var t = this.troopers[i];
      var dx = t.tx - t.x, dz = t.tz - t.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d < 0.12) {
        t.step += 7;
        var next = openSpot(this.spots, this.walkable, this.size, t.step);
        t.tx = next.x;
        t.tz = next.z;
        continue;
      }
      var v = Math.min(t.speed * dt, d);
      t.x += (dx / d) * v;
      t.z += (dz / d) * v;
    }
  };

  // The walk: from the tile it stands on, step to an open neighbour, avoiding
  // the one it just left unless there is nowhere else to go. No pathfinding and
  // no destination — which is the whole idea.
  Scene.prototype.advanceWanderer = function (dt) {
    var w = this.wanderer;
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    w.u += dt * 1.6;
    while (w.u >= 1) {
      w.u -= 1;
      w.px = w.cx; w.pz = w.cz;
      w.cx = w.nx; w.cz = w.nz;
      var options = [];
      for (var i = 0; i < 4; i++) {
        var nx = w.cx + dirs[i][0], nz = w.cz + dirs[i][1];
        if (nx < 0 || nz < 0 || nx >= this.size || nz >= this.size) continue;
        if (!this.open[nx * this.size + nz]) continue;
        if (nx === w.px && nz === w.pz) continue;
        options.push([nx, nz]);
      }
      if (!options.length) options.push([w.px, w.pz]);
      var k = Math.floor(this.roomNoise(w.cx * 2.3 + w.step, w.cz * 2.3) * options.length);
      var pick = options[Math.min(Math.max(k, 0), options.length - 1)];
      w.nx = pick[0];
      w.nz = pick[1];
      w.step++;
    }
  };

  Scene.prototype.tick = function (now) {
    if (!this.running) return;
    var dt = this.last ? Math.min((now - this.last) / 1000, 0.05) : 0.016;
    this.last = now;
    this.t += dt;
    if (!reduceMotion.matches) {
      if (this.karts) {
        for (var i = 0; i < this.karts.length; i++) {
          var k = this.karts[i];
          k.t = (k.t + k.speed * dt * 0.075) % 1;
        }
      }
      if (this.troopers) {
        this.advanceTroopers(dt);
        this.plane.t = (this.plane.t + dt * 0.15) % 1;
      }
      if (this.wanderer) this.advanceWanderer(dt);
    }
    this.draw(dt);
    this.frame = global.requestAnimationFrame(this.tick.bind(this));
  };

  Scene.prototype.start = function () {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    if (reduceMotion.matches || paused) {
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

  global.VoxelScenes = {
    scenes: scenes,
    mount: mount,
    isPaused: function () { return paused; },
    setPaused: function (value) {
      paused = !!value;
      scenes.forEach(function (s) {
        if (paused) {
          s.stop();
          s.draw(1); // leave the scene resolved rather than half-drawn
        } else if (s.visible) {
          s.start();
        }
      });
    }
  };
})(window);
