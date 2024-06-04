import {FormGroup} from "@angular/forms";

export class FormStatesUtil {
  public static markAllAsDirty(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsDirty();
      if (control instanceof FormGroup) {
        this.markAllAsDirty(control);
      }
    })
  }
}
