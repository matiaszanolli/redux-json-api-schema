import _ from 'lodash'
import {
  create,
  update,
} from './actions'

let singleton = Symbol()
let singletonEnforcer = Symbol()

class SchemaError extends Error {
  constructor(message) {
    super(message)
    this.name = this.constructor.name
    this.message = message
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(message)).stack
    }
  }
}

// The schema handler. Should handle all entities and related actions.
class Schema {

  constructor(enforcer) {
    if(enforcer != singletonEnforcer)
      throw new SchemaError('Cannot call Schema directly. Use Schema.instance instead.')
  }

  // Is a singleton still necessary?
  static get instance() {
    if(!this[singleton]) {
      this[singleton] = new Schema(singletonEnforcer)
    }
    return this[singleton]
  }

  // Creates a subset of SchemaEntity with items specified by their IDs.
  // Should be compatible with all SchemaEntity operations.
  static fromArray(type, ids) {
    if (!ids instanceof Array)
      throw new SchemaError('Schema.fromArray() should receive a type and an array of IDs.')
    return new SchemaEntity(type, ids)
  }

  // Creates an empty item.
  createItem(type, attributes, relationships) {
    if (!this.entities)
      throw new SchemaError('The schema was not initialized properly. Run initialize() first.')
    if (!this.entities[type])
      throw new SchemaError(`${type} is not a valid entity.`)
    else {
      return new SchemaItem({
        id: null,
        type: type,
        attributes: attributes,
        relationships: relationships || {}
      })
    }
  }

  // Creates the base structure of the entity.
  initialize(store, entities) {
    this.store = store
    if (!entities || typeof entities !== 'object' || !entities.length)
      throw new SchemaError('Schema should receive a list of entity names as a parameter.')
    this.entities = {}
    let state = store.getState()
    for (let type of entities) {
      let entity = new SchemaEntity(type)
      this.entities[type] = entity
    }
  }

  // Allows to call an action related to an entity or an element.
  dispatch(actionCreator) {
    return this.store.dispatch(actionCreator)
  }
}

// Defines a container of SchemaItem elements of the same type.
export class SchemaEntity {

  constructor(type, ids = []) {
    this.type = type
    this.ids = ids
  }

  // Returns all items from the schema as raw objects.
  // Note that it filters all items that weren't found on the state.
  // TODO: fetch non found items from DB?
  get items() {
    let entity = Schema.instance.store.getState().api[this.type] || { data: [] }
    if (this.ids.length) {
      return this.ids.map((id) => {
        return _.find(entity.data, {id: id})
      }).filter((item) => (item))
    } else {
      return entity.data
    }
  }

  // returns all items from the schema as SchemaItem objects.
  get all() {
    return this.items.map((item) => new SchemaItem(item))
  }

  // returns the first result in a SchemaEntity.
  get first() {
    return (this.items.length ? new SchemaItem(this.items[0]) : undefined)
  }

  // returns the number of items in a SchemaEntity.
  get count() {
    return this.items.length
  }

  // gets an element from an entity from its ID.
  // returns null if no results are found.
  findById(id) {
    let result = this.items.filter((item) => {
      return item.id == id
    })
    return (result && result.length ? new SchemaItem(result[0]) : null)
  }

  // performs a simple search on an entity.
  // TODO: full comparator support (eq, ne, like)
  where(params) {
    return _.filter(this.items, (item) => {
      return _.reduce(params, (result, value, key) => {
        return (result && (key == 'id' ? item : item.attributes)[key] == value)
      }, true)
    }).map((item) => {
      return new SchemaItem(item)
    })
  }
}

// Defines a single item.
export class SchemaItem {
  constructor(item) {
    this.id = item.id
    this.type = item.type
    this.diff = Object.assign({}, {
      attributes: item.attributes || {},
      relationships: item.relationships || {}
    })
    if (!item.id)
      this._ref = {
        attributes: item.attributes || {},
        relationships: item.relationships || {}
      }
  }

  // Returns the raw item from the state or a temporary store.
  get ref() {
    if (this.id) { // it's an existing item
      let entity = Schema.instance.store.getState().api[this.type],
      result
      if (entity) {
        result = _.filter(entity.data, (item) => (item.id === this.id))
      }
      return (result ? result[0] : null)
    } else { // it's a new item
      return this._ref
    }
  }

  set ref(data) {
    if (!this.id)
      this._ref = _.merge({}, this._ref, data)
  }

  // Returns the attributes object from the array.
  // TODO: The ID should be gathered from here too.
  get attributes() {
    return (this.ref ? this.ref.attributes : {})
  }

  set attributes(data) {
    this.ref.attributes = data
  }

  // Returns the raw list of relationships from the state.
  get relationships() {
    return (this.ref ? this.ref.relationships : [])
  }

  set relationships(data) {
    this.ref.relationships = data
  }

  // Returns a sanitized item, ready to be sent through a JSON API query.
  sanitize() {
    return {
      id: (this.id ? this.id.toString() : undefined),
      type: this.type,
      attributes: this.diff.attributes || {},
      relationships: (this.diff.relationships ? _.mapValues(this.diff.relationships, (rel) => {
        return {
          data: rel.data
        }
      }) : {})
    }
  }

  // Returns an array of all SchemaItem elements of a given type related to
  // the item.
  getRelated(relation) {
    let related = this.relationships[relation]
    if (related && related.data && related.data.length) {
      let entity = Schema.instance.entities[related.data[0].type].items
      if (entity.length) {
        let result = related.data.map((item) => {
          return new SchemaItem(_.find(entity, (res) => (res.id == item.id)))
        })
        return (result[0] ? result : [])
      }
    }
    return []
  }

  // Counts all related items of a specific type.
  countRelated(relation) {
    let related = this.relationships[relation]
    return (related && related.data && related.data.length ? related.data.length : 0)
  }

  update(data) {
    // Only attributes and relationships should be updated, everything else is
    // treated as static. Changes are saved on a temporary `diff` list.
    this.diff = _.merge({}, this.diff, data)
    this.attributes = _.merge({}, this.attributes, (data.attributes || {}))
    this.relationships = _.merge({}, this.relationships, (data.relationships || {}))
  }

  // Triggers a CreateAction event for this item.
  save() {
    let fn = (this.id ? update : create)
    return fn(this.sanitize()) // TODO: clean the diff object
  }
}

export default Schema
