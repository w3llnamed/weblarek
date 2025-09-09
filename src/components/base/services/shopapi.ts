import type {
  IApi,
  IProduct,
  IProductsResponse,
  IOrderRequest,
  IOrderResponse
} from '../../../types';

export class ShopApi {
  constructor(private readonly api: IApi) {}

  public async getProducts(): Promise<IProduct[]> {
    const res = await this.api.get<IProductsResponse>('/product/');
    return res.items;
  }

  public async createOrder(data: IOrderRequest): Promise<IOrderResponse> {
    return this.api.post<IOrderResponse>('/order', data);
  }
}
