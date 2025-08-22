import react, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/api-client";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
  InputGroup,
} from "react-bootstrap";

const AdminUserWritePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  //원본, 편집
  const [saving, setSaving] = useState(false);
  const [okMsg, setOkMsg] = useState(null);

  //원본 유저정보
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    nickname: "",
    gender: "", // "M" or "F"
    role: "USER", // "ADMIN" or "USER"
  });

  // 정지 상태/입력
  const [isBanned, setIsBanned] = useState(false);
  const [banEndAt, setBanEndAt] = useState(null); // string or null
  const [penaltyOn, setPenaltyOn] = useState(false); // 새 정지 등록 토글
  const [penaltyReason, setPenaltyReason] = useState("");
  const [penaltyStart, setPenaltyStart] = useState(""); // datetime-local
  const [penaltyHours, setPenaltyHours] = useState(24); // 기간(시간)

  // 유틸
  const toDateTimeLocal = (d) => {
    // Date -> 'YYYY-MM-DDTHH:mm'
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  // 초기 로드
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // GET /api/admins/users/{userId}
        const data = await api.get(
          `/admins/users/${encodeURIComponent(userId)}`
        );
        if (!alive) return;

        setUser(data);
        setForm({
          nickname: data?.nickname ?? "",
          gender: (data?.gender ?? "").toString().toUpperCase(), // 'M'|'F'|''
          role: (data?.role ?? "user").toLowerCase(), // 'admin'|'user'
        });

        const banned = Boolean(data?.banned);
        setIsBanned(banned);
        setBanEndAt(data?.banEndAt ?? null);

        // 정지 등록 기본 시작시간: 지금
        setPenaltyStart(toDateTimeLocal(new Date()));
      } catch (e) {
        console.error(e);
        alert("사용자 정보를 불러오지 못했습니다.");
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

  // 저장 핸들러
  const onSave = async () => {
    setSaving(true);
    setOkMsg(null);
    try {
      // 1) 기본 정보 수정 (닉네임/성별)
      const baseChanged =
        form.nickname !== (user?.nickname ?? "") ||
        form.gender.toUpperCase() !==
          (user?.gender ?? "").toString().toUpperCase();

      if (baseChanged) {
        // PUT /api/admins/users/{userId}
        await api.put(`/admins/users/${encodeURIComponent(userId)}`, {
          nickname: form.nickname,
          gender: form.gender, // 'M'|'F'|''
        });
      }

      // 2) 역할 변경
      if (
        (form.role || "").toLowerCase() !== (user?.role ?? "").toLowerCase()
      ) {
        // PATCH /api/admins/users/{userId}/role  { role: 'admin' | 'user' }
        (await api.patch)
          ? await api.patch(
              `/admins/users/${encodeURIComponent(userId)}/role`,
              {
                role: form.role,
              }
            )
          : // api-client에 patch 없으면 post로 구현된 경우 대비
            await api.post(`/admins/users/${encodeURIComponent(userId)}/role`, {
              role: form.role,
            });
      }

      // 3) 정지 등록
      if (penaltyOn) {
        // POST /api/admins/users/{userId}/penalties
        // body: { reason, effectiveAt, durationSec }
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

      // 저장 후 다시 로드
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
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // 정지 해제
  const onLiftPenalty = async () => {
    setSaving(true);
    setOkMsg(null);
    try {
      // POST /api/admins/users/{userId}/penalties/lift
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
      alert("정지 해제 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Container fluid className="py-3">
        <Alert variant="warning">사용자 정보를 불러올 수 없습니다.</Alert>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          뒤로
        </Button>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-3">
        <Col>
          <h4 className="mb-0">사용자 수정</h4>
          <div className="text-muted small">
            USER ID: <code>{userId}</code>
          </div>
        </Col>
        <Col className="text-end">
          <Button
            variant="secondary"
            className="me-2"
            onClick={() => navigate(-1)}
          >
            목록
          </Button>
          <Button variant="primary" onClick={onSave} disabled={saving}>
            {saving ? "저장 중…" : "저장"}
          </Button>
        </Col>
      </Row>

      {okMsg && (
        <Alert variant="success" className="mb-3">
          {okMsg}
        </Alert>
      )}

      <Row className="g-3">
        {/* 기본 정보 */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>기본 정보</Card.Title>

              <Form.Group className="mb-3">
                <Form.Label>닉네임</Form.Label>
                <Form.Control
                  value={form.nickname}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, nickname: e.target.value }))
                  }
                  maxLength={30}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>성별</Form.Label>
                <Form.Select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, gender: e.target.value }))
                  }
                >
                  <option value="">미지정</option>
                  <option value="M">남성</option>
                  <option value="F">여성</option>
                </Form.Select>
                <div className="small text-muted mt-1">
                  현재 저장된 값: <strong>{genderLabel}</strong>
                </div>
              </Form.Group>

              <Form.Group>
                <Form.Label>역할</Form.Label>
                <div className="d-flex gap-3">
                  <Form.Check
                    inline
                    type="radio"
                    name="role"
                    id="role-user"
                    label="유저"
                    checked={form.role === "user"}
                    onChange={() => setForm((s) => ({ ...s, role: "user" }))}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    name="role"
                    id="role-admin"
                    label="관리자"
                    checked={form.role === "admin"}
                    onChange={() => setForm((s) => ({ ...s, role: "admin" }))}
                  />
                </div>
              </Form.Group>
            </Card.Body>
          </Card>
        </Col>

        {/* 정지 관리 */}
        <Col lg={6}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <Card.Title>정지 관리</Card.Title>

              <div className="mb-3">
                현재 상태:{" "}
                {isBanned ? (
                  <Badge bg="danger">정지</Badge>
                ) : (
                  <Badge bg="success">정상</Badge>
                )}
                {isBanned && banEndAt ? (
                  <span className="small text-muted ms-2">
                    종료 예정: {new Date(banEndAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {isBanned ? (
                <Button
                  variant="outline-danger"
                  className="mb-3"
                  onClick={onLiftPenalty}
                  disabled={saving}
                >
                  정지 해제
                </Button>
              ) : null}

              <Form.Check
                className="mb-3"
                type="switch"
                id="penalty-on"
                label="새 정지 등록"
                checked={penaltyOn}
                onChange={(e) => setPenaltyOn(e.target.checked)}
              />

              <fieldset disabled={!penaltyOn}>
                <Form.Group className="mb-3">
                  <Form.Label>사유</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    placeholder="신고/운영 방침 위반 등"
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                  />
                </Form.Group>

                <Row>
                  <Col md={7}>
                    <Form.Group className="mb-3">
                      <Form.Label>적용 시작 (KST)</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={penaltyStart}
                        onChange={(e) => setPenaltyStart(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group className="mb-3">
                      <Form.Label>기간(시간)</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="number"
                          min={0}
                          step={1}
                          value={penaltyHours}
                          onChange={(e) => setPenaltyHours(e.target.value)}
                        />
                        <InputGroup.Text>시간</InputGroup.Text>
                      </InputGroup>
                      <div className="form-text">예: 24시간 = 1일</div>
                    </Form.Group>
                  </Col>
                </Row>
              </fieldset>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminUserWritePage;
