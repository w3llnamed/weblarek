import './scss/styles.scss';

import './scss/styles.scss';

// Базовые штуки
import { EventEmitter } from './components/base/Events';
import { Modal } from './components/base/views/modal/Modal';

// Модели
import { Catalog } from './components/base/models/catalog';
import { Cart } from './components/base/models/cart';
import { Buyer } from './components/base/models/buyer';

// API
import { Api } from './components/base/Api'; 
import { ShopApi } from './components/base/services/shopapi';

// View: список
import { CatalogView } from './components/base/views/layout/CatalogView';
import { HeaderView } from './components/base/views/layout/HeaderView';
import { BasketView } from './components/base/views/layout/BasketView';

// View: карточки
import { CatalogCard } from './components/base/views/cards/CatalogCard';
import { PreviewCard } from './components/base/views/cards/PreviewCard';
import { BasketItem } from './components/base/views/cards/BasketItem';

// View: формы + success
import { PaymentDeliveryForm } from './components/base/views/forms/PaymentDeliveryForm';
import { ContactsForm } from './components/base/views/forms/ContactsForm';
import { OrderSuccessView } from './components/base/views/misc/OrderSuccessView';

// Типы
import type { IProduct, IBuyer, IOrderRequest } from './types';

// ---------- ИНИЦИАЛИЗАЦИЯ ----------
const events = new EventEmitter();

const api = new Api(`${import.meta.env.VITE_API_ORIGIN}/api/weblarek`, {
  headers: { 'Content-Type': 'application/json' }
});
const shopApi = new ShopApi(api);

const catalog = new Catalog(events);
const cart = new Cart(events);
const buyer = new Buyer(events);

const gallery = document.querySelector<HTMLElement>('.gallery')!;
const headerEl = document.querySelector<HTMLElement>('.header')!;
const modalRoot = document.getElementById('modal-container') as HTMLElement;

const modal = new Modal(modalRoot);
const header = new HeaderView(headerEl, {
  onOpenBasket: () => openBasket()
});
const catalogView = new CatalogView(gallery);

// ---------- ХЕЛПЕРЫ РЕНДЕРА ----------

function renderCatalog() {
  const cards = catalog.getProducts().map((p) => {
    const tpl = document.getElementById('card-catalog') as HTMLTemplateElement;
    const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

    const card = new CatalogCard(node, {
      onSelect: (id) => {
        const prod = catalog.getProductById(id);
        catalog.setProduct(prod ?? null);
      }
    });

    return card.render({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      image: p.image
    });
  });

  catalogView.renderList(cards);
}

function openPreview(prod: IProduct) {
  const tpl = document.getElementById('card-preview') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

  const preview = new PreviewCard(node, {
    onAdd: (id) => {
      const product = catalog.getProductById(id);
      if (product) cart.addProduct(product);
      modal.close();
    },
    onRemove: (id) => {
      const product = catalog.getProductById(id);
      if (product) cart.deleteProduct(product);
      modal.close();
    }
  });

  const inCart = cart.hasProduct(prod.id);
  preview.setInCart(inCart);

  modal.open(
    preview.render({
      id: prod.id,
      title: prod.title,
      price: prod.price,
      category: prod.category,
      image: prod.image
    })
  );
}

function openBasket() {
  const tpl = document.getElementById('basket') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

  const view = new BasketView(node, {
    onCheckout: () => openStep1()
  });

  // Собираем элементы корзины
  const items = cart.getProducts().map((p, i) => {
    const tplItem = document.getElementById('card-basket') as HTMLTemplateElement;
    const li = tplItem.content.firstElementChild!.cloneNode(true) as HTMLElement;

    const item = new BasketItem(li, {
      onRemove: (id) => {
        const product = catalog.getProductById(id);
        if (product) cart.deleteProduct(product);
      }
    });

    item.setIndex(i + 1);
    return item.render({
      id: p.id,
      title: p.title,
      price: p.price
    });
  });

  view.setItems(items);
  view.setTotal(cart.getSum());
  view.setSubmitDisabled(cart.getCount() === 0);
  view.setEmpty(cart.getCount() === 0);

  modal.open(view.render());
}

