
// 모집 글 저장 + 작성자를 팀원(LEADER)으로 등록
// tx: Service에서 연 트랜잭션 연결

const save = async (tx, project) => {
  const [result] = await tx.query(
    `INSERT INTO projects
       (author_id, title, content, meeting_method, target_level,
        capacity, progress_mode, active_times, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      project.authorId,
      project.title,
      project.content,
      project.meetingMethod,
      project.targetLevel,
      project.capacity,
      project.progressMode,
      project.activeTimes,   
      project.deadline,
    ]
  );

  const projectId = result.insertId; // 방금 저장된 모집 글 번호

  await tx.query(
    `INSERT INTO project_members (project_id, user_id, role)
     VALUES (?, ?, 'LEADER')`,
    [projectId, project.authorId]
  );

  return projectId;
};


module.exports = { save };