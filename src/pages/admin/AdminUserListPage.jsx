import { useEffect, useMemo, useState } from "react";
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";

// 서버 페이징 기본값
const DEFAULT_PAGE = 0; // Spring Page index (0-based)
const DEFAULT_SIZE = 10;

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

  // 디바운스 검색 키
  const [typingKey, setTypingKey] = useState(0);

  // 서버호출: 목록 조회
  const loadUsers = async () => {
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
    setRowCount(Number.isFinite(data?.totalElements) ? data.totalElements : 0);
  };

  useEffect(() => {
    loadUsers();
  }, [page, pageSize, sortModel, typingKey, roleFilter, suspendedFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      loadUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

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
        renderCell: (params) => {
          const raw = (params?.row?.gender ?? "").toUpperCase();
          return (
            <span>{raw === "M" ? "남성" : raw === "F" ? "여성" : "기타"}</span>
          );
        },
      },
      {
        field: "role",
        headerName: "역할",
        width: 120,
        renderCell: (params) => {
          const r = (params.row.role || "").toLowerCase();
          return (
            <Button
              size="small"
              variant={r === "admin" ? "contained" : "outlined"}
              disabled
            >
              {r === "admin" ? "관리자" : "유저"}
            </Button>
          );
        },
      },
      {
        field: "banned",
        headerName: "정지 상태",
        width: 140,
        renderCell: (params) => {
          const banned = !!params.row.banned;
          const until = params.row.banEndAt;
          return banned ? (
            <Box>
              <Button size="small" color="error" variant="contained" disabled>
                정지
              </Button>
              {until && (
                <div style={{ fontSize: 10, color: "#666" }}>
                  {new Date(until).toLocaleString()}
                </div>
              )}
            </Box>
          ) : (
            <Button size="small" color="success" variant="contained" disabled>
              정상
            </Button>
          );
        },
      },
      {
        field: "actions",
        headerName: "수정",
        width: 120,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
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
    <Box>
      {/* 검색 + 필터 + 초기화 */}
      <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={2}>
        {/* 검색 */}
        <TextField
          label="검색 (아이디/닉네임)"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ minWidth: 250 }}
        />

        {/* 권한 필터 */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>권한</InputLabel>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            label="권한"
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="user">유저</MenuItem>
            <MenuItem value="admin">관리자</MenuItem>
          </Select>
        </FormControl>

        {/* 정지 필터 */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>정지</InputLabel>
          <Select
            value={suspendedFilter}
            onChange={(e) => {
              setSuspendedFilter(e.target.value);
              setPage(0);
            }}
            label="정지"
          >
            <MenuItem value="">전체</MenuItem>
            <MenuItem value="true">정지</MenuItem>
            <MenuItem value="false">정상</MenuItem>
          </Select>
        </FormControl>

        {/* 초기화 버튼 */}
        <Box flexGrow={1} display="flex" justifyContent="flex-end">
          <Button
            size="small"
            variant="outlined"
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
        </Box>
      </Box>

      {/* 데이터 그리드 */}
      <DataGrid
        rows={rows}
        columns={columns}
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
      />
    </Box>
  );
};

export default AdminUserListPage;
