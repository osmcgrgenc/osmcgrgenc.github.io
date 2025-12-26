export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, down: false };
    this.wheelDelta = 0;
    this._listeners = [];
    this.bind();
  }

  bind() {
    const onKeyDown = (event) => {
      if (event.repeat) return;
      this.keys.add(event.code);
    };
    const onKeyUp = (event) => {
      this.keys.delete(event.code);
    };
    const onMouseMove = (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
    };
    const onMouseDown = () => {
      this.mouse.down = true;
    };
    const onMouseUp = () => {
      this.mouse.down = false;
    };
    const onWheel = (event) => {
      this.wheelDelta = event.deltaY;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('wheel', onWheel);

    this._listeners.push(['keydown', onKeyDown]);
    this._listeners.push(['keyup', onKeyUp]);
    this._listeners.push(['mousemove', onMouseMove]);
    this._listeners.push(['mousedown', onMouseDown]);
    this._listeners.push(['mouseup', onMouseUp]);
    this._listeners.push(['wheel', onWheel]);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  clearWheel() {
    this.wheelDelta = 0;
  }

  destroy() {
    this._listeners.forEach(([event, handler]) => {
      window.removeEventListener(event, handler);
    });
  }
}
