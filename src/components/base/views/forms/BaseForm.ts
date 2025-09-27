import { Component } from '../../Component';

export type FormHandlers<TState> = {
  onChange?(patch: Partial<TState>): void;
  onSubmit?(full: TState): void;
};

/**
 * Базовый класс для форм.
 * View НЕ хранит состояние данных — только:
 *  - читает значения из DOM при эмите,
 *  - отображает ошибки и disabled,
 *  - пробрасывает события наружу.
 */
export class BaseForm<TState extends Record<string, unknown>> extends Component<void> {
  protected inputs: Map<string, HTMLInputElement | HTMLTextAreaElement>;
  protected submitBtn?: HTMLButtonElement;
  protected errorsEl?: HTMLElement;

  protected handlers: FormHandlers<TState>;

  constructor(form: HTMLFormElement, handlers: FormHandlers<TState> = {}) {
    super(form);
    this.handlers = handlers;

    // Собираем инпуты/текстовые поля по name
    this.inputs = new Map();
    form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[name], textarea[name]')
      .forEach((el) => {
        const name = el.getAttribute('name');
        if (name) this.inputs.set(name, el);
      });

    // Общая область ошибок (если есть)
    this.errorsEl = form.querySelector<HTMLElement>('.form__errors') ?? undefined;

    // Кнопка submit (если есть)
    this.submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]') ?? undefined;

    // Слушатели: любые изменения пробрасываем наверх снимком ТЕКУЩИХ значений из DOM
    this.inputs.forEach((el) => {
      const handler = () => this.handlers.onChange?.(this.getValues());
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    // Отправка формы — только наружу (никаких внутренних setState)
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      this.handlers.onSubmit?.(this.getValues() as TState);
    });
  }

  /** View-рендер: опционально подставляет значения в поля и возвращает контейнер */
  render(data?: Partial<TState>): HTMLElement {
    if (data) {
      Object.entries(data).forEach(([name, value]) => {
        const el = this.inputs.get(name);
        if (el != null && value !== undefined && value !== null) {
          el.value = String(value);
        }
      });
    }
    return this.container;
  }

  /** Управление доступностью submit-кнопки */
  setSubmitDisabled(flag: boolean): void {
    if (this.submitBtn) this.submitBtn.disabled = flag;
  }

  /**
   * Отрисовка ошибок:
   *  - сводный текст в .form__errors (если есть),
   *  - aria-invalid на полях с ошибкой.
   */
  setErrors(map: Record<string, string | undefined>): void {
    if (this.errorsEl) {
      const list = Object.values(map).filter(Boolean) as string[];
      this.errorsEl.textContent = list.length ? list.join('; ') : '';
    }

    this.inputs.forEach((el, name) => {
      const hasError = Boolean(map[name]);
      el.toggleAttribute('aria-invalid', hasError);
      // el.classList.toggle('form__input_error', hasError);
    });
  }

  /** Снимок текущих значений формы из DOM (без внутреннего хранения) */
  protected getValues(): Partial<TState> {
    const obj: Record<string, unknown> = {};
    this.inputs.forEach((el, name) => {
      obj[name] = el.value;
    });
    return obj as Partial<TState>;
  }
}
