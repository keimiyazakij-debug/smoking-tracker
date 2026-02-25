const FILE_PICK_CANCELLED = '__FILE_PICK_CANCELLED__';

export function exportTextFile(filename: string, text: string): Promise<void> {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  return Promise.resolve();
}

export function importTextFile(accept: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.display = 'none';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error(FILE_PICK_CANCELLED));
        return;
      }
      try {
        resolve(await file.text());
      } catch (error) {
        reject(error);
      }
    };

    input.oncancel = () => {
      reject(new Error(FILE_PICK_CANCELLED));
    };

    input.click();
  });
}

export function isFilePickCancelled(error: unknown): boolean {
  return error instanceof Error && error.message === FILE_PICK_CANCELLED;
}
