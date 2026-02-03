import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AddPropertyComponent } from './add-property.component';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import { PhotoAdminService } from '../service/photo-admin.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../service/loading-service/loading-service.service';

describe('AddPropertyComponent', () => {
  let component: AddPropertyComponent;
  let fixture: ComponentFixture<AddPropertyComponent>;
  let propertyFormService: jasmine.SpyObj<PropertyFormServiceService>;
  let photoAdminService: jasmine.SpyObj<PhotoAdminService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(() => {
    propertyFormService = jasmine.createSpyObj<PropertyFormServiceService>(
      'PropertyFormServiceService',
      ['saveProperty', 'getPropertiesPage', 'deleteProperty', 'updateSortOrder']
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
    photoAdminService.replacePhotos.and.returnValue(of(void 0));
    photoAdminService.deleteAllPhotos.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [AddPropertyComponent],
      providers: [
        provideNoopAnimations(),
        LoadingService,
        { provide: PropertyFormServiceService, useValue: propertyFormService },
        { provide: PhotoAdminService, useValue: photoAdminService },
        { provide: MessageService, useValue: messageService }
      ]
    });

    fixture = TestBed.createComponent(AddPropertyComponent);
    component = fixture.componentInstance;
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

    expect(propertyFormService.updateSortOrder).toHaveBeenCalledWith('b', 1);
    expect(propertyFormService.updateSortOrder).toHaveBeenCalledWith('a', 2);
  });
});