function openStep1() {
  const tpl = document.getElementById('order') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLFormElement;

  const form = new PaymentDeliveryForm(node, {
    onChange: (state) => {
      const paymentOk = state.payment !== undefined ? !!state.payment : buyer.checkData();
      const addressOk = typeof state.address === 'string' ? state.address.trim().length > 0 : true;
      form.setSubmitDisabled(!(paymentOk && addressOk));
    },
    onSubmit: (state) => {
      // сохраняем частично
      buyer.setData({
        payment: state.payment!,
        address: state.address,
        email: '',  // заполняется на шаге 2
        phone: ''   // заполняется на шаге 2
      } as IBuyer);

      openStep2();
    }
  });

  // Подставим уже выбранное (если есть)
  try {
    const data = buyer.getData();
    form.setPayment(data.payment);
    form.setAddress(data.address);
  } catch { /* payment мог быть null */ }

  form.setSubmitDisabled(true);
  modal.open(form.render());
}

function openStep2() {
  const tpl = document.getElementById('contacts') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLFormElement;

  const form = new ContactsForm(node, {
    onChange: (state) => {
      const emailOk = typeof state.email === 'string' && state.email.trim().length > 0;
      const phoneOk = typeof state.phone === 'string' && state.phone.trim().length > 0;
      form.setSubmitDisabled(!(emailOk && phoneOk));
    },
    onSubmit: async (state) => {
      // доклеиваем контакты
      const prev = buyer.getData();
      buyer.setData({ ...prev, ...state });

      // собираем заказ
      const order: IOrderRequest = {
        payment: prev.payment,
        address: prev.address,
        email: state.email,
        phone: state.phone,
        items: cart.getProducts().map(p => p.id),
        total: cart.getSum()
      };

      try {
        const res = await shopApi.createOrder(order);
        cart.clear();
        buyer.clearData();
        showSuccess(res.total);
      } catch (e) {
        form.setErrors({ common: 'Не удалось оформить заказ. Попробуйте ещё раз.' });
      }
    }
  });

  // Предзаполнение (если вернулись назад и снова вперёд)
  try {
    const data = buyer.getData();
    if (data.email) form.setEmail(data.email);
    if (data.phone) form.setPhone(data.phone);
  } catch {}

  form.setSubmitDisabled(true);
  modal.open(form.render());
}

function showSuccess(amount: number) {
  const tpl = document.getElementById('success') as HTMLTemplateElement;
  const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

  const view = new OrderSuccessView(node, {
    onClose: () => modal.close()
  });

  modal.open(view.render({ amount }));
}

// ---------- ПОДПИСКИ НА МОДЕЛИ ----------
events.on('catalog:changed', () => {
  renderCatalog();
});

events.on('viewer:changed', ({ item }: { item: IProduct | null }) => {
  if (item) openPreview(item);
  else modal.close();
});

events.on('basket:changed', ({ items, total }: { items: IProduct[]; total: number }) => {
  header.setBadge(items.length);
  // Если корзина открыта сейчас — пересоберём содержимое:
  const isBasketOpen = modalRoot.classList.contains('modal_active') &&
    !!modalRoot.querySelector('.basket');
  if (isBasketOpen) openBasket();
});

// ---------- СТАРТ: загрузка каталога ----------
(async function bootstrap() {
  try {
    const items = await shopApi.getProducts();
    catalog.setProducts(items);
  } catch (e) {
    console.error('Не удалось загрузить каталог', e);
  }
})();








// -------------------------------------- Т Е С Т Ы ----------------------------------





// ТЕСТ БАЗЫ КАРТОЧКИ

// import { BaseCard } from './components/base/views/cards/BaseCard';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// // Берём шаблон каталожной карточки
// const tpl = document.getElementById('card-catalog') as HTMLTemplateElement;
// const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

// // Создаём базовую карточку
// const base = new BaseCard(node, {
//   onSelect: (id) => console.log('select', id),
// });

// // Рендер с данными
// gallery.replaceChildren(
//   base.render({
//     id: 'test-1',
//     title: 'Тестовая карточка',
//     price: 1234,
//     category: 'софт-скил',
//     image: './src/images/Subtract.svg',
//   })
// );

// // Проверить недоступный товар (раскомментируй):
// // setTimeout(() => {
// //   base.render({ price: null });
// // }, 1500);






// ТЕСТ КАРТОЧКИ В КАТАЛОГЕ

// import { CatalogCard } from './components/base/views/cards/CatalogCard';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// // 1) Рендер нормальной карточки
// {
//   const tpl = document.getElementById('card-catalog') as HTMLTemplateElement;
//   const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

