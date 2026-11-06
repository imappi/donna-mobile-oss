import { useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import type { PickedFile } from '@core/capture/upload';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { useCaptureQueue } from './captureQueue';
import { CAPTURE_RETURN_HREF } from './shellNavigation';

const fromImageAsset = (asset: ImagePicker.ImagePickerAsset): PickedFile => ({
  uri: asset.uri,
  filename: asset.fileName ?? `receipt-${Date.now()}.jpg`,
  mimeType: asset.mimeType ?? 'image/jpeg',
  size: asset.fileSize ?? 0,
  source: 'camera'
});

/** The launcher and first-books action share these exact capture paths. */
export const useCaptureActions = () => {
  const captureQueue = useCaptureQueue();
  const router = useRouter();
  const toast = useToast();

  const upload = useCallback(
    async (file: PickedFile) => {
      try {
        const result = await captureQueue.add(file);
        if (result.status === 'queued') toast.show(t('capture.queuedOffline'));
        if (result.status === 'blocked') toast.show(result.error ?? t('common.error_generic'));
        router.navigate(CAPTURE_RETURN_HREF);
      } catch (cause) {
        toast.show(cause instanceof Error ? cause.message : t('common.error_generic'));
      }
    },
    [captureQueue, router, toast]
  );

  const snapReceipt = useCallback(async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show(t('capture.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) await upload(fromImageAsset(result.assets[0]));
  }, [toast, upload]);

  const pickFile = useCallback(async (purpose?: 'prior_records') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf', 'text/csv'],
      copyToCacheDirectory: true
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await upload({
        uri: asset.uri,
        filename: asset.name,
        mimeType: asset.mimeType ?? 'application/pdf',
        size: asset.size ?? 0,
        ...(purpose ? { purpose } : {}),
        source: 'file'
      });
    }
  }, [upload]);

  const addFile = useCallback(() => pickFile(), [pickFile]);
  const addPriorRecords = useCallback(() => pickFile('prior_records'), [pickFile]);
  return { snapReceipt, addFile, addPriorRecords };
};
