import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  userPin: "@altoque/user-pin",
  showBalance: "@altoque/show-balance",
  transactions: "@altoque/transactions",
  offers: "@altoque/offers",
};

export const storageKeys = STORAGE_KEYS;

export async function getStoredJson(key, fallbackValue = null) {
  try {
    const rawValue = await AsyncStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    console.log("AsyncStorage read error:", key, error.message);
    return fallbackValue;
  }
}

export async function setStoredJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.log("AsyncStorage write error:", key, error.message);
    return false;
  }
}

export async function removeStoredValue(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.log("AsyncStorage remove error:", key, error.message);
    return false;
  }
}
