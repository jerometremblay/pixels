(() => {
  const svgNS = "http://www.w3.org/2000/svg";

  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy || 1;
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  };

  const initPixelGrid = (options = {}) => {
    const settings = {
      gridId: "grid",
      hudId: "hud",
      rotationId: null,
      blockSizeId: null,
      minCols: 16,
      baseBlockSize: 14,
      gap: 2,
      cornerRadius: 2,
      baseFill: "#1e293b",
      highlightFill: "#38bdf8",
      strokeOpacity: 0.25,
      strokeWidthMultiplier: 3,
      hudText: null,
      isHighlighted: null,
      drawOverlay: null,
      ...options,
    };

    const grid = document.getElementById(settings.gridId);
    if (!grid) return null;

    const hud = settings.hudId ? document.getElementById(settings.hudId) : null;
    const rotationInput = settings.rotationId
      ? document.getElementById(settings.rotationId)
      : null;
    const blockSizeInput = settings.blockSizeId
      ? document.getElementById(settings.blockSizeId)
      : null;

    const getRotation = () => (rotationInput ? Number(rotationInput.value) || 0 : 0);
    const getTargetBlockSize = () =>
      blockSizeInput ? Number(blockSizeInput.value) || settings.baseBlockSize : settings.baseBlockSize;

    const buildGrid = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      grid.setAttribute("width", width);
      grid.setAttribute("height", height);
      grid.setAttribute("viewBox", `0 0 ${width} ${height}`);
      grid.innerHTML = "";

      const targetBlockSize = getTargetBlockSize();
      const cols = Math.max(settings.minCols, Math.floor(width / targetBlockSize));
      grid.style.setProperty("--cols", cols);
      const blockSize = width / cols;
      const rows = Math.max(1, Math.floor(height / blockSize));
      const total = rows * cols;
      const gridWidth = cols * blockSize;
      const gridHeight = rows * blockSize;

      const maxX = gridWidth - blockSize / 2;
      const maxY = gridHeight - blockSize / 2;
      const centerX = Math.min(
        maxX,
        Math.max(blockSize / 2, Math.round(gridWidth / blockSize / 2) * blockSize + blockSize / 2)
      );
      const centerY = Math.min(
        maxY,
        Math.max(blockSize / 2, Math.round(gridHeight / blockSize / 2) * blockSize + blockSize / 2)
      );
      const rawRadius = Math.min(gridWidth, gridHeight) / 2 - Math.max(6, blockSize);
      const radius = Math.round(rawRadius / blockSize) * blockSize;
      const strokeMultiplier =
        typeof settings.strokeWidthMultiplier === "function"
          ? settings.strokeWidthMultiplier()
          : settings.strokeWidthMultiplier;
      const strokeWidth = blockSize * strokeMultiplier;
      const rotation = getRotation();

      const metrics = {
        width,
        height,
        gridWidth,
        gridHeight,
        cols,
        rows,
        total,
        blockSize,
        centerX,
        centerY,
        radius,
        strokeWidth,
        rotation,
      };

      if (settings.onBuildStart) settings.onBuildStart(metrics);

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const rect = document.createElementNS(svgNS, "rect");
          const x = col * blockSize;
          const y = row * blockSize;
          const size = Math.max(0, blockSize - settings.gap);
          const inset = (blockSize - size) / 2;
          const cx = x + blockSize / 2;
          const cy = y + blockSize / 2;

          rect.setAttribute("x", x + inset);
          rect.setAttribute("y", y + inset);
          rect.setAttribute("width", size);
          rect.setAttribute("height", size);
          rect.setAttribute("rx", settings.cornerRadius);

          const highlight = settings.isHighlighted
            ? settings.isHighlighted({ cx, cy, row, col, metrics, helpers: { distToSegment } })
            : false;

          rect.setAttribute("fill", highlight ? settings.highlightFill : settings.baseFill);
          if (settings.onCell) {
            settings.onCell({
              cx,
              cy,
              row,
              col,
              metrics,
              highlight,
              helpers: { distToSegment },
            });
          }
          grid.appendChild(rect);
        }
      }

      if (settings.drawOverlay) {
        settings.drawOverlay({ grid, metrics, svgNS, settings, helpers: { distToSegment } });
      }

      if (settings.onBuildEnd) settings.onBuildEnd(metrics);

      if (hud) {
        const hudText = settings.hudText
          ? settings.hudText(metrics)
          : `Grid: ${cols} × ${rows} (${total} blocks). Block: ${Math.round(blockSize)}px.`;
        hud.textContent = hudText;
      }
    };

    if (rotationInput) rotationInput.addEventListener("input", buildGrid);
    if (blockSizeInput) blockSizeInput.addEventListener("input", buildGrid);

    window.addEventListener("resize", () => {
      window.clearTimeout(window.__gridTimer);
      window.__gridTimer = window.setTimeout(buildGrid, 150);
    });

    buildGrid();

    return { buildGrid };
  };

  window.Pixels = {
    initPixelGrid,
    helpers: { distToSegment },
  };
})();
