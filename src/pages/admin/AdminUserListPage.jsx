import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  Stack,
  Form,
  InputGroup,
  Button,
  Badge,
  Alert,
} from "react-bootstrap";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";

// 서버 페이징 기본값
const DEFAULT_PAGE = 0; // Spring Page index (0-based)
const DEFAULT_SIZE = 25;

const AdminUserListPage = () => {
  const navigate = useNavigate();

  // 검색/필터 상태
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // '', 'admin', 'user'
  const [suspendedFilter, setSuspendedFilter] = useState(""); // '', 'true', 'false'

  // 페이징/정렬 상태
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_SIZE);
  const [sortModel, setSortModel] = useState([]);

  // 데이터 상태
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // 디바운스용 키
  const [typingKey, setTypingKey] = useState(0);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const sortParam = sortModel?.[0]
        ? `${sortModel[0].field},${sortModel[0].sort}`
        : undefined;

      const params = {
        page,
        size: pageSize,
        keyword: query || undefined,
        role: roleFilter || undefined,
        suspended: suspendedFilter || undefined,
        sort: sortParam,
      };

      const data = await api.get("/admins/users", params);

      const content = Array.isArray(data?.content) ? data.content : [];
      setRows(
        content.filter(Boolean).map((u, idx) => ({
          id: u.userId ?? `row-${idx}`,
          userId: u.userId ?? "",
          nickname: u.nickname ?? "",
          gender: (u.gender ?? "").toString(),
          role: u.role ?? "",
          banned: Boolean(u.banned),
          banEndAt: u.banEndAt ?? null,
        }))
      );
      setRowCount(
        Number.isFinite(data?.totalElements) ? data.totalElements : 0
      );
    } catch (e) {
      setErr(e?.message || "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortModel, query, roleFilter, suspendedFilter]);
  // 서버 호출: 페이지·정렬·필터 변경 시
  useEffect(() => {
    loadUsers();
  }, [loadUsers, typingKey]);

  // 검색 입력 디바운스: query 변경 → 300ms 후 typingKey 증가 → 목록 호출
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setTypingKey((k) => k + 1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // 컬럼
  const columns = useMemo(
    () => [
      {
        field: "userId",
        headerName: "아이디",
        flex: 1,
        minWidth: 140,
        sortable: true,
      },
      {
        field: "nickname",
        headerName: "닉네임",
        flex: 1,
        minWidth: 140,
        sortable: true,
      },
      {
        field: "gender",
        headerName: "성별",
        width: 90,
        sortable: false,
        renderCell: (params) => {
          const raw = (params?.row?.gender ?? "")
            .toString()
            .trim()
            .toUpperCase();
          const label = raw === "M" ? "남성" : raw === "F" ? "여성" : "기타";
          return <span>{label}</span>;
        },
      },
      {
        field: "role",
        headerName: "역할",
        width: 120,
        sortable: true,
        renderCell: (params) => {
          const r = (params.row.role || "").toLowerCase();
          const variant = r === "admin" ? "primary" : "secondary";
          const label = r === "admin" ? "관리자" : "유저";
          return <Badge bg={variant}>{label}</Badge>;
        },
      },
      {
        field: "banned",
        headerName: "정지 상태",
        width: 150,
        sortable: true,
        renderCell: (params) => {
          const banned = !!params.row.banned;
          const until = params.row.banEndAt;
          return banned ? (
            <div>
              <Badge bg="danger" className="me-1">
                정지
              </Badge>
              {until ? (
                <div className="small text-muted">
                  {new Date(until).toLocaleString()}
                </div>
              ) : null}
            </div>
          ) : (
            <Badge bg="success">정상</Badge>
          );
        },
      },
      {
        field: "actions",
        headerName: "수정",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => navigate(`/admin/user/${params.row.userId}`)}
          >
            수정
          </Button>
        ),
      },
    ],
    [navigate]
  );

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white mb-10">
        <div className="d-flex justify-content-between align-items-end flex-wrap ">
          {/* 왼쪽: 필터 묶음 */}
          <Stack
            direction="horizontal"
            gap={10}
            className="flex-wrap flex-grow-1"
          >
            {/* 검색, 권한, 정지 Select 등 */}
            <InputGroup style={{ minWidth: 280, maxWidth: 420 }}>
              <InputGroup.Text>검색</InputGroup.Text>
              <Form.Control
                placeholder="아이디 / 닉네임"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </InputGroup>

            <Form.Group>
              <Form.Label className="small mb-1">권한</Form.Label>
              <Form.Select
                size="sm"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
                style={{ minWidth: 170 }}
              >
                <option value="">전체</option>
                <option value="user">유저</option>
                <option value="admin">관리자</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label className="small mb-1">정지</Form.Label>
              <Form.Select
                size="sm"
                value={suspendedFilter}
                onChange={(e) => {
                  setSuspendedFilter(e.target.value);
                  setPage(0);
                }}
                style={{ minWidth: 170 }}
              >
                <option value="">전체</option>
                <option value="true">정지</option>
                <option value="false">정상</option>
              </Form.Select>
            </Form.Group>
          </Stack>

          {/* 오른쪽: 초기화 버튼만 */}
          <div className="d-flex justify-content-between align-items-end flex-md-nowrap">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => {
                setQuery("");
                setRoleFilter("");
                setSuspendedFilter("");
                setSortModel([]);
                setPage(0);
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {err && (
          <Alert variant="danger" className="mb-3">
            {err}
          </Alert>
        )}

        <div style={{ minWidth: 320 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id ?? r.userId}
            loading={loading}
            autoHeight
            disableRowSelectionOnClick
            pagination
            paginationMode="server"
            sortingMode="server"
            rowCount={rowCount}
            onPaginationModelChange={(m) => {
              setPage(m.page ?? DEFAULT_PAGE);
              setPageSize(m.pageSize ?? DEFAULT_SIZE);
            }}
            onSortModelChange={(m) => setSortModel(m)}
            initialState={{
              pagination: {
                paginationModel: { page: DEFAULT_PAGE, pageSize: DEFAULT_SIZE },
              },
            }}
            density="compact"
            sx={{
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "rgba(0,0,0,0.02)",
              },
              "& .MuiDataGrid-row:nth-of-type(odd)": {
                backgroundColor: "rgba(0,0,0,0.01)",
              },
              "& .MuiDataGrid-cell": { fontVariantNumeric: "tabular-nums" },
              border: 0,
            }}
          />
        </div>
      </Card.Body>
    </Card>
  );
};

export default AdminUserListPage;
