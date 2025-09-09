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

shop.getProducts()
  .then((items) => {
    catalog.setProducts(items);
    console.log('Каталог с сервера:', catalog.getProducts());
  })
  .catch((e) => console.error('Ошибка загрузки каталога:', e));