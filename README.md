# Schema Modifiable

[![npm version](https://img.shields.io/npm/v/@zuze/schema-modifiable.svg)](https://npmjs.org/package/@zuze/schema-modifiable)
[![Coverage Status](https://coveralls.io/repos/github/zuze-lab/schema-modifiable/badge.svg)](https://coveralls.io/github/zuze-lab/schema-modifiable)
[![Build Status](https://travis-ci.com/zuze-lab/schema-modifiable.svg)](https://travis-ci.com/zuze-lab/schema-modifiable)
[![Bundle Phobia](https://badgen.net/bundlephobia/minzip/@zuze/schema-modifiable)](https://bundlephobia.com/result?p=@zuze/schema-modifiable)

## What?

Check out [**@zuze/schema**](https://github.com/zuze-lab/schema) and [**@zuze/modifiable**](https://github.com/zuze-lab/modifiable) and then come back.

## And now...

Same reason as **@zuze/modifiable** came about - manipulating application (or some kind of) state in response to changes in external *context* (user input, websocket events, etc).

## SchemaModifiable

SchemaModifiable allows you to create modifiers as [AST Schema Definitions](https://zuze-lab.github.io/schema/docs/ast).


```js
import { schemaModifiable } from '@zuze/schema-modifiable';


```

## ModifiableDescriptor

A modifiable descriptor is a plain javascript object that defines its own modifiers at a special key called `modifier` (the key can be configured using options).

All you need to do to determine a state is supply the context. All of your modification logic has already been encoded in the state itself:

```js
import { modifiableDescriptor } from '@zuze/schema-modifiable';


const myModifiableDescriptor = modifiableDescriptor({
  // the descriptor part
  schema: 'string',
  tests: ['required', ['is', 'freddie']],
  field: {
    type: 'select',
    options: ['freddie', 'roger', 'doug', 'jim'],
    properties: {
        key: 'value'
    }
  },


  // the modifications
  modifier: {
    // values at these paths should be interpolated using the context object
    interpolate: ['hint'],

    // values at these paths will never be overridden
    keep: ['schema'],

    // values at these paths will be appended by conditions, if applicable
    append: ['field.options'],

    // values at these paths will be merged with conditions, if applicable
    merge: ['field.properties'],

    conditions: [
      {
        when: { value: { tests: ['required' ] } },
        then: {
            when: { value: { tests: [['oneOf', { ref: '$field.options' } ]] } },
            then: {
                when: { value: { tests: [['is', 'freddie']] } },
                then: { hint: 'yay! you selected freddie!' },
                otherwise: { hint: 'boo, why not freddie?' },                
            },
            otherwise: { hint: '{value} is not one of the options' },
        },
        otherwise: { hint: 'select an option' },
      },
    ],
  },
});

myModifiableDescriptor.getState();
/*
{
  schema: 'string',
  tests: ['required', ['is', 'freddie']],
  field: {
    type: 'select',
    options: ['freddie', 'roger', 'doug', 'jim'],
  },
  hint: 'select an option'
}
*/

myModifiableDescriptor.setContext({value: 'not an option'});
/*
{
  ...
  hint: 'not an option is not one of the options'
}
*/

myModifiableDescriptor.setContext({value: 'jim'});
/*
{
  ...
  hint: 'boo, why not freddie?'
}
*/

myModifiableDescriptor.setContext({value: 'freddie'});
/*
{
  ...
  hint: 'yay! you selected freddie!'
}
*/
```

## API