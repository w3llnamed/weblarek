import { BaseForm, FormHandlers } from './BaseForm';

export type ContactsState = { email: string; phone: string };

export class ContactsForm extends BaseForm<ContactsState> {
  protected emailInput: HTMLInputElement;
  protected phoneInput: HTMLInputElement;
  protected submitBtn: HTMLButtonElement;
  protected errorsEl: HTMLElement;

  constructor(form: HTMLFormElement, handlers: FormHandlers<ContactsState> = {}) {
    super(form, handlers);

    const email = form.querySelector<HTMLInputElement>('input[name="email"]');
    const phone = form.querySelector<HTMLInputElement>('input[name="phone"]');
    const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errors = form.querySelector<HTMLElement>('.form__errors');

    if (!email || !phone || !submit || !errors) {
      throw new Error('ContactsForm: не найдены обязательные элементы формы (email/phone/submit/errors).');
    }

    this.emailInput = email;
    this.phoneInput = phone;
    this.submitBtn = submit;
    this.errorsEl = errors;

    // фиксируем поля в Map базового класса
    this.inputs.set('email', this.emailInput);
    this.inputs.set('phone', this.phoneInput);
  }

  setEmail(value: string): void {
    this.emailInput.value = value ?? '';
    this.handlers.onChange?.(this.getValues());
  }

  setPhone(value: string): void {
    this.phoneInput.value = value ?? '';
    this.handlers.onChange?.(this.getValues());
  }

  render(data?: Partial<ContactsState>): HTMLElement {
    if (data?.email !== undefined) this.emailInput.value = data.email ?? '';
    if (data?.phone !== undefined) this.phoneInput.value = data.phone ?? '';
    // ничего не сохраняем во "внутреннее состояние"
    return super.render(); // без data
  }
}
