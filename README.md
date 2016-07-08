Schemas for JSON API
----------------

Handling your [JSON API](http://jsonapi.org)s on Redux as easy as possible.

Note that this is WIP, and as such new features can be added or removed.

# Features

- Extends the state provided by [redux-json-api](https://github.com/dixieio/redux-json-api)
  in a non invasive way
- Eases most common tasks for a web application, such as:
  - Getting a specified element from the state
  - Handling all create, edit and delete actions efficiently
  - Working with related items (for ex., getting all related employees from an office)
  - Basic querying (to be extended on a future release)
- Cleans most of repeated code related to API handling

# Installation

1. `npm install redux-json-api` (follow instructions on [redux-json-api](https://github.com/dixieio/redux-json-api) docs)
1. `npm install redux-json-api-schema`

# Initializing the schema

The following code will initialize the structure for `user` and `project` models,
acting as a wrapper for the state provided by the JSON API.
```javascript
import { Schema } from 'redux-json-api-schema'

let schema = Schema.instance
schema.initialize(store, [
  'user',
  'project'
])
```

Now you're ready to start working on your state.

# Available classes

## Schema
This is the main class, which provides the base structure and static content in order to add extended capabilities to the state.

## SchemaEntity
Each model is handled as a `SchemaEntity` object, which allows to easily search for elements, as well as other tasks like count or work with subsets of elements.

## SchemaItem
This refers to a specific element on the state, allowing to easily update existing items or create new ones.

This works with an internal diff which keeps track of all made changes, in order to make API queries as small as possible.

# TODO
- Handle API read calls from within the library
- Improve search (add ne / gt / lt conditions)
- Add model validation support
- Add a lot of test cases
- Improve this readme (for obvious reasons)

* * *

Made with ❤️ by [Matías Zanolli][matiaszanolli]

 [matiaszanolli]: http://matiaszanolli.com
