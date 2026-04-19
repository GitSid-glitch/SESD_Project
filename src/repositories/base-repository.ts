const dataStore = require("./data-store");

class BaseRepository {
  collectionName;
  ModelClass;

  constructor(collectionName, ModelClass) {
    this.collectionName = collectionName;
    this.ModelClass = ModelClass;
  }

  all() {
    return dataStore.findAll(this.collectionName);
  }

  findAll() {
    return this.all().map((item) => new this.ModelClass(item));
  }

  findById(id) {
    const item = dataStore.findById(this.collectionName, id);
    return item ? new this.ModelClass(item) : null;
  }

  create(data) {
    const created = dataStore.insert(this.collectionName, data);
    return new this.ModelClass(created);
  }

  update(id, updater) {
    const current = this.findById(id);
    if (!current) {
      return null;
    }

    const nextEntity = updater(current) || current;
    const updated = dataStore.update(this.collectionName, id, nextEntity);
    return updated ? new this.ModelClass(updated) : null;
  }

  delete(id) {
    dataStore.delete(this.collectionName, id);
  }
}

module.exports = BaseRepository;
