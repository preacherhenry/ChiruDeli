import type {
  AuthResponse,
  LoginInput,
  RegisterCustomerInput,
  RequestOtpInput,
  VerifyOtpInput,
  SessionUser,
  BusinessSummary,
  BusinessDetail,
  Product,
  MasterOrder,
  MasterOrderSummary,
  CreateOrderInput,
  PreviewOrderInput,
  OrderPreview,
  CancelOrderInput,
  SubmitReviewInput,
  SubmitRiderReviewInput,
  Review,
  Notification,
  PromoValidationResult,
  Address,
  CreateAddressInput,
  StoreClass,
  CreateStoreClassInput,
  UpdateStoreClassInput,
  RegisterStoreInput,
  RegisterStoreResult,
  MyStore,
  UpdateStoreProfileInput,
  OpeningHours,
  ManagerDashboardStats,
  StoreDocument,
  UploadStoreDocumentInput,
  AdminBusinessListItem,
  AdminBusinessDetail,
  RejectStoreInput,
  RequestStoreChangesInput,
  SuspendStoreInput,
  AdminUpdateStoreInput,
  ReviewStoreDocumentInput,
  AdminStoreManagerListItem,
  AdminStoreManagerDetail,
  ReassignStoreManagerInput,
  ResetStoreManagerPasswordResult,
  ProductCategory,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  UpsertProductInput,
  ManagerOrder,
  RejectStoreOrderInput,
  AdvanceStoreOrderInput,
  PlatformStats,
  ManagerReview,
} from '@chirudeli/shared-types';
import { ApiError } from './error';
import type { TokenStorage } from './storage';
import { InMemoryTokenStorage } from './storage';

export interface ApiClientOptions {
  baseUrl: string;
  tokenStorage?: TokenStorage;
  /** Web apps rely on httpOnly cookies instead of bearer tokens. */
  useCookies?: boolean;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  skipAuthRefresh?: boolean;
};

export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Thin typed fetch wrapper shared by all four frontends. Handles auth header
 * injection, one automatic refresh-and-retry on 401, and normalizes every
 * failure into ApiError so screens can branch on `.status`/`.code` instead
 * of parsing response bodies themselves.
 */
export class ApiClient {
  private baseUrl: string;
  private tokenStorage: TokenStorage;
  private useCookies: boolean;
  private refreshPromise: Promise<void> | null = null;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.tokenStorage = options.tokenStorage ?? new InMemoryTokenStorage();
    this.useCookies = options.useCookies ?? false;
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(this.baseUrl + path);
    if (opts.query) {
      for (const [key, value] of Object.entries(opts.query)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {};
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (!this.useCookies) {
      const token = await this.tokenStorage.getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        method: opts.method ?? 'GET',
        headers,
        credentials: this.useCookies ? 'include' : 'omit',
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
    } catch {
      throw new ApiError('Network request failed. Check your connection.', 0, 'NETWORK_ERROR');
    }

    if (response.status === 401 && !opts.skipAuthRefresh) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(path, { ...opts, skipAuthRefresh: true });
    }

    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      code?: string;
      details?: unknown;
    } | null;

    if (!response.ok) {
      throw new ApiError(
        payload?.message ?? 'Something went wrong. Please try again.',
        response.status,
        payload?.code ?? 'UNKNOWN_ERROR',
        payload?.details,
      );
    }

