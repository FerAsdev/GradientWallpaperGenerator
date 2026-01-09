const els = {
  gradientType: document.getElementById('gradientType'),
  angle: document.getElementById('angle'),
  angleValue: document.getElementById('angleValue'),
  centerX: document.getElementById('centerX'),
  centerY: document.getElementById('centerY'),
  meshLayers: document.getElementById('meshLayers'),
  meshBlur: document.getElementById('meshBlur'),
  palette: document.getElementById('palette'),
  stops: document.getElementById('stops'),
  addStop: document.getElementById('addStop'),
  sortStops: document.getElementById('sortStops'),
  resetStops: document.getElementById('resetStops'),
  preview: document.getElementById('preview'),
  detectedResolution: document.getElementById('detectedResolution'),
  cssOutput: document.getElementById('cssOutput'),
  width: document.getElementById('width'),
  height: document.getElementById('height'),
  useScreen: document.getElementById('useScreen'),
  use4k: document.getElementById('use4k'),
  use8k: document.getElementById('use8k'),
  scale: document.getElementById('scale'),
  scaleValue: document.getElementById('scaleValue'),
  fileName: document.getElementById('fileName'),
  render: document.getElementById('render'),
  export: document.getElementById('export'),
  copyCss: document.getElementById('copyCss'),
  exportInfo: document.getElementById('exportInfo'),
  canvas: document.getElementById('canvas'),
  randomize: document.getElementById('randomize'),
  angleField: document.getElementById('angleField'),
  radialField: document.getElementById('radialField'),
  meshField: document.getElementById('meshField'),
};

const palettes = [
  {
    name: 'Aurora Boreal',
    colors: ['#1d4350', '#a43931', '#f6b17a', '#101020'],
  },
  {
    name: 'Cosmic Nebula',
    colors: ['#0f0c29', '#302b63', '#24243e', '#f27121'],
  },
  {
    name: 'Sunset Rave',
    colors: ['#ff6b6b', '#f7b801', '#6a4c93', '#1a1b41'],
  },
  {
    name: 'Mint Cyber',
    colors: ['#00f5a0', '#00d9f5', '#4361ee', '#1b1b3a'],
  },
  {
    name: 'Midnight Violet',
    colors: ['#10002b', '#240046', '#5a189a', '#e0aaff'],
  },
  {
    name: 'Electric Flamingo',
    colors: ['#ff8fab', '#c77dff', '#7b2cbf', '#3c096c'],
  },
];

let stops = [
  { color: '#1d4350', pos: 0 },
  { color: '#a43931', pos: 40 },
  { color: '#f6b17a', pos: 72 },
  { color: '#101020', pos: 100 },
];

function setupPaletteSelect() {
  palettes.forEach((palette, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = palette.name;
    els.palette.appendChild(option);
  });
  els.palette.value = '0';
}

function applyPalette(index) {
  const palette = palettes[index];
  const step = Math.floor(100 / (palette.colors.length - 1));
  stops = palette.colors.map((color, i) => ({
    color,
    pos: Math.min(100, i * step),
  }));
  renderStops();
}

function stopRow(stop, index) {
  const div = document.createElement('div');
  div.className = 'stop';
  div.dataset.index = index;
  div.innerHTML = `
    <input type="color" value="${stop.color}" aria-label="Color stop">
    <input type="number" min="0" max="100" value="${stop.pos}">
    <div class="stop__actions">
      <button class="btn btn--ghost" data-action="up" type="button">↑</button>
      <button class="btn btn--ghost" data-action="down" type="button">↓</button>
      <button class="btn btn--ghost" data-action="delete" type="button">✕</button>
    </div>
  `;
  return div;
}

function renderStops() {
  els.stops.innerHTML = '';
  stops.forEach((stop, index) => {
    els.stops.appendChild(stopRow(stop, index));
  });
  updatePreview();
}

function updateAngleLabel() {
  els.angleValue.textContent = `${els.angle.value}°`;
}

function updateScaleLabel() {
  els.scaleValue.textContent = `${Number(els.scale.value).toFixed(1)}x`;
}

function updateGradientFields() {
  const type = els.gradientType.value;
  els.angleField.style.display = type === 'linear' || type === 'conic' ? 'block' : 'none';
  els.radialField.style.display = type === 'radial' || type === 'mesh' ? 'grid' : 'none';
  els.meshField.style.display = type === 'mesh' ? 'grid' : 'none';
}

function sortedStops() {
  return stops.slice().sort((a, b) => a.pos - b.pos);
}

