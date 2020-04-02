import { from, get, set } from '@zuze/interpolate';

export const allKeys = (...objects) =>
  Array.from(
    new Set(objects.reduce((acc, o) => [...acc, ...Object.keys(o)], []))
  );

export const deep = (state, mod) =>
  Object.entries(mod).reduce(
    (acc, [key, val]) =>
      get(acc, key) === val ? acc : set(acc, key, val, true),
    state
  );

// accepts paths and returns a function that merges the values of objects at those paths
export const merge = keys => (...objects) =>
  keys.reduce(
    (acc, k) =>
      set(
        acc,
        k,
        objects.reduce((acc, o) => ({ ...acc, ...get(o, k, {}) }), {})
      ),
    {}
  );

// keys reference expected array entities
export const append = keys => (orig, next) =>
  keys.reduce((acc, k) => {
    const o = get(orig, k);
    const n = get(next, k);
    // if neither object specifies the path, then skip
    if (!o && !n) return acc;
    return set(acc, k, [...(o || []), ...(n || [])]);
  }, {});

// merges - objects will be merged
// keeps - values will not be overridden
// all other parts of the mod will be shallow merged with the state

export const complexMerge = ({
  merge: merges = [],
  keep: keeps = [],
  append: appends = [],
  interpolate = [],
} = {}) => (state, mod, context) =>
  interpolate.reduce(
    (acc, k) => {
      const val = get(acc, k);
      return val ? set(acc, k, from(val, context)) : acc;
    },
    keeps.reduce((acc, k) => set(acc, k, get(state, k)), {
      ...deep(state, mod),
      ...merge(merges)(state, mod),
      ...append(appends)(state, mod),
    })
  );
