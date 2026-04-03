import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { PropertyTypeStore } from '../service/property-type.store';
import { PropertyType } from '../dto/property-type.enum';
import { PropertyDTO } from '../dto/property.dto';
import { InputText } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { FileUpload } from 'primeng/fileupload';
import { ButtonDirective } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { PropertyFormServiceService } from '../service/property-form-service/property-form-service.service';
import {Textarea} from "primeng/textarea";
import { PhotoAdminService, ReplacePhotosRequest } from '../service/photo-admin.service';
import { MessageService } from 'primeng/api';
import { LoadingService } from '../service/loading-service/loading-service.service';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-add-property',
  standalone: true,
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    DropdownModule,
    FileUpload,
    FloatLabel,
    ButtonDirective,
    Textarea,
    TableModule,
    DialogModule,
    ProgressSpinnerModule,
    PaginatorModule
  ]
})
export class AddPropertyComponent {
  @ViewChild('replaceGalleryInput') replaceGalleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('replaceThumbnailInput') replaceThumbnailInput?: ElementRef<HTMLInputElement>;

  PropertyType = PropertyType;
  propertyTypeOptions = [
    { label: 'house', value: PropertyType.HOUSE },
    { label: 'land', value: PropertyType.LAND }
  ];

  mainPhotoPreviewUrl: string | null = null;
  galleryPreviewUrls: string[] = [];

  properties: PropertyDTO[] = [];
  totalRecords = 0;
  pageSize = 20;
  currentPage = 0;
  showPropertiesTable = false;

  replaceDialogVisible = false;
  replaceGalleryFiles: File[] = [];
  replacePreviewUrls: string[] = [];
  selectedReplaceProperty: PropertyDTO | null = null;

  thumbnailDialogVisible = false;
  replaceThumbnailFile: File | null = null;
  replaceThumbnailPreviewUrl: string | null = null;
  selectedThumbnailProperty: PropertyDTO | null = null;

  constructor(
    public store: PropertyTypeStore,
    private propertyFormService: PropertyFormServiceService,
    private photoAdminService: PhotoAdminService,
    private messageService: MessageService,
    public loadingService: LoadingService,
    private auth: Auth,
    private router: Router
  ) {}

  onUpload(event: any) {
    const file: File | undefined = event?.files?.[0];
    this.store.setPhoto(file ?? null);
    this.setMainPhotoPreview(file ?? null);
  }

  onUploadGallery(event: any) {
    const files: File[] = event?.files ?? [];
    this.store.setGalleryPhotos(files);
    this.setGalleryPreviews(files);
  }

  clearMainPhoto() {
    this.store.setPhoto(null);
    this.setMainPhotoPreview(null);
  }

  removeGalleryPhoto(index: number) {
    const files = [...this.store.form.controls.photos.value];
    if (index < 0 || index >= files.length) {
      return;
    }
    files.splice(index, 1);
    this.store.setGalleryPhotos(files);
    this.setGalleryPreviews(files);
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  async onSave() {
    if (this.store.form.invalid) {
      this.store.form.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formular invalid',
        detail: 'Verificați câmpurile obligatorii.'
      });
      return;
    }

    const { name, description, type, photo, photos } = this.store.value;

    this.loadingService.loadingOn();

    let thumbnail = '';
    if (photo) {
      try {
        thumbnail = await this.fileToBase64(photo);
      } catch (e) {
        console.error('Eroare la conversia imaginii:', e);
      }
    }

    let gallery: string[] = [];
    if (photos && photos.length) {
      try {
        gallery = await Promise.all(photos.map((f) => this.fileToBase64(f)));
      } catch (e) {
        console.error('Eroare la conversia imaginilor din galerie:', e);
      }
    }

    const payload: PropertyDTO = {
      name,
      description,
      type: type as PropertyType,
      thumbnail,
      photos: gallery
    };

