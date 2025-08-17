export type PhotoItem = {
  id: string;
  filename: string;
  url: string; // URL statique /uploads/...
  caption?: string;
  uploader?: string;
  createdAt: number;
};