//   const card = new CatalogCard(node, {
//     onSelect: (id) => console.log('Открыть предпросмотр товара', id),
//   });

//   gallery.append(card.render({
//     id: 'p1',
//     title: '+1 час в сутках',
//     price: 750,
//     category: 'софт-скил',
//     image: './src/images/Subtract.svg',
//   }));
// }

// // 2) Рендер «Недоступно»
// {
//   const tpl = document.getElementById('card-catalog') as HTMLTemplateElement;
//   const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

//   const card = new CatalogCard(node, {
//     onSelect: (id) => console.log('этот не должен кликаться', id),
//   });

//   gallery.append(card.render({
//     id: 'p2',
//     title: 'Нет в продаже',
//     price: null,
//     category: 'другое',
//     image: './src/images/Subtract.svg',
//   }));
// }







// ТЕСТ КАРТОЧКИ ДЛЯ ПРЕВЬЮ


// import { Modal } from './components/base/views/modal/Modal'; // твой путь к Modal
// import { PreviewCard } from './components/base/views/cards/PreviewCard';

// const modalRoot = document.getElementById('modal-container') as HTMLElement;
// const modal = new Modal(modalRoot);

// const tpl = document.getElementById('card-preview') as HTMLTemplateElement;
// const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

// const card = new PreviewCard(node, {
//   onAdd: (id) => console.log('Добавить в корзину:', id),
//   onRemove: (id) => console.log('Удалить из корзины:', id),
// });

// // рендер данных
// const content = card.render({
//   id: 'p42',
//   title: 'Бэкенд-антистресс',
//   price: 1000000,
//   category: 'другое',
//   image: './src/images/Subtract.svg',
//   description: 'Если планируете решать задачи в тренажёре, берите два.',
// });

// // открыть модалку
// modal.open(content);

// // пощупать переключение состояний
// setTimeout(() => card.setInCart(true), 1200);
// setTimeout(() => card.setInCart(false), 2400);

// // проверить «нет цены»
// // setTimeout(() => card.render({ price: null }), 3200);






// ТЕСТ МИНИ - КАРТОЧКИ В КОРЗИНЕ


// import { BasketItem } from './components/base/views/cards/BasketItem';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// // контейнер UL для теста
// const ul = document.createElement('ul');
// ul.className = 'basket__list';
// gallery.replaceChildren(ul);

// // #1 нормальная позиция
// {
//   const tpl = document.getElementById('card-basket') as HTMLTemplateElement;
//   const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

//   const item = new BasketItem(node, {
//     onRemove: (id) => console.log('remove from cart:', id),
//   });

//   item.setIndex(1);
//   ul.append(item.render({
//     id: 'p1',
//     title: 'Фреймворк куки судьбы',
//     price: 2500,
//   }));
// }

// // #2 price === null -> «Бесценно» (fallback)
// {
//   const tpl = document.getElementById('card-basket') as HTMLTemplateElement;
//   const node = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

//   const item = new BasketItem(node, {
//     onRemove: (id) => console.log('remove from cart (null price):', id),
//   });

//   item.setIndex(2);
//   ul.append(item.render({
//     id: 'p2',
//     title: 'Редчайший лот',
//     price: null,
//   }));
// }





//ТЕСТ БАЗОВОЙ ФОРМЫ

// import { BaseForm } from './components/base/views/forms/BaseForm';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// // Берём шаблон формы контактов
// const tpl = document.getElementById('contacts') as HTMLTemplateElement;
// const formNode = tpl.content.firstElementChild!.cloneNode(true) as HTMLFormElement;

// // Создаём базовую форму с конкретным типом состояния
// type ContactsState = { email: string; phone: string };

// const form = new BaseForm<ContactsState>(formNode, {
//   onChange: (state) => {
//     console.log('change', state);
//     // Примитивная проверка, чтобы увидеть работу setSubmitDisabled / setErrors
//     const errors: Record<string, string> = {};
//     if (!state.email?.trim()) errors.email = 'Введите email';
//     if (!state.phone?.trim()) errors.phone = 'Введите телефон';

//     form.setErrors(errors);
//     form.setSubmitDisabled(Object.keys(errors).length > 0);
//   },
//   onSubmit: (state) => {
//     console.log('submit', state);
//     alert(`Отправка: ${JSON.stringify(state)}`);
//   },
// });

