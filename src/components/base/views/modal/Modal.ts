export class Modal {
  public element: HTMLElement;
  private container: HTMLElement;
  private closeButton: HTMLButtonElement;
  private content: HTMLElement;

  constructor(root: HTMLElement) {
    this.element = root;
    this.container = root.querySelector('.modal__container') as HTMLElement;
    this.closeButton = root.querySelector('.modal__close') as HTMLButtonElement;
    this.content = root.querySelector('.modal__content') as HTMLElement;

    // Закрытие по крестику
    this.closeButton.addEventListener('click', () => this.close());

    // Закрытие по клику вне контейнера (на оверлей)
    this.element.addEventListener('mousedown', (evt) => {
      const target = evt.target as Node;
      if (!this.container.contains(target)) this.close();
    });
  }

  /** Вставляет контент и показывает модалку */
  open(content: HTMLElement): void {
    this.content.replaceChildren(content);
    this.element.classList.add('modal_active');
  }

  /** Скрывает модалку и очищает контент */
  close(): void {
    this.element.classList.remove('modal_active');
    this.content.replaceChildren();
  }
}
