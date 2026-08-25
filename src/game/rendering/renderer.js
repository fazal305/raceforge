const CAR_LENGTH = 26;
const CAR_WIDTH = 14;

function worldToScreen(camera, canvasWidth, canvasHeight, x, y) {
  return { x: x - camera.x + canvasWidth / 2, y: y - camera.y + canvasHeight / 2 };
}

function drawRoad(ctx, track, camera, canvasWidth, canvasHeight) {
  const { centerline, roadWidth } = track;
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.beginPath();
  centerline.forEach((point, index) => {
    const screen = worldToScreen(camera, canvasWidth, canvasHeight, point.x, point.y);
    if (index === 0) ctx.moveTo(screen.x, screen.y);
    else ctx.lineTo(screen.x, screen.y);
  });
  ctx.closePath();

  ctx.lineWidth = roadWidth;
  ctx.strokeStyle = '#2a2d34';
  ctx.stroke();

  ctx.lineWidth = 4;
  ctx.setLineDash([18, 16]);
  ctx.strokeStyle = 'rgba(232,232,232,0.35)';
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawStartLine(ctx, track, camera, canvasWidth, canvasHeight) {
  const start = track.startPosition;
  const screen = worldToScreen(camera, canvasWidth, canvasHeight, start.x, start.y);
  const perp = track.startHeading + Math.PI / 2;
  const half = track.roadWidth / 2;
  ctx.save();
  ctx.strokeStyle = '#f4f5f7';
  ctx.lineWidth = 6;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(screen.x - Math.cos(perp) * half, screen.y - Math.sin(perp) * half);
  ctx.lineTo(screen.x + Math.cos(perp) * half, screen.y + Math.sin(perp) * half);
  ctx.stroke();
  ctx.restore();
}

function drawCheckpoints(ctx, track, camera, canvasWidth, canvasHeight, nextIndex) {
  const checkpoint = track.checkpoints[nextIndex];
  if (!checkpoint) return;
  const screen = worldToScreen(camera, canvasWidth, canvasHeight, checkpoint.x, checkpoint.y);
  ctx.save();
  ctx.strokeStyle = '#f2792b';
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 6]);
  const perp = checkpoint.heading + Math.PI / 2;
  const half = track.roadWidth / 2;
  ctx.beginPath();
  ctx.moveTo(screen.x - Math.cos(perp) * half, screen.y - Math.sin(perp) * half);
  ctx.lineTo(screen.x + Math.cos(perp) * half, screen.y + Math.sin(perp) * half);
  ctx.stroke();
  ctx.restore();
}

function drawObstacles(ctx, track, camera, canvasWidth, canvasHeight) {
  ctx.save();
  ctx.fillStyle = '#e5484d';
  track.obstacles.forEach((obstacle) => {
    const screen = worldToScreen(camera, canvasWidth, canvasHeight, obstacle.x, obstacle.y);
    if (
      screen.x < -50 ||
      screen.x > canvasWidth + 50 ||
      screen.y < -50 ||
      screen.y > canvasHeight + 50
    ) {
      return;
    }
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, obstacle.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawCar(ctx, camera, canvasWidth, canvasHeight, carState, color, isPlayer) {
  const screen = worldToScreen(camera, canvasWidth, canvasHeight, carState.x, carState.y);
  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(carState.heading);

  ctx.fillStyle = color;
  ctx.strokeStyle = isPlayer ? '#f4f5f7' : 'rgba(0,0,0,0.35)';
  ctx.lineWidth = isPlayer ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(-CAR_LENGTH / 2, -CAR_WIDTH / 2, CAR_LENGTH, CAR_WIDTH, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(CAR_LENGTH / 2 - 6, -CAR_WIDTH / 2 + 2, 4, CAR_WIDTH - 4);

  ctx.restore();
}

function drawSkidMarks(ctx, camera, canvasWidth, canvasHeight, skidMarks) {
  ctx.save();
  ctx.strokeStyle = 'rgba(10,10,10,0.4)';
  ctx.lineWidth = 3;
  skidMarks.forEach(({ x, y, alpha }) => {
    const screen = worldToScreen(camera, canvasWidth, canvasHeight, x, y);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function renderFrame(ctx, canvasWidth, canvasHeight, world) {
  const { track, player, opponents, playerProgress, skidMarks } = world;
  const camera = { x: player.x, y: player.y };

  ctx.fillStyle = '#132015';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  drawRoad(ctx, track, camera, canvasWidth, canvasHeight);
  drawStartLine(ctx, track, camera, canvasWidth, canvasHeight);
  drawCheckpoints(ctx, track, camera, canvasWidth, canvasHeight, playerProgress.nextCheckpointIndex);
  drawObstacles(ctx, track, camera, canvasWidth, canvasHeight);
  if (skidMarks?.length) drawSkidMarks(ctx, camera, canvasWidth, canvasHeight, skidMarks);

  opponents.forEach((opponent) => {
    drawCar(ctx, camera, canvasWidth, canvasHeight, opponent.state, opponent.color, false);
  });

  drawCar(ctx, camera, canvasWidth, canvasHeight, player, '#f2792b', true);
}

export function renderMinimap(ctx, size, track, player, opponents) {
  const { bounds } = track;
  const scaleX = size / (bounds.maxX - bounds.minX);
  const scaleY = size / (bounds.maxY - bounds.minY);
  const scale = Math.min(scaleX, scaleY);

  const toMap = (x, y) => ({
    x: (x - bounds.minX) * scale,
    y: (y - bounds.minY) * scale,
  });

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  track.centerline.forEach((point, index) => {
    const p = toMap(point.x, point.y);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.stroke();

  opponents.forEach((opponent) => {
    const p = toMap(opponent.state.x, opponent.state.y);
    ctx.fillStyle = opponent.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  const playerMap = toMap(player.x, player.y);
  ctx.fillStyle = '#f2792b';
  ctx.beginPath();
  ctx.arc(playerMap.x, playerMap.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
