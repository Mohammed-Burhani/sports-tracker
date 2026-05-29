import { Platform, ToastAndroid, Alert } from "react-native";

export const showToast = (message: string, duration: "short" | "long" = "short") => {
  if (Platform.OS === "android") {
    ToastAndroid.show(
      message,
      duration === "short" ? ToastAndroid.SHORT : ToastAndroid.LONG
    );
  } else {
    // For iOS, use Alert as a fallback
    Alert.alert("", message, [{ text: "OK" }]);
  }
};

export const showErrorToast = (message: string) => {
  showToast(message, "long");
};

export const showSuccessToast = (message: string) => {
  showToast(message, "short");
};
