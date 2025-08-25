import React, { useEffect, useMemo, useState } from "react";
import {
  Row,
  Col,
  Form,
  InputGroup,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import { DataGrid } from "@mui/x-data-grid";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { api } from "../../api/api-client";

// 서버 페이지 설정
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;

// TargetType / Status 매핑
const TARGET_LABEL = {
  NEWS: "뉴스",
  BOARD: "게시글",
  COMMENT: "댓글",
};

const STATUS_LABEL = {
  PROCESSING: "처리중",
  COMPLETED: "처리완료",
};

const AdminReportListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 검색/필터
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // '', 'NEWS' | 'BOARD' | 'COMMENT'
  const [statusFilter, setStatusFilter] = useState("PROCESSING"); // 기본: 처리중만 보기

  // 정렬/페이징
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_SIZE);
  const [sortModel, setSortModel] = useState([]); // [{ field, sort }]

  // 데이터
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [err, setErr] = useState(null);

  // 검색 디바운스용 키
  const [typingKey, setTypingKey] = useState(0);

  // 목록 로드
  const loadReports = async () => {
    setErr(null);

    const sortParam = sortModel?.[0]
      ? `${sortModel[0].field},${sortModel[0].sort}`
      : undefined;

    const params = {
      page,
      size: pageSize,
      q: q || undefined, // 제목/사유/신고자 검색
      type: typeFilter || undefined, // NEWS/BOARD/COMMENT
      status: statusFilter || undefined, // PROCESSING/COMPLETED
      sort: sortParam,
    };

    // GET /api/admins/reports
    const data = await api.get("/admins/reports", params);
    const content = Array.isArray(data?.content) ? data.content : [];

    // 예시 응답 row:
    // {
    //   reportId: 101,
    //   targetType: 'NEWS'|'BOARD'|'COMMENT',
    //   targetId: 123,
    //   title: '신고된 글 제목',
    //   reason: '욕설/스팸',
    //   reporterId: 'user001',
    //   status: 'PROCESSING'|'COMPLETED',
    //   createdAt: '2025-08-20T05:12:34'
    // }

    setRows(
      content.filter(Boolean).map((r, idx) => ({
        id: r.reportId ?? `row-${idx}`,
        reportId: r.reportId ?? null,
        targetType: r.targetType ?? null, // NEWS | BOARD | COMMENT
        targetId: r.targetId ?? null,
        title: r.contentTitle ?? "",
        reason: r.reason ?? "",
        reporterId: r.reporterUserId ?? "", // reporterUserId -> reporterId
        status: r.status ?? "PROCESSING", // PROCESSING | COMPLETED
        createdAt: r.reportedAt ?? null,
        contentPath: r.contentPath ?? null, // "/board/3" 등
      }))
    );

    setRowCount(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
  };

  // 이펙트: 의존성 변경 시 로드
  useEffect(() => {
    loadReports(); // eslint-disable-next-line
  }, [page, pageSize, sortModel, typingKey, typeFilter, statusFilter]);

  // 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setTypingKey((k) => k + 1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  // 상태 변경(PATCH)
  const updateStatus = async (reportId, nextStatus) => {
    try {
      // PATCH /api/admins/{id}/status  { status: 'PROCESSING' | 'COMPLETED' }
      await api.patch(`/admins/${reportId}/status`, {
        status: nextStatus,
      });
      await loadReports();
    } catch (e) {
      console.error(e);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 신고 대상 열기 (타입별 라우팅 또는 새 창)
  const openTarget = (row) => {
    // 서버가 contentPath("/board/3", "/news/10" 등)를 내려주므로 그걸 그대로 사용
    const path = row?.contentPath;
    if (!path) return;
    // 관리자 라우트로 갈지, 사용자 뷰로 갈지 정책에 맞게 변경
    // 관리자 쪽 라우트로 감싸려면: navigate(`/admin${path}`)
    navigate(path);
  };

  const columns = [
    {
      field: "targetType",
      headerName: "종류",
      width: 100,
      sortable: true,
      renderCell: (p = {}) => {
        const v = p?.row?.targetType;
        return TARGET_LABEL[v] ?? "-";
      },
    },
    {
      field: "title",
      headerName: "제목",
      flex: 1,
      minWidth: 220,
      sortable: true,
      renderCell: (p = {}) => String(p?.row?.title ?? ""),
    },
    {
      field: "reason",
      headerName: "사유",
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: (p = {}) => String(p?.row?.reason ?? ""),
    },
    {
      field: "reporterId",
      headerName: "신고자",
      width: 180,
      sortable: true,
      renderCell: (p = {}) => String(p?.row?.reporterId ?? ""),
    },
    {
      field: "createdAt",
      headerName: "신고일시",
      width: 200,
      sortable: true,
      renderCell: (p = {}) => {
        const v = p?.row?.createdAt;
        return v ? new Date(v).toLocaleString() : "-";
      },
    },
    {
      field: "status",
      headerName: "상태",
      width: 120,
      sortable: true,
      renderCell: (p = {}) => {
        const s = String(p?.row?.status || "PROCESSING").toUpperCase();
        const label = STATUS_LABEL[s] ?? s;
        const variant =
          s === "COMPLETED" || s === "DONE" ? "success" : "warning";
        return <span className={`badge bg-${variant}`}>{label}</span>;
      },
    },
    {
      field: "actions",
      headerName: "작업",
      width: 240,
      sortable: false,
      renderCell: (p = {}) => {
        const row = p?.row ?? {};
        const id = row.reportId;
        const isProcessing =
          String(row.status || "PROCESSING").toUpperCase() === "PROCESSING";
        return (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => openTarget(row)}
              disabled={!row.contentPath}
            >
              이동
            </button>
            {isProcessing ? (
              <button
                type="button"
                className="btn btn-sm btn-success"
                onClick={() => id && updateStatus(id, "COMPLETED")}
                disabled={!id}
              >
                처리완료
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => id && updateStatus(id, "PROCESSING")}
                disabled={!id}
              >
                처리중으로
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container-fluid py-3">
      <Row className="g-2 align-items-end mb-2">
        <Col xs={12} md={4}>
          <InputGroup>
            <InputGroup.Text>검색</InputGroup.Text>
            <Form.Control
              placeholder="제목 / 사유 / 신고자"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </InputGroup>
        </Col>

        <Col xs="auto">
          <Form.Group>
            <Form.Label className="small mb-1">종류</Form.Label>
            <Form.Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(0);
              }}
              size="sm"
            >
              <option value="">전체</option>
              <option value="NEWS">뉴스</option>
              <option value="BOARD">게시글</option>
              <option value="COMMENT">댓글</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs="auto">
          <Form.Group>
            <Form.Label className="small mb-1">상태</Form.Label>
            <Form.Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              size="sm"
            >
              <option value="PROCESSING">처리중</option>
              <option value="COMPLETED">처리완료</option>
              <option value="">전체</option>
            </Form.Select>
          </Form.Group>
        </Col>

        <Col xs="auto">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setQ("");
              setTypeFilter("");
              setStatusFilter("PROCESSING");
              setSortModel([]);
              setPage(0);
            }}
          >
            초기화
          </Button>
        </Col>
      </Row>

      {err && (
        <Alert variant="danger" className="mb-2">
          {err}
        </Alert>
      )}

      <div style={{ width: "110%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          autoHeight
          disableRowSelectionOnClick
          pagination
          paginationMode="server"
          sortingMode="server"
          rowCount={rowCount}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={(model) => {
            setPage(model.page ?? DEFAULT_PAGE);
            setPageSize(model.pageSize ?? DEFAULT_SIZE);
          }}
          onSortModelChange={(model) => setSortModel(model)}
          density="compact"
          sx={{
            "& .MuiDataGrid-cell": { fontVariantNumeric: "tabular-nums" },
          }}
        />
      </div>
    </div>
  );
};

export default AdminReportListPage;
