// 커스텀 훅(로그인 상태를 꺼내 쓴다.)
// const{ user, isLoggedIn, login, logout } = useAuth();
import { createContext, useContext } from "react";

const AuthContext = createContext(null);

function useAuth() {
    return useContext(AuthContext);
}

export { AuthContext, useAuth };