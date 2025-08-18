import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api-client";
import QuillEditor from "../../components/editor/QuillEditor";

// 표시/전송 매핑
const toApi = (v) => ({ DEV: "dev", DESIGN: "design", AI: "ai", JOB: "job", ETC: "etc" }[String(v).toUpperCase()] || String(v).toLowerCase());

const CATEGORIES = [
  { label: "개발", code: "DEV" },
  { label: "디자인", code: "DESIGN" },
  { label: "AI", code: "AI" },
  { label: "취업", code: "JOB" },
  { label: "기타", code: "ETC" },
];

export default function BoardWritePage() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("DEV");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const t = title.trim();
    const normalized = (content || "").replace(/<p><br><\/p>/g, "").trim();
    if (!t) return setError("제목을 입력해 주세요.");
    if (!normalized) return setError("본문을 입력해 주세요.");
    await api.post("/board-posts", { title: t, category: toApi(category), content });
    nav("/board");
  };

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label style={label}>제목</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" style={input} />
        </div>

        <div>
          <label style={label}>카테고리</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => {
              const active = category === c.code;
              return (
                <button key={c.code} type="button" onClick={() => setCategory(c.code)}
                  style={{
                    padding: "8px 14px", borderRadius: 16,
                    border: active ? "1px solid #111" : "1px solid #ccc",
                    background: active ? "#111" : "#fff", color: active ? "#fff" : "#111",
                    cursor: "pointer",
                  }}>
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

        {error && <div style={{ color: "crimson", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
          <button type="submit" style={primaryBtn}>등록</button>
          <button type="button" onClick={() => nav(-1)} style={ghostBtn}>취소</button>
        </div>
      </form>
    </div>
  );
}

const wrap = { maxWidth: 960, margin: "24px auto", padding: 16, border: "1px solid #c9c9c9", borderRadius: 6, background: "#fff" };
const label = { display: "block", marginBottom: 8, color: "#333", fontWeight: 600 };
const input = { width: "100%", height: 36, border: "1px solid #bbb", borderRadius: 4, padding: "0 10px" };
const primaryBtn = { height: 36, padding: "0 18px", borderRadius: 6, border: "1px solid #2d5ae7", background: "#2d5ae7", color: "#fff", cursor: "pointer" };
const ghostBtn = { height: 36, padding: "0 18px", borderRadius: 6, border: "1px solid #bbb", background: "#f7f7f7", color: "#333", cursor: "pointer" };
