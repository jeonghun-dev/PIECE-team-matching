import "./ProjectApplyButton.css";

export default function ProjectApplyButton({ status = "AVAILABLE", onApply }) {
  let buttonText = "지원하기";

  if (status === "APPLIED") {
    buttonText = "지원함";
  } else if (status === "MEMBER") {
    buttonText = "소속됨";
  } else if (status === "CLOSED") {
    buttonText = "모집 마감";
  }

  return (
    <button
      type="button"
      className="project-apply-button"
      disabled={status !== "AVAILABLE"}
      onClick={() => onApply?.()}
    >
      {buttonText}
    </button>
  );
}
