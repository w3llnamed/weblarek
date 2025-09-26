# Проектная работа "Веб-ларек"

Стек: HTML, SCSS, TS, Webpack

Структура проекта:
- src/ - исходные файлы проекта
- src/components/ - папка с JS компонентами
- src/components/base/ - папка с базовым кодом

Важные файлы:
- index.html - HTML-файл главной страницы
- src/types/index.ts - файл с типами
- src/main.ts - точка входа приложения
- src/scss/styles.scss - корневой файл стилей
- src/utils/constants.ts - файл с константами
- src/utils/utils.ts - файл с утилитами

## Установка и запуск
Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```
## Сборка

```
npm run build
```

или

```
yarn build
```
# Интернет-магазин «Web-Larёk»
«Web-Larёk» - это интернет-магазин с товарами для веб-разработчиков, где пользователи могут просматривать товары, добавлять их в корзину и оформлять заказы. Сайт предоставляет удобный интерфейс с модальными окнами для просмотра деталей товаров, управления корзиной и выбора способа оплаты, обеспечивая полный цикл покупки с отправкой заказов на сервер.

## Архитектура приложения

Код приложения разделен на слои согласно парадигме MVP (Model-View-Presenter), которая обеспечивает четкое разделение ответственности между классами слоев Model и View. Каждый слой несет свой смысл и ответственность:

Model - слой данных, отвечает за хранение и изменение данных.  
View - слой представления, отвечает за отображение данных на странице.  
Presenter - презентер содержит основную логику приложения и  отвечает за связь представления и данных.

Взаимодействие между классами обеспечивается использованием событийно-ориентированного подхода. Модели и Представления генерируют события при изменении данных или взаимодействии пользователя с приложением, а Презентер обрабатывает эти события используя методы как Моделей, так и Представлений.

## Базовый код

### Класс Component
Является базовым классом для всех компонентов интерфейса.
Класс является дженериком и принимает в переменной `T` тип данных, которые могут быть переданы в метод `render` для отображения.

Конструктор:  
`constructor(container: HTMLElement)` - принимает ссылку на DOM элемент за отображение, которого он отвечает.

Поля класса:  
`container: HTMLElement` - поле для хранения корневого DOM элемента компонента.

Методы класса:  
`render(data?: Partial<T>): HTMLElement` - Главный метод класса. Он принимает данные, которые необходимо отобразить в интерфейсе, записывает эти данные в поля класса и возвращает ссылку на DOM-элемент. Предполагается, что в классах, которые будут наследоваться от `Component` будут реализованы сеттеры для полей с данными, которые будут вызываться в момент вызова `render` и записывать данные в необходимые DOM элементы.  
`setImage(element: HTMLImageElement, src: string, alt?: string): void` - утилитарный метод для модификации DOM-элементов `<img>`


### Класс Api
Содержит в себе базовую логику отправки запросов.

Конструктор:  
`constructor(baseUrl: string, options: RequestInit = {})` - В конструктор передается базовый адрес сервера и опциональный объект с заголовками запросов.

Поля класса:  
`baseUrl: string` - базовый адрес сервера  
`options: RequestInit` - объект с заголовками, которые будут использованы для запросов.

Методы:  
`get(uri: string): Promise<object>` - выполняет GET запрос на переданный в параметрах ендпоинт и возвращает промис с объектом, которым ответил сервер  
`post(uri: string, data: object, method: ApiPostMethods = 'POST'): Promise<object>` - принимает объект с данными, которые будут переданы в JSON в теле запроса, и отправляет эти данные на ендпоинт переданный как параметр при вызове метода. По умолчанию выполняется `POST` запрос, но метод запроса может быть переопределен заданием третьего параметра при вызове.  
`handleResponse(response: Response): Promise<object>` - защищенный метод проверяющий ответ сервера на корректность и возвращающий объект с данными полученный от сервера или отклоненный промис, в случае некорректных данных.

### Класс EventEmitter
Брокер событий реализует паттерн "Наблюдатель", позволяющий отправлять события и подписываться на события, происходящие в системе. Класс используется для связи слоя данных и представления.

Конструктор класса не принимает параметров.

Поля класса:  
`_events: Map<string | RegExp, Set<Function>>)` -  хранит коллекцию подписок на события. Ключи коллекции - названия событий или регулярное выражение, значения - коллекция функций обработчиков, которые будут вызваны при срабатывании события.

Методы класса:  
`on<T extends object>(event: EventName, callback: (data: T) => void): void` - подписка на событие, принимает название события и функцию обработчик.  
`emit<T extends object>(event: string, data?: T): void` - инициализация события. При вызове события в метод передается название события и объект с данными, который будет использован как аргумент для вызова обработчика.  
`trigger<T extends object>(event: string, context?: Partial<T>): (data: T) => void` - возвращает функцию, при вызове которой инициализируется требуемое в параметрах событие с передачей в него данных из второго параметра.


## Слой данных (Models)
В данных присутствуют два интерфейса: `IProduct` (Товар) и `IBuyer` (Покупатель), описывающие свойства соответствующих сущностей

### Интерфейс IProduct
Описывает сущность "Товар"
Имеет 6 свойств:
 - `id: string` - идентификатор
 - `title: string` - название
 - `image: string` - ссылка на картинку
 - `category: string` - категория товара
 - `price: number | null` - цена товара (`null` - цена не указана)
 - `description: string` - описание товара

### Интерфейс IBuyer
Описывает сущность "Покупатель"
Имеет 4 свойства:
 - `payment: TPayment` - способ оплаты покупателя
 - `address: string` - физический адрес покупателя
 - `email: string` - адрес электронной почты покупателя
 - `phone: string` - телефон покупателя

## Модели данных
В данных присутствуют 3 класса, которыми реализована работа с данными: Catalog(Каталог товаров), Cart(Корзина), Buyer(Покупатель)

### Класс Catalog
Назначение: управление данными каталога товаров.  

Поля класса:
 - `products: IProduct[]` - хранит массив всех товаров
 - `selectedProduct: IProduct | null` - хранит товар, выбранный для подробного отображения

Методы класса:
 - `setProducts(products: IProduct[]): void` - сохранение массива товаров полученного в параметрах метода
 - `getProducts(): IProduct[]` - получение массива товаров из модели
 - `getProductById(id: string): IProduct | undefined` - получение одного товара по его id
 - `setProduct(product: IProduct): void` - сохранения товара для подробного отображения
 - `getProduct(): IProduct | null` - получение товара для подробного отображения

### Класс Cart
Назначение: управление корзиной покупателя.  

Поля класса:
 - `products: IProduct[]` - хранит массив товаров, выбранных покупателем для покупки

Методы класса:
 - `getProducts(): IProduct[]` - получение массива товаров, которые находятся в корзине
 - `addProduct(product: IProduct): void` - добавление товара, который был получен в параметре в массив корзины
 - `deleteProduct(product: IProduct): void` - удаление товара, полученного в параметре из массива корзины
 - `clear(): void` - очистка корзины
 - `getSum(): number` - получение стоимости всех товаров в корзине
 - `getCount(): number` - получение количества товаров в корзине
 - `hasProduct(id:string): boolean` - проверка наличия товара в корзине по его id, полученному в параметр метода

### Класс Buyer
Назначение: хранение и управление данными покупателя. 

Поля класса:
 - `payment: TPayment` - вид оплаты
 - `address: string` - адреc
 - `phone: string` - телефон
 - `email: string` - email

Методы класса:
 - `setData(data: IBuyer): void` - сохранение данных в модели
 - `getData(): IBuyer` - получение всех данных покупателя
 - `clearData(): void` - очистка данных покупателя
 - `checkData(): boolean` - валидация данных


## Слой коммуникации
В слое коммуникации присутствует класс, который будет использовать композицию, чтобы выполнить запрос на сервер с помощью метода `get` класса `Api` и будет получать с сервера объект с массивом товаров

### Класс ShopApi
Назначение: получение данных с сервера и отправка заказов.

Конструктор:
`constructor(api: IApi)` - принимает запрос и сохраняет его внутри класса

Поля класса:
 - `api: IApi` - объект, через который выполняются HTTP-запросы

Методы класса:
 - `getProducts(): Promise<IProduct[]>` - получить каталог товаров
 - `createOrder(data: IOrderRequest): Promise<IOrderResponse>` - оформить заказ


## Слой представления (View)
В слое представления используются классы, которые отвечают только за работу с DOM: поиск и кэширование узлов, подстановку текстов/картинок, включение/выключение кнопок и модалок. Данные не хранятся внутри View - они передаются извне презентером.

### Класс Modal
Назначение: управление модальным окном (показ/скрытие, подстановка контента).  Обработчики закрытия по клику на крестик и вне контейнера подключаются в конструкторе.

Конструктор:
`constructor(root: HTMLElement)` - принимает корневой элемент модального окна с классом .modal

Поля класса:
 - `element: HTMLElement` - корневой `.modal`
 - `container: HTMLElement` - внутренняя ссылка на `.modal__container`
 - `closeButton: HTMLButtonElement` - внутренняя ссылка на `.modal__close`
 - `content: HTMLElement` - внутренняя ссылка на `.modal__content`

Методы класса:
 - `open(content: HTMLElement): void` - вставляет content в `.modal__content` и добавляет модификатор видимости `modal_active` на `.modal`
 - `close(): void` - удаляет modal_active и очищает `.modal__content`

### Класс BaseCard (наследуется от Component)
Назначение: общий родитель для карточек товара (каталог, предпросмотр, корзина). Отвечает за поиск внутренних узлов и отрисовку заголовка, цены, категории и изображения.

Конструктор:
`constructor(node: HTMLElement, handlers?: { onSelect?(id: string): void; onAdd?(id: string): void; onRemove?(id: string): void })` - принимает готовый DOM-узел карточки и набор обработчиков действий.

Поля:
 - `container: HTMLElement` - из `Component`
 - `titleEl?: HTMLElement` - внутренняя ссылка на `.card__title`
 - `priceEl?: HTMLElement` - внутренняя ссылка на `.card__price`
 - `categoryEl?: HTMLElement` - внутренняя ссылка на `.card__category`
 - `imageEl?: HTMLImageElement` - внутренняя ссылка на `.card__image`
 - `actionButton?: HTMLButtonElement` - внутренняя ссылка на `.card__button` (кнопка действия, если есть в шаблоне)

Методы:
 - `render(data?: Partial<{ title: string; price: number|null; category: string; image: string }>): HTMLElement` - подставляет данные в DOM, возвращает корневой элемент
 - `setTitle(title: string): void` - записывает заголовок товара в `.card__title` (если узла нет - метод ничего не делает)
 - `setPrice(price: number|null): void` - обновляет `.card__price`:
   - если `price` задан, выводит форматированное значение (например, 1000 синапсов)
   - если `price === null`, выводит «Недоступно» и (при наличии кнопки действия) делает кнопку недоступной
 - `setCategory(name: string): void` - записывает текст категории в `.card__category` и применяет модификатор по `categoryMap` (например, добавляет класс `card__category_soft`), предварительно снимая прежние модификаторы категории.
 - `setImage(src: string, alt: string): void` - проставляет `src` и `alt` у `.card__image`, если `alt` пустой, подставляет безопасное значение по умолчанию (например, название товара или пустую строку)

### Класс CatalogCard (наследуется от BaseCard) - шаблон #card-catalog
Назначение: карточка товара в каталоге (плитка на главной), по клику открывает предпросмотр, показывает категорию/цену/картинку/название и умеет блокироваться, если товара «нет в продаже». 

Конструктор:
как у `BaseCard` `(constructor(node, { onSelect }?))` дополнительно вешает клик на корневую кнопку - вызывает `onSelect(id)`

Поля:
 - `rootButton: HTMLButtonElement` - внутренняя ссылка на `.gallery__item.card` (корневой элемент-кнопка; кликом дергаем onSelect)
 - `categoryEl: HTMLElement` - внутренняя ссылка на `.card__category`
 - `titleEl: HTMLElement` - внутренняя ссылка на `.card__title`
 - `imageEl: HTMLImageElement` - внутренняя ссылка на `.card__image`
 - `priceEl: HTMLElement` - внутренняя ссылка на `.card__price`

Методы:
Наследует методы `BaseCard` без переопределений

Поведение/особенности UI:
 - Если `price === null`:
   - `rootButton.disabled` = true (плитка не кликабельна)
   - `priceEl.textContent` = 'Недоступно'
 - Клик по `rootButton` вызывает `handlers.onSelect?.(productId)` - презентер откроет предпросмотр
 - `productId` сохраняется при `render(data)` (например, из `data.id`) и используется в обработчиках


### Класс PreviewCard (наследуется от BaseCard) - шаблон #card-preview
Назначение: карточка детального просмотра товара для модального окна. Отображает картинку, категорию, название, описание, цену и основную кнопку действия.

Конструктор:
как у `BaseCard` `(constructor(node, { onAdd, onRemove }?))` дополнительно вешает клик на `actionButton` - в зависимости от состояния вызывает `onAdd(id)` или `onRemove(id)`.

Поля (обязательные для этого шаблона):
 - `imageEl: HTMLImageElement` - внутренняя ссылка на `.card__image`
 - `categoryEl: HTMLElement` - внутренняя ссылка на `.card__category`
 - `titleEl: HTMLElement` - внутренняя ссылка на `.card__title`
 - `textEl: HTMLElement` - внутренняя ссылка на `.card__text`
 - `priceEl: HTMLElement` - внутренняя ссылка на `.card__price`
 - `actionButton: HTMLButtonElement` - внутренняя ссылка на `.card__button`

Методы: наследует базовые из `BaseCard`; добавляет:
 - `setInCart(flag: boolean): void` - переключает текст/смысл actionButton:
 - `false` - «В корзину», клик вызывает `onAdd(id)`
 - `true` - «Удалить из корзины», клик вызывает `onRemove(id)`

Особенности UI:
 - Применяет модификатор категории `card__category_${categoryMap[name]}` на `.card__category`
 - Если `price === null`: actionButton.disabled = true, текст кнопки «Недоступно»
 - После успешного `onAdd`/`onRemove` закрытие модалки выполняется внешним кодом (презентером)
 - `productId` сохраняется при `render(data)` (например, из `data.id`) и используется в обработчиках

 ### Класс BasketItem (наследуется от BaseCard) - шаблон #card-basket
Назначение: строка товара в корзине (компактная карточка): порядковый номер, название, цена и кнопка удаления.

Конструктор: 
как у `BaseCard` (constructor(node, { onRemove }?)); вешает клик на deleteButton → вызывает onRemove(id).

Поля (обязательные для этого шаблона):
 - `rootItem: HTMLLIElement` - внутренняя ссылка на `.basket__item.card`
 - `indexEl: HTMLElement` - внутренняя ссылка на `.basket__item-index`
 - `titleEl: HTMLElement` - внутренняя ссылка на `.card__title`
 - `priceEl: HTMLElement` - внутренняя ссылка на `.card__price`
 - `deleteButton: HTMLButtonElement` - внутренняя ссылка на `.basket__item-delete.card__button`

Методы: наследует базовые из BaseCard; добавляет (по необходимости):
 - `setIndex(n: number): void` - выводит порядковый номер в `indexEl`

Особенности UI:
 - Цена в корзине должна быть определена; если по данным `price === null`, допускается выводить «Недоступно» как fallback (такие товары обычно не попадают в корзину)
 - Клик по `deleteButton` всегда вызывает `onRemove(productId)`
 - `productId` сохраняется при `render(data)` и используется в обработчиках

### Класс BaseForm<TState> (наследуется от Component)
Назначение: общий родитель для форм оформления (кэш полей, визуализация ошибок, управление доступностью кнопки)

Конструктор:
`constructor(form: HTMLFormElement, handlers?: { onChange?(state: Partial<TState>): void; onSubmit?(state: TState): void })`

Поля:
 - `container: HTMLFormElement` - корень формы.
 - `inputs: Map<string, HTMLInputElement | HTMLTextAreaElement>` - все поля ввода формы, собираются по селектору `input[name]`, `textarea[name]` (ключ - атрибут `name`)
 - `submitBtn?: HTMLButtonElement` - основная кнопка отправки (`button[type="submit"]` или конкретный селектор формы)
 - `errorsEl?: HTMLElement` - `.form__errors` (общая область ошибок, если предусмотрена разметкой)

Методы:
 - `render(data?: Partial<TState>): HTMLElement` - возвращает форму, при наличии data заполняет соответствующие поля (`inputs.get(name).value = ...`)
 - `setErrors(map: Record<string, string>): void` - показывает ошибки:
   - если `errorsEl` есть, пишет сводное сообщение
   - дополнительно может помечать отдельные инпуты (например, `aria-invalid`, класс ошибки)
 - `setSubmitDisabled(flag: boolean): void` - включает/выключает `submitBtn`

Поведение:
 - В конструкторе навешиваются обработчики `input`/`change` на все элементы из `inputs` и `submit` на форму; при изменениях вызывается onChange, при отправке - `onSubmit`
 - Конкретные формы (наследники) уточняют обязательные поля (`submitBtn`, конкретные элементы из `inputs`) и при необходимости переопределяют стратегию отображения ошибок

### Класс PaymentDeliveryForm (наследуется от BaseForm<{ payment: 'card'|'cash'; address: string }>), шаблон #order
Назначение: первый шаг оформления - выбор способа оплаты и адрес доставки.

Конструктор: 
как у `BaseForm` `(constructor(form, { onChange, onSubmit }?))`

Поля (обязательные):
 - `cardBtn: HTMLButtonElement` - `button[name="card"].button_alt`
 - `cashBtn: HTMLButtonElement` - `button[name="cash"].button_alt`
 - `addressInput: HTMLInputElement` - `input[name="address"]`
 - `submitBtn: HTMLButtonElement` - `.order__button`
 - `errorsEl: HTMLElement` - `.form__errors`

Методы: наследует базовые; добавляет:
 - `setPayment(p: 'card'|'cash'): void` - ставит модификатор button_alt-active на выбранной кнопке
 - `setAddress(value: string): void` - подставляет значение в поле адреса
 
Особенности UI: 
 - `submit` активен только если выбран способ оплаты и адрес непустой

### Класс ContactsForm (наследуется от BaseForm<{ email: string; phone: string }>), шаблон #contacts
Назначение: второй шаг оформления - ввод контактов

Конструктор: 
как у `BaseForm` `(constructor(form, { onChange, onSubmit }?))`

Поля (обязательные):
 - `emailInput: HTMLInputElement` - `input[name="email"]`
 - `phoneInput: HTMLInputElement` - `input[name="phone"]`
 - `submitBtn: HTMLButtonElement` - `.button[type="submit"]`
 - `errorsEl: HTMLElement` - `.form__errors`

Методы: наследует базовые; добавляет:
 - `setEmail(value: string): void` - подставляет `value` в поле `emailInput`, уведомляет обработчик `onChange({ email: value })`
 - `setPhone(value: string): void` - подставляет `value` в поле `phoneInput`, уведомляет `onChange({ phone: value })`

Особенности UI: 
 - `submit` активен только если оба поля валидны и непустые

### Класс CatalogView (наследуется от Component)
Назначение: контейнер каталога на главной странице.

Конструктор: 
`constructor(container: HTMLElement)` - принимает `<main class="gallery">`.

Поля: 
 - `container: HTMLElement`

Методы:
 - `render(): HTMLElement` - возвращает контейнер
 - `renderList(nodes: HTMLElement[]): void` - `container.replaceChildren(...nodes)`

### Класс BasketView (наследуется от Component), шаблон #basket
Назначение: контейнер содержимого корзины для модального окна

Конструктор: 
`constructor(root: HTMLElement, handlers?: { onCheckout?(): void })`

Поля (обязательные):
 - `listEl: HTMLUListElement` - `.basket__list`
 - `totalEl: HTMLElement` - `.basket__price`
 - `checkoutBtn: HTMLButtonElement` - `.basket__button`

Методы:
 - `render(): HTMLElement`
 - `setItems(nodes: HTMLElement[]): void` - рендер списка позиций
 - `setTotal(value: number): void` - обновляет сумму
 - `setSubmitDisabled(flag: boolean): void` - активирует/деактивирует «Оформить»
 - `setEmpty(flag: boolean): void` - переключает пустое состояние (вместо списка - «Корзина пуста»).

### Класс HeaderView (наследуется от Component)
Назначение: хедер с иконкой корзины и счётчиком

Конструктор:
constructor(root: HTMLElement, handlers?: { onOpenBasket?(): void })

Поля (обязательные):
 - `basketButton: HTMLButtonElement` - `.header__basket`
 - `counterEl: HTMLElement` - `.header__basket-counter`

Методы:
 - `render(): HTMLElement`
 - `setBadge(count: number): void` - устанавливает число товаров

Поведение: клик по `basketButton` вызывает `onOpenBasket()` (открытие корзины)

### Класс OrderSuccessView, шаблон #success
Назначение: содержимое модалки после успешной оплаты

Конструктор: 
`constructor(node: HTMLElement, handlers?: { onClose?(): void })`

Поля:
 - `titleEl: HTMLElement` - `.order-success__title`
 - `descEl: HTMLElement` - `.order-success__description`
 - `closeBtn: HTMLButtonElement` - `.order-success__close`

Методы:
 - `render(data?: { amount?: number }): HTMLElement` - обновляет текст «Списано N синапсов» и возвращает корень

Поведение: клик по `closeBtn` вызывает `onClose()`


## Событийная модель (что эмитим и на что подписываемся)
Брокер: `EventEmitter`. Представления не хранят данные — они сообщают о действиях пользователя через события/обработчики. Модели данных при любом изменении эмитят свои события.

### События от Представления (UI)
| Источник (класс) |	Событие |	Payload |	Когда/зачем |
|------------------|----------|---------|-------------|
| `CatalogCard` |	`card:select` |	`{ id: string }` |	Клик по плитке товара в каталоге — открыть предпросмотр. |
| `PreviewCard` |	`card:add` |	`{ id: string }` |	Клик «В корзину». |
| `PreviewCard` |	`card:remove` |	`{ id: string }` |	Клик «Удалить из корзины». |
| `BasketItem` |	`card:remove` |	`{ id: string }` |	Кнопка удаления позиции в корзине. |
| `HeaderView` |	`header:open-basket` |	`void` |	Клик по иконке корзины — показать корзину. |
| `BasketView` |	`basket:checkout` |	`void` |	Клик «Оформить» в корзине — открыть форму доставки. |
| `PaymentDeliveryForm` |	`checkout:step1:change` |	`Partial<{ payment: 'card'\|'cash'; address: string }>` | Изменение оплаты/адреса |
| `PaymentDeliveryForm` | `checkout:step1:submit` |	`{ payment: 'card'\|'cash'; address: string }` | Клик «Далее» (валидно) |
| `ContactsForm` |	`checkout:step2:change` |	`Partial<{ email: string; phone: string }>` |	Изменение контактов. |
| `ContactsForm` |	`checkout:step2:submit` |	`{ email: string; phone: string }` |	Нажатие «Оплатить» (валидная форма). |
| `Modal` |	`modal:close` |	`void` |	Закрытие по крестику/клику вне окна (если нужно отреагировать в презентере). |

Примечание: в коде PreviewCard/BasketItem/CatalogCard эти действия могут вызываться как переданные в конструктор обработчики, но в презентере они транслируются в события брокера и/или вызывают методы моделей.

### События от Моделей данных
| Модель	| Событие	| Payload	| Когда/зачем |
|---------|---------|---------|-------------|
| `Catalog` |	`catalog:changed` |	`{ items: IProduct[] }` |	Загрузили/обновили список товаров. |
| `Catalog` |	`viewer:changed` |	`{ item: IProduct\|null }` |	Выбран/снят товар для предпросмотра. |
| `Cart` |	`basket:changed` |	`{ items: IProduct[]; total: number }` |	Состав корзины/сумма изменились. |
| `Buyer` |	`buyer:changed` |	`{ data: IBuyer }` |	Данные покупателя обновились (любой шаг). |
| (`API`/`Order`) |	`order:paid` |	`{ amount: number }` |	Заказ успешно принят/оплачен на сервере. |

Правило перерисовки: презентер рендерит View только:
 - при обработке событий от моделей (*:changed, order:paid)
 - когда нужно показать/закрыть модалку (например, после card:select)


## Слой Презентера (Presenter)
В этом проекте роль презентера выполняет файл `src/main.ts`. Он не хранит данных и не рендерит разметку сам — он:
 - создаёт экземпляры Моделей и Представлений
 - подписывается на события моделей и колбэки представлений
 - вызывает методы моделей и перерисовывает нужные представления строго по правилам ниже

### Правила перерисовки
Презентер перерисовывает View только когда:
 - пришло событие об изменении данных от модели (`*:changed`, `order:paid`);
 - нужно показать/закрыть модалку.

### Потоки данных
 - Представления - Презентер: клики/ввод в компонентах (через переданные в конструктор колбэки).
 - Презентер - Модели: операции с данными (`addProduct`, `setProduct`, `setData` и т.п.).
 - Модели - Презентер: события об изменении состояния.
 - Презентер - Представления: рендер/обновление DOM компонентами (через их методы).

### Инициализация (жизненный цикл)
1. Создать брокер событий EventEmitter (используется моделями).
2. Создать Api/ShopApi, модели: Catalog, Cart, Buyer.
3. Создать View: Modal, HeaderView, CatalogView, BasketView, шаблонные карточки/формы/успешный экран.
4. Подписаться на события моделей и настроить обработчики UI.
5. Загрузить каталог с сервера и передать в Catalog.setProducts.

### Карта событий - действий презентера (коротко)
| Источник | Событие / Колбэк |	Действие презентера |
|----------|------------------|---------------------|
| Модель `Catalog` |	`catalog:changed` |	Сформировать список `CatalogCard` и отдать в `CatalogView.renderList` |
| Модель `Catalog` |	`viewer:changed` |	Открыть модалку с `PreviewCard` (или закрыть, если `null`) |
| Модель `Cart` |	`basket:changed` |	Обновить `HeaderView.setBadge`, `BasketView.setItems`/`setTotal`/`setEmpty` |
| Модель `Buyer` |	`buyer:changed` |	Ничего не рендерим сразу; состояние используется на шагах оформления |
| Представление `HeaderView` |	`onOpenBasket` |	Открыть модалку с `BasketView` |
| Представление `CatalogCard` |	`onSelect(id)` |	`Catalog.setProduct(productById)` |
| Представление `PreviewCard` |	`onAdd(id)` |	Добавить в корзину, закрыть модалку |
| Представление `PreviewCard` |	`onRemove(id)` |	Удалить из корзины, закрыть модалку |
| Представление `BasketItem` |	`onRemove(id)` |	Удалить позицию из корзины |
| Представление `BasketView` |	`onCheckout()` |	Открыть модалку со шагом 1 (`PaymentDeliveryForm`) |
| Представление `PaymentDeliveryForm` |	`onChange(state)` |	Валидировать, включать/выключать «Далее» |
| Представление `PaymentDeliveryForm` |	`onSubmit(fullState)` |	Сохранить в `Buyer`, открыть форму контактов (`ContactsForm`) |
| Представление `ContactsForm` |	`onChange(state)` |	Валидировать, включать/выключать «Оплатить» |
| Представление `ContactsForm` |	`onSubmit(fullState)` |	Отправить заказ через `ShopApi.createOrder`, очистить корзину/покупателя, показать `OrderSuccessView` |
| Представление `OrderSuccessView` |	`onClose()` |	Закрыть модалку |

### Хелперы рендера (что делает презентер)
 - `renderCatalog()` - формирует `CatalogCard[]` и передаёт в `CatalogView.renderList`
 - `openPreview(product)` - собирает `PreviewCard` по шаблону, ставит тексты/состояние кнопки, открывает модалку
 - `openBasket()` - рендерит `BasketView` из текущего состояния корзины и открывает модалку
 - `openStep1()` - создаёт `PaymentDeliveryForm`, подставляет имеющиеся данные, открывает модалку
 - `openStep2()` - создаёт `ContactsForm`, подставляет данные, открывает модалку
 - `showSuccess(amount)` - рендерит `OrderSuccessView` с «Списано N синапсов»