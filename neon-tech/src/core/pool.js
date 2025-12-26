export class Pool {
  constructor(createFn, size) {
    this.items = [];
    this.available = [];
    for (let i = 0; i < size; i += 1) {
      const item = createFn();
      item.active = false;
      this.items.push(item);
      this.available.push(item);
    }
  }

  acquire() {
    const item = this.available.pop();
    if (!item) return null;
    item.active = true;
    return item;
  }

  release(item) {
    item.active = false;
    this.available.push(item);
  }

  forEachActive(callback) {
    this.items.forEach((item) => {
      if (item.active) callback(item);
    });
  }

  countActive() {
    return this.items.filter((item) => item.active).length;
  }
}
