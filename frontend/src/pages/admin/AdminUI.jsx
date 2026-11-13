// 관리자 화면 공통 부품: 탭, 검색창, 목록 상태 줄, 페이지 번호

// 상태 탭 (전체 / 정상 / 정지 등)
export function AdminTabs({ tabs, value, onChange }) {
  return (
    <div className="admin-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={
            value === tab.value
              ? "admin-tabs__item admin-tabs__item--active"
              : "admin-tabs__item"
          }
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// 검색창 (Enter 또는 돋보기 버튼으로 검색)
export function AdminSearch({ value, onChange, onSubmit, placeholder }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="admin-search" role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        className="admin-search__input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
      />
      <button type="submit" className="admin-search__button" aria-label="검색">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="admin-search__icon"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </button>
    </form>
  );
}

// 표 안의 불러오는 중 / 오류 / 빈 목록 줄
export function AdminTableState({
  loading,
  error,
  empty,
  colSpan,
  emptyText,
  onRetry,
}) {
  if (loading) {
    return (
      <tr>
        <td colSpan={colSpan} className="admin-table__state" role="status">
          목록을 불러오는 중입니다.
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr>
        <td colSpan={colSpan} className="admin-table__state" role="alert">
          {error}
          <button
            type="button"
            className="admin-button admin-table__retry"
            onClick={onRetry}
          >
            다시 시도
          </button>
        </td>
      </tr>
    );
  }

  if (empty) {
    return (
      <tr>
        <td colSpan={colSpan} className="admin-table__state">
          {emptyText}
        </td>
      </tr>
    );
  }

  return null;
}

// 페이지 번호 (현재 페이지 주변 5개)
const PAGE_WINDOW = 5;

export function AdminPagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const start = Math.max(
    1,
    Math.min(page - Math.floor(PAGE_WINDOW / 2), totalPages - PAGE_WINDOW + 1),
  );
  const end = Math.min(totalPages, start + PAGE_WINDOW - 1);
  const pages = [];
  for (let number = start; number <= end; number += 1) {
    pages.push(number);
  }

  return (
    <nav className="admin-pagination" aria-label="페이지">
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          className={
            number === page
              ? "admin-pagination__item admin-pagination__item--active"
              : "admin-pagination__item"
          }
          aria-current={number === page ? "page" : undefined}
          onClick={() => onChange(number)}
        >
          {number}
        </button>
      ))}
    </nav>
  );
}
