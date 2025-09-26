import { Component } from '../../Component';

export class CatalogView extends Component {
  constructor(container: HTMLElement) {
    super(container);
  }

  /** Вернуть корневой узел  */
  render(): HTMLElement {
    return this.container;
  }

  /** Отрисовать список карточек */
  renderList(nodes: HTMLElement[]): void {
    this.container.replaceChildren(...nodes);
  }
}
