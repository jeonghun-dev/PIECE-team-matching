// 관리자 화면 공통 도구: 목록 상태 훅, 날짜 점수 표시
import { useEffect, useState } from "react";

export const ADMIN_PAGE_SIZE = 10;

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
};

// 점수 표시: 정수면 6점, 소수면 6.5점
export const formatScore = (score) => {
  const value = Number(score);
  if (!Number.isFinite(value)) {
    return "0점";
  }
  return Number.isInteger(value) ? `${value}점` : `${value.toFixed(1)}점`;
};

// 서버 오류 메시지 꺼내기
export const getErrorMessage = (error, fallback) => {
  return error.response?.data?.message || fallback;
};

// 관리자 목록 공통 상태: 탭, 검색어, 페이지, 불러오기
// load는 컴포넌트 밖에 만든 함수를 넘겨야 함 (렌더마다 새로 만들면 계속 다시 불러옴)
export function useAdminList(load, initialTab) {
  const [tab, setTab] = useState(initialTab);
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState({
    items: [],
    totalCount: 0,
    size: ADMIN_PAGE_SIZE,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function fetchList() {
      setLoading(true);
      setError("");

      try {
        const data = await load({ tab, keyword: appliedKeyword, page });
        if (!ignore) {
          setResult(data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            getErrorMessage(requestError, "목록을 불러오지 못했습니다."),
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchList();

    return () => {
      ignore = true;
    };
  }, [load, tab, appliedKeyword, page, reloadKey]);

  // 탭을 바꾸면  1페이지부터
  const changeTab = (nextTab) => {
    setTab(nextTab);
    setPage(1);
  };

  // 검색 버튼 (또는 Enter)을 눌렀을 때만 검색어 적용
  const submitSearch = () => {
    setAppliedKeyword(keyword.trim());
    setPage(1);
  };

  // 정지/삭제 같은 처리 후 현재 페이지에서 다시 불러오기
  const reload = () => {
    setReloadKey((key) => key + 1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(result.totalCount / (result.size || ADMIN_PAGE_SIZE)),
  );

  return {
    tab,
    changeTab,
    keyword,
    setKeyword,
    submitSearch,
    page,
    setPage,
    totalPages,
    items: result.items,
    totalCount: result.totalCount,
    loading,
    error,
    reload,
  };
}
