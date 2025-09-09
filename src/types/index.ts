export type ApiPostMethods = 'POST' | 'PUT' | 'DELETE';

export type TPayment = 'card' | 'cash';

export interface IApi {
    get<T extends object>(uri: string): Promise<T>;
    post<T extends object>(uri: string, data: object, method?: ApiPostMethods): Promise<T>;
}

export interface IProduct {
    id: string;
    title: string;
    image: string;
    category: string;
    price: number | null;
    description: string;
}

export interface IBuyer {
    payment: TPayment;
    address: string;
    email: string;
    phone: string;
}

export interface IProductsResponse {
  total: number;
  items: IProduct[];
}

export interface IOrderRequest extends IBuyer {
  items: string[];
  total: number;     
}

export interface IOrderResponse {
  id: string;
  total: number;
}
