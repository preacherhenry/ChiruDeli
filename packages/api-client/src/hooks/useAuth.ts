import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  LoginInput,
  RegisterCustomerInput,
  RequestOtpInput,
  VerifyOtpInput,
} from '@chirudeli/shared-types';
import { useApiClient } from '../context';

export function useLogin() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => client.auth.login(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useLoginRider() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => client.auth.loginRider(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useLoginBusiness() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => client.auth.loginBusiness(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useLoginAdmin() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => client.auth.loginAdmin(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useRegisterCustomer() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterCustomerInput) => client.auth.registerCustomer(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useRequestOtp() {
  const client = useApiClient();
  return useMutation({ mutationFn: (input: RequestOtpInput) => client.auth.requestOtp(input) });
}

export function useVerifyOtp() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VerifyOtpInput) => client.auth.verifyOtp(input),
    onSuccess: async (res) => {
      await client.auth.persistSession(res);
      qc.invalidateQueries();
    },
  });
}

export function useMe(enabled: boolean) {
  const client = useApiClient();
  return useQuery({ queryKey: ['me'], queryFn: () => client.auth.me(), enabled, retry: false });
}

export function useLogout() {
  const client = useApiClient();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => client.auth.logout(),
    onSuccess: () => qc.clear(),
  });
}
