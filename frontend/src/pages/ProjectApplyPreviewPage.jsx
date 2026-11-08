import { useState } from "react";
import ProjectApplyButton from "../components/project/ProjectApplyButton";

export default function ProjectApplyPreviewPage() {
  const [status, setStatus] = useState("AVAILABLE");

  function handleApply() {
    setStatus("APPLIED");
  }

  return (
    <main
      style={{
        maxWidth: "var(--detail-max-width)",
        margin: "var(--space-7) auto",
        padding: "var(--space-5)",
      }}
    >
      <h1>프로젝트 참여 요청 테스트</h1>

      <p>현재 상태: {status}</p>

      <ProjectApplyButton status={status} onApply={handleApply} />
    </main>
  );
}
