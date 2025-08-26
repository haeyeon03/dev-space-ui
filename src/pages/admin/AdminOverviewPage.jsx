import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";
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

// Chart.js 등록
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

import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
  Paper,
  Box,
  Typography,
  useTheme,
  Divider,
} from "@mui/material";

const fmt = (d) => d.toISOString().slice(0, 10);

/*
 * 관리자 대시보드 (React, Bootstrap, Chart.js)
 * - 상단 KPI 카드: Total Users / News / Board / Comments
 * - 성별 비율: 도넛
 * - 일별 조회수: 라인
 * - 연령·성별 분포: 스택 바
 */

const AdminOverviewPage = () => {
  // 기간 기본: 최근 7일
  const today = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return fmt(d);
  });
  const [endDate, setEndDate] = useState(fmt(today));

  // 데이터 상태
  const [summary, setSummary] = useState(null); // {usersTotal, newsTotal, boardTotal, commentTotal}
  const [gender, setGender] = useState(null); // {male, female}
  const [daily, setDaily] = useState([]); // [{date, viewCount}]
  const [ageGender, setAgeGender] = useState([]); // [{ageGroup, gender, viewCount}]

  // daily view, age gender 묶음
  const [chartTab, setChartTab] = React.useState("daily");
  const [err, setErr] = useState(null);

  // mui 레이아웃
  const theme = useTheme();
  const cardSx = {
    p: 2.5,
    borderRadius: 2,
    elevation: 0,
    bgcolor: "background.paper",
    boxShadow:
      theme.palette.mode === "light"
        ? "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)"
        : "0 1px 2px rgba(0,0,0,0.4)",
    border: `1px solid ${
      theme.palette.mode === "light"
        ? theme.palette.grey[200]
        : theme.palette.grey[800]
    }`,
  };

  // 공통 로더
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
    } finally {
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
      console.log("get", dv);
    } catch (e2) {
      setErr(e2?.message || String(e2));
    } finally {
    }
  };

  // 초기(KPI/성비)
  useEffect(() => {
    loadInitial();
  }, []);

  // 기간 변경 시(일별/연령·성별)
  useEffect(() => {
    loadRange(startDate, endDate);
  }, [startDate, endDate]);

  // ---------- 차트 데이터 가공 ----------

  // KPI 카드
  const kpi = [
    { title: "이용자 현황", value: summary?.totalUsers ?? "-" },
    { title: "뉴스 게시글 현황", value: summary?.totalNewsPosts ?? "-" },
    { title: "게시판 게시글 현황", value: summary?.totalBoardPosts ?? "-" },
    { title: "사이트 댓글 현황", value: summary?.totalComments ?? "-" },
  ];

  // 성별 비율 (Doughnut)
  const genderData = useMemo(() => {
    const m = gender?.maleCounts ?? 0;
    const f = gender?.femaleCounts ?? 0;
    return {
      labels: ["남성", "여성"],
      datasets: [
        {
          data: [m, f],
          backgroundColor: ["#0d6efd", "#dc3545"],
        },
      ],
    };
  }, [gender]);

  // 일별 조회수 (Line)
  const dailyData = useMemo(() => {
    const safe = Array.isArray(daily) ? daily : [];
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

  // 연령·성별 (Bar, stack)
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

  // 공통 옵션
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
    <Container fluid className="py-4">
      {/* 상단 필터 */}
      <Row className="align-items-end g-3 mb-3">
        <Col xs="auto">
          <h3 className="mb-0">DEV-SPACE information for admin</h3>
        </Col>
      </Row>

      <Box
        sx={{
          p: {
            xs: 2,
            md: 3,
            borderRadius: 15,
            border: `1px solid ${
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800]
            }`,
          },
        }}
      >
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {/* 상단: KPI (좌) */}
          <Grid item xs={12} md={6}>
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                KPI
              </Typography>

              <Grid container spacing={2}>
                {[
                  {
                    label: "이용자 현황",
                    value: `${summary?.totalUsers ?? "-"} 명`,
                  },
                  {
                    label: "뉴스 게시글 현황",
                    value: `${summary?.totalNewsPosts ?? "-"} 건`,
                  },
                  {
                    label: "게시판 게시글 현황",
                    value: `${summary?.totalBoardPosts ?? "-"} 건`,
                  },
                  {
                    label: "전체 댓글 수 현황",
                    value: `${summary?.totalComments ?? "-"} 개`,
                  },
                ].map((k, i) => (
                  <Grid key={i} item xs={6}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1.5,
                        bgcolor: "rgb",

                        border: `1px solid ${
                          theme.palette.mode === "light"
                            ? theme.palette.grey[200]
                            : theme.palette.grey[800]
                        }`,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {k.label}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.5 }}>
                        {k.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* 상단: 성별 비율 (우) */}
          <Grid item xs={12} md={6}>
            <Paper sx={cardSx}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                성별 비율
              </Typography>

              <Doughnut data={genderData} />
            </Paper>
          </Grid>
        </Grid>

        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,

            border: `1px solid ${
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800]
            }`,
          }}
        >
          <Col lg={8}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>날짜 설정</Card.Title>
              </Card.Body>
            </Card>
          </Col>

          {/* 하단: 차트 전환 (라디오 버튼 + 단일 카드) */}
          <Row className="g-3">
            <Col xs="auto" className="ms-auto">
              <Form className="d-flex align-items-center gap-2">
                <Form.Group controlId="startDate">
                  <Form.Label className="small mb-1">시작일</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="sm"
                  />
                </Form.Group>
                <Form.Group controlId="endDate">
                  <Form.Label className="small mb-1">종료일</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="sm"
                  />
                </Form.Group>
              </Form>
            </Col>
            {/* 오른쪽 정렬된 라디오 버튼 */}
            <Col xs={12} className="d-flex justify-content-end">
              <FormControl>
                <FormLabel id="chart-tab-label" className="small"></FormLabel>
                <RadioGroup
                  row
                  aria-labelledby="chart-tab-label"
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
                    label="연령·성별별 활동"
                  />
                </RadioGroup>
              </FormControl>
            </Col>

            <Col xs={12}>
              {chartTab === "daily" ? (
                <Card className="shadow-sm border-0 bg-light text-dark dark:bg-dark dark:text-light">
                  <Card.Body>
                    <Card.Title></Card.Title>
                    <div style={{ height: 340 }}>
                      <Line data={dailyData} options={lineOptions} />
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <Card className="shadow-sm border-0 bg-light text-dark dark:bg-dark dark:text-light">
                  <Card.Body>
                    <Card.Title></Card.Title>
                    <div style={{ height: 340 }}>
                      <Bar data={ageGenderData} options={barOptions} />
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminOverviewPage;
