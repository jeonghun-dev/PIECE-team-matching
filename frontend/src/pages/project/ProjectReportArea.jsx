import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import client from "../../api/client";
import ReportButton from "../../components/report/ReportButton";
import ReportForm from "../../components/report/ReportForm";

// 기존 신고 UI를 조합하며 내부 구현은 변경하지 않는다.
export default function ProjectReportArea({ projectId, formTarget }) {
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const active = useRef(true);
  const formArea = useRef(null);
  const trigger = useRef(null);
  const success = useRef(null);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    let ignore = false;
    client.get("/reports/mine", { params: { targetType: "PROJECT", targetIds: String(projectId) } })
      .then((response) => {
        if (!ignore) setReported(response.data.data.reportedIds.some((id) => String(id) === String(projectId)));
      })
      .catch(() => { if (!ignore) setError("신고 여부를 확인하지 못했습니다. 다시 시도해 주세요."); })
      .finally(() => { if (!ignore) setChecking(false); });
    return () => { ignore = true; };
  }, [projectId, retryCount]);

  useEffect(() => {
    if (open) formArea.current?.querySelector("select")?.focus();
    else if (reported) success.current?.focus();
  }, [open, reported]);

  async function handleReport(input) {
    try {
      await client.post("/reports", { targetType: "PROJECT", targetId: Number(projectId), reason: input.reason, detail: input.detail });
    } catch (requestError) {
      if (active.current && requestError.response?.status === 409) {
        setReported(true);
        setOpen(false);
        return;
      }
      throw requestError;
    }
    if (active.current) { setReported(true); setOpen(false); }
  }

  return (
    <>
      <span className="project-detail-report-trigger" ref={trigger}><ReportButton disabled={checking || Boolean(error) || open || reported} onClick={() => setOpen(true)} /></span>
      {formTarget && createPortal(<div className={checking || error || reported || open ? "project-detail-report" : undefined}>
      {checking && <p className="project-detail-muted" role="status">신고 여부를 확인하고 있습니다.</p>}
      {error && <div><p className="project-detail-error" role="alert">{error}</p><button type="button" className="project-question-button" onClick={() => { setChecking(true); setError(""); setRetryCount((prev) => prev + 1); }}>다시 시도</button></div>}
      {reported && <p ref={success} tabIndex={-1} role="status">신고가 접수되었습니다.</p>}
      {open && <div ref={formArea}><ReportForm onSubmit={handleReport} onCancel={() => { setOpen(false); trigger.current?.querySelector("button")?.focus(); }} /></div>}
      </div>, formTarget)}
    </>
  );
}
