import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { api } from "../../api/api-client";

const TARGET_TYPE = "BOARD_POST";
const DBG = true; // 콘솔 로깅 보고 싶으면 true

export default function CommentList({ postId, onAdded }) {
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

    const isMine = (c) => {
        const cid =
            c.userId ?? c.memberId ?? c.authorId ?? c.writerId ?? c.user?.userId ?? c.user?.id ?? null;
        const cnick = c.userNickname ?? c.nickname ?? c.user?.nickname ?? null;
        if (c.mine || c.owned || c.editable || c.canEdit) return true;
        if (myId && cid && String(myId) === String(cid)) return true;
        if (myNick && cnick && myNick === cnick) return true;
        return false;
    };

    const load = useCallback(
        async (curPage = 0) => {
            setLoading(true);
            try {
                const data = await api.get(`/board-posts/${postId}/comments`, {
                    curPage: curPage,
                    pageSize: size,
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

    // 여러 엔드포인트 후보를 순차 시도 (백엔드 안 건드리고 맞는 걸 자동으로 찾기)
    const tryUpdateComment = async (commentId, text) => {
        const candidates = [
            // ⚑ 가장 유력: 댓글 전용 리소스 + 필요한 파라미터
            { m: "put", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "patch", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },

            // 댓글 전용 리소스 (파라미터 없이)
            { m: "put", url: `/post-comments/${commentId}`, body: { content: text } },
            { m: "patch", url: `/post-comments/${commentId}`, body: { content: text } },

            // /comments 계열
            { m: "put", url: `/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "put", url: `/comments/${commentId}`, body: { content: text } },

            // 게시글 하위 경로 (혹시 열려있으면)
            { m: "put", url: `/board-posts/${postId}/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}`, body: { content: text } },

            // 액션형(POST)
            { m: "post", url: `/post-comments/${commentId}/update?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },
            { m: "post", url: `/comments/${commentId}/update?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}`, body: { content: text } },

            // 본문에 id 전달형
            { m: "put", url: `/board-posts/${postId}/comments`, body: { commentId, content: text, targetType: TARGET_TYPE } },
        ];

        let lastErr;
        for (const c of candidates) {
            try {
                log("UPDATE try:", c.m.toUpperCase(), c.url, c.body);
                if (c.m === "put") await api.put(c.url, c.body);
                else if (c.m === "patch") await (api.patch ? api.patch(c.url, c.body) : api.put(c.url, c.body));
                else if (c.m === "post") await api.post(c.url, c.body);
                return;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error("댓글 수정에 실패했습니다.");
    };

    const tryDeleteComment = async (commentId) => {
        const candidates = [
            // ⚑ 가장 유력
            { m: "delete", url: `/post-comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },

            // 댓글 전용 리소스 (파라미터 없이)
            { m: "delete", url: `/post-comments/${commentId}` },

            // /comments 계열
            { m: "delete", url: `/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "delete", url: `/comments/${commentId}` },

            // 게시글 하위 경로 (혹시 열려있으면)
            { m: "delete", url: `/board-posts/${postId}/comments/${commentId}?targetType=${encodeURIComponent(TARGET_TYPE)}` },

            // 액션형(POST)
            { m: "post", url: `/post-comments/${commentId}/delete?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },
            { m: "post", url: `/comments/${commentId}/delete?targetType=${encodeURIComponent(TARGET_TYPE)}&targetId=${encodeURIComponent(postId)}` },

            // 쿼리스트링 전달형
            { m: "delete", url: `/board-posts/${postId}/comments?commentId=${commentId}&targetType=${encodeURIComponent(TARGET_TYPE)}` },
        ];

        let lastErr;
        for (const c of candidates) {
            try {
                log("DELETE try:", c.m.toUpperCase(), c.url);
                if (c.m === "delete") await api.delete(c.url);
                else if (c.m === "post") await api.post(c.url, {});
                return;
            } catch (e) {
                lastErr = e;
            }
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
            onAdded?.();
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
            onAdded?.();
        } catch (e) {
            alert(e?.response?.data?.message || e?.message || "댓글 삭제에 실패했습니다.");
        }
    };

    if (loading && items.length === 0) return <div>댓글 불러오는 중...</div>;

    return (
        <section style={{ marginTop: 24 }}>
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
                    <button
                        type="submit"
                        disabled={!token || submitting || !content.trim()}
                        style={{
                            height: 32, padding: "0 12px", borderRadius: 6, border: "1px solid #2d5ae7",
                            background: "#2d5ae7", color: "#fff",
                            cursor: (!token || submitting || !content.trim()) ? "default" : "pointer"
                        }}
                    >
                        {submitting ? "등록 중..." : "댓글 등록"}
                    </button>
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
                            <li key={key} style={{ borderTop: "1px solid #eee", padding: "12px 0" }}>
                                <div style={{ fontSize: 14, color: "#666", display: "flex", justifyContent: "space-between" }}>
                                    <span><b>{nickname}</b> · {created}</span>

                                    {token && mine && (
                                        <span style={{ display: "flex", gap: 8 }}>
                                            {!isEditing ? (
                                                <>
                                                    <button type="button" onClick={() => startEdit(c)}>수정</button>
                                                    <button type="button" onClick={() => remove(key)}>삭제</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={submitEdit} disabled={editSubmitting}>
                                                        {editSubmitting ? "저장 중..." : "저장"}
                                                    </button>
                                                    <button type="button" onClick={cancelEdit}>취소</button>
                                                </>
                                            )}
                                        </span>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{c.content}</div>
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
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={prev} disabled={page === 0}>이전</button>
                <span>{page + 1} / {totalPages || 1}</span>
                <button onClick={next} disabled={page + 1 >= totalPages}>다음</button>
            </div>

            <style>{`
        .cmt-textarea:focus, .cmt-editarea:focus {
          border-color: #2d5ae7;
          box-shadow: 0 0 0 3px rgba(45, 90, 231, 0.12);
        }
      `}</style>
        </section>
    );
}
