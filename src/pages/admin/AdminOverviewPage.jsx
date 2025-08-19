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
    { title: "Total Users", value: summary?.totalUsers ?? "-" },
    { title: "Total News Posts", value: summary?.totalNewsPosts ?? "-" },
    { title: "Total Board Posts", value: summary?.totalBoardPosts ?? "-" },
    { title: "Total Comments", value: summary?.totalComments ?? "-" },
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
          borderColor: "#0d6efd",
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
        { label: "기타", data: X, backgroundColor: "#6c757d", stack: "g" },
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
    <Container fluid className="py-3">
      {/* 상단 필터 */}
      <Row className="align-items-end g-3 mb-3">
        <Col xs="auto">
          <h3 className="mb-0">관리자 대시보드</h3>
        </Col>
      </Row>

      {/* KPI */}
      <Grid container spacing={25} alignItems="stretch" sx={{ mb: 5 }}>
        <Grid item xs={12} md={7}>
          {kpi.map((k) => (
            <Col key={k.title} md={6}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="text-muted small">{k.title}</div>
                  <div className="fw-semibold fs-4 mt-1">{k.value}</div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Grid>

        {/* 성별 비율 */}

        <Grid item xs={12} md={10}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>성별 비율</Card.Title>
              <div style={{ height: 280 }}>
                <Doughnut data={genderData} />
              </div>
            </Card.Body>
          </Card>
        </Grid>
      </Grid>

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
            <FormLabel id="chart-tab-label" className="small">
              차트 선택
            </FormLabel>
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
                label="연령·성별별 분포"
              />
            </RadioGroup>
          </FormControl>
        </Col>

        <Col xs={12}>
          {chartTab === "daily" ? (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>일별 조회수</Card.Title>
                <div style={{ height: 340 }}>
                  <Line data={dailyData} options={lineOptions} />
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>연령·성별별 분포</Card.Title>
                <div style={{ height: 340 }}>
                  <Bar data={ageGenderData} options={barOptions} />
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminOverviewPage;
