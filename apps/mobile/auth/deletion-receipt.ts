import * as SecureStore from 'expo-secure-store';

const DELETION_RECEIPT_KEY = 'partyhause.accountDeletionReceipt';

export async function getDeletionReceipt(): Promise<string | null> {
  return SecureStore.getItemAsync(DELETION_RECEIPT_KEY);
}

export async function saveDeletionReceipt(receipt: string): Promise<void> {
  await SecureStore.setItemAsync(DELETION_RECEIPT_KEY, receipt, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function removeDeletionReceipt(): Promise<void> {
  await SecureStore.deleteItemAsync(DELETION_RECEIPT_KEY);
}
