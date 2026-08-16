import { Navigate, Route, Routes } from "react-router-dom";

import { SetupPage } from "./features/setup/SetupPage";
import { StudyPage } from "./features/study/StudyPage";

export function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/study/course_calculus_2026" />} path="/" />
      <Route element={<SetupPage />} path="/setup" />
      <Route element={<StudyPage />} path="/study/:courseId" />
      <Route element={<Navigate replace to="/study/course_calculus_2026" />} path="*" />
    </Routes>
  );
}
