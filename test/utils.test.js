import { merge, complexMerge, deep } from '../src/utils';

describe('deep', () => {
  const state = {
    field: {
      hidden: false,
      options: [
        { label: 'first', value: 'first' },
        { label: 'second', value: 'second' },
      ],
    },
  };

  it('should modify deep', () => {
    const result = deep(state, {
      'field.hidden': true,
      'field.options[0].extra': 'fail',
    });

    expect(result).not.toBe(state);
    expect(result.field.hidden).toBe(true);
    expect(result.field.options[0].extra).toBe('fail');
  });
});

describe('complexMerge', () => {
  const state = {
    a: 'b',
    c: 'd',
    e: 'f',
    g: {
      h: 'i',
      j: 'k',
    },
    l: {
      m: 'nop',
    },
  };

  const mod = {
    a: 'mod',
    g: 'mod',
    l: {
      q: 'rst',
    },
    u: {
      v: 'wxyz',
    },
  };

  it('should merge if no merges/keeps provided', () => {
    expect(complexMerge()(state, mod)).toStrictEqual({ ...state, ...mod });
  });

  it('should merge if a keep is provided', () => {
    expect(complexMerge({ keep: ['a'] })(state, mod)).toStrictEqual({
      ...state,
      ...mod,
      a: state.a,
    });
  });

  it('should merge if a merge is provided', () => {
    expect(complexMerge({ merge: ['l'] })(state, mod)).toStrictEqual({
      ...state,
      ...mod,
      l: { ...state.l, ...mod.l },
    });
  });
});

describe('merge', () => {
  it('should accept paths on how to merge a modification with a state object', () => {
    const paths = ['one', 'two'];
    const state = {
      one: {
        a: 'b',
      },
      two: {
        c: 'd',
      },
      three: {
        e: 'f',
      },
    };

    const mod = {
      one: {
        g: 'h',
      },
      two: {
        i: 'j',
      },
      three: {
        k: 'l',
      },
    };

    expect(merge(paths)(state, mod).one).toEqual({ ...state.one, ...mod.one });
    expect(merge(paths)(state, mod).two).toEqual({ ...state.two, ...mod.two });
    expect(merge(paths)(state, mod).three).not.toBeDefined();
  });
});
