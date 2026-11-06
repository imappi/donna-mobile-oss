import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNotificationMoment } from './notificationPermission';

export const notificationMoment = createNotificationMoment(AsyncStorage);
