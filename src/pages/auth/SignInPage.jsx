import { AppProvider } from "@toolpad/core/AppProvider";
import { SignInPage } from "@toolpad/core/SignInPage";
import { useTheme } from "@mui/material/styles";
import { useDispatch } from "react-redux";
import { api } from "../../api/api-client";
import { ko } from "../../locales";
import { setUser } from "../../store/user-slice";
import { useState } from "react";
import { Box, Button, Divider } from "@mui/material";
import useCustomMove from "../../hook/useCustomMove";

const providers = [
  { id: "google", name: "Google" },
  { id: "credentials", name: "아이디" },
];

const CustomSignInPage = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { moveToSignup, moveToNewsList } = useCustomMove();

  const [errors, setErrors] = useState({});

  const validate = (name, value) => {
    let error = "";
    if (!value || value.trim() === "") {
      error =
        name === "username"
          ? "아이디를 입력해주세요."
          : "비밀번호를 입력해주세요.";
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSignIn = async (provider, formData) => {
    const username = formData.get("username")?.trim();
    const password = formData.get("password")?.trim();

    validate("username", username);
    validate("password", password);

    if (errors.username || errors.password) {
      alert("입력값을 확인해주세요.");
      return;
    }

    try {
      const data = await api.post("/auth/login", {
        userId: username,
        password: password,
      });

      if (data.status === 200) {
        const { accessToken, nickname, email, role } = data.data;
        dispatch(setUser({ token: accessToken, nickname, email, role }));
        moveToNewsList();
      } else {
        alert(data.message || "로그인에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <AppProvider
      theme={theme}
      localeText={ko.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 250px)",
          width: "100%",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <SignInPage
            signIn={(provider, formData) => handleSignIn(provider, formData)}
            slotProps={{
              form: { noValidate: true },
              emailField: {
                name: "username",
                type: "text",
                variant: "standard",
                placeholder: "아이디를 입력하세요.",
                onBlur: (e) => validate("username", e.target.value),
                error: Boolean(errors.username),
                helperText: errors.username,
              },
              passwordField: {
                name: "password",
                variant: "standard",
                placeholder: "비밀번호를 입력하세요.",
                type: "password",
                onBlur: (e) => validate("password", e.target.value),
                error: Boolean(errors.password),
                helperText: errors.password,
              },
              submitButton: { variant: "outlined" },
              oAuthButton: { variant: "contained" },
            }}
            providers={providers}
          />
          <Divider sx={{ my: -14 }} />
          <Box sx={{ textAlign: "center", mt: 16 }}>
            <Button
              variant="outlined"
              onClick={() => moveToSignup()}
              sx={{
                width: "80%",
              }}
            >
              회원가입
            </Button>
          </Box>
        </Box>
      </Box>
    </AppProvider>
  );
};

export default CustomSignInPage;
