// Simple pagination helpers (not heavily used yet)

export function paginate(list, pageSize, pageIndex) {
  const start = pageIndex * pageSize;
  return list.slice(start, start + pageSize);
}