// 추후 삭제 예정(참고용)
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../api/api-client";
import { setUser } from "../store/user-slice";

const ApiTestPage = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.user.token);
  const [result, setResult] = useState(null);

  const handleGet = async () => {
    try {
      const data = await api.get("/tests");
      console.log("GET /tests", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  const handlePost = async () => {
    try {
      const data = await api.post("/tests", { number: 5 });
      console.log("POST /tests:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  const handlePut = async () => {
    try {
      const data = await api.put("/tests/0", { number: 10 });
      console.log("PUT /tests/0:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      const data = await api.delete("/tests/0");
      console.log("DELETE /tests/0:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  // 로그인 예제
  const handleSignUp = async () => {
    try {
      const data = await api.post("/users", {
        userId: "haeyeon01",
        password: "1234",
        nickname: "Miss Fortune Master",
        gender: "F",
        birthdate: new Date(2003, 1, 1),
      });
      console.log("POST /users:", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  const handleSignIn = async () => {
    try {
      const data = await api.post("/auth/login", {
        userId: "haeyeon01",
        password: "1234",
      });
      console.log("POST /auth/login:", data);
      setResult(data);

      if (data.data) {
        const token = data.data.accessToken;
        const nickname = data.data.nickname;
        const email = data.data.email;
        const role = data.data.role;

        dispatch(setUser({ token, nickname, email, role }));
      }
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  const handleGetWithToken = async () => {
    try {
      const data = await api.get("/tests/token");
      console.log("GET /tests/token", data);
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult(err.message);
    }
  };

  return (
    <div>
      <h1>API TEST PAGE</h1>
      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <button onClick={handleGet}>GET /tests</button>
        <button onClick={handlePost}>POST /tests</button>
        <button onClick={handlePut}>PUT /tests/0</button>
        <button onClick={handleDelete}>DELETE /tests/0</button>
        <button onClick={handleSignUp}>Sign Up</button>
        <button onClick={handleSignIn}>Sign In</button>
        <button onClick={handleGetWithToken}>GET /tests/token</button>
      </div>

      <pre>{JSON.stringify(result, null, 2)}</pre>

      <pre>Access Token: {JSON.stringify(token, null, 2)}</pre>
    </div>
  );
};

export default ApiTestPage;