// // Стартовое состояние: пустые поля => кнопка выключена, ошибок нет
// gallery.replaceChildren(
//   form.render({ email: '', phone: '' })
// );




// ТЕСТ КАРТОЧКИ ОПЛАТЫ


// import { PaymentDeliveryForm, PaymentDeliveryState } from './components/base/views/forms/PaymentDeliveryForm';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// // Берём шаблон шага 1
// const tpl = document.getElementById('order') as HTMLTemplateElement;
// const formNode = tpl.content.firstElementChild!.cloneNode(true) as HTMLFormElement;

// const form = new PaymentDeliveryForm(formNode, {
//   onChange: (state) => {
//     // простая валидация
//     const errors: Record<string, string> = {};
//     const pay = (state.payment ?? '') as string;
//     if (!pay) errors.payment = 'Выберите способ оплаты';
//     if (!state.address?.trim()) errors.address = 'Введите адрес';

//     form.setErrors(errors);
//     form.setSubmitDisabled(Object.keys(errors).length > 0);
//   },
//   onSubmit: (state) => {
//     alert(`Шаг 1 OK: ${JSON.stringify(state)}`);
//   },
// });

// // старт: пустой адрес, оплаты нет
// gallery.replaceChildren(form.render({ payment: '', address: '' }));



// ТЕСТ КАРТОЧКИ КОНТАКТОВ

// import { ContactsForm, ContactsState } from './components/base/views/forms/ContactsForm';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;

// const tpl = document.getElementById('contacts') as HTMLTemplateElement;
// const formNode = tpl.content.firstElementChild!.cloneNode(true) as HTMLFormElement;

// const form = new ContactsForm(formNode, {
//   onChange: (state) => {
//     // простенькая валидация для проверки UI
//     const errors: Record<string, string> = {};
//     const emailOk = !!state.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
//     const phoneOk = !!state.phone?.trim();
//     if (!emailOk) errors.email = 'Введите корректный email';
//     if (!phoneOk) errors.phone = 'Введите телефон';

//     form.setErrors(errors);
//     form.setSubmitDisabled(Object.keys(errors).length > 0);
//   },
//   onSubmit: (state) => {
//     alert(`Шаг 2 OK: ${JSON.stringify(state)}`);
//   },
// });

// gallery.replaceChildren(
//   form.render({ email: '', phone: '' })
// );



//ТЕСТ КОНТЕЙНЕРА КАТАЛОГА НА ГЛАВНОЙ

// import { CatalogView } from './components/base/views/layout/CatalogView';

// const gallery = document.querySelector<HTMLElement>('.gallery')!;
// const catalog = new CatalogView(gallery);

// // Сгенерируем пару «пустых» карточек из шаблона каталога
// const tpl = document.getElementById('card-catalog') as HTMLTemplateElement;
// const card1 = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
// const card2 = tpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
// card1.querySelector('.card__title')!.textContent = 'Карточка 1';
// card2.querySelector('.card__title')!.textContent = 'Карточка 2';

// catalog.renderList([card1, card2]);



//ТЕСТ КОНТЕЙНЕРА КОРЗИНЫ

// import { Modal } from './components/base/views//modal/Modal';
// import { BasketView } from './components/base/views/layout/BasketView';

// const modalRoot = document.getElementById('modal-container') as HTMLElement;
// const modal = new Modal(modalRoot);

// // клонируем шаблон корзины
// const basketTpl = document.getElementById('basket') as HTMLTemplateElement;
// const basketNode = basketTpl.content.firstElementChild!.cloneNode(true) as HTMLElement;

// const basket = new BasketView(basketNode, {
//   onCheckout: () => alert('Переходим к оформлению!'),
// });

// // соберём пару демо-элементов из шаблона позиции корзины
// const itemTpl = document.getElementById('card-basket') as HTMLTemplateElement;

// const mkItem = (i: number, title: string, price: number) => {
//   const li = itemTpl.content.firstElementChild!.cloneNode(true) as HTMLElement;
//   li.querySelector('.basket__item-index')!.textContent = String(i);
//   li.querySelector('.card__title')!.textContent = title;
//   li.querySelector('.card__price')!.textContent = `${price} синапсов`;
//   return li as HTMLElement;
// };

// basket.setItems([mkItem(1, 'Товар А', 500), mkItem(2, 'Товар Б', 700)]);
// basket.setTotal(1200);
// basket.setSubmitDisabled(false);

