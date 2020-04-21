import { ast } from '@zuze/schema';
import { get } from '@zuze/interpolate';
import { modifiable, identity } from '@zuze/modifiable';
import { deep, allKeys } from './utils';

const { matches } = ast;

// get all dependencies from an array of whens
const dependencies = ({ when }) =>
  allKeys
    .apply(null, Array.isArray(when) ? when : [when])
    .map(k => ctx => get(ctx, k));

const getModification = (
  { when, then, otherwise },
  context,
  how,
  state,
  options
) => {
  if (!then && !otherwise)
    throw new Error(`One of then or otherwise must be declared`);

  const shapes = Array.isArray(when) ? when : [when];
  const against = shapes.reduce(
    (acc, s) => ({
      ...acc,
      ...Object.keys(s).reduce(
        (acc, key) => ({ ...acc, [key]: get(context, key) }),
        {}
      ),
    }),
    {}
  );

  const what = matches(
    shapes.map(shape => ({ schema: 'object', shape })),
    against,
    Object.assign({ context: state }, options)
  )
    ? then
    : otherwise;

  return !what
    ? // no what - return identity
      identity
    : // if the what specifies a when, it's a nested condition :)
    what.when
    ? getModification(what, context, how, state, options)
    : // otherwise, modify
      state => how(state, what, context);
};

const schemaModifier = (modifier, how, state, options) => [
  context => getModification(modifier, context, how, state, options),
  dependencies(modifier),
];

export const schemaModifiable = (state, options = {}) => {
  const { how = deep, context = {}, modifiers = [] } = options;
  const createSchemaModifier = m => schemaModifier(m, how, state, options);
  const api = modifiable(
    state,
    Object.assign({ context }, options, {
      modifiers: modifiers.map(createSchemaModifier),
    })
  );

  return Object.assign({}, api, {
    modify: m => api.modify.apply(api, createSchemaModifier(m)),
  });
};
