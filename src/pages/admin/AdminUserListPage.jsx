import { useEffect, useMemo, useState } from "react";
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

// 서버 페이징 기본값
const DEFAULT_PAGE = 0; // Spring Page index (0-based)
const DEFAULT_SIZE = 10;

const AdminUserListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 검색/필터 상태
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // '', 'admin', 'user'
  const [suspendedFilter, setSuspendedFilter] = useState(""); // '', 'true', 'false'

  // 페이징/정렬 상태
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_SIZE);
  const [sortModel, setSortModel] = useState([]); // [{ field: 'nickname', sort: 'asc' }]

  // 데이터 상태
  const [rows, setRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  // 디바운스 검색 키
  const [typingKey, setTypingKey] = useState(0);

  // 서버호출: 목록 조회
  const loadUsers = async () => {
    // 정렬 파라미터 만들기 (백엔드: sort=field,dir 형식 가정)
    const sortParam = sortModel?.[0]
      ? `${sortModel[0].field},${sortModel[0].sort}`
      : undefined;

    const params = {
      page,
      size: pageSize,
      keyword: query || undefined, // 닉네임/이름 통합 검색
      role: roleFilter || undefined, // 'admin' | 'user'
      suspended: suspendedFilter || undefined, // 'true' | 'false'
      sort: sortParam,
    };

    // 백엔드 엔드포인트 가정: GET /admins/users (Spring Data Page 반환)
    const data = await api.get("/admins/users", params);
    /*
        응답 예시 (Spring Page):
        {
          content: [
            {
              userId: "test001",
              name: "홍길동",
              nickname: "길동쓰",
              gender: "M",        // or "F", null
              role: "admin" | "user",
              banned: true | false,
              banEndAt: "2025-08-31T12:00:00" | null
            },
            ...
          ],
          totalElements: 123,
          totalPages: 13,
          number: 0,            // 현재 페이지
          size: 10
        }
      */

    const content = Array.isArray(data?.content) ? data.content : [];
    setRows(
      (Array.isArray(content) ? content : []).filter(Boolean).map((u, idx) => ({
        id: u.userId ?? `row-${idx}`,
        userId: u.userId ?? "",
        nickname: u.nickname ?? "",
        gender: (u.gender ?? "").toString(),
        role: u.role ?? "",
        banned: Boolean(u.banned),
        banEndAt: u.banEndAt ?? null,
      }))
    );
    setRowCount(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
    console.log("rows[0]", rows?.[0]);
  };

  // 최초 및 의존성 변경 시 로드
  useEffect(() => {
    loadUsers(); /* eslint-disable-next-line */
  }, [page, pageSize, sortModel, typingKey, roleFilter, suspendedFilter]);

  // 검색 입력 디바운스
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0); // 검색어 바뀌면 1페이지부터
      loadUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // 컬럼 정의
  const columns = useMemo(
    () => [
      {
        field: "userId",
        headerName: "아이디",
        flex: 1,
        minWidth: 130,
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
        width: 140,
        sortable: true,
        renderCell: (params) => {
          const banned = !!params.row.banned;
          const until = params.row.banEndAt;
          return banned ? (
            <div>
              <Badge bg="danger">정지</Badge>
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

  const localeText = {
    MuiTablePagination: {
      labelRowsPerPage: "페이지당 유저 수", // 원하는 문구
    },
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gridTemplateColumns: "1fr 120px",
          gap: "3%",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 400 }}>
          <InputGroup>
            <InputGroup.Text style={{ padding: "4px 8px" }}>
              검색
            </InputGroup.Text>
            <Form.Control
              placeholder="아이디 / 닉네임"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </div>

        <Form.Group className="mb-0" style={{ padding: "4px 8px" }}>
          <Form.Label className="small mb-1 " style={{ padding: "4px 8px" }}>
            권한
          </Form.Label>
          <Form.Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            size="sm"
          >
            <option value="">전체</option>
            <option value="user">유저</option>
            <option value="admin">관리자</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-0">
          <Form.Label className="small mb-1" style={{ padding: "4px 8px" }}>
            정지
          </Form.Label>
          <Form.Select
            value={suspendedFilter}
            onChange={(e) => {
              setSuspendedFilter(e.target.value);
              setPage(0);
            }}
            size="sm"
          >
            <option value="">전체</option>
            <option value="true">정지</option>
            <option value="false">정상</option>
          </Form.Select>
        </Form.Group>

        {/* 오른쪽 끝으로 밀기 */}
        <div className="ms-auto">
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

      {/* 리스트 */}
      <div style={{ minWidth: 320 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          localeText={localeText}
          getRowId={(r) => r.id ?? r.userId}
          autoHeight
          disableRowSelectionOnClick
          pagination
          paginationMode="server"
          sortingMode="server"
          rowCount={rowCount}
          page={page}
          pageSize={pageSize}
          onPaginationModelChange={(m) => {
            setPage(m.page ?? DEFAULT_PAGE);
            setPageSize(m.pageSize ?? DEFAULT_SIZE);
          }}
          onSortModelChange={(m) => setSortModel(m)}
          density="compact"
          sx={{
            "& .MuiDataGrid-cell": { fontVariantNumeric: "tabular-nums" },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "background.paper",
            },
          }}
        />
      </div>
    </>
  );
};

export default AdminUserListPage;
