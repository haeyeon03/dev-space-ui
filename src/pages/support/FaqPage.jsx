import * as React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqs = [
  {
    category: "로그인",
    question: "회원가입은 어떻게 하나요?",
    answer: "상단 메뉴의 회원가입 버튼을 클릭 후 양식을 작성하시면 됩니다.",
  },
  {
    category: "로그인",
    question: "구글로 로그인 되나요?",
    answer: "구글 계정을 통한 소셜 로그인 가능합니다.",
  },
  {
    category: "서비스",
    question: "내 정보 수정은 어디서 하나요?",
    answer:
      "하단에 내 로그인 정보 옆 버튼을 클릭하면 마이페이지로 이동하여 수정할 수 있습니다.",
  },
  {
    category: "문의",
    question: "1:1 문의 가능한가요?",
    answer: "Support > Inqury를 통해 1:1 문의 가능합니다.",
  },
  {
    category: "서비스",
    question: "서비스 이용 시간은 어떻게 되나요?",
    answer: "서비스는 24시간 이용 가능합니다.",
  },
];

const FaqPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("전체");

  const categories = [
    "전체",
    ...Array.from(new Set(faqs.map((f) => f.category))),
  ];

  const filteredFaqs =
    selectedCategory === "전체"
      ? faqs
      : faqs.filter((f) => f.category === selectedCategory);

  return (
    <Box>
      {/* FAQ 제목 */}
      <Typography
        variant="h3"
        sx={{
          mb: 3,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        FAQ
      </Typography>

      {/* 카테고리 필터 */}
      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 3, justifyContent: "center", flexWrap: "wrap" }}
      >
        {categories.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            color={selectedCategory === cat ? "primary" : "default"}
            onClick={() => setSelectedCategory(cat)}
            clickable
          />
        ))}
      </Stack>

      {/* 질문 리스트 */}
      {filteredFaqs.map((faq, index) => (
        <Accordion key={index} sx={{ mb: 1.5 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Chip
              label={faq.category}
              color="primary"
              size="small"
              sx={{ mr: 2 }}
            />
            <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{faq.answer}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};
export default FaqPage;
