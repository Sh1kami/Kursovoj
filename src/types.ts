export interface Category {
  id: number;
  name: string;
  itemCount: number;
}

export interface Item {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  description: string;
  location: string;
  photoName: string | null;
  createdAt: string;
}

export interface ItemInput {
  name: string;
  categoryId: number | null;
  description: string;
  location: string;
}

export interface Snapshot {
  categories: Category[];
  items: Item[];
}
