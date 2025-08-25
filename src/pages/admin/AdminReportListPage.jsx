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
  PENDING: "처리중",
  DONE: "처리완료",
};

const AdminReportListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 검색/필터
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState(""); // '', 'NEWS' | 'BOARD' | 'COMMENT'
  const [statusFilter, setStatusFilter] = useState("PENDING"); // 기본: 처리중만 보기

  // 정렬/페이징
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_SIZE);
  const [sortModel, setSortModel] = useState([]); // [{ field, sort }]

  // 데이터
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // 검색 디바운스용 키
  const [typingKey, setTypingKey] = useState(0);

  // 목록 로드
  const loadReports = async () => {
    setLoading(true);
    setErr(null);
    try {
      const sortParam = sortModel?.[0]
        ? `${sortModel[0].field},${sortModel[0].sort}`
        : undefined;

      const params = {
        page,
        size: pageSize,
        q: q || undefined, // 제목/사유/신고자 검색
        type: typeFilter || undefined, // NEWS/BOARD/COMMENT
        status: statusFilter || undefined, // PENDING/DONE
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
      //   status: 'PENDING'|'DONE',
      //   createdAt: '2025-08-20T05:12:34'
      // }

      setRows(
        content.map((r, idx) => ({
          id: r.reportId ?? `row-${idx}`,
          reportId: r.reportId,
          targetType: r.targetType ?? "",
          targetId: r.targetId ?? null,
          title: r.title ?? "(제목 없음)",
          reason: r.reason ?? "",
          reporterId: r.reporterId ?? "",
          status: r.status ?? "PENDING",
          createdAt: r.createdAt ?? null,
        }))
      );
      setRowCount(
        Number.isFinite(data?.totalElements) ? data.totalElements : 0
      );
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
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
      // PATCH /api/admins/reports/{id}/status  { status: 'DONE' | 'PENDING' }
      await api.patch(`/admins/reports/${reportId}/status`, {
        status: nextStatus,
      });
      // 반영 후 새로고침
      await loadReports();
    } catch (e) {
      alert("상태 변경 중 오류가 발생했습니다.");
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  // 신고 대상 열기 (타입별 라우팅 또는 새 창)
  const openTarget = (row) => {
    const { targetType, targetId } = row;
    if (!targetType || !targetId) return;

    // 내부 관리자 라우트 or 사용자-facing 라우트 결정
    if (targetType === "NEWS") {
      // 예: 관리자 뉴스 상세로 이동
      navigate(`/admin/news/${targetId}`);
    } else if (targetType === "BOARD") {
      navigate(`/admin/board/${targetId}`);
    } else if (targetType === "COMMENT") {
      navigate(`/admin/comments/${targetId}`);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "targetType",
        headerName: "종류",
        width: 100,
        sortable: true,
        valueFormatter: ({ value }) => TARGET_LABEL[value] || value || "-",
      },
      {
        field: "title",
        headerName: "제목",
        flex: 1,
        minWidth: 200,
        sortable: true,
      },
      {
        field: "reason",
        headerName: "사유",
        flex: 1,
        minWidth: 180,
        sortable: false,
      },
      {
        field: "reporterId",
        headerName: "신고자",
        width: 140,
        sortable: true,
      },
      {
        field: "status",
        headerName: "상태",
        width: 120,
        sortable: true,
        renderCell: (params) => {
          const s = (params.row.status || "PENDING").toUpperCase();
          const label = STATUS_LABEL[s] || s;
          const variant = s === "DONE" ? "success" : "warning";
          return <Badge bg={variant}>{label}</Badge>;
        },
      },
      {
        field: "createdAt",
        headerName: "신고일시",
        width: 180,
        sortable: true,
        valueFormatter: ({ value }) =>
          value ? new Date(value).toLocaleString() : "-",
      },
      {
        field: "actions",
        headerName: "작업",
        width: 220,
        sortable: false,
        renderCell: (params) => {
          const s = (params.row.status || "PENDING").toUpperCase();
          const isPending = s === "PENDING";
          return (
            <div className="d-flex gap-2">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => openTarget(params.row)}
              >
                이동
              </Button>
              {isPending ? (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => updateStatus(params.row.reportId, "DONE")}
                >
                  처리완료
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline-secondary"
                  onClick={() => updateStatus(params.row.reportId, "PENDING")}
                >
                  처리중으로
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

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
            {loading ? (
              <InputGroup.Text>
                <Spinner size="sm" />
              </InputGroup.Text>
            ) : null}
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
              <option value="PENDING">처리중</option>
              <option value="DONE">처리완료</option>
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
              setStatusFilter("PENDING");
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

      <div style={{ width: "100%" }}>
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
          loading={loading}
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
