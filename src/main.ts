import './scss/styles.scss';

import type { IApi } from './types';

import { apiProducts } from "./utils/data";

import { Catalog } from "./components/base/models/catalog";
import { Cart } from "./components/base/models/cart";
import { Buyer } from "./components/base/models/buyer";
import { ShopApi } from './components/base/services/shopapi';
import { Api } from './components/base/Api';


const catalog = new Catalog();
catalog.setProducts(apiProducts.items); 
console.log('Массив товаров из каталога: ', catalog.getProducts()) 

const cart = new Cart();
console.log('проверка Cart:', cart.getProducts());

const buyer = new Buyer();
console.log('проверка Buyer:', buyer.checkData());

const http = new Api('https://larek-api.nomoreparties.co/api/weblarek') as unknown as IApi;
const shop = new ShopApi(http);


const runChecks = (items: any[]) => {
  // 1) Catalog
  console.group('Catalog');
  catalog.setProducts(items);
  console.log('Список товаров (count):', catalog.getProducts().length);

  const first = catalog.getProducts()[0];
  if (first) {
    const found = catalog.getProductById(first.id);
    console.log('getProductById(first.id):', found);
    catalog.setProduct(first);
    console.log('getProduct() после setProduct:', catalog.getProduct());
  }
  console.groupEnd();

  // 2) Cart
  console.group('Cart');
  console.log('Старт:', cart.getProducts(), 'count=', cart.getCount(), 'sum=', cart.getSum());

  const second = catalog.getProducts()[1];

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

  // 3) Buyer
  console.group('Buyer');
  console.log('checkData() до setData:', buyer.checkData());
  buyer.setData({
    payment: 'card',              
    address: 'Адрес тест',
    email: 'user@example.com',
    phone: '+7 999 123-45-67',
  });
  console.log('checkData() после setData:', buyer.checkData());
  console.log('getData():', buyer.getData());
  buyer.clearData();
  console.log('После clearData() -> checkData():', buyer.checkData());
  try {
    console.log('getData() после clearData():', buyer.getData());
  } catch (e) {
    console.log('ОЖИДАЕМО: getData() после clearData() бросил ошибку:', e);
  }
  console.groupEnd();
};


shop.getProducts()
  .then((items) => {
    console.log('Каталог с сервера загружен, штук:', items.length);
    runChecks(items);
  })
  .catch((_e) => {
    console.warn('Сервер недоступен');

  });
