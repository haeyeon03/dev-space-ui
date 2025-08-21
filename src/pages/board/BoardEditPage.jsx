import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import QuillEditor from "../../components/editor/QuillEditor";

const toApi = (v) =>
({ DEV: "dev", DESIGN: "design", AI: "ai", JOB: "job", ETC: "etc" }[
    String(v).toUpperCase()
] || String(v).toLowerCase());

const codeFromApi = (raw) => {
    const s = String(raw ?? "").toUpperCase();
    const rev = { DEV: "DEV", DESIGN: "DESIGN", AI: "AI", JOB: "JOB", ETC: "ETC" };
    const up = s in rev ? s : String(raw ?? "").toUpperCase();
    if (rev[up]) return up;
    // 라벨 대응
    const byLabel =
        { 개발: "DEV", 디자인: "DESIGN", AI: "AI", 취업: "JOB", 기타: "ETC" }[
        String(raw ?? "")
        ];
    return byLabel || "DEV";
};

const CATEGORIES = [
    { label: "개발", code: "DEV" },
    { label: "디자인", code: "DESIGN" },
    { label: "AI", code: "AI" },
    { label: "취업", code: "JOB" },
    { label: "기타", code: "ETC" },
];

export default function BoardEditPage() {
    const { id } = useParams();
    const nav = useNavigate();

    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("DEV");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");

    const load = async () => {
        const data = await api.get(`/board-posts/${id}`);
        setTitle(data?.title ?? "");
        setCategory(codeFromApi(data?.category));
        setContent(data?.content ?? "");
    };

    useEffect(() => {
        if (id) load();
    }, [id]);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        const t = (title || "").trim();
        const normalized = (content || "").replace(/<p><br><\/p>/g, "").trim();
        if (!t) return setError("제목을 입력해 주세요.");
        if (!normalized) return setError("본문을 입력해 주세요.");

        await api.put(`/board-posts/${id}`, {
            title: t,
            category: toApi(category),
            content,
        });
        nav(`/board/${id}`);
    };

    return (
        <div style={wrap}>
            {/* Quill / 버튼 등 테마 정렬용 오버라이드 */}
            <style>{`
        /* 입력/패널 기본 색 */
        .board-edit input,
        .board-edit select,
        .board-edit textarea {
          background: var(--mui-palette-background-paper);
          color: var(--mui-palette-text-primary);
          border-color: var(--mui-palette-divider);
        }
        /* Quill Snow 테마 다크/라이트 대응 */
        .board-edit .ql-toolbar.ql-snow,
        .board-edit .ql-container.ql-snow {
          border-color: var(--mui-palette-divider) !important;
          background: var(--mui-palette-background-paper) !important;
          color: var(--mui-palette-text-primary) !important;
        }
        .board-edit .ql-editor {
          color: var(--mui-palette-text-primary) !important;
        }
        .board-edit .ql-snow .ql-stroke {
          stroke: var(--mui-palette-text-primary) !important;
        }
        .board-edit .ql-snow .ql-fill {
          fill: var(--mui-palette-text-primary) !important;
        }
        .board-edit .ql-picker,
        .board-edit .ql-picker-label,
        .board-edit .ql-picker-options {
          color: var(--mui-palette-text-primary) !important;
        }
      `}</style>

            <form onSubmit={submit} className="board-edit" style={{ display: "grid", gap: 16 }}>
                <div>
                    <label style={label}>제목</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="제목을 입력하세요"
                        style={input}
                    />
                </div>

                <div>
                    <label style={label}>카테고리</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {CATEGORIES.map((c) => {
                            const active = category === c.code;
                            return (
                                <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => setCategory(c.code)}
                                    style={{
                                        padding: "8px 14px",
                                        borderRadius: 16,
                                        border: active
                                            ? `1px solid var(--mui-palette-primary-main)`
                                            : "1px solid var(--mui-palette-divider)",
                                        background: active
                                            ? "var(--mui-palette-primary-main)"
                                            : "transparent",
                                        color: active
                                            ? "var(--mui-palette-primary-contrastText)"
                                            : "var(--mui-palette-text-primary)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label style={label}>본문</label>
                    <QuillEditor value={content} onChange={setContent} />
                </div>

                {error && (
                    <div style={{ color: "var(--mui-palette-error-main)", fontSize: 13 }}>
                        {error}
                    </div>
                )}

                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
                    <button type="submit" style={primaryBtn}>수정완료</button>
                    <button type="button" onClick={() => nav(-1)} style={ghostBtn}>취소</button>
                </div>
            </form>
        </div>
    );
}

/* 테마 대응 인라인 스타일 */
const wrap = {
    maxWidth: 960,
    margin: "24px auto",
    padding: 16,
    border: "1px solid var(--mui-palette-divider)",
    borderRadius: 6,
    background: "var(--mui-palette-background-paper)",
};

const label = {
    display: "block",
    marginBottom: 8,
    fontWeight: 600,
};

const input = {
    width: "100%",
    height: 36,
    border: "1px solid var(--mui-palette-divider)",
    borderRadius: 4,
    padding: "0 10px",
    background: "var(--mui-palette-background-paper)",
    color: "var(--mui-palette-text-primary)",
};

const primaryBtn = {
    height: 36,
    padding: "0 18px",
    borderRadius: 6,
    border: "1px solid var(--mui-palette-primary-main)",
    background: "var(--mui-palette-primary-main)",
    color: "var(--mui-palette-primary-contrastText)",
    cursor: "pointer",
};

const ghostBtn = {
    height: 36,
    padding: "0 18px",
    borderRadius: 6,
    border: "1px solid var(--mui-palette-divider)",
    background: "transparent",
    color: "var(--mui-palette-text-primary)",
    cursor: "pointer",
};
