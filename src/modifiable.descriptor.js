import { schemaModifiable } from './schema.modifiable';
import { complexMerge } from './utils';

export const modifiableDescriptor = (descriptor, options = {}) => {
  if (!descriptor.modifier)
    throw new Error(`A modifiable descriptor must contain a modifier property`);
  return schemaModifiable(descriptor, {
    how: complexMerge(descriptor.modifier),
    ...options,
    modifiers: descriptor[options.key || 'modifier'].conditions,
  });
};
