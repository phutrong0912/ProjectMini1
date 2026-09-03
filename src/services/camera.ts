import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuditPhoto } from '../types/audit';

export async function capturePhoto(): Promise<AuditPhoto> {
  const photoId = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = Date.now();

  try {
    // Attempt Capacitor Native Camera
    const image = await Camera.getPhoto({
      quality: 75,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      promptLabelHeader: 'Chụp ảnh bằng chứng thiết bị VKU',
      promptLabelPhoto: 'Chọn từ thư viện',
      promptLabelPicture: 'Chụp ảnh mới',
    });

    if (image && image.dataUrl) {
      return {
        id: photoId,
        dataUrl: image.dataUrl,
        timestamp,
      };
    }
  } catch (err: any) {
    console.warn('[Camera] Native camera unavailable or dismissed, attempting web fallback:', err?.message);
  }

  // Web fallback: Trigger file input with camera capture
  return new Promise<AuditPhoto>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No photo selected'));
        return;
      }

      try {
        const compressedDataUrl = await compressImageFile(file, 1024, 0.75);
        resolve({
          id: photoId,
          dataUrl: compressedDataUrl,
          timestamp,
          label: file.name,
        });
      } catch (e) {
        reject(e);
      }
    };

    input.onerror = (e) => reject(e);
    input.click();
  });
}

/**
 * Compresses an image File to a web-friendly Base64 Data URL to conserve IndexedDB space
 */
export function compressImageFile(file: File, maxDimension = 1024, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
