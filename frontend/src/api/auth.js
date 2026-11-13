// frontend/src/api/auth.js
import client from './client';

// 회원가입
export const signupApi = (data) => client.post('/auth/signup', data);

// 로그인
export const loginApi = (credentials) => client.post('/auth/login', credentials);

// 로그아웃
export const logoutApi = () => client.post('/auth/logout');

// 내 정보 통합 조회 (기본 정보 + 프로필 + 학습 레벨)
export const getMeApi = () => client.get('/users/me');

// 내 학습 점수 및 레벨 상세 조회
export const getMyLevelApi = () => client.get('/users/me/level');

// 내 프로필 및 학습 이력 수정
export const updateProfileApi = (data) => client.put('/users/me', data);

// 타 회원 공개 프로필 상세 조회
export const getMemberProfileApi = (id) => client.get(`/members/${id}`);