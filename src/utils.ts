export const fileToBlobURL = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(URL.createObjectURL(new Blob([reader.result!])));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
