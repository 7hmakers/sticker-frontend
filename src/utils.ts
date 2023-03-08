export const fileToBuffer = (file: File) => {
  return new Promise<string | ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target!.result!);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const MIME_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const base64ToFile = (base64: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const ext = MIME_MAP[mime as keyof typeof MIME_MAP];
  return new File([u8arr], `uploadImage.${ext}`, { type: mime });
};
