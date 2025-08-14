import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";
const NewsListPage = () => {
  return (
    <div>
      NewsListPage
      <FormGroup>
        <FormControlLabel control={<Checkbox defaultChecked />} label="Label" />
        <FormControlLabel required control={<Checkbox />} label="Required" />
        <FormControlLabel disabled control={<Checkbox />} label="Disabled" />
      </FormGroup>
    </div>
  );
};

export default NewsListPage;
