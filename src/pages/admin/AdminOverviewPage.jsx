import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Grid,
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler,
} from "chart.js";
import { api } from "../../api/api-client";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Filler
);

const fmt = (d) => d.toISOString().slice(0, 10);

const AdminOverviewPage = () => {
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return fmt(d);
  });
  const [endDate, setEndDate] = useState(fmt(today));

  const [summary, setSummary] = useState(null);
  const [gender, setGender] = useState(null);
  const [daily, setDaily] = useState([]);
  const [ageGender, setAgeGender] = useState([]);
  const [chartTab, setChartTab] = useState("daily");
  const [err, setErr] = useState(null);

  const cardSx = {
    p: 4,
    borderRadius: 3,
    bgcolor: "background.paper",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  const kpiCardSx = {
    p: 2,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: 120,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "none",
    borderRadius: 2,
  };

  const chartCardSx = {
    p: 3,
    borderRadius: 3,
    bgcolor: "background.paper",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
  };

  const loadInitial = async () => {
    setErr(null);
    try {
      const [d, g] = await Promise.all([
        api.get("/admins/stats/summary"),
        api.get("/admins/stats/gender-ratio"),
      ]);
      setSummary(d.data);
      setGender(g.data);
    } catch (e) {
      setErr(e?.message || String(e));
    }
  };

  const loadRange = async (s, e) => {
    setErr(null);
    try {
      const [dv, ag] = await Promise.all([
        api.get("/admins/stats/daily-views", { startDate: s, endDate: e }),
        api.get("/admins/stats/age-gender", { startDate: s, endDate: e }),
      ]);
      setDaily(Array.isArray(dv) ? dv : []);
      setAgeGender(Array.isArray(ag) ? ag : []);
    } catch (e2) {
      setErr(e2?.message || String(e2));
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    loadRange(startDate, endDate);
  }, [startDate, endDate]);

  const genderData = useMemo(() => {
    const m = gender?.maleCounts ?? 0;
    const f = gender?.femaleCounts ?? 0;
    return {
      labels: ["남성", "여성"],
      datasets: [{ data: [m, f], backgroundColor: ["#0d6efd", "#dc3545"] }],
    };
  }, [gender]);

  const dailyData = useMemo(() => {
    const labels = daily.map((d) => d.date);
    const values = daily.map((d) => d.viewCount);
    return {
      labels,
      datasets: [
        {
          label: "일별 조회수",
          data: values,
          borderColor: "#4582df",
          backgroundColor: "rgba(13,110,253,0.2)",
          tension: 0.3,
          fill: true,
          pointRadius: 0,
        },
      ],
    };
  }, [daily]);

  const ageGenderData = useMemo(() => {
    const rows = Array.isArray(ageGender) ? ageGender : [];
    const order = ["10대", "20대", "30대", "40대", "50대", "60대 이상"];
    const grouped = new Map();
    for (const r of rows) {
      const key = r.ageGroup || "기타";
      const g = (r.gender || "").toUpperCase();
      if (!grouped.has(key)) grouped.set(key, { M: 0, F: 0, X: 0 });
      const acc = grouped.get(key);
      if (g === "M") acc.M += r.viewCount || 0;
      else if (g === "F") acc.F += r.viewCount || 0;
      else acc.X += r.viewCount || 0;
    }
    const labels = Array.from(grouped.keys()).sort(
      (a, b) => order.indexOf(a) - order.indexOf(b)
    );
    const M = labels.map((k) => grouped.get(k).M);
    const F = labels.map((k) => grouped.get(k).F);
    const X = labels.map((k) => grouped.get(k).X);

    return {
      labels,
      datasets: [
        { label: "남성", data: M, backgroundColor: "#0d6efd", stack: "g" },
        { label: "여성", data: F, backgroundColor: "#dc3545", stack: "g" },
        { label: "-", data: X, backgroundColor: "#6c757d", stack: "g" },
      ],
    };
  }, [ageGender]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={cardSx}>
        {/* DASH BOARD 제목 */}
        <Typography
          variant="h4"
          sx={{
            mb: 4,
            textAlign: "center",
            fontWeight: 800,
            fontSize: { xs: "2rem", md: "3rem" },
            letterSpacing: "0.15em",
            background:
              "linear-gradient(90deg, #0d6efd, #dc3545, #0dcaf0, #198754)",
            backgroundSize: "300% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradientMove 3s ease infinite",
            textShadow: "2px 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          DASH BOARD
        </Typography>

        {/* KPI 카드 */}
        <Grid container spacing={3} sx={{ mb: 4 }} justifyContent="center">
          {[
            { label: "이용자 현황", value: `${summary?.totalUsers ?? "-"} 명` },
            {
              label: "뉴스 게시글 현황",
              value: `${summary?.totalNewsPosts ?? "-"} 건`,
            },
            {
              label: "게시판 게시글 현황",
              value: `${summary?.totalBoardPosts ?? "-"} 건`,
            },
            {
              label: "전체 댓글 수",
              value: `${summary?.totalComments ?? "-"} 개`,
            },
          ].map((k, i) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={3}
              key={i}
              sx={{ display: "flex", alignItems: "stretch" }}
            >
              <Paper sx={kpiCardSx}>
                <Typography variant="body2" color="text.secondary">
                  {k.label}
                </Typography>
                <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                  {k.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* 성별 비율 + 날짜/차트 */}
        <Grid container spacing={3} justifyContent="center">
          {/* 성별 비율 */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ ...chartCardSx, width: "100%" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                성별 비율
              </Typography>
              <Box sx={{ width: "100%", height: { xs: 250, md: 340 } }}>
                <Doughnut
                  data={genderData}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </Box>
            </Paper>
          </Grid>

          {/* 날짜 선택 + 라디오 + 차트 */}
          <Grid item xs={12} md={8}>
            <Paper sx={chartCardSx}>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="시작일"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="종료일"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md="auto" sx={{ ml: "auto" }}>
                  <FormControl>
                    <RadioGroup
                      row
                      name="chart-tab"
                      value={chartTab}
                      onChange={(e) => setChartTab(e.target.value)}
                    >
                      <FormControlLabel
                        value="daily"
                        control={<Radio size="small" />}
                        label="일별 조회수"
                      />
                      <FormControlLabel
                        value="ageGender"
                        control={<Radio size="small" />}
                        label="연령·성별 활동"
                      />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ width: "100%", height: { xs: 250, md: 340 } }}>
                {chartTab === "daily" ? (
                  <Line data={dailyData} options={lineOptions} />
                ) : (
                  <Bar data={ageGenderData} options={barOptions} />
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
    </Container>
  );
};

export default AdminOverviewPage;