    this.propertyFormService.saveProperty(payload).subscribe({
      next: (resp) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Salvare reușită',
          detail: 'Proprietatea a fost salvată.'
        });
        this.loadingService.loadingOff();
      },
      error: (err) => {
        console.error('Failed to save property', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut salva proprietatea.'
        });
        this.loadingService.loadingOff();
      }
    });
  }

  onShowProperties() {
    this.loadPropertiesPage(0);
  }

  onPropertiesPageChange(event: any) {
    const page = event?.page ?? 0;
    this.loadPropertiesPage(page);
  }

  onDeleteProperty(property: PropertyDTO) {
    const trimmed = (property.id ?? '').trim();
    if (!trimmed) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lipsă ID',
        detail: 'Nu am găsit ID-ul proprietății pentru ștergere.'
      });
      return;
    }
    this.propertyFormService.deleteProperty(trimmed).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Șters',
          detail: 'Proprietatea a fost ștearsă.'
        });
        this.loadPropertiesPage(this.currentPage);
      },
      error: (err) => {
        console.error('Eroare la ștergerea proprietății', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut șterge proprietatea.'
        });
      }
    });
  }

  movePropertyUp(index: number) {
    if (index <= 0 || index >= this.properties.length) {
      return;
    }
    this.swapProperties(index, index - 1);
  }

  movePropertyDown(index: number) {
    if (index < 0 || index >= this.properties.length - 1) {
      return;
    }
    this.swapProperties(index, index + 1);
  }

  openReplacePhotos(property: PropertyDTO) {
    this.selectedReplaceProperty = property;
    this.replaceGalleryInput?.nativeElement.click();
  }

  onReplaceGallerySelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (!files.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nicio poză selectată',
        detail: 'Selectează cel puțin o poză pentru înlocuire.'
      });
      if (input) {
        input.value = '';
      }
      return;
    }
    this.replaceGalleryFiles = files;
    this.setReplacePreviews(files);
    this.replaceDialogVisible = true;
  }

  async confirmReplacePhotos() {
    if (!this.selectedReplaceProperty?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lipsă proprietate',
        detail: 'Nu este selectată nicio proprietate.'
      });
      return;
    }
    if (!this.replaceGalleryFiles.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nicio poză selectată',
        detail: 'Selectează poze înainte de a confirma.'
      });
      return;
    }

    try {
      const photosBase64 = await Promise.all(
        this.replaceGalleryFiles.map((file) => this.fileToBase64(file))
      );
      const payload: ReplacePhotosRequest = {
        propertyId: this.selectedReplaceProperty.id,
        thumbnail: photosBase64[0],
        photos: photosBase64
      };
      this.photoAdminService.replacePhotos(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Poze înlocuite',
            detail: 'Pozele au fost actualizate.'
          });
          this.closeReplaceDialog();
        },
        error: (err) => {
          console.error('Eroare la înlocuirea pozelor:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Eroare',
            detail: 'Nu s-au putut înlocui pozele.'
          });
        }
      });
    } catch (e) {
      console.error('Eroare la pregătirea pozelor pentru înlocuire:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Eroare',
        detail: 'Nu s-au putut procesa pozele selectate.'
      });
    }
  }

  closeReplaceDialog() {
    this.replaceDialogVisible = false;
    this.clearReplaceSelection();
  }

  openReplaceThumbnail(property: PropertyDTO) {
    this.selectedThumbnailProperty = property;
    this.replaceThumbnailInput?.nativeElement.click();
  }

  onReplaceThumbnailSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nicio poză selectată',
        detail: 'Selectează o poză pentru poza principală.'
      });
      if (input) {
        input.value = '';
      }
      return;
    }
    this.replaceThumbnailFile = file;
    if (this.replaceThumbnailPreviewUrl) {
      URL.revokeObjectURL(this.replaceThumbnailPreviewUrl);
    }
    this.replaceThumbnailPreviewUrl = URL.createObjectURL(file);
    this.thumbnailDialogVisible = true;
  }

  async confirmReplaceThumbnail() {
    if (!this.selectedThumbnailProperty?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lipsă proprietate',
        detail: 'Nu este selectată nicio proprietate.'
      });
      return;
    }
    if (!this.replaceThumbnailFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nicio poză selectată',
        detail: 'Selectează o poză înainte de a confirma.'
      });
      return;
    }

    try {
      this.loadingService.loadingOn();
      const thumbnailBase64 = await this.fileToBase64(this.replaceThumbnailFile);
      const existingPhotos = this.selectedThumbnailProperty.photos ?? [];
      const payload: ReplacePhotosRequest = {
        propertyId: this.selectedThumbnailProperty.id,
        thumbnail: thumbnailBase64,
        photos: existingPhotos
      };
      this.photoAdminService.replacePhotos(payload).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Poză principală actualizată',
            detail: 'Poza principală a fost înlocuită.'
          });
          this.closeThumbnailDialog();
          this.loadPropertiesPage(this.currentPage);
          this.loadingService.loadingOff();
        },
        error: (err) => {
          console.error('Eroare la înlocuirea pozei principale:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Eroare',
            detail: 'Nu s-a putut înlocui poza principală.'
          });
          this.loadingService.loadingOff();
        }
      });
    } catch (e) {
      console.error('Eroare la pregătirea pozei principale:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Eroare',
        detail: 'Nu s-a putut procesa poza selectată.'
      });
      this.loadingService.loadingOff();
    }
  }

  closeThumbnailDialog() {
    this.thumbnailDialogVisible = false;
    this.replaceThumbnailFile = null;
    if (this.replaceThumbnailPreviewUrl) {
      URL.revokeObjectURL(this.replaceThumbnailPreviewUrl);
      this.replaceThumbnailPreviewUrl = null;
    }
    if (this.replaceThumbnailInput?.nativeElement) {
      this.replaceThumbnailInput.nativeElement.value = '';
    }
  }

  onDeleteAllPhotos() {
    this.photoAdminService.deleteAllPhotos().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Poze șterse',
          detail: 'Toate pozele au fost șterse.'
        });
      },
      error: (err) => {
        console.error('Eroare la ștergerea tuturor pozelor:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-au putut șterge toate pozele.'
        });
      }
    });
  }

  private loadPropertiesPage(page: number) {
    this.loadingService.loadingOn();
    this.propertyFormService.getPropertiesPage(page, this.pageSize).subscribe({
      next: (resp) => {
        this.currentPage = page;
        const content = resp?.content ?? [];
        this.properties = this.sortPropertiesByOrder(content);
        this.totalRecords = resp?.totalElements ?? this.properties.length;
        this.showPropertiesTable = true;
        this.messageService.add({
          severity: 'success',
          summary: 'Proprietăți încărcate',
          detail: 'Lista de proprietăți a fost actualizată.'
        });
        this.loadingService.loadingOff();
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-au putut încărca proprietățile.'
        });
        this.loadingService.loadingOff();
      }
    });
  }

  private sortPropertiesByOrder(properties: PropertyDTO[]): PropertyDTO[] {
    return [...properties].sort((first, second) => {
      const firstOrder = first.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const secondOrder = second.sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }
      return (first.name ?? '').localeCompare(second.name ?? '');
    });
  }

  private swapProperties(currentIndex: number, targetIndex: number) {
    const updated = [...this.properties];
    [updated[currentIndex], updated[targetIndex]] = [updated[targetIndex], updated[currentIndex]];
    this.properties = updated;
    this.updateLocalSortOrders();
    const changed = [this.properties[currentIndex], this.properties[targetIndex]].filter(Boolean);
    this.persistSortOrderChanges(changed);
  }

  private updateLocalSortOrders() {
    this.properties = this.properties.map((property, index) => ({
      ...property,
      sortOrder: index + 1
    }));
  }

  private persistSortOrderChanges(properties: PropertyDTO[]) {
    const updates = properties
      .filter((property) => property?.id && typeof property.sortOrder === 'number')
      .map((property) => this.propertyFormService.updateSortOrder(property.id!, property.sortOrder!));

    if (!updates.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lipsă date',
        detail: 'Nu pot salva ordinea fără ID sau sortOrder.'
      });
      return;
    }

    forkJoin(updates).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Ordine salvată',
          detail: 'Ordinea a fost actualizată.'
        });
      },
      error: (err) => {
        console.error('Eroare la salvarea ordinii:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut salva ordinea.'
        });
      }
    });
  }

  private setMainPhotoPreview(file: File | null) {
    if (this.mainPhotoPreviewUrl) {
      URL.revokeObjectURL(this.mainPhotoPreviewUrl);
    }
    this.mainPhotoPreviewUrl = file ? URL.createObjectURL(file) : null;
  }

  private setGalleryPreviews(files: File[]) {
    this.galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.galleryPreviewUrls = files.map((file) => URL.createObjectURL(file));
  }

  private setReplacePreviews(files: File[]) {
    this.replacePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.replacePreviewUrls = files.map((file) => URL.createObjectURL(file));
  }

  private clearReplaceSelection() {
    this.replaceGalleryFiles = [];
    this.replacePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    this.replacePreviewUrls = [];
    if (this.replaceGalleryInput?.nativeElement) {
      this.replaceGalleryInput.nativeElement.value = '';
    }
  }

  /**
   * Logout - Deconectează utilizatorul și redirectionează la homepage
   */
  async logout() {
    try {
      await signOut(this.auth);
      console.log('[Logout] User signed out successfully');
      this.messageService.add({
        severity: 'success',
        summary: 'Deconectat',
        detail: 'Ai fost deconectat cu succes.'
      });
      this.router.navigate(['/']);
    } catch (err) {
      console.error('[Logout] Error signing out:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Eroare',
        detail: 'Nu s-a putut efectua deconectarea.'
      });
    }
  }
}
