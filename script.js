"use strict";

const canvas = document.getElementById("heartCanvas");
const context = canvas.getContext("2d", { alpha: true });

if (!context) {
    throw new Error("Canvas 2D is not supported by this browser.");
}

const MESSAGE = "I love you жан <3";
const TEXT_COLOR = "#ffb6c1";
const GLOW_COLOR = "#ff69b4";
const DRAW_INTERVAL_MS = 52;
const POINTS_PER_LAYER = 120;
const MIN_SCALE = 11;
const MAX_SCALE = 16;

const heartLayer = document.createElement("canvas");
const heartContext = heartLayer.getContext("2d", { alpha: true });

let width = 0;
let height = 0;
let pixelRatio = 1;
let heartPoints = [];
let particles = [];
let pointIndex = 0;
let lastPointTime = 0;
let animationFrameId = 0;
let resizeTimerId = 0;
let drawingComplete = false;
let startTime = performance.now();

function configureCanvas(target, targetContext) {
    target.width = Math.round(width * pixelRatio);
    target.height = Math.round(height * pixelRatio);
    target.style.width = `${width}px`;
    target.style.height = `${height}px`;
    targetContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function createHeartPoints() {
    const points = [];
    const centerX = width / 2;
    const centerY = height / 2 + Math.min(25, height * 0.035);
    const screenScale = Math.min(width / 900, height / 700);

    for (let scale = MIN_SCALE; scale <= MAX_SCALE; scale += 1) {
        for (let i = 0; i < POINTS_PER_LAYER; i += 1) {
            const angle = i * Math.PI * 2 / POINTS_PER_LAYER;
            const x = 16 * Math.sin(angle) ** 3 * scale * screenScale;
            const y = (
                13 * Math.cos(angle)
                - 5 * Math.cos(2 * angle)
                - 2 * Math.cos(3 * angle)
                - Math.cos(4 * angle)
            ) * scale * screenScale;

            points.push({ x: centerX + x, y: centerY - y });
        }
    }

    return points;
}

function createParticles() {
    const count = Math.max(18, Math.min(42, Math.floor(width / 28)));

    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.8 + Math.random() * 1.8,
        speed: 4 + Math.random() * 12,
        drift: -5 + Math.random() * 10,
        alpha: 0.12 + Math.random() * 0.4,
    }));
}

function drawTextPoint(point) {
    const responsiveFontSize = Math.max(8, Math.min(11, width / 95));

    heartContext.save();
    heartContext.font = `700 ${responsiveFontSize}px Arial, Helvetica, sans-serif`;
    heartContext.fillStyle = TEXT_COLOR;
    heartContext.textAlign = "center";
    heartContext.textBaseline = "middle";
    heartContext.shadowColor = GLOW_COLOR;
    heartContext.shadowBlur = Math.max(2, responsiveFontSize * 0.42);
    heartContext.fillText(MESSAGE, point.x, point.y);
    heartContext.restore();
}

function updateParticles(deltaSeconds) {
    for (const particle of particles) {
        particle.y -= particle.speed * deltaSeconds;
        particle.x += particle.drift * deltaSeconds;

        if (particle.y < -8) {
            particle.y = height + 8;
            particle.x = Math.random() * width;
        }

        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
    }
}

function drawParticles() {
    context.save();
    context.fillStyle = TEXT_COLOR;

    for (const particle of particles) {
        context.globalAlpha = particle.alpha;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
    }

    context.restore();
}

function renderHeart(now) {
    context.save();

    if (drawingComplete) {
        const pulse = 1 + Math.sin((now - startTime) / 560) * 0.012;
        context.translate(width / 2, height / 2);
        context.scale(pulse, pulse);
        context.translate(-width / 2, -height / 2);
    }

    context.drawImage(heartLayer, 0, 0, width, height);
    context.restore();
}

function animate(now) {
    const deltaSeconds = Math.min((now - (animate.previousTime || now)) / 1000, 0.05);
    animate.previousTime = now;

    while (!drawingComplete && now - lastPointTime >= DRAW_INTERVAL_MS) {
        drawTextPoint(heartPoints[pointIndex]);
        pointIndex += 1;
        lastPointTime += DRAW_INTERVAL_MS;

        if (pointIndex >= heartPoints.length) {
            drawingComplete = true;
            startTime = now;
            break;
        }
    }

    updateParticles(deltaSeconds);
    context.clearRect(0, 0, width, height);
    drawParticles();
    renderHeart(now);

    animationFrameId = requestAnimationFrame(animate);
}

function resetAnimation() {
    cancelAnimationFrame(animationFrameId);

    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    configureCanvas(canvas, context);
    configureCanvas(heartLayer, heartContext);

    context.clearRect(0, 0, width, height);
    heartContext.clearRect(0, 0, width, height);

    heartPoints = createHeartPoints();
    particles = createParticles();
    pointIndex = 0;
    drawingComplete = false;
    lastPointTime = performance.now();
    animate.previousTime = lastPointTime;

    animationFrameId = requestAnimationFrame(animate);
}

function handleResize() {
    window.clearTimeout(resizeTimerId);
    resizeTimerId = window.setTimeout(resetAnimation, 180);
}

window.addEventListener("resize", handleResize, { passive: true });
window.addEventListener("orientationchange", handleResize, { passive: true });
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        animate.previousTime = performance.now();
    }
});

resetAnimation();
