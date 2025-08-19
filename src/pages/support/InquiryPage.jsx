import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

export default function InquiryPage() {
  const [form, setForm] = React.useState({ title: "", message: "", email: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);

    alert("문의가 제출되었습니다! 감사합니다 😊");

    setForm({ title: "", message: "", email: "" });
  };

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", my: 5 }}>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 4, borderRadius: 3, boxShadow: 6 }}
      >
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", textAlign: "center" }}
        >
          1:1 문의
        </Typography>

        <Typography
          variant="body2"
          sx={{
            mb: 3,
            color: "text.secondary",
            whiteSpace: "pre-line",
            textAlign: "center",
          }}
        >
          문의사항을 남겨주시면 최대한 빠르게 답변드리겠습니다.{"\n"}
          이메일을 정확히 입력해주세요.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="이메일 주소"
            name="email"
            value={form.email}
            onChange={handleChange}
            type="email"
            fullWidth
            required
          />
          <TextField
            label="제목"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            label="문의 내용"
            name="message"
            value={form.message}
            onChange={handleChange}
            multiline
            rows={5}
            fullWidth
            required
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ py: 1.5, fontWeight: "bold" }}
          >
            문의 제출
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
