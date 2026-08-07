import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, Mail, MessageCircleQuestion } from 'lucide-react-native';
import { useAppNavigation } from '../../navigation/useAppNavigation';

const FAQS = [
  { q: 'How do I track my order?', a: 'Open Orders, tap the order, then "Track order" to see live status and rider location.' },
  { q: 'What areas does ChiruDeli deliver to?', a: 'We currently deliver across Chirundu Town, the Border Area and nearby Farm Areas. More towns are coming soon.' },
  { q: 'How do I cancel an order?', a: 'You can cancel from Order Details as long as the business hasn’t started preparing it yet.' },
  { q: 'What payment methods are accepted?', a: 'Cash on Delivery is fully supported today. Mobile Money and Card are being finalized.' },
];

export function HelpSupportScreen() {
  const navigation = useAppNavigation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={24} color="#1F2328" />
        </Pressable>
        <Text className="font-heading text-xl text-neutral-900">Help & Support</Text>
      </View>

      <ScrollView className="px-4">
        <View className="mb-6 flex-row gap-3">
          <Pressable
            onPress={() => Linking.openURL('tel:+260970000000')}
            className="flex-1 items-center gap-2 rounded-lg bg-white p-4"
          >
            <Phone size={20} color="#0E6E4E" />
            <Text className="font-body-semibold text-xs text-neutral-900">Call us</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@chirudeli.zm')}
            className="flex-1 items-center gap-2 rounded-lg bg-white p-4"
          >
            <Mail size={20} color="#0E6E4E" />
            <Text className="font-body-semibold text-xs text-neutral-900">Email us</Text>
          </Pressable>
        </View>

        <View className="mb-2 flex-row items-center gap-2">
          <MessageCircleQuestion size={18} color="#1F2328" />
          <Text className="font-heading text-base text-neutral-900">Frequently asked questions</Text>
        </View>
        {FAQS.map((faq) => (
          <View key={faq.q} className="mb-3 gap-1 rounded-lg bg-white p-4">
            <Text className="font-body-semibold text-sm text-neutral-900">{faq.q}</Text>
            <Text className="font-body text-xs text-neutral-500">{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
