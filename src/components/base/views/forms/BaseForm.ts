import { Component } from '../../Component';

export type FormHandlers<TState> = {
  onChange?(state: Partial<TState>): void;
  onSubmit?(state: TState): void;
};

/**
 * Базовый класс для форм оформления
 * - кеширует поля ввода
 * - управляет отображением ошибок
 * - включает/выключает submit-кнопку
 * - не хранит бизнес-данных, только читает значения из DOM при эмите
 */
export class BaseForm<TState extends Record<string, unknown>> extends Component<Partial<TState>> {
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

    // Общая область ошибок (если есть в разметке)
    this.errorsEl = form.querySelector<HTMLElement>('.form__errors') ?? undefined;

    // Кнопка submit (если есть)
    this.submitBtn =
      form.querySelector<HTMLButtonElement>('button[type="submit"]') ?? undefined;

    // Слушатели: изменение любого поля -> onChange(currentState)
    this.inputs.forEach((el, name) => {
      const handler = () => this.handlers.onChange?.(this.readFormState());
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });

    // Отправка формы -> onSubmit(fullState)
    form.addEventListener('submit', (evt) => {
      evt.preventDefault();
      // Ровно здесь читаем значения из DOM и отдаем наружу
      if (this.handlers.onSubmit) {
        this.handlers.onSubmit(this.readFormState(true) as TState);
      }
    });
  }

  /** Рендер: опционально заполняет известные поля значениями */
  render(data?: Partial<TState>): HTMLElement {
    if (data) {
      Object.entries(data).forEach(([name, value]) => {
        const el = this.inputs.get(name);
        if (el) el.value = value as string;
      });
    }
    return this.container;
  }

  /** Установить/снять disabled на submit-кнопке */
  setSubmitDisabled(flag: boolean): void {
    if (this.submitBtn) this.submitBtn.disabled = flag;
  }

  /**
   * Показ ошибок:
   * - пишет сводный текст в .form__errors (если есть)
   * - помечает конкретные инпуты aria-invalid
   */
  setErrors(map: Record<string, string>): void {
    // Сводный текст (в одну строку через «; »)
    if (this.errorsEl) {
      const list = Object.values(map).filter(Boolean);
      this.errorsEl.textContent = list.length ? list.join('; ') : '';
    }

    // Пометки на полях
    this.inputs.forEach((el, name) => {
      const hasError = Boolean(map[name]);
      el.toggleAttribute('aria-invalid', hasError);
      // При необходимости можно добавлять/снимать CSS-класс ошибки
      // el.classList.toggle('form__input_error', hasError);
    });
  }

  /**
   * Считывает текущее состояние формы из DOM.
   * @param strict если true — подразумевается полная валидная форма (для onSubmit)
   */
  protected readFormState(strict = false): Partial<TState> {
    const obj: Record<string, unknown> = {};
    this.inputs.forEach((el, name) => {
      obj[name] = el.value;
    });
    // Каст к Partial<TState> допустим, так как имена полей задаются шаблоном
    return obj as Partial<TState>;
  }
}
