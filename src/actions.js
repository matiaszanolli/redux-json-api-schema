import {
  readEndpoint,
  createEntity,
  updateEntity,
  deleteEntity
} from 'redux-json-api'

export function read(endpoint) {
  return readEndpoint(endpoint)
}

export function create(entity) {
  // TODO: Validate
  return createEntity(entity)
}

export function update(entity) {
  // TODO: Validate
  return updateEntity(entity)
}

export function remove(entity) {
  return deleteEntity(entity)
}
