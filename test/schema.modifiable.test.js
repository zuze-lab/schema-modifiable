import { schemaModifiable } from '../src/schema.modifiable';
import { deep } from '../src/utils';

const testMap = {
  id1: {
    a: 'a',
    b: 'b',
    c: 'c',
  },
  id2: {
    d: 'd',
    e: 'e',
    f: 'f',
  },
  id3: {
    g: 'g',
    h: 'h',
    i: 'i',
  },
};

describe('schema modifiable', () => {
  it('should work', () => {
    const m = schemaModifiable(testMap);
    expect(m.getState()).toBe(testMap);
  });

  it('should modify', () => {
    const modifiers = [
      {
        when: { firstName: { tests: ['required', ['is', 'freddie']] } },
        then: { id1: 'jim' },
        otherwise: { id1: 'fred' },
      },
    ];

    const m = schemaModifiable(testMap, { modifiers });
    expect(m.getState().id1).toBe('fred');
    m.setContext({ firstName: 'freddie' });
    expect(m.getState().id1).toBe('jim');
    m.clear();
    expect(m.getState().id1).toEqual(testMap.id1);
  });

  it('should modify with or', () => {
    const modifiers = [
      {
        when: [
          { firstName: { tests: ['required', ['is', 'freddie']] } },
          { lastName: { schema: 'string', tests: ['required', ['min', 5]] } },
        ],
        then: { id1: 'jim' },
        otherwise: { id1: 'fred' },
      },
    ];
    const m = schemaModifiable(testMap, { modifiers });
    expect(m.getState().id1).toBe('fred');
    m.setContext({ lastName: 'more than 5 characters' });
    expect(m.getState().id1).toBe('jim');
    m.clear();
    expect(m.getState().id1).toEqual(testMap.id1);
  });

  it('should modify at runtime', () => {
    const m = schemaModifiable(testMap);
    m.setContext({ firstName: 'freddie' });
    expect(m.getState().id1).toEqual(testMap.id1);
    const undo = m.modify({
      when: { firstName: { tests: ['required', ['is', 'freddie']] } },
      then: { id1: 'jim' },
      otherwise: { id1: 'fred' },
    });
    expect(m.getState().id1).toEqual('jim');
    undo();
    expect(m.getState().id1).toEqual(testMap.id1);
  });

  it('should throw an error if no then or otherwise is specified', () => {
    const modifiers = [
      {
        when: [
          { firstName: { tests: ['required', ['is', 'freddie']] } },
          { lastName: { schema: 'string', tests: ['required', ['min', 5]] } },
        ],
      },
    ];
    expect(() => schemaModifiable(testMap, { modifiers })).toThrow(
      'One of then or otherwise must be declared'
    );
  });

  it('should work if no then or otherwise is specified on a matching condition', () => {
    const modifiers = [
      {
        when: { firstName: { tests: ['required', ['is', 'freddie']] } },
        otherwise: { id1: 'jim' },
      },
      {
        when: { lastName: { tests: ['required', ['is', 'mercury']] } },
        then: { id2: 'bill' },
      },
    ];

    const m = schemaModifiable(testMap, { modifiers });
    expect(m.getState().id1).toBe('jim');
    expect(m.getState().id2).toBe(testMap.id2);
    m.setContext({ firstName: 'freddie', lastName: 'mercury' });
    expect(m.getState().id1).toBe(testMap.id1);
    expect(m.getState().id2).toBe('bill');
  });

  it('should modify with a custom how', () => {
    const modifiers = [
      {
        when: { firstName: { tests: ['required', ['is', 'freddie']] } },
        then: { 'id1.a': 'jim' },
        otherwise: { 'id1.j': 'fred' },
      },
    ];
    const how = deep;
    const m = schemaModifiable(testMap, { modifiers, how });
    expect(m.getState().id1.j).toBe('fred');
    m.setContext({ firstName: 'freddie' });
    expect(m.getState().id1.j).toBeUndefined();
    expect(m.getState().id1.a).toBe('jim');
  });

  it('should allow nested conditions', () => {
    // nested conditions are supported
    // but only when all dependencies have
    // been specified as keys in the outer-most when
    // might be able to fix this by looking recursively

    const modifiers = [
      {
        when: {
          firstName: { tests: ['required', ['is', 'freddie']] },
          lastName: { schema: 'string' },
        },
        then: {
          when: {
            lastName: { schema: 'string', tests: ['required', ['min', 5]] },
          },
          then: { id1: 'more than 5' },
          otherwise: { id1: 'less than 5' },
        },
        otherwise: {
          id1: 'not freddie',
        },
      },
    ];

    const m = schemaModifiable(testMap, { modifiers });
    expect(m.getState().id1).toBe('not freddie');
    m.setContext({ firstName: 'freddie' });
    expect(m.getState().id1).toBe('less than 5');
    m.setContext({ lastName: 'longer than 5 chars' });
    expect(m.getState().id1).toBe('more than 5');
    m.setContext({ firstName: undefined });
    expect(m.getState().id1).toBe('not freddie');
  });
});
