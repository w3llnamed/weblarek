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

// --- КЭШ ШАБЛОНОВ + УТИЛИТА КЛОНИРОВАНИЯ (один раз при загрузке) ---
function getTpl(id: string): HTMLTemplateElement {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLTemplateElement)) {
    throw new Error(`Template with id="${id}" not found or not a <template>`);
  }
  return el;
}

const TPL = {
  cardCatalog: getTpl('card-catalog'),
  cardPreview: getTpl('card-preview'),
  basket:      getTpl('basket'),
  basketItem:  getTpl('card-basket'),
  step1:       getTpl('order'),
  step2:       getTpl('contacts'),
  success:     getTpl('success'),
} as const;

function cloneFrom<T extends HTMLElement = HTMLElement>(tpl: HTMLTemplateElement): T {
  return tpl.content.firstElementChild!.cloneNode(true) as T;
}

// --- SINGLETON-экземпляры View (создаются ОДИН РАЗ) ---
const basketView = new BasketView(cloneFrom<HTMLElement>(TPL.basket), {
  onCheckout: () => openDeliveryForm()
});

// Хэндлеры вынесены в именованные функции, чтобы не плодить замыкания при каждом открытии
function onDeliveryChange(state: { payment?: string; address?: string }) {
  if (state.payment !== undefined) {
    events.emit('order:change', { key: 'payment', value: state.payment } as OrderChangePayload);
  }
  if (state.address !== undefined) {
    events.emit('order:change', { key: 'address', value: state.address } as OrderChangePayload);
  }
}

function onDeliverySubmit(state: { payment?: string; address?: string }) {
  const errors: OrderErrors = {};
  if (!state.payment) errors.payment = 'Выберите способ оплаты';
  if (!state.address?.trim()) errors.address = 'Введите адрес доставки';

  // показать ошибки и заодно корректно задизейблить кнопку
  deliveryForm.setErrors({ payment: errors.payment, address: errors.address });
  deliveryForm.setSubmitDisabled(Boolean(errors.payment || errors.address));
  if (errors.payment || errors.address) return;

  // только теперь пишем в модель и идём дальше
  const prev = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  buyer.setData({ ...prev, payment: state.payment!, address: state.address! } as IBuyer);

  openContactsForm();
}


const deliveryForm = new PaymentDeliveryForm(cloneFrom<HTMLFormElement>(TPL.step1), {
  onChange: onDeliveryChange,
  onSubmit: onDeliverySubmit
});

function onContactsChange(state: { email?: string; phone?: string }) {
  if (state.email !== undefined) {
    events.emit('order:change', { key: 'email', value: state.email } as OrderChangePayload);
  }
  if (state.phone !== undefined) {
    events.emit('order:change', { key: 'phone', value: state.phone } as OrderChangePayload);
  }
}


async function onContactsSubmit(state: { email: string; phone: string }) {
  const prev = buyer.getData();
  buyer.setData({ ...prev, ...state });

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
  } catch {
    contactsForm.setErrors({ common: 'Не удалось оформить заказ. Попробуйте ещё раз.' });
  }
}

const contactsForm = new ContactsForm(cloneFrom<HTMLFormElement>(TPL.step2), {
  onChange: onContactsChange,
  onSubmit: onContactsSubmit
});

const successView = new OrderSuccessView(cloneFrom<HTMLElement>(TPL.success), {
  onClose: () => modal.close()
});


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

header.setBadge(cart.getCount());
renderBasketFromModel();

// ---------- ХЕЛПЕРЫ РЕНДЕРА ----------

function renderCatalog() {
  const cards = catalog.getProducts().map((p) => {
    const node = cloneFrom<HTMLElement>(TPL.cardCatalog);

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

function renderBasketFromModel() {
  const items = cart.getProducts().map((p, i) => {
    const li = cloneFrom<HTMLElement>(TPL.basketItem);

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

  basketView.setItems(items);
  basketView.setTotal(cart.getSum());
  basketView.setSubmitDisabled(cart.getCount() === 0);
  basketView.setEmpty(cart.getCount() === 0);
}

// --- ВАЛИДАЦИЯ ЗАКАЗА ---
type OrderErrors = Partial<Record<'payment'|'address'|'email'|'phone'|'common', string>>;

type OrderChangePayload = { key: keyof IBuyer; value: string | undefined };


function validateOrder(d: IBuyer): { errors: OrderErrors; valid: boolean } {
  const errors: OrderErrors = {};
  if (!d.payment) errors.payment = 'Выберите способ оплаты';
  if (!d.address?.trim()) errors.address = 'Введите адрес доставки';
  if (d.email !== undefined && !d.email.trim()) errors.email = 'Введите почту';
  if (d.phone !== undefined && !d.phone.trim()) errors.phone = 'Введите телефон';
  const valid = Object.keys(errors).length === 0;
  return { errors, valid };
}


function openPreview(prod: IProduct) {
  const node = cloneFrom<HTMLElement>(TPL.cardPreview);

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
  // Ничего не пересобираем при открытии: содержимое синхронизируется по событию 'basket:changed'
  modal.open(basketView.render());
}

function openDeliveryForm() {
  try {
    const data = buyer.getData();
    deliveryForm.setPayment(data.payment);
    deliveryForm.setAddress(data.address);
  } catch {
    deliveryForm.setPayment(undefined as any);
    deliveryForm.setAddress('');
  }
  deliveryForm.setErrors({ payment: '', address: '' });
  deliveryForm.setSubmitDisabled(true);

  modal.open(deliveryForm.render());
}

function openContactsForm() {
  try {
    const data = buyer.getData();
    if (data.email) contactsForm.setEmail(data.email);
    if (data.phone) contactsForm.setPhone(data.phone);
    onContactsChange({ email: data.email, phone: data.phone });
  } catch {
    contactsForm.setEmail('');
    contactsForm.setPhone('');
    contactsForm.setSubmitDisabled(true);
  }

  modal.open(contactsForm.render());
}

function showSuccess(amount: number) {
  modal.open(successView.render({ amount }));
}

// --- СВЯЗКА: View -> Presenter -> Model -> View ---
events.on('order:change', ({ key, value }: OrderChangePayload) => {
  const prev = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  const next = { ...prev, [key]: value } as IBuyer;

  buyer.setData(next);

  const { errors } = validateOrder(next);
  events.emit('form:validate', errors);
});


events.on('form:validate', (errors: OrderErrors) => {
  deliveryForm.setErrors({ payment: errors.payment, address: errors.address });
  deliveryForm.setSubmitDisabled(!!(errors.payment || errors.address));

  contactsForm.setErrors({ email: errors.email, phone: errors.phone, common: errors.common });
  contactsForm.setSubmitDisabled(!!(errors.email || errors.phone));
});


// ---------- ПОДПИСКИ НА МОДЕЛИ ----------
events.on('catalog:changed', () => {
  renderCatalog();
});

events.on('viewer:changed', ({ item }: { item: IProduct | null }) => {
  if (item) openPreview(item);
  else modal.close();
});

events.on('basket:changed', ({ items, total }: { items: IProduct[]; total: number }) => {
  // Всегда обновляем шапку и содержимое представления корзины (без прямого DOM)
  header.setBadge(items.length);
  renderBasketFromModel();
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