    return payload as T;
  }

  private async tryRefresh(): Promise<boolean> {
    if (!this.refreshPromise) {
      this.refreshPromise = (async () => {
        const refreshToken = await this.tokenStorage.getRefreshToken();
        if (!refreshToken && !this.useCookies) return;
        try {
          const res = await this.request<AuthResponse>('/auth/refresh', {
            method: 'POST',
            body: this.useCookies ? undefined : { refreshToken },
            skipAuthRefresh: true,
          });
          await this.tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken);
        } catch {
          await this.tokenStorage.clearTokens();
        }
      })();
    }
    await this.refreshPromise;
    this.refreshPromise = null;
    return Boolean(await this.tokenStorage.getAccessToken()) || this.useCookies;
  }

  async getAccessToken() {
    return this.tokenStorage.getAccessToken();
  }

  auth = {
    registerCustomer: (input: RegisterCustomerInput) =>
      this.request<AuthResponse>('/auth/customer/register', { method: 'POST', body: input }),
    login: (input: LoginInput) =>
      this.request<AuthResponse>('/auth/customer/login', { method: 'POST', body: input }),
    loginBusiness: (input: LoginInput) =>
      this.request<AuthResponse>('/auth/business/login', { method: 'POST', body: input }),
    loginRider: (input: LoginInput) =>
      this.request<AuthResponse>('/auth/rider/login', { method: 'POST', body: input }),
    loginAdmin: (input: LoginInput) =>
      this.request<AuthResponse>('/auth/admin/login', { method: 'POST', body: input }),
    requestOtp: (input: RequestOtpInput) =>
      this.request<{ sent: true; devCode?: string }>('/auth/customer/otp/request', {
        method: 'POST',
        body: input,
      }),
    verifyOtp: (input: VerifyOtpInput) =>
      this.request<AuthResponse>('/auth/customer/otp/verify', { method: 'POST', body: input }),
    logout: async () => {
      await this.request<void>('/auth/logout', { method: 'POST' });
      await this.tokenStorage.clearTokens();
    },
    me: () => this.request<SessionUser>('/auth/me'),
    persistSession: (res: AuthResponse) =>
      this.tokenStorage.setTokens(res.tokens.accessToken, res.tokens.refreshToken),
  };

  businesses = {
    list: (params: { category?: string; search?: string; lat?: number; lng?: number }) =>
      this.request<BusinessSummary[]>('/businesses', { query: params }),
    get: (id: string, coords?: { lat?: number; lng?: number }) =>
      this.request<BusinessDetail>(`/businesses/${id}`, { query: coords }),
    products: (id: string) => this.request<Product[]>(`/businesses/${id}/products`),
  };

  addresses = {
    list: () => this.request<Address[]>('/addresses'),
    create: (input: CreateAddressInput) =>
      this.request<Address>('/addresses', { method: 'POST', body: input }),
  };

  orders = {
    create: (input: CreateOrderInput) =>
      this.request<MasterOrder>('/orders', { method: 'POST', body: input }),
    preview: (input: PreviewOrderInput) =>
      this.request<OrderPreview>('/orders/preview', { method: 'POST', body: input }),
    get: (id: string) => this.request<MasterOrder>(`/orders/${id}`),
    list: () => this.request<MasterOrderSummary[]>('/orders'),
    cancel: (id: string, input: CancelOrderInput) =>
      this.request<MasterOrder>(`/orders/${id}/cancel`, { method: 'POST', body: input }),
    riderReview: (id: string, input: SubmitRiderReviewInput) =>
      this.request<MasterOrder>(`/orders/${id}/rider-review`, { method: 'POST', body: input }),
  };

  storeOrders = {
    review: (id: string, input: SubmitReviewInput) =>
      this.request<Review>(`/store-orders/${id}/review`, { method: 'POST', body: input }),
  };

  notifications = {
    list: () => this.request<Notification[]>('/notifications'),
    markRead: (id: string) =>
      this.request<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  };

  promotions = {
    validate: (code: string, subtotal: number, businessIds: string[] = []) =>
      this.request<PromoValidationResult>('/promotions/validate', {
        method: 'POST',
        body: { code, subtotal, businessIds },
      }),
  };

  storeClasses = {
    list: () => this.request<StoreClass[]>('/store-classes'),
  };

  stores = {
    register: (input: RegisterStoreInput) =>
      this.request<RegisterStoreResult>('/stores/register', { method: 'POST', body: input }),
  };

  manager = {
    getStore: () => this.request<MyStore>('/manager/store'),
    updateProfile: (input: UpdateStoreProfileInput) =>
      this.request<MyStore>('/manager/store/profile', { method: 'PATCH', body: input }),
    updateHours: (input: OpeningHours) =>
      this.request<MyStore>('/manager/store/hours', { method: 'PATCH', body: input }),
    setOpenStatus: (storeState: 'OPEN' | 'PAUSED') =>
      this.request<MyStore>('/manager/store/open-status', { method: 'PATCH', body: { storeState } }),
    activate: () => this.request<MyStore>('/manager/store/activate', { method: 'POST' }),
    dashboard: () => this.request<ManagerDashboardStats>('/manager/dashboard'),
    reviews: () => this.request<ManagerReview[]>('/manager/store/reviews'),
    uploadDocument: (input: UploadStoreDocumentInput) =>
      this.request<StoreDocument>('/manager/store/documents', { method: 'POST', body: input }),

    productCategories: {
      list: () => this.request<ProductCategory[]>('/manager/product-categories'),
      create: (input: CreateProductCategoryInput) =>
        this.request<ProductCategory>('/manager/product-categories', { method: 'POST', body: input }),
      update: (id: string, input: UpdateProductCategoryInput) =>
        this.request<ProductCategory>(`/manager/product-categories/${id}`, { method: 'PATCH', body: input }),
      delete: (id: string) => this.request<void>(`/manager/product-categories/${id}`, { method: 'DELETE' }),
    },

    products: {
      list: () => this.request<Product[]>('/manager/products'),
      create: (input: UpsertProductInput) => this.request<Product>('/manager/products', { method: 'POST', body: input }),
      update: (id: string, input: UpsertProductInput) =>
        this.request<Product>(`/manager/products/${id}`, { method: 'PATCH', body: input }),
      delete: (id: string) => this.request<void>(`/manager/products/${id}`, { method: 'DELETE' }),
    },

    orders: {
      list: () => this.request<ManagerOrder[]>('/manager/orders'),
      get: (id: string) => this.request<ManagerOrder>(`/manager/orders/${id}`),
      reject: (id: string, input: RejectStoreOrderInput) =>
        this.request<ManagerOrder>(`/manager/orders/${id}/reject`, { method: 'POST', body: input }),
      advance: (id: string, input: AdvanceStoreOrderInput) =>
        this.request<ManagerOrder>(`/manager/orders/${id}/advance`, { method: 'POST', body: input }),
    },
  };

  admin = {
    stats: () => this.request<PlatformStats>('/admin/stats'),

    storeClasses: {
      list: () => this.request<StoreClass[]>('/admin/store-classes'),
      create: (input: CreateStoreClassInput) =>
        this.request<StoreClass>('/admin/store-classes', { method: 'POST', body: input }),
      update: (id: string, input: UpdateStoreClassInput) =>
        this.request<StoreClass>(`/admin/store-classes/${id}`, { method: 'PATCH', body: input }),
      delete: (id: string) => this.request<void>(`/admin/store-classes/${id}`, { method: 'DELETE' }),
    },

    stores: {
      list: (filters: { status?: string; storeClassId?: string; search?: string } = {}) =>
        this.request<AdminBusinessListItem[]>('/admin/stores', { query: filters }),
      get: (id: string) => this.request<AdminBusinessDetail>(`/admin/stores/${id}`),
      update: (id: string, input: AdminUpdateStoreInput) =>
        this.request<AdminBusinessDetail>(`/admin/stores/${id}`, { method: 'PATCH', body: input }),
      approve: (id: string) => this.request<AdminBusinessDetail>(`/admin/stores/${id}/approve`, { method: 'POST' }),
      reject: (id: string, input: RejectStoreInput) =>
        this.request<AdminBusinessDetail>(`/admin/stores/${id}/reject`, { method: 'POST', body: input }),
      requestChanges: (id: string, input: RequestStoreChangesInput) =>
        this.request<AdminBusinessDetail>(`/admin/stores/${id}/request-changes`, { method: 'POST', body: input }),
      suspend: (id: string, input: SuspendStoreInput) =>
        this.request<AdminBusinessDetail>(`/admin/stores/${id}/suspend`, { method: 'POST', body: input }),
      reactivate: (id: string) => this.request<AdminBusinessDetail>(`/admin/stores/${id}/reactivate`, { method: 'POST' }),
      deactivate: (id: string) => this.request<AdminBusinessDetail>(`/admin/stores/${id}/deactivate`, { method: 'POST' }),
      reviewDocument: (id: string, docId: string, input: ReviewStoreDocumentInput) =>
        this.request<StoreDocument>(`/admin/stores/${id}/documents/${docId}/review`, { method: 'POST', body: input }),
    },

    storeManagers: {
      list: () => this.request<AdminStoreManagerListItem[]>('/admin/store-managers'),
      get: (id: string) => this.request<AdminStoreManagerDetail>(`/admin/store-managers/${id}`),
      suspend: (id: string) => this.request<AdminStoreManagerDetail>(`/admin/store-managers/${id}/suspend`, { method: 'POST' }),
      reactivate: (id: string) =>
        this.request<AdminStoreManagerDetail>(`/admin/store-managers/${id}/reactivate`, { method: 'POST' }),
      resetPassword: (id: string) =>
        this.request<ResetStoreManagerPasswordResult>(`/admin/store-managers/${id}/reset-password`, { method: 'POST' }),
      reassign: (id: string, input: ReassignStoreManagerInput) =>
        this.request<AdminStoreManagerDetail>(`/admin/store-managers/${id}/reassign`, { method: 'POST', body: input }),
    },

    masterOrders: {
      list: () => this.request<MasterOrderSummary[]>('/admin/master-orders'),
      get: (id: string) => this.request<MasterOrder>(`/admin/master-orders/${id}`),
    },
  };
}
