export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
}

export type WinnerSortField = 'wins' | 'time';
export type SortOrder = 'ASC' | 'DESC';

export interface WinnersQueryParams {
  page: number;
  limit: number;
  sort?: WinnerSortField;
  order?: SortOrder;
}
