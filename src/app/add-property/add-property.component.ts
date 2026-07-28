import { Component, DestroyRef, ElementRef, inject, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { firstValueFrom, map } from 'rxjs';
import { PropertiesStateService } from '../service/properties-state-service/properties-state.service';

@Component({
  selector: 'app-add-property',
  standalone: true,
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
  @ViewChild('addPhotoInput') addPhotoInput?: ElementRef<HTMLInputElement>;

  PropertyType = PropertyType;
  propertyTypeOptions = [
    { label: 'house', value: PropertyType.HOUSE },
    { label: 'land', value: PropertyType.LAND }
  ];

  mainPhotoPreviewUrl: string | null = null;
  galleryPreviewUrls: string[] = [];

  private destroyRef = inject(DestroyRef);

  properties: PropertyDTO[] = [];
  totalRecords = 0;
  pageSize = 20;
  currentPage = 0;
  showPropertiesTable = false;

  replaceDialogVisible = false;
  replaceGalleryFiles: File[] = [];
  replacePreviewUrls: string[] = [];
  selectedReplaceProperty: PropertyDTO | null = null;

  thumbWidth = 300;
  thumbHeight = 300;

  selectedAddPhotoProperty: PropertyDTO | null = null;

  thumbnailDialogVisible = false;
  replaceThumbnailFile: File | null = null;
  replaceThumbnailPreviewUrl: string | null = null;
  selectedThumbnailProperty: PropertyDTO | null = null;

  deletePropertyPhotosDialogVisible = false;
  selectedDeletePhotosProperty: PropertyDTO | null = null;

  deleteAllPhotosDialogVisible = false;

  editDescriptionDialogVisible = false;
  editDescriptionProperty: PropertyDTO | null = null;
  editDescriptionValue: string = '';

  constructor(
    public store: PropertyTypeStore,
    private propertyFormService: PropertyFormServiceService,
    private photoAdminService: PhotoAdminService,
    private messageService: MessageService,
    public loadingService: LoadingService,
    private propertiesState: PropertiesStateService,
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

    this.propertyFormService.saveProperty(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.propertyFormService.deleteProperty(trimmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    const position = this.globalPosition(index);
    if (position <= 1) {
      return;
    }
    this.moveToPosition(this.properties[index], position - 1);
  }

  movePropertyDown(index: number) {
    const position = this.globalPosition(index);
    if (position >= this.totalCount()) {
      return;
    }
    this.moveToPosition(this.properties[index], position + 1);
  }

  /**
   * Numărul total de proprietăți. `totalRecords` vine de la server, dar dacă e
   * încă 0 (pagina nu s-a încărcat prin flux normal) cădem pe ce avem în pagină,
   * ca mutarea în jos să nu fie blocată tăcut.
   */
  private totalCount(): number {
    return Math.max(this.totalRecords, this.currentPage * this.pageSize + this.properties.length);
  }

  /**
   * Poziția 1-based în lista COMPLETĂ, nu în pagina curentă.
   * Lista de admin e paginată, iar `index` e relativ la pagină — folosirea lui
   * directă ca poziție ar muta elementele de pe pagina 2 în capul listei.
   */
  private globalPosition(index: number): number {
    return this.currentPage * this.pageSize + index + 1;
  }

  /**
   * Trimite o singură cerere; serverul mută proprietatea și împinge restul listei,
   * atomic. Frontend-ul nu mai calculează și nu mai salvează poziții individual —
   * exact asta producea duplicate și găuri când o parte din apeluri eșua.
   */
  private moveToPosition(property: PropertyDTO | undefined, position: number) {
    if (!property?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Lipsă date',
        detail: 'Nu pot muta o proprietate fără ID.'
      });
      return;
    }
    this.propertyFormService.updateSortOrder(property.id, position)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Ordine salvată',
            detail: `"${property.name}" a fost mutată pe poziția ${position}.`
          });
          this.loadPropertiesPage(this.currentPage);
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

  onSortOrderInput(property: any, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);
    property._pendingSortOrder = isNaN(val) ? null : val;
  }

  onSaveSortOrder(property: any) {
    const newOrder = property._pendingSortOrder;
    if (newOrder == null || !property.id) {
      return;
    }
    this.propertyFormService.updateSortOrder(property.id, newOrder)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        property.sortOrder = newOrder;
        property._pendingSortOrder = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Ordine actualizată',
          detail: `Ordinea proprietății "${property.name}" a fost schimbată la ${newOrder}.`
        });
        this.loadPropertiesPage(this.currentPage);
      },
      error: (err) => {
        console.error('Eroare la actualizarea ordinii:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut actualiza ordinea.'
        });
      }
    });
  }

  openAddPhoto(property: PropertyDTO) {
    this.selectedAddPhotoProperty = property;
    if (this.addPhotoInput?.nativeElement) {
      this.addPhotoInput.nativeElement.value = '';
    }
    this.addPhotoInput?.nativeElement.click();
  }

  async onAddPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file || !this.selectedAddPhotoProperty?.id) {
      if (input) input.value = '';
      return;
    }
    try {
      this.loadingService.loadingOn();
      const base64 = await this.fileToBase64(file);
      this.photoAdminService.addPhoto(this.selectedAddPhotoProperty.id, base64)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Poză adăugată',
            detail: `Poza a fost adăugată la "${this.selectedAddPhotoProperty?.name}".`
          });
          this.propertiesState.clearCache();
          this.loadPropertiesPage(this.currentPage);
        },
        error: (err) => {
          console.error('Eroare la adăugarea pozei:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Eroare',
            detail: 'Nu s-a putut adăuga poza.'
          });
          this.loadingService.loadingOff();
        }
      });
    } catch (e) {
      console.error('Eroare la conversia pozei:', e);
      this.loadingService.loadingOff();
    }
    if (input) input.value = '';
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
      this.loadingService.loadingOn();
      const currentProperty = await firstValueFrom(
        this.propertyFormService.getPropertyById(this.selectedReplaceProperty.id)
      );
      const photosBase64 = await Promise.all(
        this.replaceGalleryFiles.map((file) => this.fileToBase64(file))
      );
      const existingThumbnail = (currentProperty?.thumbnail ?? '').trim();
      const [fallbackThumbnail, ...fallbackGalleryPhotos] = photosBase64;
      const payload: ReplacePhotosRequest = {
        propertyId: this.selectedReplaceProperty.id,
        thumbnail: existingThumbnail || fallbackThumbnail,
        photos: existingThumbnail ? photosBase64 : fallbackGalleryPhotos
      };
      this.photoAdminService.replacePhotos(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Poze înlocuite',
            detail: 'Pozele au fost actualizate.'
          });
          this.propertiesState.clearCache();
          this.closeReplaceDialog();
          this.loadPropertiesPage(this.currentPage);
        },
        error: (err) => {
          console.error('Eroare la înlocuirea pozelor:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Eroare',
            detail: 'Nu s-au putut înlocui pozele.'
          });
          this.loadingService.loadingOff();
        }
      });
    } catch (e) {
      console.error('Eroare la pregătirea pozelor pentru înlocuire:', e);
      this.messageService.add({
        severity: 'error',
        summary: 'Eroare',
        detail: 'Nu s-au putut procesa pozele selectate.'
      });
      this.loadingService.loadingOff();
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
      const payload: ReplacePhotosRequest = {
        propertyId: this.selectedThumbnailProperty.id,
        thumbnail: thumbnailBase64
      };
      this.photoAdminService.replacePhotos(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Poză principală actualizată',
            detail: 'Poza principală a fost înlocuită.'
          });
          this.propertiesState.clearCache();
          this.closeThumbnailDialog();
          this.loadPropertiesPage(this.currentPage);
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

  onRegenerateThumbnailForProperty(property: PropertyDTO) {
    const trimmed = (property.id ?? '').trim();
    if (!trimmed) {
      return;
    }
    this.loadingService.loadingOn();
    this.photoAdminService.regenerateThumbnailForProperty(trimmed, this.thumbWidth, this.thumbHeight)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thumbnail regenerat',
          detail: `Thumbnailul pentru "${property.name}" a fost regenerat la ${this.thumbWidth}x${this.thumbHeight}.`
        });
        this.propertiesState.clearCache();
        this.loadPropertiesPage(this.currentPage);
      },
      error: (err) => {
        console.error('Eroare la regenerarea thumbnailului:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut regenera thumbnailul.'
        });
        this.loadingService.loadingOff();
      }
    });
  }

  onDeletePropertyPhotos(property: PropertyDTO) {
    this.selectedDeletePhotosProperty = property;
    this.deletePropertyPhotosDialogVisible = true;
  }

  confirmDeletePropertyPhotos() {
    const property = this.selectedDeletePhotosProperty;
    const trimmed = (property?.id ?? '').trim();
    if (!trimmed) return;

    this.deletePropertyPhotosDialogVisible = false;
    this.loadingService.loadingOn();
    this.photoAdminService.deletePhotosForProperty(trimmed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Poze șterse',
          detail: `Toate pozele proprietății "${property?.name}" au fost șterse.`
        });
        this.propertiesState.clearCache();
        this.loadPropertiesPage(this.currentPage);
      },
      error: (err) => {
        console.error('Eroare la ștergerea pozelor proprietății:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-au putut șterge pozele proprietății.'
        });
        this.loadingService.loadingOff();
      }
    });
  }

  onRegenerateThumbnails() {
    if (!this.thumbWidth || !this.thumbHeight || this.thumbWidth < 1 || this.thumbHeight < 1) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Dimensiuni invalide',
        detail: 'Introduceți valori pozitive pentru lățime și înălțime.'
      });
      return;
    }
    this.loadingService.loadingOn();
    this.photoAdminService.regenerateThumbnails(this.thumbWidth, this.thumbHeight)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (count) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Thumbnailuri regenerate',
          detail: `${count} thumbnailuri au fost regenerate la ${this.thumbWidth}x${this.thumbHeight}.`
        });
        this.propertiesState.clearCache();
        if (this.showPropertiesTable) {
          this.loadPropertiesPage(this.currentPage);
        } else {
          this.loadingService.loadingOff();
        }
      },
      error: (err) => {
        console.error('Eroare la regenerarea thumbnailurilor:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-au putut regenera thumbnailurile.'
        });
        this.loadingService.loadingOff();
      }
    });
  }

  openEditDescription(property: PropertyDTO) {
    this.editDescriptionProperty = property;
    this.editDescriptionValue = property.description ?? '';
    this.editDescriptionDialogVisible = true;
  }

  saveDescription() {
    const property = this.editDescriptionProperty;
    if (!property?.id) return;

    this.propertyFormService.updateDescription(property.id, this.editDescriptionValue)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: () => {
        property.description = this.editDescriptionValue;
        this.messageService.add({
          severity: 'success',
          summary: 'Descriere actualizată',
          detail: `Descrierea proprietății "${property.name}" a fost salvată.`
        });
        this.closeEditDescription();
      },
      error: (err) => {
        console.error('Eroare la actualizarea descrierii:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Eroare',
          detail: 'Nu s-a putut salva descrierea.'
        });
      }
    });
  }

  closeEditDescription() {
    this.editDescriptionDialogVisible = false;
    this.editDescriptionProperty = null;
    this.editDescriptionValue = '';
  }

  onDeleteAllPhotos() {
    this.deleteAllPhotosDialogVisible = true;
  }

  confirmDeleteAllPhotos() {
    this.deleteAllPhotosDialogVisible = false;
    this.photoAdminService.deleteAllPhotos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.propertyFormService.getPropertiesPage(page, this.pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
      // La egalitate departajăm ca backend-ul (id descrescător), nu după nume —
      // altfel admin-ul afișa altă ordine decât site-ul public.
      return (second.id ?? '').localeCompare(first.id ?? '');
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

  isLocalhost(): boolean {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }

  async onDebugInfo() {
    if (!this.isLocalhost()) return;

    console.log('%c=== DEBUG: Fetching all properties and photos ===', 'color: #ff6600; font-size: 14px; font-weight: bold;');

    try {
      // 1. Fetch ALL properties (all pages)
      const firstPage = await firstValueFrom(this.propertyFormService.getPropertiesPage(0, 100));
      const allProperties = Array.isArray(firstPage?.content) ? firstPage.content : [];
      const totalPages = firstPage?.totalPages ?? 1;

      for (let page = 1; page < totalPages; page++) {
        const resp = await firstValueFrom(this.propertyFormService.getPropertiesPage(page, 100));
        if (resp?.content) allProperties.push(...resp.content);
      }

      const propertyIds = new Set(allProperties.map(p => p.id).filter(Boolean));

      console.log(`%c📋 Total proprietăți: ${allProperties.length}`, 'color: #2196F3; font-weight: bold;');
      console.table(allProperties.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        hasThumbnail: !!(p.thumbnail && p.thumbnail.trim()),
        sortOrder: p.sortOrder
      })));

      // 2. Fetch photo count per property
      console.log('%c\n📸 Fetching photos per property...', 'color: #4CAF50; font-weight: bold;');

      const photoResults: { propertyId: string; propertyName: string; photoCount: number }[] = [];
      const propertiesWithNoPhotos: { id: string; name: string; type: string }[] = [];

      for (const prop of allProperties) {
        if (!prop.id) continue;
        try {
          const photosResp = await firstValueFrom(
            this.propertyFormService.getPhotos(prop.id, 0, 1)
          );
          const total = photosResp?.total ?? 0;
          photoResults.push({
            propertyId: prop.id,
            propertyName: prop.name,
            photoCount: total
          });
          if (total === 0) {
            propertiesWithNoPhotos.push({ id: prop.id, name: prop.name, type: prop.type });
          }
        } catch (err) {
          console.error(`  Error fetching photos for "${prop.name}" (${prop.id}):`, err);
          photoResults.push({
            propertyId: prop.id!,
            propertyName: prop.name,
            photoCount: -1
          });
        }
      }

      console.log('%c\n📊 Photo count per property:', 'color: #9C27B0; font-weight: bold;');
      console.table(photoResults);

      if (propertiesWithNoPhotos.length > 0) {
        console.log(`%c\n⚠️ Proprietăți FĂRĂ poze (${propertiesWithNoPhotos.length}):`, 'color: #FF5722; font-weight: bold; font-size: 13px;');
        console.table(propertiesWithNoPhotos);
      } else {
        console.log('%c\n✅ Toate proprietățile au cel puțin o poză.', 'color: #4CAF50; font-weight: bold;');
      }

      // 3. Fetch ALL photos from the "photos" table and check orphans
      console.log('%c\n🗄️ Fetching ALL photos from database (photos table)...', 'color: #E91E63; font-weight: bold;');

      try {
        const allPhotos = await firstValueFrom(this.photoAdminService.getAllPhotosMetadata());
        console.log(`%c Total poze în tabela "photos": ${allPhotos.length}`, 'color: #E91E63; font-weight: bold;');
        console.table(allPhotos.map(p => ({
          photoId: p.photoId,
          propertyId: p.propertyId,
          hasData: p.hasData,
          propertyExists: propertyIds.has(p.propertyId) ? 'DA' : '⚠️ NU'
        })));

        const orphanPhotos = allPhotos.filter(p => !propertyIds.has(p.propertyId));
        if (orphanPhotos.length > 0) {
          console.log(`%c\n🚨 POZE ORFANE - ${orphanPhotos.length} poze NU sunt legate de nicio proprietate existentă:`, 'color: #F44336; font-weight: bold; font-size: 13px;');
          console.table(orphanPhotos.map(p => ({
            photoId: p.photoId,
            propertyId: p.propertyId,
            hasData: p.hasData
          })));

          const orphanPropertyIds = [...new Set(orphanPhotos.map(p => p.propertyId))];
          console.log(`%c\n Property IDs orfane (${orphanPropertyIds.length} unice):`, 'color: #F44336;');
          orphanPropertyIds.forEach(id => {
            const count = orphanPhotos.filter(p => p.propertyId === id).length;
            console.log(`   ${id} → ${count} poze`);
          });
        } else {
          console.log('%c\n✅ Nicio poză orfană. Toate pozele sunt legate de proprietăți existente.', 'color: #4CAF50; font-weight: bold;');
        }
      } catch (err) {
        console.error('%c\n❌ Nu s-au putut aduce pozele din baza de date. Asigură-te că backend-ul rulează local cu endpoint-ul /debug/all-photos-metadata', 'color: #F44336;');
        console.error(err);
      }

      console.log('%c\n=== DEBUG COMPLETE ===', 'color: #ff6600; font-size: 14px; font-weight: bold;');

    } catch (err) {
      console.error('Debug info failed:', err);
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

