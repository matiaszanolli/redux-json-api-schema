import expect from 'expect'
import configureMockStore from 'redux-mock-store'
import _ from 'lodash'
import { SchemaEntity, SchemaItem } from '../src/schema'

const middlewares = []
const mockStore = configureMockStore(middlewares)
const store = mockStore()

const arr = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const defaultEntities = [
  'genre',
  'milestone',
  'multimedia',
  'pledge',
  'project',
  'reward',
  'stretch_goal',
  'tag',
  'user',
  'vote'
]

let randomList = (customList) => {
  return _.sampleSize((customList || arr), _.random(2, 10))
}

describe('ORM', () => {
  it('should initialize with a single entity', () => {
    let Schema = require('../src/schema').default
    let instance = Schema.instance,
    expected = { test: { ids: [], type: 'test' } }

    instance.initialize(store, ['test'])
    expect(instance.entities).toIncludeKey('test')
  })

  it('should initialize with multiple entities', () => {
    let Schema = require('../src/schema').default
    let instance = Schema.instance,
    expected = randomList()

    instance.initialize(store, expected)
    expect(Object.keys(instance.entities)).toEqual(expected)
  })

  it('should fail to initialize the orm with invalid data', () => {
    let Schema = require('../src/schema').default
    let instance = Schema.instance,
    expected = { test: { ids: [], type: 'test' } }

    expect(() => { instance.initialize() }).toThrow()
    expect(() => { instance.initialize(store) }).toThrow()
    expect(() => { instance.initialize('aaaaa') }).toThrow()
    expect(() => { instance.initialize(store, 'aaaaa') }).toThrow()
  })

  it('should initialize with a populated store', () => {
    let Schema = require('../src/schema').default,
    initialState = require('./fixtures/testState.js').initialState,
    altStore = mockStore(initialState)

    let instance = Schema.instance

    instance.initialize(altStore, defaultEntities)
    expect(Object.keys(instance.entities)).toEqual(defaultEntities)
  })

  it('should create an SchemaEntity with the selected items', () => {
    let Schema = require('../src/schema').default,
    initialState = require('./fixtures/testState.js').initialState,
    altStore = mockStore(initialState)

    let instance = Schema.instance,
    ids = [1, 2, 3, 4, 5]

    instance.initialize(altStore, defaultEntities)
    let entityList = randomList(ids)
    let expected = { ids: entityList, type: 'project' },
    result = Schema.fromArray('project', entityList)

    expect(result).toBeA(SchemaEntity)
    expect(result.ids).toEqual(expected.ids)
    expect(result.type).toEqual(expected.type)
  })

  it('should get a SchemaItem from a SchemaEntity', () => {
    let Schema = require('../src/schema').default,
    initialState = require('./fixtures/testState.js').initialState,
    altStore = mockStore(initialState)

    let instance = Schema.instance,
    id = _.random(1,41)

    instance.initialize(altStore, defaultEntities)
    let result = instance.entities.project.findById(id)

    expect(result).toBeA(SchemaItem)
    expect(result.id).toBe(id)
    expect(result.type).toBe('project')
    expect(result.attributes).toBeAn('object')
    expect(result.relationships).toBeAn('object')
  })

  it('should get all projects on the state', () => {
    let Schema = require('../src/schema').default,
    initialState = require('./fixtures/testState.js').initialState,
    altStore = mockStore(initialState)

    let instance = Schema.instance

    instance.initialize(altStore, defaultEntities)
    let result = instance.entities.project.all

    let ids = _.sampleSize(_.range(1,41), 2)

    expect(result).toBeAn(Array)
    expect(result.length).toBe(41)
    expect(result[0]).toBeA(SchemaItem)
    expect(result[ids[0]]).toNotEqual(result[ids[1]])
    expect(result[ids[0]].id).toNotEqual(result[ids[1]].id)
  })

  it('should get related items from a SchemaItem', () => {
    let Schema = require('../src/schema').default,
    initialState = require('./fixtures/testState.js').initialState,
    altStore = mockStore(initialState)

    let instance = Schema.instance,
    id = _.random(1,41)

    instance.initialize(altStore, defaultEntities)
    let item = instance.entities.project.findById(id),
    result = item.getRelated('genres')

    expect(result).toBeAn(Array)
    expect(result[0]).toBeA(SchemaItem)
    expect(result[0].type).toBe('genre')
  })
})
