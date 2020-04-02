import { modifiableDescriptor } from '../src/modifiable.descriptor';

const descriptor = {
  schema: 'string',
  tests: ['required', ['is', 'freddie']],
  field: {
    type: 'select',
    options: ['freddie', 'roger', 'doug', 'jim'],
  },
  modifier: {
    keep: ['not a key'],
    interpolate: ['hint', 'someval', 'field.options'],
    conditions: [
      {
        when: {
          value: { tests: ['required', ['oneOf', { ref: '$field.options' }]] },
        },
        then: {
          when: { value: { tests: [['is', 'freddie']] } },
          then: { hint: 'yay! you selected freddie!' },
          otherwise: { hint: 'boo, you only selected {value}' },
        },
        otherwise: { hint: 'select a value' },
      },
    ],
  },
};

describe('modifiable descriptor', () => {
  it('should work', () => {
    const m = modifiableDescriptor(descriptor);
    expect(m.getState().hint).toBe('select a value');
    m.setContext({ value: 'jim' });
    expect(m.getState().hint).toBe('boo, you only selected jim');
    m.setContext({ value: 'freddie' });
    expect(m.getState().hint).toBe('yay! you selected freddie!');
    m.setContext({ value: 'nope' });
    expect(m.getState().hint).toBe('select a value');
  });

  it('should preserve values', () => {
    const descriptor = {
      schema: 'string',
      tests: ['required'],
      modifier: {
        keep: ['schema'],
        conditions: [
          {
            when: { someField: { tests: ['required'] } },
            then: { schema: 'notString', hint: 'someHint' },
          },
        ],
      },
    };

    const m = modifiableDescriptor(descriptor, {
      context: { someField: 'fred' },
    });
    expect(m.getState().hint).toBe('someHint');
    expect(m.getState().schema).toBe('string');
    m.setContext(() => {});
    expect(m.getState().hint).toBeUndefined();
  });

  it('should append', () => {
    const descriptor = {
      schema: 'string',
      tests: ['required'],
      someOtherProp: ['m'],
      modifier: {
        append: ['tests', 'someProp', 'someOtherProp', 'noProp'],
        conditions: [
          {
            when: { someField: { tests: ['required'] } },
            then: { tests: [['min', 10]], someProp: ['h'] },
          },
        ],
      },
    };

    const m = modifiableDescriptor(descriptor, {
      context: { someField: 'fred' },
    });
    expect(m.getState().tests).toHaveLength(2);
    m.setContext(() => {});
    expect(m.getState().tests).toEqual(['required']);
  });

  it('should merge', () => {
    const descriptor = {
      schema: 'string',
      tests: ['required'],
      field: {
        type: 'select',
        options: ['freddie', 'roger', 'doug', 'jim'],
      },
      modifier: {
        merge: ['field'],
        conditions: [
          {
            when: { someField: { tests: ['required'] } },
            then: { field: { type: 'text', style: 'filled' } },
          },
        ],
      },
    };

    const m = modifiableDescriptor(descriptor, {
      context: { someField: 'fred' },
    });

    expect(m.getState().field.options).toBe(descriptor.field.options);
    expect(m.getState().field.type).toBe('text');
    expect(m.getState().field.style).toBe('filled');

    m.setContext(() => {});

    expect(m.getState().field.options).toBe(descriptor.field.options);
    expect(m.getState().field.type).toBe('select');
    expect(m.getState().field.style).toBeUndefined();
  });

  it('should throw an error if there is no modifier property', () => {
    expect(() =>
      modifiableDescriptor({ ...descriptor, modifier: undefined })
    ).toThrow('A modifiable descriptor must contain a modifier property');
  });
});
