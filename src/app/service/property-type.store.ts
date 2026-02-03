import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PropertyType } from '../dto/property-type.enum';

export interface AddPropertyFormValue {
  name: string;
  description: string;
  type: PropertyType | null;
  photo: File | null;
  photos: File[]; // gallery files
}

@Injectable({ providedIn: 'root' })
export class PropertyTypeStore {
  readonly form: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    type: FormControl<PropertyType | null>;
    photo: FormControl<File | null>;
    photos: FormControl<File[]>;
  }> = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<PropertyType | null>(null, { validators: [Validators.required] }),
    photo: new FormControl<File | null>(null),
    photos: new FormControl<File[]>([], { nonNullable: true })
  });

  setPhoto(file: File | null) {
    this.form.controls.photo.setValue(file);
    this.form.controls.photo.markAsDirty();
  }

  setGalleryPhotos(files: File[]) {
    this.form.controls.photos.setValue(files ?? []);
    this.form.controls.photos.markAsDirty();
  }

  get value(): AddPropertyFormValue {
    return this.form.getRawValue();
  }
}
