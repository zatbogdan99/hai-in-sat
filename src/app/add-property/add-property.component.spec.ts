import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';

import { AddPropertyComponent } from './add-property.component';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { PhotoAdminService } from '../service/photo-admin.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';

describe('AddPropertyComponent', () => {
  let component: AddPropertyComponent;
  let fixture: ComponentFixture<AddPropertyComponent>;
  let propertyFormService: jasmine.SpyObj<PropertyFormServiceService>;
  let photoAdminService: jasmine.SpyObj<PhotoAdminService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let propertiesState: PropertiesStateService;

  beforeEach(() => {
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>(
      'PropertyFormServiceService',
      ['saveProperty', 'getPropertiesPage', 'deleteProperty', 'updateSortOrder', 'getPropertyById']
    );
    photoAdminService = jasmine.createSpyObj<PhotoAdminService>(
      'PhotoAdminService',
      ['replacePhotos', 'deleteAllPhotos']
    );
    messageService = jasmine.createSpyObj<MessageService>('MessageService', ['add']);

    propertyFormService.getPropertiesPage.and.returnValue(
      of({ content: [], totalElements: 0, totalPages: 0, size: 10, number: 0 })
    );
    propertyFormService.saveProperty.and.returnValue(of({}));
    propertyFormService.deleteProperty.and.returnValue(of(null));
    propertyFormService.updateSortOrder.and.returnValue(of(void 0));
    propertyFormService.getPropertyById.and.returnValue(of({
      id: 'default-id',
      name: 'Default',
      description: 'desc',
      type: 'land' as any,
      thumbnail: 'full-thumbnail',
      photos: []
    }));
    photoAdminService.replacePhotos.and.returnValue(of(void 0));
    photoAdminService.deleteAllPhotos.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [AddPropertyComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        LoadingService,
        { provide: Auth, useValue: {} },
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: PropertyFormServiceService, useValue: propertyFormService },
        { provide: PhotoAdminService, useValue: photoAdminService },
        { provide: MessageService, useValue: messageService }
      ]
    });

    fixture = TestBed.createComponent(AddPropertyComponent);
    component = fixture.componentInstance;
    propertiesState = TestBed.inject(PropertiesStateService);
    fixture.detectChanges();
  });

  it('should load properties on show', () => {
    component.onShowProperties();

    expect(propertyFormService.getPropertiesPage).toHaveBeenCalledWith(0, 20);
  });

  it('should show toast when saving invalid form', async () => {
    await component.onSave();

    expect(messageService.add).toHaveBeenCalled();
    expect(propertyFormService.saveProperty).not.toHaveBeenCalled();
  });

  it('should persist sort order when moving property down', () => {
    component.properties = [
      {
        id: 'a',
        name: 'A',
        description: 'A desc',
        type: 'land' as any,
        thumbnail: 'thumb-a',
        sortOrder: 1
      },
      {
        id: 'b',
        name: 'B',
        description: 'B desc',
        type: 'land' as any,
        thumbnail: 'thumb-b',
        sortOrder: 2
      }
    ];

    component.movePropertyDown(0);

    // Un SINGUR apel: serverul mută proprietatea pe poziția cerută și împinge
    // restul listei, atomic. Varianta veche trimitea câte un apel per element
    // mutat, iar un eșec parțial lăsa poziții duplicate sau găuri.
    expect(propertyFormService.updateSortOrder).toHaveBeenCalledOnceWith('a', 2);
  });

  it('should move a property up to the previous global position', () => {
    component.currentPage = 1;
    component.pageSize = 20;
    component.totalRecords = 40;
    component.properties = [
      {
        id: 'x',
        name: 'X',
        description: 'X desc',
        type: 'land' as any,
        thumbnail: 'thumb-x',
        sortOrder: 21
      }
    ];

    component.movePropertyUp(0);

    // Poziția se calculează pe lista COMPLETĂ (pagina 1 × 20 + index 0 + 1 = 21),
    // nu pe indexul din pagina curentă — altfel elementele de pe pagina a doua
    // ar sări în capul listei.
    expect(propertyFormService.updateSortOrder).toHaveBeenCalledOnceWith('x', 20);
  });

  it('should not move the last property further down', () => {
    component.currentPage = 0;
    component.totalRecords = 1;
    component.properties = [
      {
        id: 'only',
        name: 'Only',
        description: 'desc',
        type: 'land' as any,
        thumbnail: 'thumb',
        sortOrder: 1
      }
    ];

    component.movePropertyDown(0);

    expect(propertyFormService.updateSortOrder).not.toHaveBeenCalled();
  });

  it('should keep the existing thumbnail when replacing gallery photos', async () => {
    spyOn<any>(component, 'fileToBase64').and.callFake((file: File) => Promise.resolve(`base64:${file.name}`));
    propertyFormService.getPropertyById.and.returnValue(of({
      id: 'land-1',
      name: 'Land',
      description: 'desc',
      type: 'land' as any,
      thumbnail: 'https://cdn.example.com/full-thumb.jpg',
      photos: []
    }));
    component.selectedReplaceProperty = {
      id: 'land-1',
      name: 'Land',
      description: 'desc',
      type: 'land' as any,
      thumbnail: 'https://cdn.example.com/generated-thumb.jpg',
      photos: []
    };
    component.replaceGalleryFiles = [
      new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'two.jpg', { type: 'image/jpeg' })
    ];

    await component.confirmReplacePhotos();

    expect(propertyFormService.getPropertyById).toHaveBeenCalledWith('land-1');
    expect(photoAdminService.replacePhotos).toHaveBeenCalledWith({
      propertyId: 'land-1',
      thumbnail: 'https://cdn.example.com/full-thumb.jpg',
      photos: ['base64:one.jpg', 'base64:two.jpg']
    });
  });

  it('should use the first selected photo as fallback thumbnail when one is missing', async () => {
    spyOn<any>(component, 'fileToBase64').and.callFake((file: File) => Promise.resolve(`base64:${file.name}`));
    propertyFormService.getPropertyById.and.returnValue(of({
      id: 'land-2',
      name: 'Land',
      description: 'desc',
      type: 'land' as any,
      thumbnail: '',
      photos: []
    }));
    component.selectedReplaceProperty = {
      id: 'land-2',
      name: 'Land',
      description: 'desc',
      type: 'land' as any,
      thumbnail: '',
      photos: []
    };
    component.replaceGalleryFiles = [
      new File(['one'], 'one.jpg', { type: 'image/jpeg' }),
      new File(['two'], 'two.jpg', { type: 'image/jpeg' })
    ];

    await component.confirmReplacePhotos();

    expect(photoAdminService.replacePhotos).toHaveBeenCalledWith({
      propertyId: 'land-2',
      thumbnail: 'base64:one.jpg',
      photos: ['base64:two.jpg']
    });
  });

  it('should replace only the thumbnail without sending gallery photos', async () => {
    spyOn<any>(component, 'fileToBase64').and.resolveTo('base64:new-thumb');
    propertiesState.setCachedPage(0, 6, 'land', [
      {
        id: 'land-3',
        name: 'Land',
        description: 'desc',
        type: 'land' as any,
        thumbnail: 'old-thumb'
      }
    ]);
    component.selectedThumbnailProperty = {
      id: 'land-3',
      name: 'Land',
      description: 'desc',
      type: 'land' as any,
      thumbnail: 'old-thumb'
    };
    component.replaceThumbnailFile = new File(['thumb'], 'thumb.jpg', { type: 'image/jpeg' });

    await component.confirmReplaceThumbnail();

    expect(photoAdminService.replacePhotos).toHaveBeenCalledWith({
      propertyId: 'land-3',
      thumbnail: 'base64:new-thumb'
    });
    expect(propertiesState.getCachedPage(0, 6, 'land')).toBeNull();
  });
});
