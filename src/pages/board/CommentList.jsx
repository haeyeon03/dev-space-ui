import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { api } from "../../api/api-client";

// MUI
import { Button, Stack } from "@mui/material";

const TARGET_TYPE = "BOARD_POST";
const DBG = false; // 콘솔 보고 싶으면 true

export default function CommentList({ postId, onAdded, onChanged, onDeleted }) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [size] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState("");
    const [editSubmitting, setEditSubmitting] = useState(false);

    const state = useSelector((s) => s.user ?? {});
    const me = state?.session?.user || state?.user || state?.profile || state || {};
    const token = state?.token || localStorage.getItem("token");

    const myId =
        me?.userId ?? me?.id ?? me?.memberId ?? me?.username ?? state?.userId ?? state?.id ?? null;
    const myNick =
        me?.nickname ?? me?.nickName ?? me?.name ?? me?.displayName ?? state?.nickname ?? null;

    const log = (...a) => { if (DBG) console.log("[comments]", ...a); };

    const load = useCallback(
        async (curPage = 0) => {
            setLoading(true);
            try {
                const data = await api.get(`/board-posts/${postId}/comments`, {
                    curPage: curPage,
                    pageSize: size,
                    _ts: Date.now(), // 캐시 버스트
                });
                setItems(data?.content ?? []);
                setPage(data?.number ?? 0);
                setTotalPages(data?.totalPages ?? 0);
            } finally {
                setLoading(false);
            }
        },
        [postId, size]
    );

    useEffect(() => {
        if (postId) load(0);
    }, [postId, load]);

    const prev = () => page > 0 && load(page - 1);
    const next = () => page + 1 < totalPages && load(page + 1);

    const getKey = (c) => c.commentId ?? c.postCommentId ?? c.id;

    // 작성
    const onSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const text = content.trim();
        if (!text) return setError("내용을 입력해 주세요.");
        if (!token) return setError("로그인이 필요합니다.");
        try {
            setSubmitting(true);
            await api.post(`/board-posts/${postId}/comments`, { content: text });
            setContent("");
            await load(0);
            onAdded?.();
            onChanged?.();
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "댓글 등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    // 편집 상태 전환
    const startEdit = (c) => {
        setEditingId(getKey(c));
        setEditText(c.content ?? "");
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditText("");
    };

    // 여러 엔드포인트 후보를 순차 시도
    const tryUpdateComment = async (commentId, text) => {
        const candidates = [
            { m: "put", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "patch", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "put", url: `/post-comments/${commentId}`, body: { content: text } },
            { m: "patch", url: `/post-comments/${commentId}`, body: { content: text } },
            { m: "put", url: `/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "put", url: `/comments/${commentId}`, body: { content: text } },
            { m: "put", url: `/board-posts/${postId}/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}`, body: { content: text } },
            { m: "post", url: `/post-comments/${commentId}/update?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "post", url: `/comments/${commentId}/update?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "put", url: `/board-posts/${postId}/comments`, body: { commentId, content: text, targetType: TARGET_TYPE } },
        ];
        let lastErr;
        for (const c of candidates) {
            try {
                if (DBG) log("UPDATE try:", c.m.toUpperCase(), c.url, c.body);
                if (c.m === "put") await api.put(c.url, c.body);
                else if (c.m === "patch") await (api.patch ? api.patch(c.url, c.body) : api.put(c.url, c.body));
                else if (c.m === "post") await api.post(c.url, c.body);
                if (DBG) log("UPDATE ok:", c.m.toUpperCase(), c.url);
                return;
            } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error("댓글 수정에 실패했습니다.");
    };

    const tryDeleteComment = async (commentId) => {
        const candidates = [
            { m: "delete", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "delete", url: `/post-comments/${commentId}` },
            { m: "delete", url: `/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "delete", url: `/comments/${commentId}` },
            { m: "delete", url: `/board-posts/${postId}/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}` },
            { m: "post", url: `/post-comments/${commentId}/delete?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "post", url: `/comments/${commentId}/delete?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "delete", url: `/board-posts/${postId}/comments?commentId=${commentId}&targetType=${encodeURIComponent(TARGET_TYPE)}` },
        ];
        let lastErr;
        for (const c of candidates) {
            try {
                if (DBG) log("DELETE try:", c.m.toUpperCase(), c.url);
                if (c.m === "delete") await api.delete(c.url);
                else if (c.m === "post") await api.post(c.url, {});
                if (DBG) log("DELETE ok:", c.m.toUpperCase(), c.url);
                return;
            } catch (e) { lastErr = e; }
        }
        throw lastErr || new Error("댓글 삭제에 실패했습니다.");
    };

    // 수정 확정
    const submitEdit = async () => {
        if (!editingId) return;
        const text = (editText || "").trim();
        if (!text) return alert("내용을 입력해 주세요.");
        if (!token) return alert("로그인이 필요합니다.");
        try {
            setEditSubmitting(true);
            await tryUpdateComment(editingId, text);
            await load(page);
            onChanged?.();
            onAdded?.(); // 레거시 호환
            cancelEdit();
        } catch (e) {
            alert(e?.response?.data?.message || e?.message || "댓글 수정에 실패했습니다.");
        } finally {
            setEditSubmitting(false);
        }
    };

    // 삭제
    const remove = async (commentId) => {
        if (!token) return alert("로그인이 필요합니다.");
        if (!window.confirm("이 댓글을 삭제할까요?")) return;
        try {
            await tryDeleteComment(commentId);
            await load(page);
            onDeleted?.();
            onChanged?.();
            onAdded?.(); // 레거시 호환
        } catch (e) {
            alert(e?.response?.data?.message || e?.message || "댓글 삭제에 실패했습니다.");
        }
    };

    if (loading && items.length === 0) return <div>댓글 불러오는 중...</div>;

    return (
        <section className="board-comment-scope" style={{ marginTop: 24 }}>
            <h3 style={{ margin: "8px 0" }}>댓글</h3>

            {/* 입력 폼 */}
            <form onSubmit={onSubmit} style={{ marginBottom: 12 }}>
                <textarea
                    className="cmt-textarea"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={token ? "댓글을 입력해 주세요." : "로그인이 필요합니다."}
                    disabled={!token || submitting}
                    rows={3}
                    style={{
                        width: "100%",
                        resize: "vertical",
                        border: "1px solid #bbb",
                        borderRadius: 10,
                        padding: 10,
                        outline: "none",
                    }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, gap: 8 }}>
                    <span style={{ color: "crimson", fontSize: 12, minHeight: 17 }}>{error}</span>
                    <Button
                        type="submit"
                        disabled={!token || submitting || !content.trim()}
                        variant="contained"
                        sx={{ height: 32, px: 1.5, textTransform: "none" }}
                    >
                        {submitting ? "등록 중..." : "댓글 등록"}
                    </Button>
                </div>
            </form>

            {/* 리스트 */}
            {items.length === 0 ? (
                <div>첫 댓글을 남겨보세요.</div>
            ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {items.map((c) => {
                        const key = getKey(c);
                        const nickname = c.userNickname ?? c.nickname ?? "익명";
                        const created = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
                        const mine =
                            c.mine ||
                            c.owned ||
                            (myId && (c.userId ?? c.user?.id ?? c.user?.userId) && String(myId) === String(c.userId ?? c.user?.id ?? c.user?.userId)) ||
                            (myNick && (c.userNickname ?? c.nickname) && myNick === (c.userNickname ?? c.nickname));
                        const isEditing = editingId === key;

                        return (
                            <li key={key} className="board-comment-item" style={{ borderTop: "1px solid #eee", padding: "12px 0" }}>
                                <div className="board-comment-meta" style={{ fontSize: 14, color: "#666", display: "flex", justifyContent: "space-between", gap: 12 }}>
                                    <span><b>{nickname}</b> · {created}</span>

                                    {token && mine && (
                                        <Stack direction="row" spacing={1} alignItems="center" className="board-comment-actions">
                                            {!isEditing ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        color="inherit"
                                                        onClick={() => startEdit(c)}
                                                        sx={{ minWidth: 0, px: 1, textTransform: "none", color: "text.secondary", "&:hover": { backgroundColor: "action.hover" } }}
                                                    >
                                                        수정
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        color="inherit"
                                                        onClick={() => remove(key)}
                                                        sx={{ minWidth: 0, px: 1, textTransform: "none", color: "text.secondary", "&:hover": { backgroundColor: "action.hover" } }}
                                                    >
                                                        삭제
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button size="small" variant="contained" disabled={editSubmitting} onClick={submitEdit} sx={{ textTransform: "none" }}>
                                                        {editSubmitting ? "저장 중..." : "저장"}
                                                    </Button>
                                                    <Button size="small" variant="outlined" onClick={cancelEdit} sx={{ textTransform: "none" }}>
                                                        취소
                                                    </Button>
                                                </>
                                            )}
                                        </Stack>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div className="board-comment-content" style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{c.content}</div>
                                ) : (
                                    <div style={{ marginTop: 6 }}>
                                        <textarea
                                            className="cmt-editarea"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            rows={3}
                                            style={{
                                                width: "100%",
                                                resize: "vertical",
                                                border: "1px solid #bbb",
                                                borderRadius: 10,
                                                padding: 10,
                                                outline: "none",
                                            }}
                                        />
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* 페이지네이션 */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5, mb: 0, justifyContent: "center", width: "100%" }}>
                <Button size="small" variant="outlined" onClick={prev} disabled={page === 0} sx={{ textTransform: "none" }}>
                    이전
                </Button>
                <span>{page + 1} / {totalPages || 1}</span>
                <Button size="small" variant="outlined" onClick={next} disabled={page + 1 >= totalPages} sx={{ textTransform: "none" }}>
                    다음
                </Button>
            </Stack>

            <style>{`
        .cmt-textarea:focus, .cmt-editarea:focus {
          border-color: #2d5ae7;
          box-shadow: 0 0 0 3px rgba(45, 90, 231, 0.12);
        }
      `}</style>
        </section>
    );
}
