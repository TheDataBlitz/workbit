jest.mock('react-native-mmkv', () => {
  const stores = new Map();

  const createStore = () => {
    const map = new Map();
    return {
      getString: (k) => (map.has(k) ? map.get(k) : undefined),
      set: (k, v) => {
        map.set(k, v);
      },
      remove: (k) => map.delete(k),
      contains: (k) => map.has(k),
      getAllKeys: () => [...map.keys()],
      clearAll: () => map.clear(),
    };
  };

  return {
    createMMKV: () => {
      const id = `mock-${stores.size}`;
      const store = createStore();
      stores.set(id, store);
      return store;
    },
  };
});
