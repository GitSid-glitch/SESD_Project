const dataStore = require("./data-store");

class BaseRepository {
  collectionName;
  ModelClass;

  constructor(collectionName, ModelClass) {
    this.collectionName = collectionName;
    this.ModelClass = ModelClass;
  }

  async all() {
    return dataStore.findAll(this.collectionName);
  }

  async findAll() {
    const items = await this.all();
    return items.map((item) => new this.ModelClass(item));
  }

  async findById(id) {
    const item = await dataStore.findById(this.collectionName, id);
    return item ? new this.ModelClass(item) : null;
  }

  async create(data) {
    const created = await dataStore.insert(this.collectionName, data);
    return new this.ModelClass(created);
  }

  async update(id, updater) {
    const current = await this.findById(id);
    if (!current) {
      return null;
    }

    const nextEntity = updater(current) || current;
    const updated = await dataStore.update(this.collectionName, id, nextEntity);
    return updated ? new this.ModelClass(updated) : null;
  }

  async delete(id) {
    await dataStore.delete(this.collectionName, id);
  }
}

module.exports = BaseRepository;
