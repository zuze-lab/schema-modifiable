import { ast } from '@zuze/schema';
import { get } from '@zuze/interpolate';
import { modifiable, identity } from '@zuze/modifiable';
import { deep, allKeys } from './utils';

const { matches } = ast;

// get all dependencies from an array of whens
const dependencies = ({ when }) =>
  allKeys(...(Array.isArray(when) ? when : [when])).map(k => ctx =>
    get(ctx, k)
  );

const getModification = (
  { when, then, otherwise },
  context,
  how,
  state,
  options
) => {
  if (!then && !otherwise)
    throw new Error(`One of then or otherwise must be declared`);

  const what = matches(
    (Array.isArray(when) ? when : [when]).map(shape => ({
      schema: 'object',
      shape,
    })),
    context,
    {
      ...options,
      context: state,
    }
  )
    ? then
    : otherwise;

  return !what
    ? // no what - return identity
      identity
    : // if the what specifies a when, it's a nested condition :)
    what.when
    ? getModification(what, context, how)
    : // otherwise, modify
      state => how(state, what, context);
};

const schemaModifier = (modifier, how, state, options) => [
  context => getModification(modifier, context, how, state, options),
  dependencies(modifier),
];

export const schemaModifiable = (state, options = {}) => {
  const { how = deep, context = {}, ...rest } = options;
  const createSchemaModifier = m => schemaModifier(m, how, state, rest);
  const { modify, ...api } = modifiable(state, {
    context,
    ...rest,
    modifiers: (rest.modifiers || []).map(createSchemaModifier),
  });
  return {
    modify: m => modify(...createSchemaModifier(m)),
    ...api,
  };
};
