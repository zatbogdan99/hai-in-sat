import { Injectable, signal } from '@angular/core';
import { PropertyDTO } from '../../dto/property.dto';

export type PropertyTypeFilter = 'house' | 'land';

@Injectable({
  providedIn: 'root'
})
export class PropertiesStateService {
  private readonly pageSignal = signal<number>(0);
  private readonly sizeSignal = signal<number>(6);
  private readonly totalRecordsSignal = signal<number>(0);
  private readonly totalPagesSignal = signal<number>(0);
  private readonly propertyTypeSignal = signal<PropertyTypeFilter>('land');
  private readonly pageCacheSignal = signal<Map<string, PropertyDTO[]>>(new Map());

  get page(): number {
    return this.pageSignal();
  }

  setPage(page: number): void {
    this.pageSignal.set(page);
  }

  get size(): number {
    return this.sizeSignal();
  }

  setSize(size: number): void {
    this.sizeSignal.set(size);
  }

  get totalRecords(): number {
    return this.totalRecordsSignal();
  }

  setTotalRecords(totalRecords: number): void {
    this.totalRecordsSignal.set(totalRecords);
  }

  get totalPages(): number {
    return this.totalPagesSignal();
  }

  setTotalPages(totalPages: number): void {
    this.totalPagesSignal.set(totalPages);
  }

  get propertyType(): PropertyTypeFilter {
    return this.propertyTypeSignal();
  }

  setPropertyType(type: PropertyTypeFilter): void {
    this.propertyTypeSignal.set(type);
  }

  getCachedPage(page: number, size: number, type: PropertyTypeFilter): PropertyDTO[] | null {
    return this.pageCacheSignal().get(this.getCacheKey(page, size, type)) ?? null;
  }

  setCachedPage(page: number, size: number, type: PropertyTypeFilter, properties: PropertyDTO[]): void {
    const updatedCache = new Map(this.pageCacheSignal());
    updatedCache.set(this.getCacheKey(page, size, type), properties);
    this.pageCacheSignal.set(updatedCache);
  }

  clearCache(): void {
    this.pageCacheSignal.set(new Map());
  }

  private getCacheKey(page: number, size: number, type: PropertyTypeFilter): string {
    return `${page}:${size}:${type}`;
  }
}
