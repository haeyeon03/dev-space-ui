import { Box, CircularProgress, Typography } from "@mui/material";

const LoadingPage = () => {
  return (
    <Box
      sx={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <CircularProgress />
      <Typography variant="h8" sx={{ mt: 2, color: "#555" }}>
        로딩중입니다...
      </Typography>
    </Box>
  );
};

export default LoadingPage;