function gradientStopsString() {
  return sortedStops()
    .map((stop) => `${stop.color} ${stop.pos}%`)
    .join(', ');
}

function createMeshLayers() {
  const layers = Math.min(6, Math.max(2, Number(els.meshLayers.value) || 3));
  const blur = Math.max(0, Number(els.meshBlur.value) || 0);
  const centerX = Number(els.centerX.value) || 50;
  const centerY = Number(els.centerY.value) || 45;
  const paletteStops = sortedStops();
  const layerStops = Array.from({ length: layers }, (_, i) => {
    const stop = paletteStops[i % paletteStops.length];
    const xOffset = (i % 2 === 0 ? -18 : 18) + (i * 4);
    const yOffset = (i % 2 === 0 ? 12 : -16) + (i * 3);
    return `radial-gradient(circle at ${centerX + xOffset}% ${centerY + yOffset}%, ${stop.color} 0%, transparent 60%)`;
  });
  const base = `radial-gradient(circle at ${centerX}% ${centerY}%, ${paletteStops[0].color} 0%, ${paletteStops[paletteStops.length - 1].color} 70%)`;
  return {
    css: [...layerStops, base].join(', '),
    blur,
  };
}

function buildCssGradient() {
  const type = els.gradientType.value;
  const stopsString = gradientStopsString();

  if (type === 'linear') {
    const angle = Number(els.angle.value) || 135;
    return `linear-gradient(${angle}deg, ${stopsString})`;
  }

  if (type === 'radial') {
    const x = Number(els.centerX.value) || 50;
    const y = Number(els.centerY.value) || 45;
    return `radial-gradient(circle at ${x}% ${y}%, ${stopsString})`;
  }

  if (type === 'conic') {
    const angle = Number(els.angle.value) || 135;
    return `conic-gradient(from ${angle}deg at 50% 50%, ${stopsString})`;
  }

  const mesh = createMeshLayers();
  return mesh.css;
}

function updatePreview() {
  const css = buildCssGradient();
  if (els.gradientType.value === 'mesh') {
    const mesh = createMeshLayers();
    els.preview.style.background = mesh.css;
    els.preview.style.filter = `blur(${mesh.blur}px)`;
  } else {
    els.preview.style.background = css;
    els.preview.style.filter = 'none';
  }
  els.cssOutput.textContent = css;
}

function updateDetectedResolution() {
  els.detectedResolution.textContent = `${window.screen.width}×${window.screen.height}px`;
}

function setResolution(width, height) {
  els.width.value = width;
  els.height.value = height;
}

function handleStopInput(event) {
  const row = event.target.closest('.stop');
  if (!row) return;
  const index = Number(row.dataset.index);

  if (event.target.type === 'color') {
    stops[index].color = event.target.value;
  }

  if (event.target.type === 'number') {
    const value = Math.min(100, Math.max(0, Number(event.target.value)));
    stops[index].pos = value;
    event.target.value = value;
  }
  updatePreview();
}

function handleStopAction(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const row = event.target.closest('.stop');
  const index = Number(row.dataset.index);

  if (action === 'delete' && stops.length > 2) {
    stops.splice(index, 1);
  }

  if (action === 'up' && index > 0) {
    [stops[index - 1], stops[index]] = [stops[index], stops[index - 1]];
  }

  if (action === 'down' && index < stops.length - 1) {
    [stops[index + 1], stops[index]] = [stops[index], stops[index + 1]];
  }

  renderStops();
}

function addStop() {
  const sorted = sortedStops();
  const last = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2] || { color: '#ffffff', pos: 0 };
  const pos = Math.round((last.pos + previous.pos) / 2);
  stops.splice(stops.length - 1, 0, { color: last.color, pos });
  renderStops();
}

function sortStops() {
  stops = sortedStops();
  renderStops();
}

function resetStops() {
  applyPalette(Number(els.palette.value));
}

function randomize() {
  const index = Math.floor(Math.random() * palettes.length);
  els.palette.value = String(index);
  applyPalette(index);
  els.gradientType.value = ['linear', 'radial', 'conic', 'mesh'][Math.floor(Math.random() * 4)];
  els.angle.value = String(Math.floor(Math.random() * 360));
  els.centerX.value = String(30 + Math.floor(Math.random() * 40));
  els.centerY.value = String(30 + Math.floor(Math.random() * 40));
  els.meshLayers.value = String(2 + Math.floor(Math.random() * 4));
  els.meshBlur.value = String(80 + Math.floor(Math.random() * 120));
  updateAngleLabel();
  updateGradientFields();
  updatePreview();
}

