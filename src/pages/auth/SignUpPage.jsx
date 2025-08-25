import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Paper,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useLocation } from "react-router-dom";
import useCustomMove from "../../hook/useCustomMove";
import { api } from "../../api/api-client";

export default function SignUpPage() {
  const location = useLocation();
  const oauthData = location.state?.oauthData; // key와 oauthData 포함
  const { moveToSignin } = useCustomMove();
  const theme = useTheme();

  const [form, setForm] = useState({
    userId: "",
    nickname: "",
    password: "",
    confirmPassword: "",
    gender: "",
    birthdate: "",
    email: "",
    provider: "",
  });

  const [errors, setErrors] = useState({});
  const [isOAuth, setIsOAuth] = useState(false);

  useEffect(() => {
    if (oauthData?.email) {
      setIsOAuth(true);
      setForm((prev) => ({
        ...prev,
        email: oauthData.email,
        nickname: oauthData.nickname || "",
        provider: "GOOGLE",
      }));
    }
  }, [oauthData]);

  const validate = (name, value) => {
    let error = "";
    if (name === "userId" && !/^[a-zA-Z0-9]{5,20}$/.test(value))
      error = "아이디는 영문, 숫자 조합 5~20자로 입력해주세요.";
    if (name === "nickname" && !/^[a-zA-Z가-힣]{2,10}$/.test(value))
      error = "닉네임은 한글 또는 영문 2~10자로 입력해주세요.";
    if (
      name === "password" &&
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,20}$/.test(
        value
      )
    )
      error = "비밀번호는 영문, 숫자, 특수문자 포함 8~20자로 입력해주세요.";
    if (name === "confirmPassword" && value !== form.password)
      error = "비밀번호가 일치하지 않습니다.";
    if (name === "gender" && !value) error = "성별을 선택해주세요.";
    if (name === "birthdate" && !/^\d{4}-\d{2}-\d{2}$/.test(value))
      error = "생년월일을 YYYY-MM-DD 형식으로 입력해주세요.";
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleSignUp = async () => {
    const requiredFields = [
      "userId",
      "nickname",
      "password",
      "confirmPassword",
      "gender",
      "birthdate",
    ];
    for (const field of requiredFields) {
      if (!form[field] || form[field].trim() === "") {
        alert("입력값을 확인해주세요.");
        return;
      }
      if (errors[field]) {
        alert(errors[field]);
        return;
      }
    }

    try {
      const { userId, password, nickname, gender, birthdate, email, provider } =
        form;
      const result = await api.post("/users", {
        userId,
        password,
        nickname,
        gender,
        birthdate,
        email: isOAuth ? email : undefined, // ✅ 소셜일때만 전달
        provider: isOAuth ? provider : undefined,
      });

      if (result.status == 400) {
        alert("이미 존재하는 User ID 입니다. 다시 입력해주세요.");
      } else {
        alert("회원가입 성공!");
        moveToSignin();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "회원가입에 실패했습니다.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 1,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          border: "0.5px solid rgba(180, 180, 180, 0.5)",
          boxShadow:
            theme.palette.mode === "light"
              ? "0px 4px 8px rgba(0,0,0,0.4)"
              : undefined,
          padding: 3,
          width: 360,
        }}
      >
        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          회원가입
        </Typography>
        <Box component="form" noValidate>
          {/* ✅ 소셜 로그인일 때만 이메일 입력칸 보임 (무조건 readonly) */}
          {isOAuth && (
            <TextField
              fullWidth
              variant="standard"
              label="이메일 *"
              name="email"
              value={form.email}
              sx={{ mb: 2 }}
              InputProps={{ readOnly: true }}
            />
          )}

          <TextField
            fullWidth
            variant="standard"
            label="닉네임 *"
            name="nickname"
            value={form.nickname}
            onChange={handleChange}
            error={!!errors.nickname}
            helperText={errors.nickname}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            variant="standard"
            label="아이디 *"
            name="userId"
            value={form.userId}
            onChange={handleChange}
            error={!!errors.userId}
            helperText={errors.userId}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            variant="standard"
            label="비밀번호 *"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="password"
            variant="standard"
            label="비밀번호 확인 *"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            variant="standard"
            label="성별 *"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            error={!!errors.gender}
            helperText={errors.gender}
            sx={{ mb: 2 }}
          >
            <MenuItem value="M">남성</MenuItem>
            <MenuItem value="F">여성</MenuItem>
          </TextField>

          <TextField
            fullWidth
            variant="standard"
            label="생년월일 *"
            name="birthdate"
            placeholder="YYYY-MM-DD"
            value={form.birthdate}
            onChange={handleChange}
            error={!!errors.birthdate}
            helperText={errors.birthdate}
            sx={{ mb: 3 }}
          />

          <Button
            type="button"
            fullWidth
            variant="outlined"
            onClick={handleSignUp}
            sx={{ mb: 2 }}
          >
            회원가입
          </Button>
          <Button fullWidth variant="outlined" onClick={moveToSignin}>
            뒤로가기
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
