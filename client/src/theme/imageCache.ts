type ImageSize = {
  width: number;
  height: number;
};

const imageSizeCache = new Map<string, ImageSize>();
const circularTextureCache = new Map<string, string>();
const CIRCULAR_TEXTURE_SIZE = 256;

export function getCachedImageSize(imageUrl: string) {
  return imageSizeCache.get(imageUrl) ?? null;
}

export function getCachedCircularTexture(imageUrl: string) {
  return circularTextureCache.get(imageUrl) ?? null;
}

function createCircularTexture(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = CIRCULAR_TEXTURE_SIZE;
  canvas.height = CIRCULAR_TEXTURE_SIZE;

  const context = canvas.getContext('2d');

  if (!context) {
    return image.src;
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const sourceX = (sourceWidth - sourceSize) / 2;
  const sourceY = (sourceHeight - sourceSize) / 2;
  const center = CIRCULAR_TEXTURE_SIZE / 2;

  context.clearRect(0, 0, CIRCULAR_TEXTURE_SIZE, CIRCULAR_TEXTURE_SIZE);
  context.save();
  context.beginPath();
  context.arc(center, center, center - 2, 0, Math.PI * 2);
  context.clip();
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    CIRCULAR_TEXTURE_SIZE,
    CIRCULAR_TEXTURE_SIZE
  );
  context.restore();

  context.lineWidth = 8;
  context.strokeStyle = '#1f2937';
  context.beginPath();
  context.arc(center, center, center - 4, 0, Math.PI * 2);
  context.stroke();

  return canvas.toDataURL('image/png');
}

export function preloadThemeImages(imageUrls: string[]) {
  return Promise.all(
    imageUrls.map(
      (imageUrl) =>
        new Promise<void>((resolve) => {
          if (imageSizeCache.has(imageUrl) && circularTextureCache.has(imageUrl)) {
            resolve();
            return;
          }

          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => {
            imageSizeCache.set(imageUrl, {
              width: image.naturalWidth || image.width,
              height: image.naturalHeight || image.height
            });
            circularTextureCache.set(imageUrl, createCircularTexture(image));
            resolve();
          };
          image.onerror = () => resolve();
          image.src = imageUrl;
        })
    )
  );
}