function renderToCanvas() {
  const width = Math.max(320, Number(els.width.value) || 1920);
  const height = Math.max(320, Number(els.height.value) || 1080);
  const scale = Math.max(1, Number(els.scale.value) || 1);
  const canvas = els.canvas;

  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);

  const ctx = canvas.getContext('2d');
  const type = els.gradientType.value;

  if (type === 'linear') {
    const angle = Number(els.angle.value) || 135;
    const theta = (angle * Math.PI) / 180;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const halfDiag = Math.sqrt(canvas.width ** 2 + canvas.height ** 2) / 2;
    const vx = Math.cos(theta);
    const vy = Math.sin(theta);

    const grad = ctx.createLinearGradient(
      cx - vx * halfDiag,
      cy - vy * halfDiag,
      cx + vx * halfDiag,
      cy + vy * halfDiag
    );
    sortedStops().forEach((stop) => grad.addColorStop(stop.pos / 100, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'radial') {
    const x = (Number(els.centerX.value) || 50) / 100;
    const y = (Number(els.centerY.value) || 45) / 100;
    const radius = Math.min(canvas.width, canvas.height) * 0.65;
    const grad = ctx.createRadialGradient(
      canvas.width * x,
      canvas.height * y,
      0,
      canvas.width * x,
      canvas.height * y,
      radius
    );
    sortedStops().forEach((stop) => grad.addColorStop(stop.pos / 100, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'conic' && typeof ctx.createConicGradient === 'function') {
    const angle = ((Number(els.angle.value) || 0) * Math.PI) / 180;
    const grad = ctx.createConicGradient(angle, canvas.width / 2, canvas.height / 2);
    sortedStops().forEach((stop) => grad.addColorStop(stop.pos / 100, stop.color));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (type === 'mesh') {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const mesh = createMeshLayers();
    const paletteStops = sortedStops();
    paletteStops.forEach((stop, index) => {
      const offset = (index + 1) / (paletteStops.length + 1);
      const x = canvas.width * (0.2 + offset * 0.6);
      const y = canvas.height * (0.2 + ((index % 2) * 0.4));
      const radius = Math.min(canvas.width, canvas.height) * 0.6;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, stop.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.8;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    ctx.globalAlpha = 1;
    ctx.filter = `blur(${mesh.blur}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  els.exportInfo.textContent = `Canvas listo: ${canvas.width}×${canvas.height}px (${scale.toFixed(1)}x).`;
}

function exportPng() {
  renderToCanvas();
  const url = els.canvas.toDataURL('image/png');
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${els.fileName.value || 'gradient-wallpaper'}.png`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function copyCss() {
  const css = buildCssGradient();
  navigator.clipboard.writeText(css).then(() => {
    els.exportInfo.textContent = 'CSS copiado al portapapeles.';
  });
}

function initResolution() {
  const width = window.screen.width;
  const height = window.screen.height;
  setResolution(width, height);
  updateDetectedResolution();
}

els.angle.addEventListener('input', () => {
  updateAngleLabel();
  updatePreview();
});

els.centerX.addEventListener('input', updatePreview);
els.centerY.addEventListener('input', updatePreview);
els.meshLayers.addEventListener('input', updatePreview);
els.meshBlur.addEventListener('input', updatePreview);

els.palette.addEventListener('change', (event) => {
  applyPalette(Number(event.target.value));
});

els.gradientType.addEventListener('change', () => {
  updateGradientFields();
  updatePreview();
});

els.scale.addEventListener('input', updateScaleLabel);

els.stops.addEventListener('input', handleStopInput);
els.stops.addEventListener('click', handleStopAction);

els.addStop.addEventListener('click', addStop);
els.sortStops.addEventListener('click', sortStops);
els.resetStops.addEventListener('click', resetStops);

els.useScreen.addEventListener('click', () => setResolution(window.screen.width, window.screen.height));
els.use4k.addEventListener('click', () => setResolution(3840, 2160));
els.use8k.addEventListener('click', () => setResolution(7680, 4320));

els.render.addEventListener('click', renderToCanvas);
els.export.addEventListener('click', exportPng);
els.copyCss.addEventListener('click', copyCss);
els.randomize.addEventListener('click', randomize);

setupPaletteSelect();
applyPalette(0);
updateAngleLabel();
updateScaleLabel();
updateGradientFields();
initResolution();
updatePreview();
