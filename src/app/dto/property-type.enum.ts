export enum PropertyType {
  HOUSE = 'house',
  LAND = 'land'
}

export function isPropertyType(v: unknown): v is PropertyType {
  return v === PropertyType.HOUSE || v === PropertyType.LAND;
}

export function toPropertyType(v: unknown, fallback: PropertyType = PropertyType.LAND): PropertyType {
  return isPropertyType(v) ? v : fallback;
}