// // показать корзину в модалке
// modal.open(basket.render());

// // проверить пустое состояние (раскомментируй):
// setTimeout(() => {
//   basket.setEmpty(true);
// }, 2000);



// ТЕСТ КОНТЕЙНЕРА ХЭДЕРА

// import { HeaderView } from './components/base/views/layout/HeaderView';

// const headerRoot = document.querySelector<HTMLElement>('.header')!;
// const header = new HeaderView(headerRoot, {
//   onOpenBasket: () => console.log('open basket click'),
// });

// header.setBadge(3); // должно показать "3" в кружке




// // ТЕСТ СОДЕРЖИМОГО МОДАЛКИ ПОСЛЕ УСПЕШНОЙ ОПЛАТЫ

// import { Modal } from './components/base/views/modal/Modal';
// import { OrderSuccessView } from './components/base/views/misc/OrderSuccessView';

// const modalRoot = document.getElementById('modal-container') as HTMLElement;
// const modal = new Modal(modalRoot);

// const tplSuccess = document.getElementById('success') as HTMLTemplateElement;
// const successNode = tplSuccess.content.firstElementChild!.cloneNode(true) as HTMLElement;

// const successView = new OrderSuccessView(successNode, {
//   onClose: () => modal.close(),
// });

// modal.open(successView.render({ amount: 3210 }));




// // ТЕСТ МОДАЛКИ

// import { Modal } from './components/base/views/modal/Modal';

// // 1. Инициализируем модалку
// const modalRoot = document.getElementById('modal-container') as HTMLElement;
// const modal = new Modal(modalRoot);

// // 2. Возьмём любой шаблон как контент, например предпросмотр
// const tplPreview = document.getElementById('card-preview') as HTMLTemplateElement;
// const previewNode = tplPreview.content.firstElementChild!.cloneNode(true) as HTMLElement;

// // 3. Вставим в модалку и покажем
// modal.open(previewNode);





// ТЕСТ ЭМИТОРОВ МОДЕЛЕЙ

// import { EventEmitter } from './components/base/Events'; // скорректируй путь
// import { Catalog } from './components/base/models/catalog';
// import { Cart } from './components/base/models/cart';
// import { Buyer } from './components/base/models/buyer';
// import type { IProduct, IBuyer } from './types';

// const events = new EventEmitter();

// // Подписки (ожидаем логи в консоль)
// events.on('catalog:changed', (p: { items: IProduct[] }) => {
//   console.log('[EV] catalog:changed', p.items.length);
// });
// events.on('viewer:changed', (p: { item: IProduct | null }) => {
//   console.log('[EV] viewer:changed', p.item?.title ?? 'null');
// });
// events.on('basket:changed', (p: { items: IProduct[]; total: number }) => {
//   console.log('[EV] basket:changed', p.items.map(i => i.title), 'total=', p.total);
// });
// events.on('buyer:changed', (p: { data: IBuyer }) => {
//   console.log('[EV] buyer:changed', p.data);
// });

// // Создаём модели
// const catalog = new Catalog(events);
// const cart = new Cart(events);
// const buyer = new Buyer(events);

// // Фейковые товары
// const goods: IProduct[] = [
//   { id: '1', title: 'Товар A', image: '', category: 'софт-скил', price: 100, description: '' },
//   { id: '2', title: 'Товар B', image: '', category: 'хард-скил', price: 300, description: '' },
// ];

// // ТЕСТ-СЦЕНАРИЙ
// console.log('--- TEST START ---');
// catalog.setProducts(goods);               // => [EV] catalog:changed 2
// catalog.setProduct(goods[0]);             // => [EV] viewer:changed "Товар A"

// cart.addProduct(goods[0]);                // => [EV] basket:changed ["Товар A"] total= 100
// cart.addProduct(goods[1]);                // => [EV] basket:changed ["Товар A","Товар B"] total= 400
// cart.deleteProduct(goods[0]);             // => [EV] basket:changed ["Товар B"] total= 300
// cart.clear();                             // => [EV] basket:changed [] total= 0

// buyer.setData({
//   payment: 'card', address: 'Москва', email: 'a@b.c', phone: '7999000000'
// });                                       // => [EV] buyer:changed {...}
// buyer.clearData();                        // => [EV] buyer:changed {...пусто}
// console.log('--- TEST END ---');
