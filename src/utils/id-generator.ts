class IdGenerator {
  counters;

  constructor() {
    this.counters = new Map();
  }

  next(key, items) {
    if (!this.counters.has(key)) {
      const maxId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0);
      this.counters.set(key, maxId);
    }

    const nextValue = this.counters.get(key) + 1;
    this.counters.set(key, nextValue);
    return nextValue;
  }
}

module.exports = new IdGenerator();
