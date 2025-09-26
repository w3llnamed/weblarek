import { Component } from '../../Component';
import { categoryMap } from '../../../../utils/constants';
import { CDN_URL } from '../../../../utils/constants';

export type CardHandlers = {
  onSelect?(id: string): void;
  onAdd?(id: string): void;
  onRemove?(id: string): void;
};

export type CardViewData = {
  id: string;
  title: string;
  price: number | null;
  category: string;
  image: string;
  // описания/доп. поля — на усмотрение наследников
};

export class BaseCard extends Component<Partial<CardViewData>> {
  protected titleEl?: HTMLElement;
  protected priceEl?: HTMLElement;
  protected categoryEl?: HTMLElement;
  protected imageEl?: HTMLImageElement;
  protected actionButton?: HTMLButtonElement;

  protected handlers: CardHandlers;
  protected productId?: string;

  constructor(node: HTMLElement, handlers: CardHandlers = {}) {
    super(node);

    // Кэшируем внутренние элементы (если их нет в конкретном шаблоне — останутся undefined)
    this.titleEl = node.querySelector<HTMLElement>('.card__title') ?? undefined;
    this.priceEl = node.querySelector<HTMLElement>('.card__price') ?? undefined;
    this.categoryEl = node.querySelector<HTMLElement>('.card__category') ?? undefined;
    this.imageEl = node.querySelector<HTMLImageElement>('.card__image') ?? undefined;
    this.actionButton = node.querySelector<HTMLButtonElement>('.card__button') ?? undefined;

    this.handlers = handlers;
  }

  // ------- Публичный API рендера -------
  render(data?: Partial<CardViewData>): HTMLElement {
    if (!data) return this.container;

    if (data.id) this.productId = data.id;
    if (data.title !== undefined) this.setTitle(data.title);
    if (data.price !== undefined) this.setPrice(data.price);
    if (data.category !== undefined) this.setCategory(data.category);
    if (data.image !== undefined) this.setImageSrc(data.image, data.title ?? '');

    return this.container;
  }

  // ------- Утилитарные методы для потомков -------

  /** Заголовок */
  protected setTitle(title: string): void {
    if (this.titleEl) this.titleEl.textContent = title;
  }

  /** Цена (формат + недоступность) */
  protected setPrice(price: number | null): void {
    if (!this.priceEl) return;

    if (price === null) {
      this.priceEl.textContent = 'Бесценно';
      if (this.actionButton) this.actionButton.disabled = true;
    } else {
      this.priceEl.textContent = `${price} синапсов`;
      if (this.actionButton) this.actionButton.disabled = false;
    }
  }

  /** Категория + модификатор card__category_* */
  protected setCategory(name: string): void {
    if (!this.categoryEl) return;

    // Текст категории
    this.categoryEl.textContent = name;

    // Сначала удаляем предыдущие модификаторы категории
    for (const cls of Array.from(this.categoryEl.classList)) {
      if (cls.startsWith('card__category_')) this.categoryEl.classList.remove(cls);
    }

    // Применяем модификатор из categoryMap (если есть)
    const mod = categoryMap[name as keyof typeof categoryMap];
    if (mod) {
      this.categoryEl.classList.add(`${mod}`);
    }
  }

  /** Картинка */
  protected setImageSrc(src: string, alt: string): void {
    if (!this.imageEl) return;
    const url = /^https?:\/\//i.test(src) ? src : `${CDN_URL}${src}`;
    this.imageEl.src = url;
    this.imageEl.alt = alt || '';
  }

  // ------- Вспомогательные «хуки» для потомков (вызывать в обработчиках кликов) -------

  protected emitSelect(): void {
    if (this.productId) this.handlers.onSelect?.(this.productId);
  }

  protected emitAdd(): void {
    if (this.productId) this.handlers.onAdd?.(this.productId);
  }

  protected emitRemove(): void {
    if (this.productId) this.handlers.onRemove?.(this.productId);
  }
}
