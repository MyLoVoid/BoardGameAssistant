const store = new Map<string, string>();

export const setItemAsync = async (key: string, value: string) => {
  store.set(key, value);
};

export const getItemAsync = async (key: string) => store.get(key) ?? null;

export const deleteItemAsync = async (key: string) => {
  store.delete(key);
};
