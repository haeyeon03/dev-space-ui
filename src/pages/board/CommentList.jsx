import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { api } from "../../api/api-client";

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

    const token = useSelector((s) => s.user.token);

    const load = useCallback(async (curPage = 0) => {
        setLoading(true);
        try {
            const data = await api.get(`/board-posts/${postId}/comments`, {
                curPage, pageSize: size,
            });
            setItems(data?.content ?? []);
            setPage(data?.number ?? 0);
            setTotalPages(data?.totalPages ?? 0);
        } finally {
            setLoading(false);
        }
    }, [postId, size]);

    useEffect(() => { if (postId) load(0); }, [postId, load]);

    const prev = () => { if (page > 0) load(page - 1); };
    const next = () => { if (page + 1 < totalPages) load(page + 1); };

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
            setError(err?.response?.data?.message || "댓글 등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const startEdit = (c) => {
        const id = c.commentId ?? c.postCommentId ?? c.id;
        setEditingId(id);
        setEditText(c.content ?? "");
    };
    const cancelEdit = () => { setEditingId(null); setEditText(""); };
    const submitEdit = async () => {
        if (!editingId) return;
        const text = (editText || "").trim();
        if (!text) return alert("내용을 입력해 주세요.");
        if (!token) return alert("로그인이 필요합니다.");
        try {
            setEditSubmitting(true);
            await api.put(`/board-posts/${postId}/comments/${editingId}`, { content: text });
            await load(page);
            onAdded?.();
            cancelEdit();
        } catch {
            alert("댓글 수정에 실패했습니다.");
        } finally {
            setEditSubmitting(false);
        }
    };
    const remove = async (commentId) => {
        if (!token) return alert("로그인이 필요합니다.");
        if (!window.confirm("이 댓글을 삭제할까요?")) return;
        await api.delete(`/board-posts/${postId}/comments/${commentId}`);
        await load(page);
        onAdded?.();
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
                    <button type="submit" disabled={!token || submitting || !content.trim()}
                        style={{
                            height: 32, padding: "0 12px", borderRadius: 6, border: "1px solid #2d5ae7",
                            background: "#2d5ae7", color: "#fff",
                            cursor: (!token || submitting || !content.trim()) ? "default" : "pointer"
                        }}>
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
                        const key = c.commentId ?? c.postCommentId ?? c.id;
                        const nickname = c.userNickname ?? c.nickname ?? "익명";
                        const created = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
                        const isEditing = editingId === key;

                        return (
                            <li key={key} style={{ borderTop: "1px solid #eee", padding: "12px 0" }}>
                                <div style={{ fontSize: 14, color: "#666", display: "flex", justifyContent: "space-between" }}>
                                    <span><b>{nickname}</b> · {created}</span>
                                    {token && (
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
                <button onClick={() => load(page - 1)} disabled={page === 0}>이전</button>
                <span>{page + 1} / {totalPages || 1}</span>
                <button onClick={() => load(page + 1)} disabled={page + 1 >= totalPages}>다음</button>
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
