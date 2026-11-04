// 로그인 상태(토큰, 사용자 정보)를 앱 전체에 제공
import {useEffect, useState} from "react";
import client from '../../api/client';
import { AuthContext } from "../../hooks/useAuth";

function AuthProvider({children}){
    const [user, setUser] = useState(null);             // 사용자 정보
    const [loading, setLoading] = useState(true);       // 로딩중인지 확인

    // 시작, 새로고침할 때 저장된 토큰이 있으면 내 정보 불러오기
    useEffect(() => {
        const token = localStorage.getItem("token");
        if(!token){
            setLoading(false);
            return;
        }

        client.get("/users/me")
        .then((resp) => {
            setUser(resp.data.data);
        })
        .catch(() => {
            localStorage.removeItem("token");
        })
        .finally(() => {
            setLoading(false);
        });
    },[]);

    // 로그인 성공했을 때 화면에서 호출   
    const login = (token, userInfo) => {
        localStorage.setItem("token", token);
        setUser(userInfo);
    }

    // 로그아웃했을 때 호출
    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const value = {
        user,
        isLoggedIn: user !== null,
        loading,
        login,
        logout,
    };


    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthProvider };