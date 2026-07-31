import { PropertyType, toPropertyType } from './property-type.enum';

describe('toPropertyType', () => {
  it('returns PropertyType.LAND for land', () => {
    expect(toPropertyType('land')).toBe(PropertyType.LAND);
  });

  it('returns the provided fallback for an unknown type', () => {
    expect(toPropertyType('farm', PropertyType.HOUSE)).toBe(PropertyType.HOUSE);
  });

  it('returns PropertyType.LAND as the default fallback for null', () => {
    expect(toPropertyType(null)).toBe(PropertyType.LAND);
  });
});
