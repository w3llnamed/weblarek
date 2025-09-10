import './scss/styles.scss';

// import type { IApi } from './types';

import { apiProducts } from "./utils/data";

import { Catalog } from "./components/base/models/catalog";
import { Cart } from "./components/base/models/cart";
import { Buyer } from "./components/base/models/buyer";
import { ShopApi } from './components/base/services/shopapi';
import { Api } from './components/base/Api';


const catalog = new Catalog();
// catalog.setProducts(apiProducts.items); 
// console.log('Массив товаров из каталога: ', catalog.getProducts()) 

const cart = new Cart();
// console.log('проверка Cart:', cart.getProducts());

// const buyer = new Buyer();
// console.log('проверка Buyer:', buyer.checkData());

const http = new Api(`${import.meta.env.VITE_API_ORIGIN}/api/weblarek`);
const shop = new ShopApi(http);

// ---- объединённая проверка всех моделей ----
const runChecks = (items: any[]) => {
  // Catalog
  console.group('Catalog');
  catalog.setProducts(items);
  console.log('Список товаров (count):', catalog.getProducts().length);

  const first = catalog.getProducts()[0];
  const second = catalog.getProducts()[1];

  if (first) {
    console.log('getProductById(first.id):', catalog.getProductById(first.id));
    catalog.setProduct(first);
    console.log('getProduct() после setProduct:', catalog.getProduct());
  }
  console.groupEnd();

  // Cart
  console.group('Cart');
  console.log('Старт:', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum());
  if (first) {
    cart.addProduct(first);
    console.log('После add(first):', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum(), 'has(first)=', cart.hasProduct(first.id));
  }
  if (second) {
    cart.addProduct(second);
    console.log('После add(second):', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum());
  }
  if (first) {
    cart.deleteProduct(first);
    console.log('После delete(first):', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum(), 'has(first)=', cart.hasProduct(first.id));
  }
  cart.clear();
  console.log('После clear():', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum());
  console.groupEnd();

  // Buyer 
  console.group('Buyer validation');

  const buyerValid = new Buyer();
  buyerValid.setData({
    payment: 'card',
    address: 'Москва, ул. Пушкина, 1',
    email: 'user@example.com',
    phone: '+7 999 123-45-67',
  });
  console.log('валидный покупатель ->', buyerValid.checkData()); 
  console.log('getData(valid):', buyerValid.getData());

  const buyerInvalid = new Buyer();
  buyerInvalid.setData({
    payment: 'cash',
    address: '',              
    email: 'wrong-email',     
    phone: '123',             
  });
  console.log('не валидный покупатель ->', buyerInvalid.checkData()); 
  try {
    console.log('getData(invalid):', buyerInvalid.getData());
  } catch (e) {
    console.log('ОЖИДАЕМО: getData(invalid) бросил ошибку:', e);
  }

  console.groupEnd();
};


shop.getProducts()
  .then((items) => {
    console.log('Каталог с сервера загружен, штук:', items.length);
    runChecks(items);
  })
  .catch(() => {
    console.warn('Сервер недоступен, использую локальные данные из utils/data.ts');
    runChecks(apiProducts.items);
  });