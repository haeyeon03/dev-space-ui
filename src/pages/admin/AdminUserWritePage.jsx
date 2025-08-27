import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api-client";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
  Stack,
  Switch,
  Button,
  Alert,
  Divider,
  InputAdornment,
} from "@mui/material";
import { ArrowBack, Save, Block, LockOpen } from "@mui/icons-material";

const AdminUserWritePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState(null);

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ nickname: "", gender: "", role: "user" });

  const [isBanned, setIsBanned] = useState(false);
  const [banEndAt, setBanEndAt] = useState(null);
  const [penaltyOn, setPenaltyOn] = useState(false);
  const [penaltyReason, setPenaltyReason] = useState("");
  const [penaltyStart, setPenaltyStart] = useState("");
  const [penaltyHours, setPenaltyHours] = useState(24);

  const toDateTimeLocal = (d) => {
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api.get(
          `/admins/users/${encodeURIComponent(userId)}`
        );
        if (!alive) return;
        setUser(data);
        setForm({
          nickname: data?.nickname ?? "",
          gender: (data?.gender ?? "").toString().toUpperCase(),
          role: (data?.role ?? "user").toLowerCase(),
        });
        setIsBanned(Boolean(data?.banned));
        setBanEndAt(data?.banEndAt ?? null);
        setPenaltyStart(toDateTimeLocal(new Date()));
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const genderLabel = useMemo(() => {
    const g = (user?.gender ?? "").toString().toUpperCase();
    if (g === "M") return "남성";
    if (g === "F") return "여성";
    return "기타";
  }, [user]);

  const onSave = async () => {
    setSaving(true);
    setOkMsg(null);
    try {
      const baseChanged =
        form.nickname !== (user?.nickname ?? "") ||
        form.gender.toUpperCase() !==
          (user?.gender ?? "").toString().toUpperCase();

      if (baseChanged) {
        await api.put(`/admins/users/${encodeURIComponent(userId)}`, {
          nickname: form.nickname,
          gender: form.gender,
        });
      }

      if (
        (form.role || "").toLowerCase() !== (user?.role ?? "").toLowerCase()
      ) {
        if (api.patch) {
          await api.patch(`/admins/users/${encodeURIComponent(userId)}/role`, {
            role: form.role,
          });
        } else {
          await api.post(`/admins/users/${encodeURIComponent(userId)}/role`, {
            role: form.role,
          });
        }
      }

      if (penaltyOn) {
        const eff = new Date(penaltyStart);
        const durationSec = Math.max(
          0,
          Math.floor(Number(penaltyHours) * 3600)
        );
        await api.post(
          `/admins/users/${encodeURIComponent(userId)}/penalties`,
          {
            reason: penaltyReason || "관리자 정지",
            effectiveAt: eff.toISOString(),
            durationSec,
          }
        );
      }

      const fresh = await api.get(
        `/admins/users/${encodeURIComponent(userId)}`
      );
      setUser(fresh);
      setForm({
        nickname: fresh?.nickname ?? "",
        gender: (fresh?.gender ?? "").toString().toUpperCase(),
        role: (fresh?.role ?? "user").toLowerCase(),
      });
      setIsBanned(Boolean(fresh?.banned));
      setBanEndAt(fresh?.banEndAt ?? null);
      setPenaltyOn(false);
      setPenaltyReason("");
      setOkMsg("변경사항이 저장되었습니다.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onLiftPenalty = async () => {
    setSaving(true);
    setOkMsg(null);
    try {
      await api.post(
        `/admins/users/${encodeURIComponent(userId)}/penalties/lift`,
        {}
      );
      const fresh = await api.get(
        `/admins/users/${encodeURIComponent(userId)}`
      );
      setUser(fresh);
      setIsBanned(Boolean(fresh?.banned));
      setBanEndAt(fresh?.banEndAt ?? null);
      setOkMsg("정지를 해제했습니다.");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          사용자 정보를 불러올 수 없습니다.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          뒤로
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={25} alignItems="center" sx={{ mb: 3 }}>
        <Grid item xs>
          <Typography variant="h5" fontWeight={700}>
            사용자 수정
          </Typography>
          <Typography variant="body2" color="text.secondary">
            USER ID:{" "}
            <Box component="span" sx={{ fontFamily: "monospace" }}>
              {userId}
            </Box>
          </Typography>
        </Grid>
        <Grid item>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(-1)}
            >
              목록
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={onSave}
              disabled={saving}
            >
              {saving ? "저장 중" : "저장"}
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {okMsg && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {okMsg}
        </Alert>
      )}

      <Grid container spacing={3} alignItems="stretch">
        {/* 기본 정보 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader title="기본 정보" sx={{ pb: 0 }} />
            <CardContent>
              <Stack spacing={2}>
                <TextField
                  disabled
                  label="닉네임"
                  value={form.nickname}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, nickname: e.target.value }))
                  }
                  inputProps={{ maxLength: 30 }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel id="gender-label">성별</InputLabel>
                  <Select
                    disabled
                    labelId="gender-label"
                    label="성별"
                    value={form.gender}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, gender: e.target.value }))
                    }
                  >
                    <MenuItem value="">미지정</MenuItem>
                    <MenuItem value="M">남성</MenuItem>
                    <MenuItem value="F">여성</MenuItem>
                  </Select>
                </FormControl>

                <FormControl>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    역할
                  </Typography>
                  <RadioGroup
                    row
                    value={form.role}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, role: e.target.value }))
                    }
                  >
                    <FormControlLabel
                      value="user"
                      control={<Radio />}
                      label="유저"
                    />
                    <FormControlLabel
                      value="admin"
                      control={<Radio />}
                      label="관리자"
                    />
                  </RadioGroup>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 정지 관리 */}
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ borderRadius: 3, height: "100%" }}>
            <CardHeader title="정지 관리" sx={{ pb: 0 }} />
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    현재 상태
                  </Typography>
                  {isBanned ? (
                    <Chip label="정지" color="error" />
                  ) : (
                    <Chip label="정상" color="success" />
                  )}
                  {isBanned && banEndAt && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      종료 예정: {new Date(banEndAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {isBanned && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LockOpen />}
                    onClick={onLiftPenalty}
                    disabled={saving}
                  >
                    정지 해제
                  </Button>
                )}
                <Divider />
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="body2">새 정지 등록</Typography>
                  <Switch
                    checked={penaltyOn}
                    onChange={(e) => setPenaltyOn(e.target.checked)}
                  />
                </Stack>
                <TextField
                  label="사유"
                  placeholder="신고/운영 방침 위반 등"
                  value={penaltyReason}
                  onChange={(e) => setPenaltyReason(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={!penaltyOn}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      label="적용 시작 (KST)"
                      type="datetime-local"
                      value={penaltyStart}
                      onChange={(e) => setPenaltyStart(e.target.value)}
                      fullWidth
                      disabled={!penaltyOn}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField
                      label="기간(시간)"
                      type="number"
                      inputProps={{ min: 0, step: 1 }}
                      value={penaltyHours}
                      onChange={(e) => setPenaltyHours(e.target.value)}
                      fullWidth
                      disabled={!penaltyOn}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">시간</InputAdornment>
                        ),
                      }}
                      helperText="예: 24시간 = 1일"
                    />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminUserWritePage;
