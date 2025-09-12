import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PropertyType } from '../dto/property-type.enum';

export interface AddPropertyFormValue {
  name: string;
  description: string;
  type: PropertyType | null;
  photo: File | null;
}

@Injectable({ providedIn: 'root' })
export class PropertyTypeStore {
  readonly form: FormGroup<{
    name: FormControl<string>;
    description: FormControl<string>;
    type: FormControl<PropertyType | null>;
    photo: FormControl<File | null>;
  }> = new FormGroup({
    name: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    type: new FormControl<PropertyType | null>(null, { validators: [Validators.required] }),
    photo: new FormControl<File | null>(null)
  });

  setPhoto(file: File | null) {
    this.form.controls.photo.setValue(file);
    this.form.controls.photo.markAsDirty();
  }

  get value(): AddPropertyFormValue {
    return this.form.getRawValue();
  }
}
