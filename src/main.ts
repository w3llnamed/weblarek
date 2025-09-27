import './scss/styles.scss';

// Утилиты
import { ensureElement, cloneTemplate } from './utils/utils';


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

// --- КЭШ ШАБЛОНОВ (селекторы для cloneTemplate) ---
const TPL = {
  cardCatalog: '#card-catalog',
  cardPreview: '#card-preview',
  basket:      '#basket',
  basketItem:  '#card-basket',
  orderForm:   '#order',
  contactsForm:'#contacts',
  success:     '#success',
} as const;


// --- SINGLETON-экземпляры View (создаются ОДИН РАЗ) ---
const basketView = new BasketView(cloneTemplate<HTMLElement>(TPL.basket), {
  onCheckout: () => openDeliveryForm()
});


// Хэндлеры вынесены в именованные функции, чтобы не плодить замыкания при каждом открытии
function onDeliveryChange(state: { payment?: string; address?: string }) {
  const prev = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  buyer.setData({ ...prev, ...state });
}

function onDeliverySubmit() {
  const current = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  const { valid } = validateOrder(current, 'delivery');
  if (!valid) return;
  openContactsForm();
}

const deliveryForm = new PaymentDeliveryForm(cloneTemplate<HTMLFormElement>(TPL.orderForm), {
  onChange: onDeliveryChange,
  onSubmit: onDeliverySubmit
});

function onContactsChange(state: { email?: string; phone?: string }) {
  const prev = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  buyer.setData({ ...prev, ...state });
}

async function onContactsSubmit() {
  const data = (() => { try { return buyer.getData(); } catch { return {} as IBuyer; } })();
  const { valid } = validateOrder(data, 'contacts');
  if (!valid) return;

  const order: IOrderRequest = {
    payment: data.payment,
    address: data.address,
    email: data.email!,
    phone: data.phone!,
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

const contactsForm = new ContactsForm(cloneTemplate<HTMLFormElement>(TPL.contactsForm), {
  onChange: onContactsChange,
  onSubmit: onContactsSubmit
});

const successView = new OrderSuccessView(cloneTemplate<HTMLElement>(TPL.success), {
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

const gallery   = ensureElement<HTMLElement>('.gallery');
const headerEl  = ensureElement<HTMLElement>('.header');
const modalRoot = ensureElement<HTMLElement>('#modal-container');

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
    const node = cloneTemplate<HTMLElement>(TPL.cardCatalog);

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
    const li = cloneTemplate<HTMLElement>(TPL.basketItem);

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

type ValidatePhase = 'delivery' | 'contacts' | 'all';

function validateOrder(
  d: Partial<IBuyer>,
  phase: ValidatePhase = 'all'
): { errors: OrderErrors; valid: boolean } {
  const errors: OrderErrors = {};

  // Блок «доставка и оплата» (payment + address)
  if (phase !== 'contacts') {
    if (!d.payment) errors.payment = 'Выберите способ оплаты';
    if (!d.address?.trim()) errors.address = 'Введите адрес доставки';
  }

  // Блок «контакты» (email + phone)
  if (phase !== 'delivery') {
    if (!d.email?.trim()) errors.email = 'Введите почту';
    if (!d.phone?.trim()) errors.phone = 'Введите телефон';
  }

  const valid = Object.keys(errors).length === 0;
  return { errors, valid };
}



function openPreview(prod: IProduct) {
  const node = cloneTemplate<HTMLElement>(TPL.cardPreview);

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
  modal.open(basketView.render());
}

function openDeliveryForm() {
  try {
    const data = buyer.getData();
    deliveryForm.setPayment(data.payment);
    deliveryForm.setAddress(data.address);
  } catch {
    deliveryForm.setPayment('');
    deliveryForm.setAddress('');
    deliveryForm.setSubmitDisabled(true);
  }
  deliveryForm.setErrors({});
  modal.open(deliveryForm.render());
}

function openContactsForm() {
  try {
    const data = buyer.getData();
    if (data.email) contactsForm.setEmail(data.email);
    else contactsForm.setEmail('');
    if (data.phone) contactsForm.setPhone(data.phone);
    else contactsForm.setPhone('');
  } catch {
    contactsForm.setEmail('');
    contactsForm.setPhone('');
    contactsForm.setSubmitDisabled(true);
    contactsForm.setErrors({});
  }
  contactsForm.setErrors({});    
  modal.open(contactsForm.render());
}


function showSuccess(amount: number) {
  modal.open(successView.render({ amount }));
}

// --- СВЯЗКА: View -> Presenter -> Model -> View ---
events.on('buyer:changed', ({ data }: { data: Partial<IBuyer> }) => {
  const { errors } = validateOrder(data, 'all');

  // шаг «Доставка и оплата»
  deliveryForm.setErrors({ payment: errors.payment, address: errors.address });
  deliveryForm.setSubmitDisabled(!!(errors.payment || errors.address));

  // шаг «Контакты»
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