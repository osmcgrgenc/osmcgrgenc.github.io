export class Engine {
  constructor({ update, render, tickRate = 60 }) {
    this.update = update;
    this.render = render;
    this.tickRate = tickRate;
    this.fixedDelta = 1 / tickRate;
    this.accumulator = 0;
    this.lastTime = 0;
    this.running = false;
    this.tickCount = 0;
    this.maxFrame = 0.25;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now() / 1000;
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
  }

  loop(timestampMs) {
    if (!this.running) return;
    const now = timestampMs / 1000;
    let frameTime = now - this.lastTime;
    if (frameTime > this.maxFrame) frameTime = this.maxFrame;
    this.lastTime = now;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDelta) {
      this.update(this.fixedDelta);
      this.tickCount += 1;
      this.accumulator -= this.fixedDelta;
    }

    const alpha = this.accumulator / this.fixedDelta;
    this.render(alpha);
    requestAnimationFrame(this.loop.bind(this));
  }
}
