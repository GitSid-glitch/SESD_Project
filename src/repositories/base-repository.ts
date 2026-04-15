const dataStore = require("./data-store");
const idGenerator = require("../utils/id-generator");

class BaseRepository {
  collectionName;
  ModelClass;

  constructor(collectionName, ModelClass) {
    this.collectionName = collectionName;
    this.ModelClass = ModelClass;
  }

  all() {
    return dataStore.getState()[this.collectionName];
  }

  findAll() {
    return this.all().map((item) => new this.ModelClass(item));
  }

  findById(id) {
    const item = this.all().find((entry) => Number(entry.id) === Number(id));
    return item ? new this.ModelClass(item) : null;
  }

  create(data) {
    const state = dataStore.getState();
    const collection = state[this.collectionName];
    const entity = new this.ModelClass({
      ...data,
      id: idGenerator.next(this.collectionName, collection)
    });
    collection.push(entity);
    dataStore.saveState(state);
    return entity;
  }

  update(id, updater) {
    const state = dataStore.getState();
    const collection = state[this.collectionName];
    const index = collection.findIndex((entry) => Number(entry.id) === Number(id));
    if (index === -1) {
      return null;
    }

    const currentEntity = new this.ModelClass(collection[index]);
    const nextEntity = updater(currentEntity) || currentEntity;
    collection[index] = nextEntity;
    dataStore.saveState(state);
    return new this.ModelClass(collection[index]);
  }

  delete(id) {
    const state = dataStore.getState();
    const collection = state[this.collectionName];
    const nextCollection = collection.filter((entry) => Number(entry.id) !== Number(id));
    state[this.collectionName] = nextCollection;
    dataStore.saveState(state);
  }
}

module.exports = BaseRepository;
