import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
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

@Component({
  selector: 'app-add-property',
  standalone: true,
  templateUrl: './add-property.component.html',
  styleUrls: ['./add-property.component.scss'],
  imports: [CommonModule, ReactiveFormsModule, InputText, DropdownModule, FileUpload, FloatLabel, ButtonDirective, Textarea]
})
export class AddPropertyComponent {
  PropertyType = PropertyType;
  propertyTypeOptions = [
    { label: 'house', value: PropertyType.HOUSE },
    { label: 'land', value: PropertyType.LAND }
  ];

  constructor(
    public store: PropertyTypeStore,
    private propertyFormService: PropertyFormServiceService,
    private photoAdminService: PhotoAdminService
  ) {}

  onUpload(event: any) {
    const file: File | undefined = event?.files?.[0];
    this.store.setPhoto(file ?? null);
  }

  onUploadGallery(event: any) {
    const files: File[] = event?.files ?? [];
    this.store.setGalleryPhotos(files);
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
    console.log('Salvare efectuata cu succes');
    console.log('form', this.store.form.value);

    if (this.store.form.invalid) {
      this.store.form.markAllAsTouched();
      console.warn('Formular invalid. Verificați câmpurile obligatorii.');
      return;
    }

    const { name, description, type, photo, photos } = this.store.value;

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
        console.log('Property saved successfully', resp);
      },
      error: (err) => {
        console.error('Failed to save property', err);
      }
    });
  }

  onShowProperties() {
    this.propertyFormService.getPropertiesPage(0, 6).subscribe({
      next: (resp) => {
        console.log('Properties page fetched successfully:', resp);
      },
      error: (err) => {
        console.error('Failed to fetch properties', err);
      }
    });
  }

  onDeleteProperty() {
    const id = this.store.form.controls.propertyId.value;
    const trimmed = (id ?? '').trim();
    if (!trimmed) {
      console.warn('Introdu un id de proprietate pentru ștergere.');
      return;
    }
    this.propertyFormService.deleteProperty(trimmed).subscribe({
      next: () => {
        console.log('Proprietate ștearsă cu succes');
      },
      error: (err) => {
        console.error('Eroare la ștergerea proprietății', err);
      }
    });
  }

  private async assetToBase64(assetPath: string): Promise<string> {
    const response = await fetch(encodeURI(assetPath));
    if (!response.ok) {
      throw new Error(`Nu s-a putut încărca asset-ul: ${assetPath}`);
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(blob);
    });
  }

  async onReplacePhotos() {
    try {
      const propertyId = '126495e7-a342-4868-8783-cc6f0a0a0dd7';
      // Thumbnail
      const thumbnailPath = 'assets/HOREZU parc avif/horezu1.avif';
      const thumbnailBase64 = await this.assetToBase64(thumbnailPath);

      // Lista de poze din folder (toate .avif cunoscute)
      const galleryPaths: string[] = [
        'assets/HOREZU parc avif/horezu1.avif',
        'assets/HOREZU parc avif/horezu2.avif',
        'assets/HOREZU parc avif/horezu3.avif',
        'assets/HOREZU parc avif/horezu4.avif',
        'assets/HOREZU parc avif/horezu5.avif',
        'assets/HOREZU parc avif/horesu6.avif'
      ];
      const photosBase64: string[] = await Promise.all(
        galleryPaths.map((p) => this.assetToBase64(p))
      );

      const payload: ReplacePhotosRequest = {
        propertyId,
        thumbnail: thumbnailBase64,
        photos: photosBase64
      };

      this.photoAdminService.replacePhotos(payload).subscribe({
        next: () => console.log('Pozele au fost înlocuite cu succes. -> HOREZU parc'),
        error: (err) => console.error('Eroare la înlocuirea pozelor:', err)
      });
    } catch (e) {
      console.error('Eroare la pregătirea pozelor pentru înlocuire:', e);
    }
  }

  onDeleteAllPhotos() {
    this.photoAdminService.deleteAllPhotos().subscribe({
      next: () => console.log('Toate pozele au fost șterse.'),
      error: (err) => console.error('Eroare la ștergerea tuturor pozelor:', err)
    });
  }
}
