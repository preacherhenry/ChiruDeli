import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Minus, Plus, Check } from 'lucide-react-native';
import { useBusiness, useProducts } from '@chirudeli/api-client';
import { useAppNavigation, useAppRoute } from '../../navigation/useAppNavigation';
import { useCartStore } from '../../state/cartStore';
import { Button } from '../../components/Button';
import { LoadingState } from '../../components/LoadingState';
import { formatK } from '../../lib/money';

export function ProductDetailsScreen() {
  const navigation = useAppNavigation();
  const { params } = useAppRoute<'ProductDetails'>();
  const business = useBusiness(params.businessId);
  const products = useProducts(params.businessId);
  const product = products.data?.find((p) => p.id === params.productId);

  const [quantity, setQuantity] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const addItem = useCartStore((s) => s.addItem);
  const replaceCart = useCartStore((s) => s.replaceCart);

  const addOnsTotal = useMemo(() => {
    if (!product) return 0;
    return product.addOns.filter((a) => selectedAddOns.includes(a.id)).reduce((sum, a) => sum + a.priceDelta, 0);
  }, [product, selectedAddOns]);

  const unitPrice = (product?.price ?? 0) + addOnsTotal;
  const total = unitPrice * quantity;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onAddToCart = () => {
    if (!product || !business.data) return;
    const addOnsLabel = product.addOns
      .filter((a) => selectedAddOns.includes(a.id))
      .map((a) => a.name)
      .join(', ');

    const item = {
      productId: product.id,
      name: product.name,
      unitPrice,
      imageUrl: product.imageUrl,
      quantity,
      addOnIds: selectedAddOns,
      addOnsLabel: addOnsLabel || undefined,
      specialInstructions: instructions || undefined,
    };

    const added = addItem(params.businessId, business.data.name, item);
    if (!added) {
      Alert.alert(
        'Start a new cart?',
        `Your cart has items from another business. Adding this item will clear it and start a new order from ${business.data.name}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start new cart',
            style: 'destructive',
            onPress: () => {
              replaceCart(params.businessId, business.data!.name, item);
              navigation.goBack();
            },
          },
        ],
      );
      return;
    }
    navigation.goBack();
  };

  if (products.isLoading || !product) return <LoadingState />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="h-56 w-full bg-neutral-100">
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} className="h-full w-full" resizeMode="cover" />
          ) : null}
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            className="absolute left-4 top-4 h-9 w-9 items-center justify-center rounded-full bg-white/90"
          >
            <ChevronLeft size={22} color="#1F2328" />
          </Pressable>
        </View>

        <View className="gap-3 px-4 pt-4">
          <Text className="font-heading text-2xl text-neutral-900">{product.name}</Text>
          {product.description ? (
            <Text className="font-body text-sm text-neutral-500">{product.description}</Text>
          ) : null}
          <Text className="font-body-semibold text-lg text-primary-700">{formatK(product.price)}</Text>

          <View className="flex-row items-center gap-4 pt-2">
            <Pressable
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 items-center justify-center rounded-full border border-neutral-200"
            >
              <Minus size={18} color="#1F2328" />
            </Pressable>
            <Text className="font-heading text-lg text-neutral-900">{quantity}</Text>
            <Pressable
              onPress={() => setQuantity((q) => q + 1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-primary-600"
            >
              <Plus size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          {product.addOns.length > 0 ? (
            <View className="pt-3">
              <Text className="mb-2 font-heading text-base text-neutral-900">Add-ons</Text>
              {product.addOns.map((addOn) => {
                const selected = selectedAddOns.includes(addOn.id);
                return (
                  <Pressable
                    key={addOn.id}
                    onPress={() => toggleAddOn(addOn.id)}
                    className="mb-2 flex-row items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                  >
                    <Text className="font-body text-sm text-neutral-800">{addOn.name}</Text>
                    <View className="flex-row items-center gap-3">
                      <Text className="font-body text-sm text-neutral-500">
                        +{formatK(addOn.priceDelta)}
                      </Text>
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-md border ${selected ? 'border-primary-600 bg-primary-600' : 'border-neutral-300'}`}
                      >
                        {selected ? <Check size={14} color="#FFFFFF" /> : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <View className="pt-3">
            <Text className="mb-2 font-heading text-base text-neutral-900">Special instructions</Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder='e.g. "No onions"'
              multiline
              className="min-h-[80px] rounded-lg border border-neutral-200 bg-white p-3 font-body text-sm text-neutral-900"
            />
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-neutral-100 px-4 py-3">
        <Button label={`Add to Cart – ${formatK(total)}`} onPress={onAddToCart} disabled={!product.isAvailable} />
      </View>
    </SafeAreaView>
  );
}
