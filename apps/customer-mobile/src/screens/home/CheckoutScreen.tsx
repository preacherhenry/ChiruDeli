import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Check, Banknote, Smartphone, CreditCard, Plus } from 'lucide-react-native';
import {
  useAddresses,
  useCreateAddress,
  useBusiness,
  useCreateOrder,
  useValidatePromo,
  generateIdempotencyKey,
  ApiError,
} from '@chirudeli/api-client';
import type { PaymentMethod } from '@chirudeli/shared-types';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { useLocationStore } from '../../state/locationStore';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import { formatK } from '../../lib/money';
import { ESTIMATED_SERVICE_FEE } from '../../lib/constants';

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string; icon: typeof Banknote; available: boolean }> = [
  { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', icon: Banknote, available: true },
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, available: true },
  { value: 'CARD', label: 'Card payment', icon: CreditCard, available: true },
];

export function CheckoutScreen() {
  const navigation = useAppNavigation();
  const { businessId, businessName, items, subtotal, clearCart } = useCartStore();
  const { coords } = useLocationStore();
  const addresses = useAddresses();
  const createAddress = useCreateAddress();
  const business = useBusiness(businessId ?? undefined, { lat: coords?.latitude, lng: coords?.longitude });
  const createOrder = useCreateOrder();
  const validatePromo = useValidatePromo();

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number; freeDelivery: boolean } | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressLine1, setNewAddressLine1] = useState('');
  const [newAddressArea, setNewAddressArea] = useState('Chirundu Town');

  // Generated once per checkout visit and reused on retry so a double-tap
  // (or a retried request after a dropped connection) can never create two
  // orders — the server enforces this with a unique constraint.
  const idempotencyKey = useRef(generateIdempotencyKey());

  const activeAddress = addresses.data?.find((a) => a.id === selectedAddressId) ?? addresses.data?.find((a) => a.isDefault) ?? addresses.data?.[0];
  const effectiveAddressId = selectedAddressId ?? activeAddress?.id ?? null;

  const sub = subtotal();
  const deliveryFee = business.data?.deliveryFee ?? 0;
  const discount = appliedPromo?.freeDelivery ? deliveryFee : (appliedPromo?.discountAmount ?? 0);
  const total = Math.max(0, sub + deliveryFee + ESTIMATED_SERVICE_FEE - discount);

  const onApplyPromo = () => {
    if (!promoCode.trim()) return;
    validatePromo.mutate(
      { code: promoCode.trim(), subtotal: sub, businessId: businessId ?? undefined },
      {
        onSuccess: (res) => {
          if (res.valid) {
            setAppliedPromo({ code: res.code, discountAmount: res.discountAmount ?? 0, freeDelivery: Boolean(res.freeDelivery) });
          } else {
            setAppliedPromo(null);
          }
          setPromoMessage(res.message);
        },
        onError: () => setPromoMessage('Could not validate this code right now.'),
      },
    );
  };

  const onAddAddress = () => {
    if (!newAddressLine1.trim() || !coords) return;
    createAddress.mutate(
      {
        label: newAddressLabel,
        line1: newAddressLine1,
        area: newAddressArea,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isDefault: (addresses.data?.length ?? 0) === 0,
      },
      {
        onSuccess: (address) => {
          setSelectedAddressId(address.id);
          setAddingAddress(false);
          setNewAddressLine1('');
        },
      },
    );
  };

  const onPlaceOrder = () => {
    if (!businessId || !effectiveAddressId) {
      Alert.alert('Missing information', 'Please select a delivery address first.');
      return;
    }

    if (paymentMethod === 'MOBILE_MONEY' || paymentMethod === 'CARD') {
      navigation.navigate('Payment', {
        businessId,
        addressId: effectiveAddressId,
        deliveryInstructions: instructions || undefined,
        paymentMethod,
        promoCode: appliedPromo?.code,
        idempotencyKey: idempotencyKey.current,
        total,
      });
      return;
    }

    createOrder.mutate(
      {
        idempotencyKey: idempotencyKey.current,
        businessId,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          addOnIds: i.addOnIds,
          specialInstructions: i.specialInstructions,
        })),
        addressId: effectiveAddressId,
        deliveryInstructions: instructions || undefined,
        paymentMethod,
        promoCode: appliedPromo?.code,
      },
      {
        onSuccess: (order) => {
          clearCart();
          navigation.replace('OrderConfirmation', { orderId: order.id });
        },
        onError: (err) => {
          const message = err instanceof ApiError ? err.message : 'Could not place your order. Please try again.';
          Alert.alert('Order failed', message);
        },
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="mb-2 font-heading text-base text-neutral-900">Delivery address</Text>
        {addresses.isLoading ? (
          <LoadingState label="Loading addresses..." />
        ) : (
          <View className="mb-2 gap-2">
            {(addresses.data ?? []).map((address) => {
              const selected = address.id === effectiveAddressId;
              return (
                <Pressable
                  key={address.id}
                  onPress={() => setSelectedAddressId(address.id)}
                  className={`flex-row items-center gap-3 rounded-lg border p-3 ${selected ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white'}`}
                >
                  <MapPin size={18} color={selected ? '#0E6E4E' : '#767B72'} />
                  <View className="flex-1">
                    <Text className="font-body-semibold text-sm text-neutral-900">{address.label}</Text>
                    <Text className="font-body text-xs text-neutral-500">
                      {address.line1}, {address.area}
                    </Text>
                  </View>
                  {selected ? <Check size={18} color="#0E6E4E" /> : null}
                </Pressable>
              );
            })}
          </View>
        )}

        {addingAddress ? (
          <View className="mb-4 gap-2 rounded-lg border border-neutral-200 bg-white p-3">
            <TextInput
              value={newAddressLabel}
              onChangeText={setNewAddressLabel}
              placeholder="Label (e.g. Home)"
              className="font-body text-sm text-neutral-900"
            />
            <TextInput
              value={newAddressLine1}
              onChangeText={setNewAddressLine1}
              placeholder="Street / plot number"
              className="border-t border-neutral-100 pt-2 font-body text-sm text-neutral-900"
            />
            <TextInput
              value={newAddressArea}
              onChangeText={setNewAddressArea}
              placeholder="Area (e.g. Chirundu Town)"
              className="border-t border-neutral-100 pt-2 font-body text-sm text-neutral-900"
            />
            <View className="flex-row gap-2 pt-2">
              <View className="flex-1">
                <Button label="Cancel" variant="ghost" onPress={() => setAddingAddress(false)} />
              </View>
              <View className="flex-1">
                <Button label="Save address" onPress={onAddAddress} loading={createAddress.isPending} />
              </View>
            </View>
          </View>
        ) : (
          <Pressable onPress={() => setAddingAddress(true)} className="mb-4 flex-row items-center gap-2 py-1">
            <Plus size={16} color="#0E6E4E" />
            <Text className="font-body-medium text-sm text-primary-600">Add new address</Text>
          </Pressable>
        )}

        <Text className="mb-2 font-heading text-base text-neutral-900">Delivery instructions</Text>
        <TextInput
          value={instructions}
          onChangeText={setInstructions}
          placeholder='e.g. "Call me when you arrive."'
          multiline
          className="mb-4 min-h-[64px] rounded-lg border border-neutral-200 bg-white p-3 font-body text-sm text-neutral-900"
        />

        <Text className="mb-2 font-heading text-base text-neutral-900">Payment method</Text>
        <View className="mb-4 gap-2">
          {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => {
            const selected = paymentMethod === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPaymentMethod(value)}
                className={`flex-row items-center gap-3 rounded-lg border p-3 ${selected ? 'border-primary-600 bg-primary-50' : 'border-neutral-200 bg-white'}`}
              >
                <Icon size={18} color={selected ? '#0E6E4E' : '#767B72'} />
                <Text className="flex-1 font-body text-sm text-neutral-900">{label}</Text>
                {selected ? <Check size={18} color="#0E6E4E" /> : null}
              </Pressable>
            );
          })}
        </View>

        <Text className="mb-2 font-heading text-base text-neutral-900">Promo code</Text>
        <View className="mb-2 flex-row gap-2">
          <TextInput
            value={promoCode}
            onChangeText={setPromoCode}
            placeholder="e.g. CHIRU10"
            autoCapitalize="characters"
            className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-3 font-body text-sm text-neutral-900"
          />
          <Pressable onPress={onApplyPromo} className="items-center justify-center rounded-lg bg-neutral-900 px-4">
            <Text className="font-body-semibold text-sm text-white">Apply</Text>
          </Pressable>
        </View>
        {promoMessage ? (
          <Text className={`mb-4 font-body text-xs ${appliedPromo ? 'text-primary-700' : 'text-error'}`}>
            {promoMessage}
          </Text>
        ) : null}

        <View className="mb-6 gap-2 rounded-lg bg-white p-4">
          <Text className="mb-1 font-heading text-base text-neutral-900">{businessName}</Text>
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-neutral-500">Subtotal</Text>
            <Text className="font-body text-sm text-neutral-900">{formatK(sub)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-neutral-500">Delivery</Text>
            <Text className="font-body text-sm text-neutral-900">{formatK(deliveryFee)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="font-body text-sm text-neutral-500">Service fee</Text>
            <Text className="font-body text-sm text-neutral-900">{formatK(ESTIMATED_SERVICE_FEE)}</Text>
          </View>
          {discount > 0 ? (
            <View className="flex-row justify-between">
              <Text className="font-body text-sm text-primary-700">Discount</Text>
              <Text className="font-body text-sm text-primary-700">-{formatK(discount)}</Text>
            </View>
          ) : null}
          <View className="flex-row justify-between border-t border-neutral-100 pt-2">
            <Text className="font-heading text-base text-neutral-900">Total</Text>
            <Text className="font-heading text-base text-neutral-900">{formatK(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-neutral-100 px-4 py-3">
        <Button
          label="Place Order"
          onPress={onPlaceOrder}
          loading={createOrder.isPending}
          disabled={!effectiveAddressId}
        />
      </View>
    </SafeAreaView>
  );
}
