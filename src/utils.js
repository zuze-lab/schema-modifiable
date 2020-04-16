import { from, get, set } from '@zuze/interpolate';

const fromArgs = args => Array.prototype.slice.call(args);
const fromSet = set => {
  const r = [];
  return set.forEach(v => r.push(v)), r;
};

export function allKeys() {
  return fromSet(
    new Set(
      fromArgs(arguments).reduce((acc, o) => acc.concat(Object.keys(o)), [])
    )
  );
}

export const deep = (state, mod) =>
  Object.entries(mod).reduce(
    (acc, entry) => set(acc, entry[0], entry[1], true),
    state
  );

// accepts paths and returns a function that merges the values of objects at those paths

export const merge = keys =>
  function() {
    const objects = fromArgs(arguments);
    return keys.reduce(
      (acc, k) =>
        set(
          acc,
          k,
          objects.reduce((acc, o) => Object.assign(acc, get(o, k, {})), {})
        ),
      {}
    );
  };

// keys reference expected array entities
export const append = keys => (orig, next) =>
  keys.reduce(
    (acc, k) => set(acc, k, get(orig, k, []).concat(get(next, k, []))),
    {}
  );

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
    keeps.reduce(
      (acc, k) => set(acc, k, get(state, k)),
      Object.assign(
        deep(state, mod),
        merge(merges)(state, mod),
        append(appends)(state, mod)
      )
    )
  );
