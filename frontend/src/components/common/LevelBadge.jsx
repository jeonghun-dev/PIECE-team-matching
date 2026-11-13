import { LEVEL } from "../../constants";
import "./LevelBadge.css";

// 학습 레벨 배지 (STARTER / BUILDER / ACHIEVER)
// score: 점수도 같이 보여줄 때 ("BUILDER · 6점")
// soft: 연한 배경 배지 (지원자 표)
// className: 페이지에서 위치를 잡을 때 붙이는 추가 클래스

function LevelBadge({ level, score, soft = false, className = "" }) {
  // 정해진 레벨이 아니면 그리지 않기
  if (!Object.values(LEVEL).includes(level)) {
    return null;
  }

  // 레벨과 모양에 맞는 클래스 모으기
  const classNames = ["level-badge", `level-badge--${level.toLowerCase()}`];

  if (soft) {
    classNames.push("level-badge--soft");
  }

  if (className) {
    classNames.push(className);
  }

  // 점수가 있으면 뒤에 " · 6점" 붙이기
  return (
    <span className={classNames.join(" ")}>
      {level}
      {score != null && ` · ${score}점`}
    </span>
  );
}

export default LevelBadge;